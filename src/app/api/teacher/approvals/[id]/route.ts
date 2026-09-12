import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: RouteProps
) {
  try {
    const session = await getSession();

    if (!session || session.role !== "TEACHER") {
      return NextResponse.json(
        { error: "无权限操作" },
        { status: 401 }
      );
    }

    const { id } = await params;
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

    if (
      reservation.status !==
      "PENDING_TEACHER"
    ) {
      return NextResponse.json(
        { error: "该预约当前不需要教师审核" },
        { status: 400 }
      );
    }

    // Optional safety:
    // only allow the student's supervising teacher
    if (
      reservation.student.teacherId !==
      session.userId
    ) {
      return NextResponse.json(
        { error: "您不是该学生的指导教师" },
        { status: 403 }
      );
    }

    if (decision === "REJECTED") {
      await prisma.$transaction([
        prisma.approval.upsert({
          where: {
            reservationId_type: {
              reservationId,
              type: "TEACHER",
            },
          },

          update: {
            approverId: session.userId,
            decision: "REJECTED",
            decidedAt: new Date(),
          },

          create: {
            reservationId,
            approverId: session.userId,
            type: "TEACHER",
            decision: "REJECTED",
            decidedAt: new Date(),
          },
        }),

        prisma.reservation.update({
          where: {
            id: reservationId,
          },

          data: {
            status: "REJECTED",
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
      });
    }

    const nextStatus =
      reservation.laboratory
        .requiresAdminApproval
        ? "PENDING_ADMIN"
        : "APPROVED";

    await prisma.$transaction([
      prisma.approval.upsert({
        where: {
          reservationId_type: {
            reservationId,
            type: "TEACHER",
          },
        },

        update: {
          approverId: session.userId,
          decision: "APPROVED",
          decidedAt: new Date(),
        },

        create: {
          reservationId,
          approverId: session.userId,
          type: "TEACHER",
          decision: "APPROVED",
          decidedAt: new Date(),
        },
      }),

      prisma.reservation.update({
        where: {
          id: reservationId,
        },

        data: {
          status: nextStatus,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      status: nextStatus,
    });
  } catch (error) {
    console.error(
      "Teacher approval error:",
      error
    );

    return NextResponse.json(
      { error: "审核失败" },
      { status: 500 }
    );
  }
}