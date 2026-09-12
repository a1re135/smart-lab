import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
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
    const laboratoryId = Number(id);

    if (!laboratoryId) {
      return NextResponse.json(
        { error: "实验室编号无效" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const laboratory =
      await prisma.laboratory.findUnique({
        where: {
          id: laboratoryId,
        },
      });

    if (!laboratory) {
      return NextResponse.json(
        { error: "实验室不存在" },
        { status: 404 }
      );
    }

    const updated =
      await prisma.laboratory.update({
        where: {
          id: laboratoryId,
        },

        data: {
          openTime:
            body.openTime ??
            laboratory.openTime,

          closeTime:
            body.closeTime ??
            laboratory.closeTime,

          maxPeople:
            body.maxPeople !== undefined
              ? Number(body.maxPeople)
              : laboratory.maxPeople,

          advanceDays:
            body.advanceDays !== undefined
              ? Number(body.advanceDays)
              : laboratory.advanceDays,

          requiresTeacherApproval:
            body.requiresTeacherApproval !==
            undefined
              ? Boolean(
                  body.requiresTeacherApproval
                )
              : laboratory.requiresTeacherApproval,

          requiresAdminApproval:
            body.requiresAdminApproval !==
            undefined
              ? Boolean(
                  body.requiresAdminApproval
                )
              : laboratory.requiresAdminApproval,

          isActive:
            body.isActive !== undefined
              ? Boolean(body.isActive)
              : laboratory.isActive,
        },
      });

    return NextResponse.json({
      success: true,
      laboratory: updated,
    });
  } catch (error) {
    console.error(
      "Update laboratory error:",
      error
    );

    return NextResponse.json(
      { error: "修改实验室失败" },
      { status: 500 }
    );
  }
}