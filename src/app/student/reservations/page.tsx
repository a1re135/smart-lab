import Link from "next/link";
import CancelReservationButton from "@/components/cancel-reservation-button";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { processExpiredReservationsForStudent } from "@/lib/violations";
import CheckInForm from "@/components/checkin-form";

export default async function ReservationsPage() {
  const session = await requireRole("STUDENT");

  await processExpiredReservationsForStudent(
    session.userId
  );

  const violationCount =
  await prisma.violation.count({
    where: {
      userId: session.userId,
    },
  });

  const reservations =
    await prisma.reservation.findMany({
      where: {
        studentId: session.userId,
      },

      include: {
        laboratory: true,
        checkIn: true,
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

        {violationCount > 0 && (
          <div className="mb-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="font-medium text-orange-800">
              当前违规次数：{violationCount}
            </p>

            {violationCount >= 3 && (
              <p className="mt-1 text-sm text-orange-700">
                由于违规次数达到3次，您目前只能提前1天预约实验室。
              </p>
            )}
          </div>
        )}

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

                    {[
                    "PENDING_TEACHER",
                    "PENDING_ADMIN",
                    "APPROVED",
                    ].includes(reservation.status) &&
                    reservation.startAt > new Date() && (
                        <CancelReservationButton
                        reservationId={reservation.id}
                        />
                    )}

                    {reservation.status === "APPROVED" &&
                      !reservation.checkIn?.checkedInAt && (
                        <CheckInForm
                          reservationId={reservation.id}
                        />
                      )}

                    {reservation.checkIn?.checkedInAt && (
                      <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        ✓ 已签到
                      </div>
                    )}
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