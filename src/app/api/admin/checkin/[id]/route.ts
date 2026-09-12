import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RouteContext
) {
  try {
    const session = await getSession();

    if (
      !session ||
      session.role !== "ADMIN"
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

    if (
      !Number.isInteger(
        reservationId
      ) ||
      reservationId <= 0
    ) {
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

        include: {
          checkIn: true,
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

    if (
      reservation.status !==
      "APPROVED"
    ) {
      return NextResponse.json(
        {
          error:
            "只有已通过的预约才能生成签到信息",
        },
        {
          status: 400,
        }
      );
    }

    if (
      reservation.checkIn
        ?.checkedInAt
    ) {
      return NextResponse.json(
        {
          error:
            "该学生已经完成签到",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * If check-in information was already
     * generated, reuse it instead of
     * changing the code every time the
     * admin refreshes the page.
     */
    const verificationCode =
      reservation.checkIn
        ?.verificationCode ??
      String(
        Math.floor(
          100000 +
            Math.random() *
              900000
        )
      );

    const qrToken =
      reservation.checkIn
        ?.qrToken ??
      randomUUID().replaceAll(
        "-",
        ""
      );

    await prisma.checkIn.upsert({
      where: {
        reservationId,
      },

      update: {
        verificationCode,
        qrToken,
      },

      create: {
        reservationId,

        method: "CODE",

        verificationCode,

        qrToken,
      },
    });

    return NextResponse.json({
      success: true,
      code: verificationCode,
      qrToken,
    });
  } catch (error) {
    console.error(
      "Generate check-in information error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "生成签到信息失败",
      },
      {
        status: 500,
      }
    );
  }
}