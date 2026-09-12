import { NextResponse } from "next/server";
import { processExpiredReservationsForStudent } from "@/lib/violations";
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

    await processExpiredReservationsForStudent(
      session.userId
    );

    const violationCount =
      await prisma.violation.count({
        where: {
          userId: session.userId,
        },
      });

    const body = await request.json();

    const laboratoryId = Number(body.laboratoryId);
    const date = String(body.date ?? "");
    const startTime = String(body.startTime ?? "");
    const endTime = String(body.endTime ?? "");
    const peopleCount = Number(body.peopleCount);
    const purpose = String(body.purpose ?? "").trim();

    if (
      !laboratoryId ||
      !date ||
      !startTime ||
      !endTime ||
      !peopleCount ||
      !purpose
    ) {
      return NextResponse.json(
        { error: "请填写完整预约信息" },
        { status: 400 }
      );
    }

    if (peopleCount <= 0) {
      return NextResponse.json(
        { error: "使用人数必须大于0" },
        { status: 400 }
      );
    }

    const laboratory = await prisma.laboratory.findUnique({
      where: {
        id: laboratoryId,
      },
    });

    if (!laboratory || !laboratory.isActive) {
      return NextResponse.json(
        { error: "实验室不存在或已停用" },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // Time validation
    // -----------------------------------------

    if (startTime >= endTime) {
      return NextResponse.json(
        { error: "结束时间必须晚于开始时间" },
        { status: 400 }
      );
    }

    if (
      startTime < laboratory.openTime ||
      endTime > laboratory.closeTime
    ) {
      return NextResponse.json(
        {
          error: `预约时间必须在 ${laboratory.openTime} - ${laboratory.closeTime} 之间`,
        },
        { status: 400 }
      );
    }

    const startAt = new Date(`${date}T${startTime}:00`);
    const endAt = new Date(`${date}T${endTime}:00`);

    if (
      Number.isNaN(startAt.getTime()) ||
      Number.isNaN(endAt.getTime())
    ) {
      return NextResponse.json(
        { error: "日期或时间格式错误" },
        { status: 400 }
      );
    }

    const now = new Date();

    if (startAt <= now) {
      return NextResponse.json(
        { error: "不能预约过去的时间" },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // Advance booking rule
    // -----------------------------------------

    const allowedAdvanceDays =
      violationCount >= 3
        ? Math.min(laboratory.advanceDays, 1)
        : laboratory.advanceDays;

    const maxDate = new Date();

    maxDate.setDate(
      maxDate.getDate() + allowedAdvanceDays
    );

    maxDate.setHours(23, 59, 59, 999);

    if (startAt > maxDate) {
      if (violationCount >= 3) {
        return NextResponse.json(
          {
            error:
              "您的违规次数已达到3次，目前只能提前1天预约",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: `该实验室最多只能提前 ${allowedAdvanceDays} 天预约`,
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // Find overlapping reservations
    //
    // overlap:
    // existing.start < new.end
    // existing.end > new.start
    // -----------------------------------------

    const overlappingReservations =
      await prisma.reservation.findMany({
        where: {
          laboratoryId,

          status: {
            in: [
              "PENDING_TEACHER",
              "PENDING_ADMIN",
              "APPROVED",
            ],
          },

          startAt: {
            lt: endAt,
          },

          endAt: {
            gt: startAt,
          },
        },

        select: {
          peopleCount: true,
        },
      });

    // -----------------------------------------
    // Capacity check
    // -----------------------------------------

    const alreadyReservedPeople =
      overlappingReservations.reduce(
        (total, reservation) =>
          total + reservation.peopleCount,
        0
      );

    const totalPeople =
      alreadyReservedPeople + peopleCount;

    if (totalPeople > laboratory.maxPeople) {
      const remaining =
        laboratory.maxPeople -
        alreadyReservedPeople;

      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `当前时间段最多还能预约 ${remaining} 人`
              : "当前时间段人数已满",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // Determine initial status
    // -----------------------------------------

    let status:
      | "PENDING_TEACHER"
      | "PENDING_ADMIN"
      | "APPROVED";

    if (laboratory.requiresTeacherApproval) {
      status = "PENDING_TEACHER";
    } else if (laboratory.requiresAdminApproval) {
      status = "PENDING_ADMIN";
    } else {
      status = "APPROVED";
    }

    // -----------------------------------------
    // Create reservation
    // -----------------------------------------

    const reservation =
      await prisma.reservation.create({
        data: {
          studentId: session.userId,
          laboratoryId,
          startAt,
          endAt,
          peopleCount,
          purpose,
          status,
        },
      });

    return NextResponse.json({
      success: true,
      reservationId: reservation.id,
      status: reservation.status,
    });
  } catch (error) {
    console.error("Create reservation error:", error);

    return NextResponse.json(
      {
        error: "预约失败，请稍后重试",
      },
      {
        status: 500,
      }
    );
  }
}