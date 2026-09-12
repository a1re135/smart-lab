import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function ReservationsPage() {
  const session = await requireRole("STUDENT");

  const reservations =
    await prisma.reservation.findMany({
      where: {
        studentId: session.userId,
      },

      include: {
        laboratory: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold text-slate-900">
            我的预约
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link
          href="/student"
          className="mb-5 inline-block text-sm font-medium text-blue-600"
        >
          ← 返回实验室列表
        </Link>

        {reservations.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-500">
              暂无预约记录
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map(
              (reservation) => (
                <div
                  key={reservation.id}
                  className="rounded-xl bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {
                          reservation
                            .laboratory.name
                        }
                      </h2>

                      <p className="mt-2 text-sm text-slate-500">
                        {formatDateTime(
                          reservation.startAt
                        )}
                        {" - "}
                        {formatTime(
                          reservation.endAt
                        )}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        使用人数：
                        {
                          reservation.peopleCount
                        }{" "}
                        人
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        用途：
                        {reservation.purpose}
                      </p>
                    </div>

                    <StatusBadge
                      status={
                        reservation.status
                      }
                    />
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const text =
    status === "APPROVED"
      ? "已通过"
      : status === "PENDING_TEACHER"
        ? "等待教师审核"
        : status === "PENDING_ADMIN"
          ? "等待管理员审核"
          : status === "REJECTED"
            ? "已拒绝"
            : status === "CANCELLED"
              ? "已取消"
              : status === "COMPLETED"
                ? "已完成"
                : status === "MISSED"
                  ? "未签到"
                  : status;

  return (
    <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
      {text}
    </span>
  );
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

function formatTime(date: Date) {
  return new Intl.DateTimeFormat(
    "zh-CN",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  ).format(date);
}