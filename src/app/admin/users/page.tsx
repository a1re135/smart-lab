import Link from "next/link";

import UserManagement from "@/components/user-management";
import LogoutButton from "@/components/logout-button";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function UsersPage() {
  const session = await requireRole("ADMIN");

  const users =
    await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        status: true,
        studentNumber: true,
        teacherNumber: true,
        studentLevel: true,
      },

      orderBy: {
        id: "asc",
      },
    });

  const studentCount =
    users.filter(
      (user) =>
        user.role === "STUDENT"
    ).length;

  const teacherCount =
    users.filter(
      (user) =>
        user.role === "TEACHER"
    ).length;

  const disabledCount =
    users.filter(
      (user) =>
        user.status === "DISABLED"
    ).length;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900">
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg font-bold text-white ring-1 ring-white/20 transition hover:bg-white/20"
              >
                ←
              </Link>

              <div>
                <p className="text-xs font-medium text-blue-200 sm:text-sm">
                  高校智能实验室预约管理系统
                </p>

                <h1 className="font-bold text-white">
                  用户管理
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

        <div className="mx-auto max-w-7xl px-4 pb-16 pt-9 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-200">
            USER MANAGEMENT
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            用户管理
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">
            查看系统用户身份、学号或教师编号，并管理账号启用状态。
          </p>
        </div>
      </div>

      <div className="mx-auto -mt-8 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        {/* Summary */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="用户总数"
            value={users.length}
            description="系统全部账号"
            icon="用"
          />

          <SummaryCard
            title="学生"
            value={studentCount}
            description="学生用户数量"
            icon="生"
          />

          <SummaryCard
            title="教师"
            value={teacherCount}
            description="教师用户数量"
            icon="师"
          />

          <SummaryCard
            title="已禁用"
            value={disabledCount}
            description={
              disabledCount > 0
                ? "当前无法登录"
                : "暂无禁用账号"
            }
            icon="停"
          />
        </section>

        <section className="mt-8">
          <UserManagement
            users={users}
            currentUserId={
              session.userId
            }
          />
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