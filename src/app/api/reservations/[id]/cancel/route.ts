import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await getSession();

    if (!session || session.role !== "STUDENT") {
      return NextResponse.json(
        { error: "无权限操作" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const reservationId = Number(id);

    if (!reservationId) {
      return NextResponse.json(
        { error: "预约编号无效" },
        { status: 400 }
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
        { error: "预约不存在" },
        { status: 404 }
      );
    }

    // Student can only cancel their own reservation
    if (reservation.studentId !== session.userId) {
      return NextResponse.json(
        { error: "不能取消其他学生的预约" },
        { status: 403 }
      );
    }

    const cancellableStatuses = [
      "PENDING_TEACHER",
      "PENDING_ADMIN",
      "APPROVED",
    ];

    if (!cancellableStatuses.includes(reservation.status)) {
      return NextResponse.json(
        { error: "该预约当前无法取消" },
        { status: 400 }
      );
    }

    // Don't allow cancelling after reservation has started
    if (reservation.startAt <= new Date()) {
      return NextResponse.json(
        { error: "预约已经开始，无法取消" },
        { status: 400 }
      );
    }

    await prisma.reservation.update({
      where: {
        id: reservationId,
      },

      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Cancel reservation error:", error);

    return NextResponse.json(
      { error: "取消预约失败" },
      { status: 500 }
    );
  }
}