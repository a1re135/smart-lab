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
    const userId = Number(id);

    if (!userId) {
      return NextResponse.json(
        { error: "用户编号无效" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const status = body.status;

    if (
      status !== "ACTIVE" &&
      status !== "DISABLED"
    ) {
      return NextResponse.json(
        { error: "用户状态无效" },
        { status: 400 }
      );
    }

    // Prevent admin from disabling their own account.
    if (
      userId === session.userId &&
      status === "DISABLED"
    ) {
      return NextResponse.json(
        { error: "不能禁用当前登录的管理员账号" },
        { status: 400 }
      );
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!existingUser) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        status,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        status: user.status,
      },
    });
  } catch (error) {
    console.error(
      "Update user status error:",
      error
    );

    return NextResponse.json(
      { error: "修改用户状态失败" },
      { status: 500 }
    );
  }
}