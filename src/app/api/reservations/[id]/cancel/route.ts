import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const FREQUENT_CANCEL_THRESHOLD = 3;
const FREQUENT_CANCEL_WINDOW_DAYS = 30;

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await getSession();

    if (
      !session ||
      session.role !== "STUDENT"
    ) {
      return NextResponse.json(
        {
          error: "无权限操作",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await context.params;

    const reservationId =
      Number(id);

    if (!reservationId) {
      return NextResponse.json(
        {
          error: "预约编号无效",
        },
        {
          status: 400,
        }
      );
    }

    const reservation =
      await prisma.reservation.findUnique({
        where: {
          id: reservationId,
        },
      });

    if (!reservation) {
      return NextResponse.json(
        {
          error: "预约不存在",
        },
        {
          status: 404,
        }
      );
    }

    // Student can only cancel
    // their own reservation.
    if (
      reservation.studentId !==
      session.userId
    ) {
      return NextResponse.json(
        {
          error:
            "不能取消其他学生的预约",
        },
        {
          status: 403,
        }
      );
    }

    const cancellableStatuses = [
      "PENDING_TEACHER",
      "PENDING_ADMIN",
      "APPROVED",
    ];

    if (
      !cancellableStatuses.includes(
        reservation.status
      )
    ) {
      return NextResponse.json(
        {
          error:
            "该预约当前无法取消",
        },
        {
          status: 400,
        }
      );
    }

    // Don't allow cancellation
    // after reservation starts.
    if (
      reservation.startAt <=
      new Date()
    ) {
      return NextResponse.json(
        {
          error:
            "预约已经开始，无法取消",
        },
        {
          status: 400,
        }
      );
    }

    const now = new Date();

    const windowStart =
      new Date(now);

    windowStart.setDate(
      windowStart.getDate() -
        FREQUENT_CANCEL_WINDOW_DAYS
    );

    /*
     * Cancel the reservation first.
     *
     * After this update, this cancellation
     * will be included when we count
     * cancellations within the last 30 days.
     */
    await prisma.reservation.update({
      where: {
        id: reservationId,
      },

      data: {
        status: "CANCELLED",
        cancelledAt: now,
      },
    });

    // ==========================================
    // FREQUENT CANCELLATION CHECK
    // ==========================================

    const recentCancellationCount =
      await prisma.reservation.count({
        where: {
          studentId:
            session.userId,

          status: "CANCELLED",

          cancelledAt: {
            gte: windowStart,
            lte: now,
          },
        },
      });

    /*
     * Every 3 cancellations within 30 days
     * count as one frequent-cancellation
     * violation.
     *
     * 3 cancellations -> 1 violation
     * 6 cancellations -> 2 violations
     * 9 cancellations -> 3 violations
     */
    const expectedViolationCount =
      Math.floor(
        recentCancellationCount /
          FREQUENT_CANCEL_THRESHOLD
      );

    const existingViolationCount =
      await prisma.violation.count({
        where: {
          userId:
            session.userId,

          type:
            "FREQUENT_CANCEL",

          createdAt: {
            gte: windowStart,
            lte: now,
          },
        },
      });

    let frequentCancellationViolationCreated =
      false;

    if (
      expectedViolationCount >
      existingViolationCount
    ) {
      await prisma.violation.create({
        data: {
          userId:
            session.userId,

          reservationId,

          type:
            "FREQUENT_CANCEL",

          description: `30天内已取消 ${recentCancellationCount} 次预约，记录频繁取消违规`,
        },
      });

      frequentCancellationViolationCreated =
        true;
    }

    const totalViolationCount =
      await prisma.violation.count({
        where: {
          userId:
            session.userId,
        },
      });

    return NextResponse.json({
      success: true,

      recentCancellationCount,

      frequentCancellationViolationCreated,

      totalViolationCount,

      reservationRestricted:
        totalViolationCount >= 3,
    });
  } catch (error) {
    console.error(
      "Cancel reservation error:",
      error
    );

    return NextResponse.json(
      {
        error: "取消预约失败",
      },
      {
        status: 500,
      }
    );
  }
}