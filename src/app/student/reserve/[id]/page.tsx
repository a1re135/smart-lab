import Link from "next/link";
import { notFound } from "next/navigation";

import ReservationForm from "@/components/reservation-form";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReservePage({
  params,
}: PageProps) {
  await requireRole("STUDENT");

  const { id } = await params;
  const laboratoryId = Number(id);

  if (!laboratoryId) {
    notFound();
  }

  const laboratory =
    await prisma.laboratory.findUnique({
      where: {
        id: laboratoryId,
      },

      include: {
        equipment: {
          where: {
            status: "AVAILABLE",
          },

          orderBy: {
            id: "asc",
          },
        },
      },
    });

  if (
    !laboratory ||
    !laboratory.isActive
  ) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/student"
            className="inline-flex items-center text-sm font-medium text-blue-200 transition hover:text-white"
          >
            ← 返回实验室列表
          </Link>

          <div className="mt-8 pb-14">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-200">
              LAB RESERVATION
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              预约实验室
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">
              选择预约日期、时间和所需设备，提交后系统会根据实验室规则进入相应审核流程。
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-8 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          {/* Laboratory information */}
          <aside>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <LaboratoryTypeBadge
                    type={laboratory.type}
                  />

                  <h2 className="mt-3 text-2xl font-bold text-slate-900">
                    {laboratory.name}
                  </h2>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-lg font-bold text-blue-700">
                  实
                </div>
              </div>

              {laboratory.description && (
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  {laboratory.description}
                </p>
              )}

              <div className="my-6 border-t border-slate-100" />

              <div className="space-y-3">
                <InfoRow
                  label="开放时间"
                  value={`${laboratory.openTime} - ${laboratory.closeTime}`}
                />

                <InfoRow
                  label="最大人数"
                  value={`${laboratory.maxPeople} 人`}
                />

                <InfoRow
                  label="提前预约"
                  value={`${laboratory.advanceDays} 天`}
                />

                <InfoRow
                  label="审核规则"
                  value={getApprovalText(
                    laboratory.requiresTeacherApproval,
                    laboratory.requiresAdminApproval
                  )}
                />
              </div>

              <div className="my-6 border-t border-slate-100" />

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">
                    当前可用设备
                  </h3>

                  <span className="text-xs text-slate-400">
                    {laboratory.equipment.length} 项
                  </span>
                </div>

                {laboratory.equipment.length === 0 ? (
                  <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-400">
                    当前暂无可用设备
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {laboratory.equipment.map(
                      (item) => (
                        <div
                          key={item.id}
                          className="rounded-xl bg-slate-50 px-3 py-3"
                        >
                          <p className="text-sm font-semibold text-slate-700">
                            {item.name}
                          </p>

                          {item.requirements && (
                            <p className="mt-1 text-xs leading-5 text-slate-400">
                              {item.requirements}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {(laboratory.requiresTeacherApproval ||
                laboratory.requiresAdminApproval) && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">
                    审核提醒
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    此实验室提交预约后不会立即生效，需要完成规定的审核流程。
                  </p>
                </div>
              )}
            </div>
          </aside>

          {/* Form */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 sm:p-7">
            <ReservationForm
              laboratoryId={laboratory.id}
              laboratoryName={laboratory.name}
              openTime={laboratory.openTime}
              closeTime={laboratory.closeTime}
              maxPeople={laboratory.maxPeople}
              advanceDays={laboratory.advanceDays}
              equipment={laboratory.equipment.map(
                (item) => ({
                  id: item.id,
                  name: item.name,
                  requirements:
                    item.requirements,
                  requiresTeacherApproval:
                    item.requiresTeacherApproval,
                  minimumStudentLevel:
                    item.minimumStudentLevel,
                })
              )}
            />
          </section>
        </div>
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
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-400">
        {label}
      </span>

      <span className="text-right text-sm font-semibold text-slate-700">
        {value}
      </span>
    </div>
  );
}

function LaboratoryTypeBadge({
  type,
}: {
  type:
    | "NORMAL"
    | "ADVANCED"
    | "EQUIPMENT";
}) {
  const text =
    type === "NORMAL"
      ? "普通实验室"
      : type === "ADVANCED"
        ? "高级实验室"
        : "设备型实验室";

  const className =
    type === "NORMAL"
      ? "bg-blue-100 text-blue-700"
      : type === "ADVANCED"
        ? "bg-purple-100 text-purple-700"
        : "bg-emerald-100 text-emerald-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {text}
    </span>
  );
}

function getApprovalText(
  teacher: boolean,
  admin: boolean
) {
  if (teacher && admin) {
    return "教师 + 管理员审核";
  }

  if (teacher) {
    return "教师审核";
  }

  if (admin) {
    return "管理员审核";
  }

  return "自动通过";
}