import Link from "next/link";

import LogoutButton from "@/components/logout-button";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function StudentPage() {
  const session = await requireRole("STUDENT");

  const [
    laboratories,
    reservationCount,
    pendingCount,
    violationCount,
  ] = await Promise.all([
    prisma.laboratory.findMany({
      where: {
        isActive: true,
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

      orderBy: {
        id: "asc",
      },
    }),

    prisma.reservation.count({
      where: {
        studentId: session.userId,
      },
    }),

    prisma.reservation.count({
      where: {
        studentId: session.userId,

        status: {
          in: [
            "PENDING_TEACHER",
            "PENDING_ADMIN",
          ],
        },
      },
    }),

    prisma.violation.count({
      where: {
        userId: session.userId,
      },
    }),
  ]);

  const equipmentCount =
    laboratories.reduce(
      (total, laboratory) =>
        total +
        laboratory.equipment.length,
      0
    );

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero background */}
      <div className="absolute inset-x-0 top-0 h-[340px] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900" />

      <div className="relative">
        {/* Header */}
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold text-white ring-1 ring-white/20 backdrop-blur">
                实
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-blue-200 sm:text-sm">
                  高校智能实验室预约管理系统
                </p>

                <h1 className="text-base font-bold text-white sm:text-lg">
                  学生端
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

        <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
          {/* Welcome */}
          <section>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-200">
                  STUDENT PORTAL
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  你好，{session.name}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">
                  选择合适的实验室，查看可用设备并快速提交预约申请。
                </p>
              </div>

              <Link
                href="/student/reservations"
                className="inline-flex w-fit items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                查看我的预约
                <span className="ml-2">
                  →
                </span>
              </Link>
            </div>
          </section>

          {/* Summary cards */}
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="可用实验室"
              value={laboratories.length}
              description="当前开放预约"
              icon="室"
            />

            <SummaryCard
              title="可用设备"
              value={equipmentCount}
              description="实验室可选设备"
              icon="设"
            />

            <SummaryCard
              title="我的预约"
              value={reservationCount}
              description="累计预约记录"
              icon="预"
            />

            <SummaryCard
              title="待审核"
              value={pendingCount}
              description={
                pendingCount > 0
                  ? "等待审核处理"
                  : "暂无待审核预约"
              }
              icon="审"
            />
          </section>

          {/* Violation warning */}
          {violationCount > 0 && (
            <section className="mt-6">
              <div
                className={`rounded-2xl border p-4 ${
                  violationCount >= 3
                    ? "border-red-200 bg-red-50"
                    : "border-orange-200 bg-orange-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                      violationCount >= 3
                        ? "bg-red-100 text-red-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    !
                  </div>

                  <div>
                    <p
                      className={`font-semibold ${
                        violationCount >= 3
                          ? "text-red-800"
                          : "text-orange-800"
                      }`}
                    >
                      当前违规次数：
                      {violationCount}
                    </p>

                    <p
                      className={`mt-1 text-sm ${
                        violationCount >= 3
                          ? "text-red-700"
                          : "text-orange-700"
                      }`}
                    >
                      {violationCount >= 3
                        ? "违规次数已达到3次，目前只能提前1天预约实验室。"
                        : "请按时签到并遵守实验室预约规定。"}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Laboratory section */}
          <section className="mt-10">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  LABORATORIES
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  可预约实验室
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  查看实验室开放时间、容量和可用设备
                </p>
              </div>

              <p className="text-sm text-slate-400">
                共 {laboratories.length} 个实验室
              </p>
            </div>

            {laboratories.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl font-bold text-slate-400">
                  室
                </div>

                <h3 className="mt-4 font-bold text-slate-800">
                  暂无可预约实验室
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  请稍后再次查看。
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {laboratories.map(
                  (laboratory) => (
                    <LaboratoryCard
                      key={laboratory.id}
                      laboratory={laboratory}
                    />
                  )
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

type LaboratoryCardProps = {
  laboratory: {
    id: number;
    name: string;
    type:
      | "NORMAL"
      | "ADVANCED"
      | "EQUIPMENT";
    description: string | null;
    openTime: string;
    closeTime: string;
    maxPeople: number;
    advanceDays: number;
    requiresTeacherApproval: boolean;
    requiresAdminApproval: boolean;

    equipment: {
      id: number;
      name: string;
      requirements: string | null;
      requiresTeacherApproval: boolean;
      minimumStudentLevel:
        | "UNDERGRADUATE"
        | "MASTER"
        | "DOCTORAL"
        | null;
    }[];
  };
};

function LaboratoryCard({
  laboratory,
}: LaboratoryCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/70">
      {/* Card top */}
      <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/70 p-5">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-100/60 blur-2xl" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <LaboratoryTypeBadge
                type={laboratory.type}
              />

              <h3 className="mt-3 text-xl font-bold text-slate-900">
                {laboratory.name}
              </h3>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-bold text-blue-700 shadow-sm ring-1 ring-slate-200">
              实
            </div>
          </div>

          {laboratory.description && (
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
              {laboratory.description}
            </p>
          )}
        </div>
      </div>

      {/* Information */}
      <div className="flex flex-1 flex-col p-5">
        <div className="grid grid-cols-2 gap-3">
          <LabInfoBox
            label="开放时间"
            value={`${laboratory.openTime} - ${laboratory.closeTime}`}
          />

          <LabInfoBox
            label="最大人数"
            value={`${laboratory.maxPeople} 人`}
          />

          <LabInfoBox
            label="提前预约"
            value={`${laboratory.advanceDays} 天`}
          />

          <LabInfoBox
            label="审核方式"
            value={getApprovalText(
              laboratory.requiresTeacherApproval,
              laboratory.requiresAdminApproval
            )}
          />
        </div>

        {/* Equipment */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              可用设备
            </p>

            <span className="text-xs text-slate-400">
              {laboratory.equipment.length} 项
            </span>
          </div>

          {laboratory.equipment.length ===
          0 ? (
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-400">
              暂无可用设备
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {laboratory.equipment
                .slice(0, 4)
                .map((equipment) => (
                  <span
                    key={equipment.id}
                    className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700"
                  >
                    {equipment.name}
                  </span>
                ))}

              {laboratory.equipment
                .length > 4 && (
                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-500">
                  +
                  {laboratory.equipment
                    .length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Approval badges */}
        {(laboratory.requiresTeacherApproval ||
          laboratory.requiresAdminApproval) && (
          <div className="mt-5 flex flex-wrap gap-2">
            {laboratory.requiresTeacherApproval && (
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                需要教师审核
              </span>
            )}

            {laboratory.requiresAdminApproval && (
              <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                需要管理员审核
              </span>
            )}
          </div>
        )}

        {/* Button */}
        <div className="mt-auto pt-6">
          <Link
            href={`/student/reserve/${laboratory.id}`}
            className="flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            立即预约
            <span className="ml-2 transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>
    </article>
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
      <div className="flex items-start justify-between gap-4">
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

function LabInfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-700">
        {value}
      </p>
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
  const label =
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
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${className}`}
    >
      {label}
    </span>
  );
}

function getApprovalText(
  teacher: boolean,
  admin: boolean
) {
  if (teacher && admin) {
    return "教师 + 管理员";
  }

  if (teacher) {
    return "教师审核";
  }

  if (admin) {
    return "管理员审核";
  }

  return "自动通过";
}