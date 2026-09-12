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

    if (!session || session.role !== "ADMIN") {
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

    const body = await request.json();
    const decision = body.decision;

    if (
      decision !== "APPROVED" &&
      decision !== "REJECTED"
    ) {
      return NextResponse.json(
        { error: "审核操作无效" },
        { status: 400 }
      );
    }

    const reservation =
      await prisma.reservation.findUnique({
        where: {
          id: reservationId,
        },

        include: {
          laboratory: true,
          student: true,
        },
      });

    if (!reservation) {
      return NextResponse.json(
        { error: "预约不存在" },
        { status: 404 }
      );
    }

    if (reservation.status !== "PENDING_ADMIN") {
      return NextResponse.json(
        { error: "该预约当前不需要管理员审核" },
        { status: 400 }
      );
    }

    // =============================================
    // Admin rejects
    // =============================================

    if (decision === "REJECTED") {
      await prisma.$transaction(async (tx) => {
        await tx.approval.create({
          data: {
            reservationId,
            approverId: session.userId,
            type: "ADMIN",
            decision: "REJECTED",
            decidedAt: new Date(),
          },
        });

        await tx.reservation.update({
          where: {
            id: reservationId,
          },

          data: {
            status: "REJECTED",
          },
        });
      });

      return NextResponse.json({
        success: true,
        status: "REJECTED",
      });
    }

    // =============================================
    // Admin approves
    // =============================================

    await prisma.$transaction(async (tx) => {
      await tx.approval.create({
        data: {
          reservationId,
          approverId: session.userId,
          type: "ADMIN",
          decision: "APPROVED",
          decidedAt: new Date(),
        },
      });

      await tx.reservation.update({
        where: {
          id: reservationId,
        },

        data: {
          status: "APPROVED",
        },
      });
    });

    return NextResponse.json({
      success: true,
      status: "APPROVED",
    });
  } catch (error) {
    console.error("Admin approval error:", error);

    return NextResponse.json(
      {
        error: "审核失败，请查看服务器终端",
      },
      {
        status: 500,
      }
    );
  }
}