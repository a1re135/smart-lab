import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const EFFECTIVE_STATUSES = [
  "PENDING_TEACHER",
  "PENDING_ADMIN",
  "APPROVED",
  "COMPLETED",
  "MISSED",
];

const USAGE_STATUSES = [
  "APPROVED",
  "COMPLETED",
];

export default async function StatisticsPage() {
  await requireRole("ADMIN");

  // ====================================================
  // DATE RANGE
  // ====================================================

  const now = new Date();

  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - 29);
  periodStart.setHours(0, 0, 0, 0);

  // ====================================================
  // LOAD DATABASE DATA
  // ====================================================

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

  // ====================================================
  // BASIC SUMMARY
  // ====================================================

  const recentReservations =
    reservations.filter(
      (reservation) =>
        reservation.createdAt >= periodStart
    );

  const approvedCount =
    reservations.filter(
      (reservation) =>
        reservation.status === "APPROVED" ||
        reservation.status === "COMPLETED"
    ).length;

  const pendingCount =
    reservations.filter(
      (reservation) =>
        reservation.status ===
          "PENDING_TEACHER" ||
        reservation.status ===
          "PENDING_ADMIN"
    ).length;

  // ====================================================
  // 1. LABORATORY UTILIZATION RATE
  //
  // Formula:
  //
  // reserved person-hours
  // --------------------------- × 100
  // total available person-hours
  //
  // Example:
  // 10 hours/day × 20 people × 30 days
  // = 6000 available person-hours
  // ====================================================

  const recentUsageReservations =
    reservations.filter(
      (reservation) =>
        reservation.startAt >= periodStart &&
        reservation.startAt <= now &&
        USAGE_STATUSES.includes(
          reservation.status
        )
    );

  const laboratoryStats =
    laboratories
      .map((laboratory) => {
        const openHours =
          timeToHours(laboratory.closeTime) -
          timeToHours(laboratory.openTime);

        const totalCapacityHours =
          Math.max(openHours, 0) *
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
            (total, reservation) => {
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
          type: laboratory.type,
          openTime: laboratory.openTime,
          closeTime: laboratory.closeTime,
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

  // ====================================================
  // 2. POPULAR TIME PERIODS
  //
  // Use 2-hour groups:
  // 08:00-10:00
  // 10:00-12:00
  // etc.
  // ====================================================

  const timePeriodMap = new Map<
    string,
    {
      count: number;
      people: number;
    }
  >();

  const recentDemandReservations =
    reservations.filter(
      (reservation) =>
        reservation.startAt >=
          periodStart &&
        reservation.startAt <= now &&
        ![
          "CANCELLED",
          "REJECTED",
        ].includes(reservation.status)
    );

  for (
    const reservation of
    recentDemandReservations
  ) {
    const hour =
      reservation.startAt.getHours();

    const startHour =
      Math.floor(hour / 2) * 2;

    const endHour = Math.min(
      startHour + 2,
      24
    );

    const label = `${padHour(
      startHour
    )}:00-${padHour(endHour)}:00`;

    const existing =
      timePeriodMap.get(label) ?? {
        count: 0,
        people: 0,
      };

    existing.count += 1;
    existing.people +=
      reservation.peopleCount;

    timePeriodMap.set(
      label,
      existing
    );
  }

  const popularPeriods =
    Array.from(
      timePeriodMap.entries()
    )
      .map(([period, data]) => ({
        period,
        count: data.count,
        people: data.people,
      }))
      .sort(
        (a, b) =>
          b.count - a.count
      )
      .slice(0, 8);

  const maxPeriodCount = Math.max(
    1,
    ...popularPeriods.map(
      (item) => item.count
    )
  );

  // ====================================================
  // 3. STUDENT RESERVATION COUNTS
  // ====================================================

  const violationCountByUser =
    new Map<number, number>();

  for (const violation of violations) {
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

        const completed =
          studentReservations.filter(
            (reservation) =>
              reservation.status ===
              "COMPLETED"
          ).length;

        return {
          ...student,
          reservationCount:
            studentReservations.length,
          completedCount: completed,
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

  const maxStudentReservations =
    Math.max(
      1,
      ...studentStats.map(
        (student) =>
          student.reservationCount
      )
    );

  // ====================================================
  // 4. EQUIPMENT USAGE
  // ====================================================

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
        (item) => item.usageCount
      )
    );

  // ====================================================
  // 5. VIOLATION RANKING
  // ====================================================

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

  for (const violation of violations) {
    const existing =
      violationMap.get(
        violation.userId
      ) ?? {
        userId: violation.userId,
        name: violation.user.name,
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
      violation.type === "NO_SHOW"
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

  // ====================================================
  // RESERVATION STATUS
  // Extra useful statistic
  // ====================================================

  const statusStatistics = [
    {
      name: "等待教师审核",
      value:
        countStatus(
          reservations,
          "PENDING_TEACHER"
        ),
    },
    {
      name: "等待管理员审核",
      value:
        countStatus(
          reservations,
          "PENDING_ADMIN"
        ),
    },
    {
      name: "已通过",
      value:
        countStatus(
          reservations,
          "APPROVED"
        ),
    },
    {
      name: "已完成",
      value:
        countStatus(
          reservations,
          "COMPLETED"
        ),
    },
    {
      name: "已取消",
      value:
        countStatus(
          reservations,
          "CANCELLED"
        ),
    },
    {
      name: "已拒绝",
      value:
        countStatus(
          reservations,
          "REJECTED"
        ),
    },
    {
      name: "未签到",
      value:
        countStatus(
          reservations,
          "MISSED"
        ),
    },
  ];

  const maxStatusCount =
    Math.max(
      1,
      ...statusStatistics.map(
        (item) => item.value
      )
    );

  // ====================================================
  // PAGE
  // ====================================================

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Header */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-bold text-slate-900">
            数据统计
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            实验室预约与使用情况分析
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Link
          href="/admin"
          className="mb-6 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← 返回管理员首页
        </Link>

        {/* ============================= */}
        {/* OVERVIEW */}
        {/* ============================= */}

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              系统概览
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              当前系统的主要数据
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              label="实验室"
              value={laboratories.length}
              description="实验室总数"
            />

            <SummaryCard
              label="学生"
              value={students.length}
              description="学生用户总数"
            />

            <SummaryCard
              label="近30天预约"
              value={
                recentReservations.length
              }
              description="新增预约记录"
            />

            <SummaryCard
              label="已通过预约"
              value={approvedCount}
              description="已通过 / 已完成"
            />

            <SummaryCard
              label="违规记录"
              value={violations.length}
              description="累计违规次数"
            />
          </div>
        </section>

        {/* ============================= */}
        {/* LAB UTILIZATION */}
        {/* ============================= */}

        <section className="mt-10">
          <SectionTitle
            title="实验室使用率"
            description="近30天容量利用率（预约人数 × 使用时长 ÷ 实验室可用容量时长）"
          />

          <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            <div className="space-y-6">
              {laboratoryStats.map(
                (lab, index) => (
                  <div key={lab.id}>
                    <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {index + 1}.{" "}
                          {lab.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {lab.openTime} -{" "}
                          {lab.closeTime}
                          {" · "}
                          最大{" "}
                          {lab.maxPeople}人
                          {" · "}
                          {lab.reservationCount}
                          次有效预约
                        </p>
                      </div>

                      <p className="text-lg font-bold text-blue-600">
                        {lab.utilization.toFixed(
                          1
                        )}
                        %
                      </p>
                    </div>

                    <ProgressBar
                      value={
                        lab.utilization
                      }
                      max={100}
                    />

                    <p className="mt-1 text-xs text-slate-400">
                      近30天预约容量：
                      {lab.usedPersonHours.toFixed(
                        1
                      )}{" "}
                      人·小时
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* ============================= */}
        {/* POPULAR TIME */}
        {/* ============================= */}

        <section className="mt-10">
          <SectionTitle
            title="热门时间段"
            description="近30天预约次数最多的实验时间段"
          />

          <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            {popularPeriods.length ===
            0 ? (
              <EmptyState text="暂无预约数据" />
            ) : (
              <div className="space-y-5">
                {popularPeriods.map(
                  (item, index) => (
                    <div
                      key={item.period}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                            {index + 1}
                          </span>

                          <span className="font-medium text-slate-900">
                            {item.period}
                          </span>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-slate-800">
                            {item.count} 次
                          </p>

                          <p className="text-xs text-slate-400">
                            {item.people}
                            人次
                          </p>
                        </div>
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
          </div>
        </section>

        {/* ============================= */}
        {/* STUDENT BOOKINGS */}
        {/* ============================= */}

        <section className="mt-10">
          <SectionTitle
            title="学生预约次数"
            description="学生有效预约次数排名"
          />

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-sm text-slate-500">
                    <th className="px-5 py-4">
                      排名
                    </th>

                    <th className="px-5 py-4">
                      学生
                    </th>

                    <th className="px-5 py-4">
                      学号
                    </th>

                    <th className="px-5 py-4">
                      有效预约
                    </th>

                    <th className="px-5 py-4">
                      已完成
                    </th>

                    <th className="px-5 py-4">
                      违规
                    </th>

                    <th className="px-5 py-4">
                      预约活跃度
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
                        className="border-t border-slate-100 text-sm"
                      >
                        <td className="px-5 py-4 font-medium text-slate-500">
                          {index + 1}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900">
                            {
                              student.name
                            }
                          </p>

                          <p className="text-xs text-slate-400">
                            {
                              student.username
                            }
                          </p>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {student.studentNumber ??
                            "-"}
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {
                            student.reservationCount
                          }
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {
                            student.completedCount
                          }
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={
                              student.violationCount >=
                              3
                                ? "font-semibold text-red-600"
                                : "text-slate-600"
                            }
                          >
                            {
                              student.violationCount
                            }
                          </span>
                        </td>

                        <td className="w-48 px-5 py-4">
                          <ProgressBar
                            value={
                              student.reservationCount
                            }
                            max={
                              maxStudentReservations
                            }
                          />
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ============================= */}
        {/* EQUIPMENT */}
        {/* ============================= */}

        <section className="mt-10">
          <SectionTitle
            title="设备使用情况"
            description="设备有效预约使用次数"
          />

          <div className="grid gap-4 md:grid-cols-2">
            {equipmentStats.map(
              (item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {item.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
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

                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="text-sm text-slate-500">
                        使用次数
                      </p>

                      <p className="mt-1 text-3xl font-bold text-slate-900">
                        {
                          item.usageCount
                        }
                      </p>
                    </div>
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

          {equipmentStats.length >
            0 &&
            equipmentStats.every(
              (item) =>
                item.usageCount === 0
            ) && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                当前设备预约次数均为 0。
                这是正常的：只有预约记录与设备建立关联后，
                设备使用统计才会产生数据。
              </div>
            )}
        </section>

        {/* ============================= */}
        {/* VIOLATION RANKING */}
        {/* ============================= */}

        <section className="mt-10">
          <SectionTitle
            title="违规排行榜"
            description="按累计违规次数排序"
          />

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {violationRanking.length ===
            0 ? (
              <div className="p-8">
                <EmptyState text="目前没有违规记录" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-sm text-slate-500">
                      <th className="px-5 py-4">
                        排名
                      </th>

                      <th className="px-5 py-4">
                        学生
                      </th>

                      <th className="px-5 py-4">
                        学号
                      </th>

                      <th className="px-5 py-4">
                        未签到
                      </th>

                      <th className="px-5 py-4">
                        频繁取消
                      </th>

                      <th className="px-5 py-4">
                        未授权使用
                      </th>

                      <th className="px-5 py-4">
                        总违规
                      </th>

                      <th className="px-5 py-4">
                        预约权限
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
                          className="border-t border-slate-100 text-sm"
                        >
                          <td className="px-5 py-4">
                            <RankingBadge
                              rank={
                                index + 1
                              }
                            />
                          </td>

                          <td className="px-5 py-4 font-medium text-slate-900">
                            {
                              item.name
                            }
                          </td>

                          <td className="px-5 py-4 text-slate-500">
                            {item.studentNumber ??
                              "-"}
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {
                              item.noShow
                            }
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {
                              item.frequentCancel
                            }
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {
                              item.unauthorized
                            }
                          </td>

                          <td className="px-5 py-4 font-bold text-red-600">
                            {
                              item.total
                            }
                          </td>

                          <td className="px-5 py-4">
                            {item.total >=
                            3 ? (
                              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                                仅可提前1天预约
                              </span>
                            ) : (
                              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
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
          </div>
        </section>

        {/* ============================= */}
        {/* STATUS DISTRIBUTION */}
        {/* ============================= */}

        <section className="mt-10 pb-10">
          <SectionTitle
            title="预约状态分布"
            description="当前数据库中的预约状态统计"
          />

          <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            <div className="space-y-5">
              {statusStatistics.map(
                (item) => (
                  <div
                    key={item.name}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        {item.name}
                      </span>

                      <span className="text-sm font-semibold text-slate-900">
                        {
                          item.value
                        }{" "}
                        条
                      </span>
                    </div>

                    <ProgressBar
                      value={
                        item.value
                      }
                      max={
                        maxStatusCount
                      }
                    />
                  </div>
                )
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
            当前待审核预约：
            <strong>
              {pendingCount}
            </strong>{" "}
            条
          </div>
        </section>
      </div>
    </main>
  );
}

// ======================================================
// COMPONENTS
// ======================================================

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-slate-900">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {description}
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
        className="h-full rounded-full bg-blue-600 transition-all"
        style={{
          width: `${percentage}%`,
        }}
      />
    </div>
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

  const className =
    status === "AVAILABLE"
      ? "bg-green-50 text-green-700"
      : status === "IN_USE"
        ? "bg-blue-50 text-blue-700"
        : status === "MAINTENANCE"
          ? "bg-orange-50 text-orange-700"
          : "bg-red-50 text-red-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

function RankingBadge({
  rank,
}: {
  rank: number;
}) {
  if (rank <= 3) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-xs font-bold text-red-700">
        {rank}
      </span>
    );
  }

  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
      {rank}
    </span>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <p className="text-center text-sm text-slate-500">
      {text}
    </p>
  );
}

// ======================================================
// HELPERS
// ======================================================

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
  const actualStart = new Date(
    Math.max(
      start.getTime(),
      minimum.getTime()
    )
  );

  const actualEnd = new Date(
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
  return String(hour).padStart(
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