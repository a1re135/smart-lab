import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const USAGE_STATUSES = [
  "APPROVED",
  "COMPLETED",
];

export default async function StatisticsPage() {
  await requireRole("ADMIN");

  const now = new Date();

  const periodStart = new Date(now);
  periodStart.setDate(
    periodStart.getDate() - 29
  );
  periodStart.setHours(0, 0, 0, 0);

  // ==================================================
  // LOAD DATA
  // ==================================================

  const [
    laboratories,
    students,
    reservations,
    equipment,
    violations,
  ] = await Promise.all([
    prisma.laboratory.findMany({
      orderBy: {
        id: "asc",
      },
    }),

    prisma.user.findMany({
      where: {
        role: "STUDENT",
      },

      select: {
        id: true,
        name: true,
        username: true,
        studentNumber: true,
      },

      orderBy: {
        id: "asc",
      },
    }),

    prisma.reservation.findMany({
      include: {
        laboratory: true,
        student: true,

        equipment: {
          include: {
            equipment: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.equipment.findMany({
      include: {
        laboratory: true,
      },

      orderBy: {
        id: "asc",
      },
    }),

    prisma.violation.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            studentNumber: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  // ==================================================
  // OVERVIEW
  // ==================================================

  const recentReservations =
    reservations.filter(
      (reservation) =>
        reservation.createdAt >=
        periodStart
    );

  const approvedCount =
    reservations.filter(
      (reservation) =>
        reservation.status ===
          "APPROVED" ||
        reservation.status ===
          "COMPLETED"
    ).length;

  const pendingCount =
    reservations.filter(
      (reservation) =>
        reservation.status ===
          "PENDING_TEACHER" ||
        reservation.status ===
          "PENDING_ADMIN"
    ).length;

  const activeLabs =
    laboratories.filter(
      (laboratory) =>
        laboratory.isActive
    ).length;

  // ==================================================
  // LAB UTILIZATION
  // ==================================================

  const recentUsageReservations =
    reservations.filter(
      (reservation) =>
        reservation.startAt >=
          periodStart &&
        reservation.startAt <= now &&
        USAGE_STATUSES.includes(
          reservation.status
        )
    );

  const laboratoryStats =
    laboratories
      .map((laboratory) => {
        const openHours =
          timeToHours(
            laboratory.closeTime
          ) -
          timeToHours(
            laboratory.openTime
          );

        const totalCapacityHours =
          Math.max(
            openHours,
            0
          ) *
          laboratory.maxPeople *
          30;

        const labReservations =
          recentUsageReservations.filter(
            (reservation) =>
              reservation.laboratoryId ===
              laboratory.id
          );

        const usedPersonHours =
          labReservations.reduce(
            (
              total,
              reservation
            ) => {
              const duration =
                getDurationHours(
                  reservation.startAt,
                  reservation.endAt,
                  periodStart,
                  now
                );

              return (
                total +
                duration *
                  reservation.peopleCount
              );
            },
            0
          );

        const utilization =
          totalCapacityHours > 0
            ? Math.min(
                100,
                (usedPersonHours /
                  totalCapacityHours) *
                  100
              )
            : 0;

        return {
          id: laboratory.id,
          name: laboratory.name,
          openTime:
            laboratory.openTime,
          closeTime:
            laboratory.closeTime,
          maxPeople:
            laboratory.maxPeople,
          reservationCount:
            labReservations.length,
          usedPersonHours,
          utilization,
        };
      })
      .sort(
        (a, b) =>
          b.utilization -
          a.utilization
      );

  // ==================================================
  // POPULAR TIME PERIODS
  // ==================================================

  const timePeriodMap = new Map<
    string,
    {
      count: number;
      people: number;
    }
  >();

  const demandReservations =
    reservations.filter(
      (reservation) =>
        reservation.startAt >=
          periodStart &&
        reservation.startAt <= now &&
        ![
          "CANCELLED",
          "REJECTED",
        ].includes(
          reservation.status
        )
    );

  for (
    const reservation of
    demandReservations
  ) {
    const hour =
      reservation.startAt.getHours();

    const startHour =
      Math.floor(hour / 2) * 2;

    const endHour =
      Math.min(
        startHour + 2,
        24
      );

    const label = `${padHour(
      startHour
    )}:00-${padHour(
      endHour
    )}:00`;

    const current =
      timePeriodMap.get(label) ?? {
        count: 0,
        people: 0,
      };

    current.count += 1;
    current.people +=
      reservation.peopleCount;

    timePeriodMap.set(
      label,
      current
    );
  }

  const popularPeriods =
    Array.from(
      timePeriodMap.entries()
    )
      .map(
        ([period, data]) => ({
          period,
          count: data.count,
          people: data.people,
        })
      )
      .sort(
        (a, b) =>
          b.count - a.count
      )
      .slice(0, 8);

  const maxPeriodCount =
    Math.max(
      1,
      ...popularPeriods.map(
        (item) => item.count
      )
    );

  // ==================================================
  // STUDENT STATS
  // ==================================================

  const violationCountByUser =
    new Map<number, number>();

  for (
    const violation of violations
  ) {
    violationCountByUser.set(
      violation.userId,
      (violationCountByUser.get(
        violation.userId
      ) ?? 0) + 1
    );
  }

  const studentStats =
    students
      .map((student) => {
        const studentReservations =
          reservations.filter(
            (reservation) =>
              reservation.studentId ===
                student.id &&
              ![
                "CANCELLED",
                "REJECTED",
              ].includes(
                reservation.status
              )
          );

        const completedCount =
          studentReservations.filter(
            (reservation) =>
              reservation.status ===
              "COMPLETED"
          ).length;

        return {
          ...student,

          reservationCount:
            studentReservations.length,

          completedCount,

          violationCount:
            violationCountByUser.get(
              student.id
            ) ?? 0,
        };
      })
      .sort(
        (a, b) =>
          b.reservationCount -
          a.reservationCount
      );

  // ==================================================
  // EQUIPMENT STATS
  // ==================================================

  const equipmentStats =
    equipment
      .map((item) => {
        const usageReservations =
          reservations.filter(
            (reservation) =>
              USAGE_STATUSES.includes(
                reservation.status
              ) &&
              reservation.equipment.some(
                (relation) =>
                  relation.equipmentId ===
                  item.id
              )
          );

        return {
          id: item.id,
          name: item.name,
          laboratory:
            item.laboratory.name,
          status: item.status,
          usageCount:
            usageReservations.length,
        };
      })
      .sort(
        (a, b) =>
          b.usageCount -
          a.usageCount
      );

  const maxEquipmentUsage =
    Math.max(
      1,
      ...equipmentStats.map(
        (item) =>
          item.usageCount
      )
    );

  // ==================================================
  // VIOLATION RANKING
  // ==================================================

  const violationMap = new Map<
    number,
    {
      userId: number;
      name: string;
      studentNumber: string | null;
      total: number;
      noShow: number;
      frequentCancel: number;
      unauthorized: number;
    }
  >();

  for (
    const violation of violations
  ) {
    const existing =
      violationMap.get(
        violation.userId
      ) ?? {
        userId:
          violation.userId,

        name:
          violation.user.name,

        studentNumber:
          violation.user
            .studentNumber,

        total: 0,
        noShow: 0,
        frequentCancel: 0,
        unauthorized: 0,
      };

    existing.total += 1;

    if (
      violation.type ===
      "NO_SHOW"
    ) {
      existing.noShow += 1;
    }

    if (
      violation.type ===
      "FREQUENT_CANCEL"
    ) {
      existing.frequentCancel += 1;
    }

    if (
      violation.type ===
      "UNAUTHORIZED_ACCESS"
    ) {
      existing.unauthorized += 1;
    }

    violationMap.set(
      violation.userId,
      existing
    );
  }

  const violationRanking =
    Array.from(
      violationMap.values()
    ).sort(
      (a, b) =>
        b.total - a.total
    );

  // ==================================================
  // STATUS DISTRIBUTION
  // ==================================================

  const statusStatistics = [
    {
      name: "等待教师审核",
      value: countStatus(
        reservations,
        "PENDING_TEACHER"
      ),
      tone: "orange",
    },

    {
      name: "等待管理员审核",
      value: countStatus(
        reservations,
        "PENDING_ADMIN"
      ),
      tone: "orange",
    },

    {
      name: "已通过",
      value: countStatus(
        reservations,
        "APPROVED"
      ),
      tone: "green",
    },

    {
      name: "已完成",
      value: countStatus(
        reservations,
        "COMPLETED"
      ),
      tone: "blue",
    },

    {
      name: "已取消",
      value: countStatus(
        reservations,
        "CANCELLED"
      ),
      tone: "gray",
    },

    {
      name: "已拒绝",
      value: countStatus(
        reservations,
        "REJECTED"
      ),
      tone: "red",
    },

    {
      name: "未签到",
      value: countStatus(
        reservations,
        "MISSED"
      ),
      tone: "red",
    },
  ];

  const totalReservations =
    reservations.length;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm font-medium text-blue-200 transition hover:text-white"
          >
            ← 返回管理员首页
          </Link>

          <div className="pb-16 pt-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-200">
              ANALYTICS
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              数据统计
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">
              分析实验室使用率、预约高峰、学生预约、设备使用和违规情况。
            </p>

            <div className="mt-5 inline-flex rounded-xl bg-white/10 px-4 py-2 text-xs font-medium text-blue-100 ring-1 ring-white/10">
              统计周期：近 30 天
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-8 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        {/* Overview */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            title="实验室"
            value={
              laboratories.length
            }
            description={`${activeLabs} 个当前启用`}
            icon="室"
          />

          <SummaryCard
            title="学生"
            value={students.length}
            description="学生用户总数"
            icon="生"
          />

          <SummaryCard
            title="近30天预约"
            value={
              recentReservations.length
            }
            description="新建预约记录"
            icon="预"
          />

          <SummaryCard
            title="有效预约"
            value={approvedCount}
            description="已通过 / 已完成"
            icon="通"
          />

          <SummaryCard
            title="违规记录"
            value={violations.length}
            description={
              violations.length > 0
                ? "需要持续关注"
                : "暂无违规"
            }
            icon="违"
          />
        </section>

        {/* Main analytics */}
        <div className="mt-8 space-y-8">
          {/* Lab Utilization */}
          <DashboardSection
            title="实验室使用率"
            description="根据近30天预约人数与使用时长计算容量利用情况"
            badge="01"
          >
            {laboratoryStats.length ===
            0 ? (
              <EmptyState text="暂无实验室数据" />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {laboratoryStats.map(
                  (
                    laboratory,
                    index
                  ) => (
                    <div
                      key={
                        laboratory.id
                      }
                      className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <RankingBadge
                              rank={
                                index + 1
                              }
                            />

                            <h3 className="font-bold text-slate-900">
                              {
                                laboratory.name
                              }
                            </h3>
                          </div>

                          <p className="mt-2 text-xs leading-5 text-slate-400">
                            {
                              laboratory.openTime
                            }{" "}
                            -{" "}
                            {
                              laboratory.closeTime
                            }
                            {" · "}
                            {
                              laboratory.maxPeople
                            }
                            人容量
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-700">
                            {laboratory.utilization.toFixed(
                              1
                            )}
                            %
                          </p>

                          <p className="text-xs text-slate-400">
                            使用率
                          </p>
                        </div>
                      </div>

                      <div className="mt-5">
                        <ProgressBar
                          value={
                            laboratory.utilization
                          }
                          max={100}
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <MiniStat
                          label="有效预约"
                          value={`${laboratory.reservationCount} 次`}
                        />

                        <MiniStat
                          label="容量使用"
                          value={`${laboratory.usedPersonHours.toFixed(
                            1
                          )} 人·小时`}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </DashboardSection>

          {/* Two-column analysis */}
          <div className="grid gap-8 xl:grid-cols-2">
            {/* Popular periods */}
            <DashboardSection
              title="热门时间段"
              description="预约次数最高的时间区间"
              badge="02"
            >
              {popularPeriods.length ===
              0 ? (
                <EmptyState text="暂无预约数据" />
              ) : (
                <div className="space-y-5">
                  {popularPeriods.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={
                          item.period
                        }
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <RankingBadge
                              rank={
                                index +
                                1
                              }
                            />

                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                {
                                  item.period
                                }
                              </p>

                              <p className="text-xs text-slate-400">
                                {
                                  item.people
                                }{" "}
                                人次
                              </p>
                            </div>
                          </div>

                          <p className="text-sm font-bold text-slate-800">
                            {item.count} 次
                          </p>
                        </div>

                        <ProgressBar
                          value={
                            item.count
                          }
                          max={
                            maxPeriodCount
                          }
                        />
                      </div>
                    )
                  )}
                </div>
              )}
            </DashboardSection>

            {/* Status distribution */}
            <DashboardSection
              title="预约状态分布"
              description={`累计 ${totalReservations} 条预约记录`}
              badge="03"
            >
              <div className="space-y-4">
                {statusStatistics.map(
                  (item) => {
                    const percentage =
                      totalReservations >
                      0
                        ? (item.value /
                            totalReservations) *
                          100
                        : 0;

                    return (
                      <div
                        key={
                          item.name
                        }
                      >
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <StatusDot
                              tone={
                                item.tone
                              }
                            />

                            <p className="text-sm font-medium text-slate-700">
                              {
                                item.name
                              }
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-bold text-slate-900">
                              {
                                item.value
                              }
                            </span>

                            <span className="ml-2 text-xs text-slate-400">
                              {percentage.toFixed(
                                1
                              )}
                              %
                            </span>
                          </div>
                        </div>

                        <ProgressBar
                          value={
                            item.value
                          }
                          max={Math.max(
                            totalReservations,
                            1
                          )}
                        />
                      </div>
                    );
                  }
                )}
              </div>

              {pendingCount > 0 && (
                <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                  <p className="text-sm font-bold text-orange-800">
                    当前还有{" "}
                    {pendingCount} 条预约等待审核
                  </p>

                  <p className="mt-1 text-xs text-orange-700">
                    建议及时处理，避免影响学生实验安排。
                  </p>
                </div>
              )}
            </DashboardSection>
          </div>

          {/* Student rankings */}
          <DashboardSection
            title="学生预约情况"
            description="按有效预约次数排序"
            badge="04"
          >
            {studentStats.length ===
            0 ? (
              <EmptyState text="暂无学生数据" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <th className="pb-4 pr-5">
                        排名
                      </th>

                      <th className="pb-4 pr-5">
                        学生
                      </th>

                      <th className="pb-4 pr-5">
                        学号
                      </th>

                      <th className="pb-4 pr-5">
                        有效预约
                      </th>

                      <th className="pb-4 pr-5">
                        已完成
                      </th>

                      <th className="pb-4">
                        违规
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {studentStats.map(
                      (
                        student,
                        index
                      ) => (
                        <tr
                          key={
                            student.id
                          }
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="py-4 pr-5">
                            <RankingBadge
                              rank={
                                index +
                                1
                              }
                            />
                          </td>

                          <td className="py-4 pr-5">
                            <p className="font-semibold text-slate-800">
                              {
                                student.name
                              }
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {
                                student.username
                              }
                            </p>
                          </td>

                          <td className="py-4 pr-5 text-sm text-slate-500">
                            {student.studentNumber ??
                              "-"}
                          </td>

                          <td className="py-4 pr-5">
                            <span className="text-lg font-bold text-slate-900">
                              {
                                student.reservationCount
                              }
                            </span>
                          </td>

                          <td className="py-4 pr-5 text-sm font-semibold text-green-700">
                            {
                              student.completedCount
                            }
                          </td>

                          <td className="py-4">
                            {student.violationCount >=
                            3 ? (
                              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                                {
                                  student.violationCount
                                }{" "}
                                次 · 已限制
                              </span>
                            ) : (
                              <span className="text-sm font-medium text-slate-600">
                                {
                                  student.violationCount
                                }{" "}
                                次
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardSection>

          {/* Equipment */}
          <DashboardSection
            title="设备使用情况"
            description="设备在有效预约中的使用次数"
            badge="05"
          >
            {equipmentStats.length ===
            0 ? (
              <EmptyState text="暂无设备数据" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {equipmentStats.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900">
                            {
                              item.name
                            }
                          </h3>

                          <p className="mt-1 text-xs text-slate-400">
                            {
                              item.laboratory
                            }
                          </p>
                        </div>

                        <EquipmentStatus
                          status={
                            item.status
                          }
                        />
                      </div>

                      <div className="mt-6 flex items-end justify-between">
                        <div>
                          <p className="text-xs font-medium text-slate-400">
                            使用次数
                          </p>

                          <p className="mt-1 text-3xl font-bold text-slate-950">
                            {
                              item.usageCount
                            }
                          </p>
                        </div>

                        <p className="text-xs text-slate-400">
                          次
                        </p>
                      </div>

                      <div className="mt-4">
                        <ProgressBar
                          value={
                            item.usageCount
                          }
                          max={
                            maxEquipmentUsage
                          }
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </DashboardSection>

          {/* Violations */}
          <DashboardSection
            title="违规排行榜"
            description="按累计违规次数排序"
            badge="06"
          >
            {violationRanking.length ===
            0 ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 font-bold text-green-700">
                  ✓
                </div>

                <p className="mt-3 font-bold text-green-800">
                  当前没有违规记录
                </p>

                <p className="mt-1 text-sm text-green-700">
                  学生预约情况良好。
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <th className="pb-4 pr-5">
                        排名
                      </th>

                      <th className="pb-4 pr-5">
                        学生
                      </th>

                      <th className="pb-4 pr-5">
                        学号
                      </th>

                      <th className="pb-4 pr-5">
                        未签到
                      </th>

                      <th className="pb-4 pr-5">
                        频繁取消
                      </th>

                      <th className="pb-4 pr-5">
                        未授权
                      </th>

                      <th className="pb-4 pr-5">
                        总违规
                      </th>

                      <th className="pb-4">
                        权限状态
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {violationRanking.map(
                      (
                        item,
                        index
                      ) => (
                        <tr
                          key={
                            item.userId
                          }
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="py-4 pr-5">
                            <RankingBadge
                              rank={
                                index +
                                1
                              }
                            />
                          </td>

                          <td className="py-4 pr-5 font-semibold text-slate-800">
                            {
                              item.name
                            }
                          </td>

                          <td className="py-4 pr-5 text-sm text-slate-500">
                            {item.studentNumber ??
                              "-"}
                          </td>

                          <td className="py-4 pr-5 text-sm text-slate-600">
                            {
                              item.noShow
                            }
                          </td>

                          <td className="py-4 pr-5 text-sm text-slate-600">
                            {
                              item.frequentCancel
                            }
                          </td>

                          <td className="py-4 pr-5 text-sm text-slate-600">
                            {
                              item.unauthorized
                            }
                          </td>

                          <td className="py-4 pr-5 text-lg font-bold text-red-600">
                            {
                              item.total
                            }
                          </td>

                          <td className="py-4">
                            {item.total >=
                            3 ? (
                              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                                仅可提前1天预约
                              </span>
                            ) : (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                正常
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardSection>

          {/* Explanation */}
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
                i
              </div>

              <div>
                <h3 className="font-bold text-blue-900">
                  关于实验室使用率
                </h3>

                <p className="mt-2 text-sm leading-6 text-blue-800">
                  使用率根据近30天实际预约的
                  “使用人数 × 使用时长”
                  与实验室
                  “开放时间 × 最大容量”
                  进行计算，因此能够同时反映实验室的使用时间和容量情况。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ==================================================
   UI COMPONENTS
================================================== */

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-3xl border border-white/20 bg-white p-5 shadow-xl shadow-slate-950/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 font-bold text-blue-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function DashboardSection({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description: string;
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700">
            {badge}
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white px-3 py-3 ring-1 ring-slate-100">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function ProgressBar({
  value,
  max,
}: {
  value: number;
  max: number;
}) {
  const percentage =
    max <= 0
      ? 0
      : Math.min(
          100,
          Math.max(
            0,
            (value / max) * 100
          )
        );

  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all"
        style={{
          width: `${percentage}%`,
        }}
      />
    </div>
  );
}

function RankingBadge({
  rank,
}: {
  rank: number;
}) {
  if (rank === 1) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-xs font-bold text-amber-700">
        1
      </span>
    );
  }

  if (rank === 2) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200 text-xs font-bold text-slate-600">
        2
      </span>
    );
  }

  if (rank === 3) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-xs font-bold text-orange-700">
        3
      </span>
    );
  }

  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
      {rank}
    </span>
  );
}

function EquipmentStatus({
  status,
}: {
  status: string;
}) {
  const label =
    status === "AVAILABLE"
      ? "可用"
      : status === "IN_USE"
        ? "使用中"
        : status === "MAINTENANCE"
          ? "维护中"
          : "停用";

  const style =
    status === "AVAILABLE"
      ? "bg-green-100 text-green-700"
      : status === "IN_USE"
        ? "bg-blue-100 text-blue-700"
        : status === "MAINTENANCE"
          ? "bg-orange-100 text-orange-700"
          : "bg-red-100 text-red-700";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${style}`}
    >
      {label}
    </span>
  );
}

function StatusDot({
  tone,
}: {
  tone: string;
}) {
  const style =
    tone === "green"
      ? "bg-green-500"
      : tone === "blue"
        ? "bg-blue-500"
        : tone === "orange"
          ? "bg-orange-500"
          : tone === "red"
            ? "bg-red-500"
            : "bg-slate-400";

  return (
    <span
      className={`h-2.5 w-2.5 rounded-full ${style}`}
    />
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-400">
        -
      </div>

      <p className="mt-3 text-sm text-slate-400">
        {text}
      </p>
    </div>
  );
}

/* ==================================================
   HELPERS
================================================== */

function timeToHours(
  time: string
) {
  const [hours, minutes] =
    time.split(":").map(Number);

  return (
    hours +
    (minutes || 0) / 60
  );
}

function getDurationHours(
  start: Date,
  end: Date,
  minimum: Date,
  maximum: Date
) {
  const actualStart =
    new Date(
      Math.max(
        start.getTime(),
        minimum.getTime()
      )
    );

  const actualEnd =
    new Date(
      Math.min(
        end.getTime(),
        maximum.getTime()
      )
    );

  if (
    actualEnd <= actualStart
  ) {
    return 0;
  }

  return (
    (actualEnd.getTime() -
      actualStart.getTime()) /
    (1000 * 60 * 60)
  );
}

function padHour(
  hour: number
) {
  return String(
    hour
  ).padStart(
    2,
    "0"
  );
}

function countStatus(
  reservations: {
    status: string;
  }[],
  status: string
) {
  return reservations.filter(
    (reservation) =>
      reservation.status ===
      status
  ).length;
}