import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const role =
      body.role === "STUDENT" ||
      body.role === "TEACHER"
        ? body.role
        : null;

    const username =
      typeof body.username === "string"
        ? body.username.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    if (!role) {
      return NextResponse.json(
        {
          error:
            "请选择学生或教师身份",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !username ||
      !password ||
      !name
    ) {
      return NextResponse.json(
        {
          error:
            "请填写完整的基本信息",
        },
        {
          status: 400,
        }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        {
          error:
            "用户名至少需要3个字符",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          error:
            "密码至少需要6个字符",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // USERNAME CHECK
    // ==========================================

    const existingUsername =
      await prisma.user.findUnique({
        where: {
          username,
        },
      });

    if (existingUsername) {
      return NextResponse.json(
        {
          error:
            "该用户名已被使用",
        },
        {
          status: 409,
        }
      );
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        10
      );

    // ==========================================
    // STUDENT REGISTRATION
    // ==========================================

    if (role === "STUDENT") {
      const studentNumber =
        typeof body.studentNumber ===
        "string"
          ? body.studentNumber.trim()
          : "";

      const studentLevel =
        body.studentLevel ===
          "UNDERGRADUATE" ||
        body.studentLevel ===
          "MASTER" ||
        body.studentLevel ===
          "DOCTORAL"
          ? body.studentLevel
          : null;

      const teacherId =
        Number(body.teacherId);

      if (!studentNumber) {
        return NextResponse.json(
          {
            error:
              "请输入学号",
          },
          {
            status: 400,
          }
        );
      }

      if (!studentLevel) {
        return NextResponse.json(
          {
            error:
              "请选择学生类型",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !Number.isInteger(
          teacherId
        ) ||
        teacherId <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "请选择指导教师",
          },
          {
            status: 400,
          }
        );
      }

      const existingStudentNumber =
        await prisma.user.findUnique({
          where: {
            studentNumber,
          },
        });

      if (
        existingStudentNumber
      ) {
        return NextResponse.json(
          {
            error:
              "该学号已被注册",
          },
          {
            status: 409,
          }
        );
      }

      const teacher =
        await prisma.user.findFirst({
          where: {
            id: teacherId,
            role: "TEACHER",
            status: "ACTIVE",
          },
        });

      if (!teacher) {
        return NextResponse.json(
          {
            error:
              "所选指导教师不存在或已停用",
          },
          {
            status: 400,
          }
        );
      }

      await prisma.user.create({
        data: {
          username,
          passwordHash,
          name,

          role: "STUDENT",

          studentNumber,
          studentLevel,

          teacherId,
        },
      });

      return NextResponse.json({
        success: true,
      });
    }

    // ==========================================
    // TEACHER REGISTRATION
    // ==========================================

    const teacherNumber =
      typeof body.teacherNumber ===
      "string"
        ? body.teacherNumber.trim()
        : "";

    if (!teacherNumber) {
      return NextResponse.json(
        {
          error:
            "请输入教师编号",
        },
        {
          status: 400,
        }
      );
    }

    const existingTeacherNumber =
      await prisma.user.findUnique({
        where: {
          teacherNumber,
        },
      });

    if (existingTeacherNumber) {
      return NextResponse.json(
        {
          error:
            "该教师编号已被注册",
        },
        {
          status: 409,
        }
      );
    }

    await prisma.user.create({
      data: {
        username,
        passwordHash,
        name,

        role: "TEACHER",

        teacherNumber,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Register error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "注册失败，请稍后重试",
      },
      {
        status: 500,
      }
    );
  }
}