import Link from "next/link";

import AdminApprovalButtons from "@/components/admin-approval-buttons";
import CheckInCodeButton from "@/components/checkin-code-button";
import LogoutButton from "@/components/logout-button";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function AdminPage() {
  const session = await requireRole("ADMIN");

  const [
    pendingReservations,
    approvedReservations,
    laboratoryCount,
    equipmentCount,
    studentCount,
  ] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        status: "PENDING_ADMIN",
      },

      include: {
        student: true,
        laboratory: true,
        approvals: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.reservation.findMany({
      where: {
        status: "APPROVED",
      },

      include: {
        student: true,
        laboratory: true,
        checkIn: true,
      },

      orderBy: {
        startAt: "asc",
      },
    }),

    prisma.laboratory.count(),

    prisma.equipment.count(),

    prisma.user.count({
      where: {
        role: "STUDENT",
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Decorative top background */}
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900" />

      <div className="relative">
        {/* Header */}
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold text-white ring-1 ring-white/20 backdrop-blur">
                实
              </div>

              <div>
                <p className="text-sm font-medium text-blue-200">
                  高校智能实验室预约管理系统
                </p>

                <h1 className="text-lg font-bold text-white">
                  管理员控制台
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-white">
                  {session.name}
                </p>

                <p className="text-xs text-blue-200">
                  系统管理员
                </p>
              </div>

              <LogoutButton />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
          {/* Welcome */}
          <section className="mb-8">
            <p className="text-sm font-medium text-blue-200">
              ADMIN DASHBOARD
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              欢迎回来，{session.name}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">
              管理实验室、设备和用户，并快速处理预约审核与签到任务。
            </p>
          </section>

          {/* Summary */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="待审核预约"
              value={pendingReservations.length}
              description="需要管理员处理"
              icon="待"
            />

            <SummaryCard
              label="实验室"
              value={laboratoryCount}
              description="系统实验室总数"
              icon="室"
            />

            <SummaryCard
              label="设备"
              value={equipmentCount}
              description="实验设备总数"
              icon="设"
            />

            <SummaryCard
              label="学生"
              value={studentCount}
              description="学生账号总数"
              icon="生"
            />
          </section>

          {/* Main content */}
          <div className="mt-8 grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
            {/* Navigation */}
            <aside>
              <div className="sticky top-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="px-2 pb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    管理菜单
                  </p>
                </div>

                <nav className="space-y-2">
                  <DashboardLink
                    href="/admin/laboratories"
                    title="实验室管理"
                    description="开放规则与状态"
                    icon="实"
                  />

                  <DashboardLink
                    href="/admin/equipment"
                    title="设备管理"
                    description="设备与权限设置"
                    icon="设"
                  />

                  <DashboardLink
                    href="/admin/users"
                    title="用户管理"
                    description="用户账号和状态"
                    icon="用"
                  />

                  <DashboardLink
                    href="/admin/statistics"
                    title="数据统计"
                    description="查看系统使用情况"
                    icon="统"
                  />
                </nav>
              </div>
            </aside>

            {/* Dashboard content */}
            <div className="space-y-8">
              {/* Pending approvals */}
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-slate-900">
                        待确认预约
                      </h2>

                      {pendingReservations.length > 0 && (
                        <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700">
                          {pendingReservations.length}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      审核需要管理员确认的学生预约
                    </p>
                  </div>
                </div>

                {pendingReservations.length === 0 ? (
                  <EmptyState
                    title="暂无待审核预约"
                    description="新的管理员审核任务会显示在这里。"
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {pendingReservations.map((reservation) => (
                      <article
                        key={reservation.id}
                        className="p-5 transition hover:bg-slate-50/70 sm:p-6"
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-bold text-slate-900">
                                {reservation.laboratory.name}
                              </h3>

                              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                                等待管理员审核
                              </span>
                            </div>

                            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                              <InfoItem
                                label="学生"
                                value={`${reservation.student.name} · ${
                                  reservation.student.studentNumber ?? "-"
                                }`}
                              />

                              <InfoItem
                                label="预约时间"
                                value={`${formatDateTime(
                                  reservation.startAt
                                )} - ${formatTime(reservation.endAt)}`}
                              />

                              <InfoItem
                                label="人数"
                                value={`${reservation.peopleCount} 人`}
                              />

                              <InfoItem
                                label="用途"
                                value={reservation.purpose}
                              />
                            </div>

                            <div className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                              ✓ 指导教师审核已通过
                            </div>
                          </div>

                          <div className="w-full lg:w-60">
                            <AdminApprovalButtons
                              reservationId={reservation.id}
                            />
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* Approved */}
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                  <h2 className="text-xl font-bold text-slate-900">
                    已通过预约
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    查看已通过预约并管理签到验证码
                  </p>
                </div>

                {approvedReservations.length === 0 ? (
                  <EmptyState
                    title="暂无已通过预约"
                    description="审核通过后的预约会显示在这里。"
                  />
                ) : (
                  <div className="grid gap-4 p-5 md:grid-cols-2 sm:p-6">
                    {approvedReservations.map((reservation) => (
                      <article
                        key={reservation.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-slate-900">
                              {reservation.laboratory.name}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {reservation.student.name}
                            </p>
                          </div>

                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                            已通过
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 text-sm text-slate-600">
                          <p>
                            <span className="text-slate-400">
                              学号：
                            </span>
                            {reservation.student.studentNumber ?? "-"}
                          </p>

                          <p>
                            <span className="text-slate-400">
                              时间：
                            </span>
                            {formatDateTime(reservation.startAt)}
                            {" - "}
                            {formatTime(reservation.endAt)}
                          </p>

                          <p>
                            <span className="text-slate-400">
                              人数：
                            </span>
                            {reservation.peopleCount} 人
                          </p>
                        </div>

                        {reservation.checkIn?.checkedInAt ? (
                          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                            ✓ 学生已签到
                          </div>
                        ) : (
                          <CheckInCodeButton
                            reservationId={reservation.id}
                          />
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/95 p-5 shadow-xl shadow-slate-950/10 backdrop-blur">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
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

function DashboardLink({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-blue-50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-600 transition group-hover:bg-blue-600 group-hover:text-white">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="font-semibold text-slate-800 group-hover:text-blue-700">
          {title}
        </p>

        <p className="truncate text-xs text-slate-400">
          {description}
        </p>
      </div>
    </Link>
  );
}

function InfoItem({
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

      <p className="mt-1 font-medium text-slate-700">
        {value}
      </p>
    </div>
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
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400">
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

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}