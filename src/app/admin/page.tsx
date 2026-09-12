import AdminApprovalButtons from "@/components/admin-approval-buttons";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function AdminPage() {
  const session = await requireRole("ADMIN");

  const reservations =
    await prisma.reservation.findMany({
      where: {
        status: "PENDING_ADMIN",
      },

      include: {
        student: true,
        laboratory: true,
        approvals: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <p className="text-sm text-slate-500">
            管理员端
          </p>

          <h1 className="text-xl font-bold text-slate-900">
            欢迎，{session.name}
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            待确认预约
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            确认需要管理员审批的实验室预约
          </p>
        </div>

        {reservations.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-500">
              暂无待确认预约
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
                  <div className="mb-4">
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">
                      等待管理员确认
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {
                      reservation
                        .laboratory.name
                    }
                  </h3>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p>
                      学生：
                      {reservation.student.name}
                    </p>

                    <p>
                      学号：
                      {reservation.student
                        .studentNumber ??
                        "-"}
                    </p>

                    <p>
                      时间：
                      {formatDateTime(
                        reservation.startAt
                      )}
                      {" - "}
                      {formatTime(
                        reservation.endAt
                      )}
                    </p>

                    <p>
                      使用人数：
                      {reservation.peopleCount}
                    </p>

                    <p>
                      使用目的：
                      {reservation.purpose}
                    </p>

                    <p>
                      教师审核：
                      <span className="font-medium text-green-600">
                        已通过
                      </span>
                    </p>
                  </div>

                  <AdminApprovalButtons
                    reservationId={
                      reservation.id
                    }
                  />
                </div>
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function formatDateTime(date: Date) {
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