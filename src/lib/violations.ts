import { prisma } from "@/lib/prisma";

export async function processExpiredReservationsForStudent(
  studentId: number
) {
  const now = new Date();

  const reservations =
    await prisma.reservation.findMany({
      where: {
        studentId,
        status: "APPROVED",
        endAt: {
          lt: now,
        },
      },

      include: {
        checkIn: true,
      },
    });

  for (const reservation of reservations) {
    // ==========================================
    // Student checked in -> completed
    // ==========================================

    if (reservation.checkIn?.checkedInAt) {
      await prisma.reservation.update({
        where: {
          id: reservation.id,
        },

        data: {
          status: "COMPLETED",
          completedAt: now,
        },
      });

      continue;
    }

    // ==========================================
    // No check-in -> violation
    // ==========================================

    const existingViolation =
      await prisma.violation.findFirst({
        where: {
          reservationId: reservation.id,
          type: "NO_SHOW",
        },
      });

    if (!existingViolation) {
      await prisma.$transaction([
        prisma.violation.create({
          data: {
            userId: studentId,
            reservationId: reservation.id,
            type: "NO_SHOW",
            description:
              "预约成功后未按时签到",
          },
        }),

        prisma.reservation.update({
          where: {
            id: reservation.id,
          },

          data: {
            status: "MISSED",
          },
        }),
      ]);
    } else {
      await prisma.reservation.update({
        where: {
          id: reservation.id,
        },

        data: {
          status: "MISSED",
        },
      });
    }
  }
}