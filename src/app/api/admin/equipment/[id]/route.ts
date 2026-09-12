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
    const equipmentId = Number(id);

    if (!equipmentId) {
      return NextResponse.json(
        { error: "设备编号无效" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const allowedStatuses = [
      "AVAILABLE",
      "IN_USE",
      "MAINTENANCE",
      "DISABLED",
    ];

    if (
      body.status &&
      !allowedStatuses.includes(body.status)
    ) {
      return NextResponse.json(
        { error: "设备状态无效" },
        { status: 400 }
      );
    }

    const existing =
      await prisma.equipment.findUnique({
        where: {
          id: equipmentId,
        },
      });

    if (!existing) {
      return NextResponse.json(
        { error: "设备不存在" },
        { status: 404 }
      );
    }

    const equipment =
      await prisma.equipment.update({
        where: {
          id: equipmentId,
        },

        data: {
          status:
            body.status ?? existing.status,
        },
      });

    return NextResponse.json({
      success: true,
      equipment,
    });
  } catch (error) {
    console.error(
      "Update equipment error:",
      error
    );

    return NextResponse.json(
      { error: "修改设备失败" },
      { status: 500 }
    );
  }
}