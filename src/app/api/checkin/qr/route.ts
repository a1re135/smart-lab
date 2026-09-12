import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(
  request: Request
) {
  try {
    const session = await getSession();

    if (
      !session ||
      session.role !== "STUDENT"
    ) {
      return NextResponse.json(
        {
          error:
            "请先使用学生账号登录",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const token =
      String(
        body.token ?? ""
      ).trim();

    if (!token) {
      return NextResponse.json(
        {
          error:
            "二维码无效",
        },
        {
          status: 400,
        }
      );
    }

    const checkIn =
      await prisma.checkIn.findUnique({
        where: {
          qrToken: token,
        },

        include: {
          reservation: {
            include: {
              laboratory: true,
            },
          },
        },
      });

    if (!checkIn) {
      return NextResponse.json(
        {
          error:
            "二维码不存在或已失效",
        },
        {
          status: 404,
        }
      );
    }

    const reservation =
      checkIn.reservation;

    if (
      reservation.studentId !==
      session.userId
    ) {
      return NextResponse.json(
        {
          error:
            "该二维码不属于您的预约",
        },
        {
          status: 403,
        }
      );
    }

    if (
      reservation.status !==
      "APPROVED"
    ) {
      return NextResponse.json(
        {
          error:
            "该预约当前不能签到",
        },
        {
          status: 400,
        }
      );
    }

    if (checkIn.checkedInAt) {
      return NextResponse.json(
        {
          error:
            "您已经完成签到",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.checkIn.update({
      where: {
        id: checkIn.id,
      },

      data: {
        method: "QR",
        checkedInAt:
          new Date(),
      },
    });

    return NextResponse.json({
      success: true,

      laboratoryName:
        reservation
          .laboratory.name,
    });
  } catch (error) {
    console.error(
      "QR check-in error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "二维码签到失败",
      },
      {
        status: 500,
      }
    );
  }
}