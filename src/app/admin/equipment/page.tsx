import Link from "next/link";

import EquipmentManagement from "@/components/equipment-management";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function EquipmentPage() {
  await requireRole("ADMIN");

  const laboratories =
    await prisma.laboratory.findMany({
      orderBy: {
        id: "asc",
      },

      select: {
        id: true,
        name: true,
      },
    });

  const equipment =
    await prisma.equipment.findMany({
      include: {
        laboratory: true,
      },

      orderBy: {
        id: "asc",
      },
    });

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold text-slate-900">
            设备管理
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            管理实验室设备、权限和使用状态
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link
          href="/admin"
          className="mb-5 inline-block text-sm font-medium text-blue-600"
        >
          ← 返回管理员首页
        </Link>

        <EquipmentManagement
          laboratories={laboratories}
          equipment={equipment}
        />
      </div>
    </main>
  );
}