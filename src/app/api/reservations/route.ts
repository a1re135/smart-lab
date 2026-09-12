import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { processExpiredReservationsForStudent } from "@/lib/violations";

const STUDENT_LEVEL_ORDER = {
  UNDERGRADUATE: 1,
  MASTER: 2,
  DOCTORAL: 3,
} as const;

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

    const student =
      await prisma.user.findUnique({
        where: {
          id: session.userId,
        },

        select: {
          id: true,
          studentLevel: true,
        },
      });

    if (!student) {
      return NextResponse.json(
        { error: "学生账号不存在" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const laboratoryId = Number(
      body.laboratoryId
    );

    const date = String(
      body.date ?? ""
    );

    const startTime = String(
      body.startTime ?? ""
    );

    const endTime = String(
      body.endTime ?? ""
    );

    const peopleCount = Number(
      body.peopleCount
    );

    const purpose = String(
      body.purpose ?? ""
    ).trim();

    const equipmentIds: number[] =
      Array.isArray(body.equipmentIds)
        ? Array.from(
            new Set<number>(
              body.equipmentIds
                .map((value: unknown) =>
                  Number(value)
                )
                .filter(
                  (id: number) =>
                    Number.isInteger(id) &&
                    id > 0
                )
            )
          )
        : [];

    if (
      !laboratoryId ||
      !date ||
      !startTime ||
      !endTime ||
      !peopleCount ||
      !purpose
    ) {
      return NextResponse.json(
        {
          error: "请填写完整预约信息",
        },
        {
          status: 400,
        }
      );
    }

    if (peopleCount <= 0) {
      return NextResponse.json(
        {
          error: "使用人数必须大于0",
        },
        {
          status: 400,
        }
      );
    }

    const laboratory =
      await prisma.laboratory.findUnique({
        where: {
          id: laboratoryId,
        },
      });

    if (
      !laboratory ||
      !laboratory.isActive
    ) {
      return NextResponse.json(
        {
          error: "实验室不存在或已停用",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // TIME VALIDATION
    // ==========================================

    if (startTime >= endTime) {
      return NextResponse.json(
        {
          error:
            "结束时间必须晚于开始时间",
        },
        {
          status: 400,
        }
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
        {
          status: 400,
        }
      );
    }

    const startAt = new Date(
      `${date}T${startTime}:00`
    );

    const endAt = new Date(
      `${date}T${endTime}:00`
    );

    if (
      Number.isNaN(startAt.getTime()) ||
      Number.isNaN(endAt.getTime())
    ) {
      return NextResponse.json(
        {
          error: "日期或时间格式错误",
        },
        {
          status: 400,
        }
      );
    }

    if (startAt <= new Date()) {
      return NextResponse.json(
        {
          error: "不能预约过去的时间",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // VIOLATION / ADVANCE BOOKING
    // ==========================================

    const allowedAdvanceDays =
      violationCount >= 3
        ? Math.min(
            laboratory.advanceDays,
            1
          )
        : laboratory.advanceDays;

    const maxDate = new Date();

    maxDate.setDate(
      maxDate.getDate() +
        allowedAdvanceDays
    );

    maxDate.setHours(
      23,
      59,
      59,
      999
    );

    if (startAt > maxDate) {
      if (violationCount >= 3) {
        return NextResponse.json(
          {
            error:
              "您的违规次数已达到3次，目前只能提前1天预约",
          },
          {
            status: 400,
          }
        );
      }

      return NextResponse.json(
        {
          error: `该实验室最多只能提前 ${allowedAdvanceDays} 天预约`,
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // EQUIPMENT VALIDATION
    // ==========================================

    const selectedEquipment =
      equipmentIds.length > 0
        ? await prisma.equipment.findMany({
            where: {
              id: {
                in: equipmentIds,
              },
            },
          })
        : [];

    if (
      selectedEquipment.length !==
      equipmentIds.length
    ) {
      return NextResponse.json(
        {
          error: "部分设备不存在",
        },
        {
          status: 400,
        }
      );
    }

    for (const equipment of selectedEquipment) {
      if (
        equipment.laboratoryId !==
        laboratoryId
      ) {
        return NextResponse.json(
          {
            error: `${equipment.name} 不属于当前实验室`,
          },
          {
            status: 400,
          }
        );
      }

      if (
        equipment.status !== "AVAILABLE"
      ) {
        return NextResponse.json(
          {
            error: `${equipment.name} 当前不可用`,
          },
          {
            status: 400,
          }
        );
      }

      if (
        equipment.minimumStudentLevel
      ) {
        if (!student.studentLevel) {
          return NextResponse.json(
            {
              error: `${equipment.name} 有学生等级限制`,
            },
            {
              status: 403,
            }
          );
        }

        const currentLevel =
          STUDENT_LEVEL_ORDER[
            student.studentLevel
          ];

        const requiredLevel =
          STUDENT_LEVEL_ORDER[
            equipment.minimumStudentLevel
          ];

        if (
          currentLevel < requiredLevel
        ) {
          return NextResponse.json(
            {
              error: `${equipment.name} 要求 ${getStudentLevelName(
                equipment.minimumStudentLevel
              )} 及以上权限`,
            },
            {
              status: 403,
            }
          );
        }
      }
    }

    // ==========================================
    // OVERLAP / CAPACITY
    // ==========================================

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

    const alreadyReservedPeople =
      overlappingReservations.reduce(
        (total, reservation) =>
          total +
          reservation.peopleCount,
        0
      );

    const totalPeople =
      alreadyReservedPeople +
      peopleCount;

    if (
      totalPeople >
      laboratory.maxPeople
    ) {
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
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // EQUIPMENT TIME CONFLICT
    // ==========================================

    if (equipmentIds.length > 0) {
      const equipmentConflict =
        await prisma.reservationEquipment.findFirst({
          where: {
            equipmentId: {
              in: equipmentIds,
            },

            reservation: {
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
          },

          select: {
            equipmentId: true,
          },
        });

      if (equipmentConflict) {
        const conflictingEquipment =
          selectedEquipment.find(
            (item) =>
              item.id ===
              equipmentConflict.equipmentId
          );

        return NextResponse.json(
          {
            error: `${
              conflictingEquipment?.name ??
              "所选设备"
            } 在该时间段已被预约`,
          },
          {
            status: 400,
          }
        );
      }
    }

    // ==========================================
    // DETERMINE APPROVAL FLOW
    // ==========================================

    const equipmentNeedsTeacher =
      selectedEquipment.some(
        (equipment) =>
          equipment.requiresTeacherApproval
      );

    let status:
      | "PENDING_TEACHER"
      | "PENDING_ADMIN"
      | "APPROVED";

    if (
      laboratory.requiresTeacherApproval ||
      equipmentNeedsTeacher
    ) {
      status = "PENDING_TEACHER";
    } else if (
      laboratory.requiresAdminApproval
    ) {
      status = "PENDING_ADMIN";
    } else {
      status = "APPROVED";
    }

    // ==========================================
    // CREATE RESERVATION + EQUIPMENT RELATIONS
    // ==========================================

    const reservation =
      await prisma.$transaction(
        async (tx) => {
          const newReservation =
            await tx.reservation.create({
              data: {
                studentId:
                  session.userId,

                laboratoryId,

                startAt,
                endAt,
                peopleCount,
                purpose,
                status,
              },
            });

          if (
            equipmentIds.length > 0
          ) {
            await tx.reservationEquipment.createMany({
              data: equipmentIds.map(
                (equipmentId: number) => ({
                  reservationId:
                    newReservation.id,

                  equipmentId,
                })
              ),
            });
          }

          return newReservation;
        }
      );

    return NextResponse.json({
      success: true,

      reservationId:
        reservation.id,

      status:
        reservation.status,
    });
  } catch (error) {
    console.error(
      "Create reservation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "预约失败，请稍后重试",
      },
      {
        status: 500,
      }
    );
  }
}

function getStudentLevelName(
  level:
    | "UNDERGRADUATE"
    | "MASTER"
    | "DOCTORAL"
) {
  if (
    level === "UNDERGRADUATE"
  ) {
    return "本科生";
  }

  if (level === "MASTER") {
    return "硕士研究生";
  }

  return "博士研究生";
}