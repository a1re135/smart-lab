import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "无权限操作" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const type = body.type;
    const openTime = String(body.openTime ?? "");
    const closeTime = String(body.closeTime ?? "");
    const maxPeople = Number(body.maxPeople);
    const advanceDays = Number(body.advanceDays);

    if (
      !name ||
      !openTime ||
      !closeTime ||
      !maxPeople ||
      advanceDays < 0
    ) {
      return NextResponse.json(
        { error: "请填写完整信息" },
        { status: 400 }
      );
    }

    if (
      !["NORMAL", "ADVANCED", "EQUIPMENT"].includes(type)
    ) {
      return NextResponse.json(
        { error: "实验室类型无效" },
        { status: 400 }
      );
    }

    if (openTime >= closeTime) {
      return NextResponse.json(
        { error: "关闭时间必须晚于开放时间" },
        { status: 400 }
      );
    }

    const existing =
      await prisma.laboratory.findUnique({
        where: {
          name,
        },
      });

    if (existing) {
      return NextResponse.json(
        { error: "实验室名称已存在" },
        { status: 400 }
      );
    }

    const laboratory =
      await prisma.laboratory.create({
        data: {
          name,
          type,
          description:
            String(body.description ?? "").trim() ||
            null,

          openTime,
          closeTime,
          maxPeople,
          advanceDays,

          requiresTeacherApproval:
            Boolean(body.requiresTeacherApproval),

          requiresAdminApproval:
            Boolean(body.requiresAdminApproval),

          isActive: true,
        },
      });

    return NextResponse.json({
      success: true,
      laboratory,
    });
  } catch (error) {
    console.error(
      "Create laboratory error:",
      error
    );

    return NextResponse.json(
      { error: "新增实验室失败" },
      { status: 500 }
    );
  }
}