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

    if (reservation.status !== "APPROVED") {
      return NextResponse.json(
        { error: "只有已通过的预约可以生成签到码" },
        { status: 400 }
      );
    }

    const existing =
      await prisma.checkIn.findUnique({
        where: {
          reservationId,
        },
      });

    if (existing?.verificationCode) {
      return NextResponse.json({
        success: true,
        code: existing.verificationCode,
      });
    }

    const code = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const checkIn =
      await prisma.checkIn.upsert({
        where: {
          reservationId,
        },

        update: {
          method: "CODE",
          verificationCode: code,
        },

        create: {
          reservationId,
          method: "CODE",
          verificationCode: code,
        },
      });

    return NextResponse.json({
      success: true,
      code: checkIn.verificationCode,
    });
  } catch (error) {
    console.error(
      "Generate check-in code error:",
      error
    );

    return NextResponse.json(
      { error: "生成签到码失败" },
      { status: 500 }
    );
  }
}