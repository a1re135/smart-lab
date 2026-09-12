import Link from "next/link";

import CancelReservationButton from "@/components/cancel-reservation-button";
import CheckInForm from "@/components/checkin-form";
import LogoutButton from "@/components/logout-button";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { processExpiredReservationsForStudent } from "@/lib/violations";

export default async function StudentReservationsPage() {
  const session = await requireRole("STUDENT");

  await processExpiredReservationsForStudent(
    session.userId
  );

  const [
    reservations,
    violationCount,
  ] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        studentId: session.userId,
      },

      include: {
        laboratory: true,
        checkIn: true,

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

    prisma.violation.count({
      where: {
        userId: session.userId,
      },
    }),
  ]);

  const upcomingCount =
    reservations.filter(
      (reservation) =>
        [
          "PENDING_TEACHER",
          "PENDING_ADMIN",
          "APPROVED",
        ].includes(
          reservation.status
        ) &&
        reservation.startAt >
          new Date()
    ).length;

  const approvedCount =
    reservations.filter(
      (reservation) =>
        reservation.status ===
        "APPROVED"
    ).length;

  const completedCount =
    reservations.filter(
      (reservation) =>
        reservation.status ===
        "COMPLETED"
    ).length;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900">
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link
                href="/student"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg font-bold text-white ring-1 ring-white/20 transition hover:bg-white/20"
              >
                ←
              </Link>

              <div>
                <p className="text-xs font-medium text-blue-200 sm:text-sm">
                  高校智能实验室预约管理系统
                </p>

                <h1 className="font-bold text-white">
                  我的预约
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-white">
                  {session.name}
                </p>

                <p className="text-xs text-blue-200">
                  学生用户
                </p>
              </div>

              <LogoutButton />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 pb-16 pt-9 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-200">
            MY RESERVATIONS
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            预约记录
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">
            查看预约状态、签到信息、设备使用情况以及取消预约。
          </p>
        </div>
      </div>

      <div className="mx-auto -mt-8 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        {/* Summary */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="全部预约"
            value={reservations.length}
            description="累计预约记录"
            icon="全"
          />

          <SummaryCard
            title="待进行"
            value={upcomingCount}
            description="未来预约"
            icon="待"
          />

          <SummaryCard
            title="已通过"
            value={approvedCount}
            description="当前已批准"
            icon="通"
          />

          <SummaryCard
            title="已完成"
            value={completedCount}
            description="历史已完成"
            icon="完"
          />
        </section>

        {/* Violation */}
        {violationCount > 0 && (
          <section className="mt-6">
            <div
              className={`rounded-2xl border p-5 ${
                violationCount >= 3
                  ? "border-red-200 bg-red-50"
                  : "border-orange-200 bg-orange-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold ${
                    violationCount >= 3
                      ? "bg-red-100 text-red-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  !
                </div>

                <div>
                  <h3
                    className={`font-bold ${
                      violationCount >= 3
                        ? "text-red-800"
                        : "text-orange-800"
                    }`}
                  >
                    当前违规记录：
                    {violationCount} 次
                  </h3>

                  <p
                    className={`mt-1 text-sm ${
                      violationCount >= 3
                        ? "text-red-700"
                        : "text-orange-700"
                    }`}
                  >
                    {violationCount >= 3
                      ? "违规次数达到3次，当前预约权限已限制为最多提前1天。"
                      : "请注意按时签到并遵守预约规定，避免影响后续预约权限。"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Reservations */}
        <section className="mt-8">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                RESERVATION HISTORY
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                预约列表
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                按最新创建时间排序
              </p>
            </div>

            <Link
              href="/student"
              className="inline-flex w-fit items-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              + 新建预约
            </Link>
          </div>

          {reservations.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-xl font-bold text-blue-700">
                预
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                还没有预约记录
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                选择一个实验室并提交您的第一条预约。
              </p>

              <Link
                href="/student"
                className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                浏览实验室
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {reservations.map(
                (reservation) => {
                  const canCancel =
                    [
                      "PENDING_TEACHER",
                      "PENDING_ADMIN",
                      "APPROVED",
                    ].includes(
                      reservation.status
                    ) &&
                    reservation.startAt >
                      new Date();

                  const canCheckIn =
                    reservation.status ===
                      "APPROVED" &&
                    !reservation.checkIn
                      ?.checkedInAt;

                  return (
                    <article
                      key={reservation.id}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
                    >
                      <div className="p-5 sm:p-6">
                        {/* Header */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xl font-bold text-slate-900">
                                {
                                  reservation
                                    .laboratory
                                    .name
                                }
                              </h3>

                              <StatusBadge
                                status={
                                  reservation.status
                                }
                              />
                            </div>

                            <p className="mt-2 text-sm text-slate-400">
                              预约编号 #
                              {
                                reservation.id
                              }
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 px-4 py-3 text-left sm:text-right">
                            <p className="text-xs font-medium text-slate-400">
                              预约日期
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {formatDate(
                                reservation.startAt
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Information */}
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <InfoBox
                            label="开始时间"
                            value={formatTime(
                              reservation.startAt
                            )}
                          />

                          <InfoBox
                            label="结束时间"
                            value={formatTime(
                              reservation.endAt
                            )}
                          />

                          <InfoBox
                            label="使用人数"
                            value={`${reservation.peopleCount} 人`}
                          />

                          <InfoBox
                            label="预约状态"
                            value={getStatusText(
                              reservation.status
                            )}
                          />
                        </div>

                        {/* Purpose */}
                        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            使用目的
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {
                              reservation.purpose
                            }
                          </p>
                        </div>

                        {/* Equipment */}
                        {reservation.equipment
                          .length > 0 && (
                          <div className="mt-5">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-slate-700">
                                使用设备
                              </p>

                              <span className="text-xs text-slate-400">
                                {
                                  reservation
                                    .equipment
                                    .length
                                }{" "}
                                项
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {reservation.equipment.map(
                                (
                                  relation
                                ) => (
                                  <span
                                    key={
                                      relation.equipmentId
                                    }
                                    className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                                  >
                                    {
                                      relation
                                        .equipment
                                        .name
                                    }
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* Check in status */}
                        {reservation.checkIn
                          ?.checkedInAt && (
                          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 font-bold text-green-700">
                                ✓
                              </div>

                              <div>
                                <p className="text-sm font-bold text-green-800">
                                  已完成签到
                                </p>

                                <p className="mt-0.5 text-xs text-green-700">
                                  签到时间：
                                  {formatDateTime(
                                    reservation
                                      .checkIn
                                      .checkedInAt
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        {(canCancel ||
                          canCheckIn) && (
                          <div className="mt-6 border-t border-slate-100 pt-5">
                            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                              可执行操作
                            </p>

                            <div className="space-y-3">
                              {canCheckIn && (
                                <CheckInForm
                                  reservationId={
                                    reservation.id
                                  }
                                />
                              )}

                              {canCancel && (
                                <CancelReservationButton
                                  reservationId={
                                    reservation.id
                                  }
                                />
                              )}
                            </div>
                          </div>
                        )}

                        {/* Final status messages */}
                        {reservation.status ===
                          "MISSED" && (
                          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            此预约未按时签到，系统已记录一次违规。
                          </div>
                        )}

                        {reservation.status ===
                          "CANCELLED" && (
                          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                            此预约已取消，不再占用实验室容量。
                          </div>
                        )}

                        {reservation.status ===
                          "REJECTED" && (
                          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                            此预约未通过审核。
                          </div>
                        )}

                        {reservation.status ===
                          "COMPLETED" && (
                          <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
                            此预约已完成。
                          </div>
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

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
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 font-bold text-blue-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const text =
    getStatusText(status);

  let className =
    "bg-slate-100 text-slate-600";

  if (
    status === "APPROVED"
  ) {
    className =
      "bg-green-100 text-green-700";
  }

  if (
    status === "PENDING_TEACHER" ||
    status === "PENDING_ADMIN"
  ) {
    className =
      "bg-orange-100 text-orange-700";
  }

  if (
    status === "REJECTED" ||
    status === "MISSED"
  ) {
    className =
      "bg-red-100 text-red-700";
  }

  if (
    status === "COMPLETED"
  ) {
    className =
      "bg-blue-100 text-blue-700";
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {text}
    </span>
  );
}

function getStatusText(
  status: string
) {
  if (
    status === "PENDING_TEACHER"
  ) {
    return "等待教师审核";
  }

  if (
    status === "PENDING_ADMIN"
  ) {
    return "等待管理员审核";
  }

  if (
    status === "APPROVED"
  ) {
    return "已通过";
  }

  if (
    status === "REJECTED"
  ) {
    return "已拒绝";
  }

  if (
    status === "CANCELLED"
  ) {
    return "已取消";
  }

  if (
    status === "COMPLETED"
  ) {
    return "已完成";
  }

  if (
    status === "MISSED"
  ) {
    return "未签到";
  }

  return status;
}

function formatDate(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "zh-CN",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(date);
}

function formatTime(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "zh-CN",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  ).format(date);
}

function formatDateTime(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "zh-CN",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  ).format(date);
}