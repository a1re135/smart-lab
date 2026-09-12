import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function StudentPage() {
  const session = await requireRole("STUDENT");

  const laboratories = await prisma.laboratory.findMany({
    where: {
      isActive: true,
    },
    include: {
      equipment: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              智能实验室预约系统
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              学生端
            </p>
          </div>

          <div className="text-right">
            <p className="font-medium text-slate-900">
              {session.name}
            </p>

            <p className="text-xs text-slate-500">
              {session.username}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}

      <Link
        href="/student/reservations"
        className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
        我的预约
        </Link>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            实验室列表
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            查看实验室开放时间、人数限制和可用设备
          </p>
        </div>

        {laboratories.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-500">
              暂无可用实验室
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {laboratories.map((lab) => (
              <div
                key={lab.id}
                className="flex flex-col rounded-2xl bg-white p-5 shadow-sm"
              >
                {/* Lab type */}
                <div className="mb-3">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                    {getLabTypeName(lab.type)}
                  </span>
                </div>

                {/* Lab name */}
                <h3 className="text-xl font-bold text-slate-900">
                  {lab.name}
                </h3>

                <p className="mt-2 min-h-10 text-sm text-slate-500">
                  {lab.description || "暂无实验室介绍"}
                </p>

                {/* Information */}
                <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                  <InfoRow
                    label="开放时间"
                    value={`${lab.openTime} - ${lab.closeTime}`}
                  />

                  <InfoRow
                    label="最大人数"
                    value={`${lab.maxPeople} 人`}
                  />

                  <InfoRow
                    label="提前预约"
                    value={`${lab.advanceDays} 天`}
                  />

                  <InfoRow
                    label="教师审核"
                    value={
                      lab.requiresTeacherApproval
                        ? "需要"
                        : "不需要"
                    }
                  />

                  <InfoRow
                    label="管理员审核"
                    value={
                      lab.requiresAdminApproval
                        ? "需要"
                        : "不需要"
                    }
                  />
                </div>

                {/* Equipment */}
                <div className="mt-5">
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    实验室设备
                  </p>

                  {lab.equipment.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      暂无设备
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {lab.equipment.map((equipment) => (
                        <span
                          key={equipment.id}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                        >
                          {equipment.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reserve */}
                <div className="mt-auto pt-6">
                  <Link
                    href={`/student/reserve/${lab.id}`}
                    className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center font-medium text-white transition hover:bg-blue-700"
                  >
                    立即预约
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">
        {label}
      </span>

      <span className="text-right font-medium text-slate-800">
        {value}
      </span>
    </div>
  );
}

function getLabTypeName(type: string) {
  switch (type) {
    case "NORMAL":
      return "普通实验室";

    case "ADVANCED":
      return "高级实验室";

    case "EQUIPMENT":
      return "设备型实验室";

    default:
      return type;
  }
}