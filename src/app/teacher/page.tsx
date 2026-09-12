import TeacherApprovalButtons from "@/components/teacher-approval-buttons";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import LogoutButton from "@/components/logout-button";
export default async function TeacherPage() {
  const session = await requireRole("TEACHER");

  const reservations =
    await prisma.reservation.findMany({
      where: {
        status: "PENDING_TEACHER",

        student: {
          teacherId: session.userId,
        },
      },

      include: {
        student: true,
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
          <p className="text-sm text-slate-500">
            教师端
          </p>

          <h1 className="text-xl font-bold text-slate-900">
            欢迎，{session.name}
          </h1>
        </div>
        <LogoutButton />
      </header>
      
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            待审核预约
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            审核指导学生提交的实验室预约申请
          </p>
        </div>

        {reservations.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-500">
              暂无待审核预约
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
                  </div>

                  <TeacherApprovalButtons
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