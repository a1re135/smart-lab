import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username =
      typeof body.username === "string"
        ? body.username.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!username || !password) {
      return NextResponse.json(
        {
          error: "请输入用户名和密码",
        },
        {
          status: 400,
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "用户名或密码错误",
        },
        {
          status: 401,
        }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error: "账号已被禁用",
        },
        {
          status: 403,
        }
      );
    }

    const passwordCorrect = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordCorrect) {
      return NextResponse.json(
        {
          error: "用户名或密码错误",
        },
        {
          status: 401,
        }
      );
    }

    await createSession({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });

    let redirectTo = "/login";

    if (user.role === "STUDENT") {
      redirectTo = "/student";
    }

    if (user.role === "TEACHER") {
      redirectTo = "/teacher";
    }

    if (user.role === "ADMIN") {
      redirectTo = "/admin";
    }

    return NextResponse.json({
      success: true,
      role: user.role,
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        error: "登录失败，请稍后重试",
      },
      {
        status: 500,
      }
    );
  }
}