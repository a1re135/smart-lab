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

    const laboratoryId = Number(body.laboratoryId);
    const name = String(body.name ?? "").trim();
    const description =
      String(body.description ?? "").trim() || null;

    const requirements =
      String(body.requirements ?? "").trim() || null;

    const requiresTeacherApproval =
      Boolean(body.requiresTeacherApproval);

    const minimumStudentLevel =
      body.minimumStudentLevel || null;

    if (!laboratoryId || !name) {
      return NextResponse.json(
        { error: "请选择实验室并填写设备名称" },
        { status: 400 }
      );
    }

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

    const existing =
      await prisma.equipment.findUnique({
        where: {
          laboratoryId_name: {
            laboratoryId,
            name,
          },
        },
      });

    if (existing) {
      return NextResponse.json(
        { error: "该实验室中已经存在同名设备" },
        { status: 400 }
      );
    }

    const equipment =
      await prisma.equipment.create({
        data: {
          laboratoryId,
          name,
          description,
          requirements,

          requiresTeacherApproval,

          minimumStudentLevel:
            minimumStudentLevel === ""
              ? null
              : minimumStudentLevel,

          status: "AVAILABLE",
        },
      });

    return NextResponse.json({
      success: true,
      equipment,
    });
  } catch (error) {
    console.error(
      "Create equipment error:",
      error
    );

    return NextResponse.json(
      { error: "新增设备失败" },
      { status: 500 }
    );
  }
}