import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || session.role !== "STUDENT") {
      return NextResponse.json(
        { error: "无权限操作" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const reservationId = Number(
      body.reservationId
    );

    const code = String(
      body.code ?? ""
    ).trim();

    if (!reservationId || !code) {
      return NextResponse.json(
        { error: "请输入签到验证码" },
        { status: 400 }
      );
    }

    const reservation =
      await prisma.reservation.findUnique({
        where: {
          id: reservationId,
        },

        include: {
          checkIn: true,
        },
      });

    if (!reservation) {
      return NextResponse.json(
        { error: "预约不存在" },
        { status: 404 }
      );
    }

    if (reservation.studentId !== session.userId) {
      return NextResponse.json(
        { error: "不能签到其他学生的预约" },
        { status: 403 }
      );
    }

    if (reservation.status !== "APPROVED") {
      return NextResponse.json(
        { error: "该预约尚未通过审核" },
        { status: 400 }
      );
    }

    if (!reservation.checkIn) {
      return NextResponse.json(
        { error: "管理员尚未生成签到码" },
        { status: 400 }
      );
    }

    if (reservation.checkIn.checkedInAt) {
      return NextResponse.json(
        { error: "该预约已经签到" },
        { status: 400 }
      );
    }

    if (
      reservation.checkIn.verificationCode !==
      code
    ) {
      return NextResponse.json(
        { error: "签到验证码错误" },
        { status: 400 }
      );
    }

    await prisma.checkIn.update({
      where: {
        reservationId,
      },

      data: {
        checkedInAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Check-in error:", error);

    return NextResponse.json(
      { error: "签到失败" },
      { status: 500 }
    );
  }
}