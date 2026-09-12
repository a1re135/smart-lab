import LogoutButton from "@/components/logout-button";
import TeacherApprovalButtons from "@/components/teacher-approval-buttons";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function TeacherPage() {
  const session = await requireRole("TEACHER");

  const [
    students,
    pendingReservations,
    recentReservations,
  ] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "STUDENT",
        teacherId: session.userId,
      },

      select: {
        id: true,
        name: true,
        username: true,
        studentNumber: true,
        studentLevel: true,
      },

      orderBy: {
        id: "asc",
      },
    }),

    prisma.reservation.findMany({
      where: {
        status: "PENDING_TEACHER",

        student: {
          teacherId: session.userId,
        },
      },

      include: {
        student: true,
        laboratory: true,

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

    prisma.reservation.findMany({
      where: {
        student: {
          teacherId: session.userId,
        },
      },

      include: {
        student: true,
        laboratory: true,

        equipment: {
          include: {
            equipment: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 8,
    }),
  ]);

  const approvedCount =
    recentReservations.filter(
      (reservation) =>
        reservation.status === "APPROVED" ||
        reservation.status === "COMPLETED"
    ).length;

  const pendingCount =
    pendingReservations.length;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero background */}
      <div className="absolute inset-x-0 top-0 h-[330px] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900" />

      <div className="relative">
        {/* Header */}
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold text-white ring-1 ring-white/20 backdrop-blur">
                师
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-blue-200 sm:text-sm">
                  高校智能实验室预约管理系统
                </p>

                <h1 className="text-base font-bold text-white sm:text-lg">
                  教师端
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-white">
                  {session.name}
                </p>

                <p className="text-xs text-blue-200">
                  指导教师
                </p>
              </div>

              <LogoutButton />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
          {/* Welcome */}
          <section>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-200">
              TEACHER PORTAL
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              欢迎回来，{session.name}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">
              查看指导学生的实验室预约，并处理需要教师确认的预约申请。
            </p>
          </section>

          {/* Summary */}
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="指导学生"
              value={students.length}
              description="当前关联学生"
              icon="生"
            />

            <SummaryCard
              title="待审核"
              value={pendingCount}
              description={
                pendingCount > 0
                  ? "需要您处理"
                  : "暂无待处理申请"
              }
              icon="审"
            />

            <SummaryCard
              title="近期预约"
              value={recentReservations.length}
              description="最近预约记录"
              icon="预"
            />

            <SummaryCard
              title="已通过"
              value={approvedCount}
              description="近期有效预约"
              icon="通"
            />
          </section>

          <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            {/* Main */}
            <div className="space-y-8">
              {/* Pending approvals */}
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-slate-900">
                        待审核预约
                      </h2>

                      {pendingCount > 0 && (
                        <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700">
                          {pendingCount}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      需要您确认的学生实验室预约
                    </p>
                  </div>
                </div>

                {pendingReservations.length === 0 ? (
                  <EmptyState
                    title="暂无待审核申请"
                    description="新的学生预约申请会显示在这里。"
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {pendingReservations.map(
                      (reservation) => (
                        <article
                          key={reservation.id}
                          className="p-5 transition hover:bg-slate-50/70 sm:p-6"
                        >
                          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-bold text-slate-900">
                                  {
                                    reservation
                                      .laboratory.name
                                  }
                                </h3>

                                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">
                                  等待教师审核
                                </span>
                              </div>

                              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <InfoBox
                                  label="学生"
                                  value={`${
                                    reservation
                                      .student.name
                                  } · ${
                                    reservation
                                      .student
                                      .studentNumber ??
                                    "-"
                                  }`}
                                />

                                <InfoBox
                                  label="预约时间"
                                  value={`${formatDateTime(
                                    reservation.startAt
                                  )} - ${formatTime(
                                    reservation.endAt
                                  )}`}
                                />

                                <InfoBox
                                  label="使用人数"
                                  value={`${reservation.peopleCount} 人`}
                                />

                                <InfoBox
                                  label="使用目的"
                                  value={
                                    reservation.purpose
                                  }
                                />
                              </div>

                              {reservation.equipment
                                .length > 0 && (
                                <div className="mt-4">
                                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    使用设备
                                  </p>

                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {reservation.equipment.map(
                                      (
                                        relation
                                      ) => (
                                        <span
                                          key={
                                            relation.equipmentId
                                          }
                                          className="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
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
                            </div>

                            <div className="w-full lg:w-60">
                              <TeacherApprovalButtons
                                reservationId={
                                  reservation.id
                                }
                              />
                            </div>
                          </div>
                        </article>
                      )
                    )}
                  </div>
                )}
              </section>

              {/* Recent reservations */}
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                  <h2 className="text-xl font-bold text-slate-900">
                    学生近期预约
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    查看指导学生最近提交的预约记录
                  </p>
                </div>

                {recentReservations.length ===
                0 ? (
                  <EmptyState
                    title="暂无预约记录"
                    description="指导学生的预约记录会显示在这里。"
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentReservations.map(
                      (reservation) => (
                        <div
                          key={reservation.id}
                          className="p-5 sm:p-6"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-slate-900">
                                  {
                                    reservation
                                      .laboratory.name
                                  }
                                </h3>

                                <StatusBadge
                                  status={
                                    reservation.status
                                  }
                                />
                              </div>

                              <p className="mt-2 text-sm text-slate-500">
                                {
                                  reservation
                                    .student.name
                                }
                                {" · "}
                                {reservation.student
                                  .studentNumber ??
                                  "-"}
                              </p>
                            </div>

                            <div className="text-sm text-slate-500 sm:text-right">
                              <p className="font-medium text-slate-700">
                                {formatDate(
                                  reservation.startAt
                                )}
                              </p>

                              <p className="mt-1">
                                {formatTime(
                                  reservation.startAt
                                )}
                                {" - "}
                                {formatTime(
                                  reservation.endAt
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                              <p className="text-xs text-slate-400">
                                使用人数
                              </p>

                              <p className="mt-1 text-sm font-semibold text-slate-700">
                                {
                                  reservation.peopleCount
                                }{" "}
                                人
                              </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                              <p className="text-xs text-slate-400">
                                使用目的
                              </p>

                              <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-700">
                                {
                                  reservation.purpose
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* Students sidebar */}
            <aside>
              <div className="sticky top-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-5">
                  <h2 className="font-bold text-slate-900">
                    我的指导学生
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    共 {students.length} 名学生
                  </p>
                </div>

                {students.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    暂无关联学生
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {students.map(
                      (student) => (
                        <div
                          key={student.id}
                          className="flex items-center gap-3 px-5 py-4"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">
                            {student.name
                              .slice(0, 1)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {student.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {student.studentNumber ??
                                student.username}
                              {" · "}
                              {getStudentLevel(
                                student.studentLevel
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
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
    <div className="rounded-3xl border border-white/20 bg-white/95 p-5 shadow-xl shadow-slate-950/10 backdrop-blur">
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
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-700">
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
  const text = getStatusText(status);

  let className =
    "bg-slate-100 text-slate-600";

  if (status === "APPROVED") {
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

  if (status === "COMPLETED") {
    className =
      "bg-blue-100 text-blue-700";
  }

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${className}`}
    >
      {text}
    </span>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg font-bold text-slate-400">
        ✓
      </div>

      <h3 className="mt-4 font-semibold text-slate-800">
        {title}
      </h3>

      <p className="mt-1 text-sm text-slate-400">
        {description}
      </p>
    </div>
  );
}

function getStatusText(
  status: string
) {
  if (status === "PENDING_TEACHER") {
    return "等待教师审核";
  }

  if (status === "PENDING_ADMIN") {
    return "等待管理员审核";
  }

  if (status === "APPROVED") {
    return "已通过";
  }

  if (status === "REJECTED") {
    return "已拒绝";
  }

  if (status === "CANCELLED") {
    return "已取消";
  }

  if (status === "COMPLETED") {
    return "已完成";
  }

  if (status === "MISSED") {
    return "未签到";
  }

  return status;
}

function getStudentLevel(
  level: string | null
) {
  if (level === "UNDERGRADUATE") {
    return "本科生";
  }

  if (level === "MASTER") {
    return "硕士研究生";
  }

  if (level === "DOCTORAL") {
    return "博士研究生";
  }

  return "学生";
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