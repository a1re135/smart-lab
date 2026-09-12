import Link from "next/link";

import LaboratoryManagement from "@/components/laboratory-management";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function LaboratoryManagementPage() {
  await requireRole("ADMIN");

  const laboratories =
    await prisma.laboratory.findMany({
      orderBy: {
        id: "asc",
      },
    });

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold text-slate-900">
            实验室管理
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            管理实验室开放规则和状态
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

        <LaboratoryManagement
          laboratories={laboratories}
        />
      </div>
    </main>
  );
}