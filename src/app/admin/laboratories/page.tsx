import Link from "next/link";

import LaboratoryManagement from "@/components/laboratory-management";
import LogoutButton from "@/components/logout-button";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function LaboratoryManagementPage() {
  const session = await requireRole("ADMIN");

  const laboratories =
    await prisma.laboratory.findMany({
      orderBy: {
        id: "asc",
      },
    });

  const activeCount =
    laboratories.filter(
      (laboratory) =>
        laboratory.isActive
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
                  实验室管理
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
            LABORATORY MANAGEMENT
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            实验室管理
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">
            管理实验室开放时间、容量、预约规则和审核流程。
          </p>
        </div>
      </div>

      <div className="mx-auto -mt-8 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        {/* Summary */}
        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            title="实验室总数"
            value={laboratories.length}
            description="系统中的全部实验室"
            icon="室"
          />

          <SummaryCard
            title="当前启用"
            value={activeCount}
            description="学生可以查看和预约"
            icon="启"
          />

          <SummaryCard
            title="当前停用"
            value={
              laboratories.length -
              activeCount
            }
            description="暂时停止预约"
            icon="停"
          />
        </section>

        <section className="mt-8">
          <LaboratoryManagement
            laboratories={laboratories}
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