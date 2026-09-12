import Link from "next/link";

import EquipmentManagement from "@/components/equipment-management";
import LogoutButton from "@/components/logout-button";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function EquipmentPage() {
  const session = await requireRole("ADMIN");

  const [laboratories, equipment] =
    await Promise.all([
      prisma.laboratory.findMany({
        orderBy: {
          id: "asc",
        },

        select: {
          id: true,
          name: true,
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
    ]);

  const availableCount =
    equipment.filter(
      (item) =>
        item.status === "AVAILABLE"
    ).length;

  const maintenanceCount =
    equipment.filter(
      (item) =>
        item.status === "MAINTENANCE"
    ).length;

  const unavailableCount =
    equipment.filter(
      (item) =>
        item.status === "DISABLED"
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
                  设备管理
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
            EQUIPMENT MANAGEMENT
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            设备管理
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">
            管理实验设备、所属实验室、学生权限、审核要求和当前使用状态。
          </p>
        </div>
      </div>

      <div className="mx-auto -mt-8 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        {/* Summary */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="设备总数"
            value={equipment.length}
            description="系统全部实验设备"
            icon="设"
          />

          <SummaryCard
            title="当前可用"
            value={availableCount}
            description="可以被学生预约"
            icon="可"
          />

          <SummaryCard
            title="维护中"
            value={maintenanceCount}
            description="暂时不可预约"
            icon="维"
          />

          <SummaryCard
            title="已停用"
            value={unavailableCount}
            description="停止提供使用"
            icon="停"
          />
        </section>

        <section className="mt-8">
          <EquipmentManagement
            laboratories={laboratories}
            equipment={equipment}
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