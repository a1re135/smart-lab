import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 10);
  const teacherPassword = await bcrypt.hash("teacher123", 10);
  const studentPassword = await bcrypt.hash("student123", 10);

  // =========================================
  // ADMIN
  // =========================================

  await prisma.user.upsert({
    where: {
      username: "admin",
    },
    update: {},
    create: {
      username: "admin",
      passwordHash: adminPassword,
      name: "系统管理员",
      role: "ADMIN",
    },
  });

  // =========================================
  // TEACHER
  // =========================================

  const teacher = await prisma.user.upsert({
    where: {
      username: "teacher01",
    },
    update: {},
    create: {
      username: "teacher01",
      passwordHash: teacherPassword,
      name: "张老师",
      role: "TEACHER",
      teacherNumber: "T001",
    },
  });

  // =========================================
  // STUDENTS
  // =========================================

  await prisma.user.upsert({
    where: {
      username: "student01",
    },
    update: {},
    create: {
      username: "student01",
      passwordHash: studentPassword,
      name: "学生一",
      role: "STUDENT",
      studentNumber: "S001",
      studentLevel: "UNDERGRADUATE",
      teacherId: teacher.id,
    },
  });

  await prisma.user.upsert({
    where: {
      username: "student02",
    },
    update: {},
    create: {
      username: "student02",
      passwordHash: studentPassword,
      name: "学生二",
      role: "STUDENT",
      studentNumber: "S002",
      studentLevel: "MASTER",
      teacherId: teacher.id,
    },
  });

  // =========================================
  // LABORATORIES
  // =========================================

  const computerLab = await prisma.laboratory.upsert({
    where: {
      name: "计算机实验室A",
    },
    update: {},
    create: {
      name: "计算机实验室A",
      type: "NORMAL",
      description: "计算机课程、编程和软件开发实验室",
      openTime: "08:00",
      closeTime: "22:00",
      maxPeople: 20,
      advanceDays: 7,
      requiresTeacherApproval: false,
      requiresAdminApproval: false,
    },
  });

  const aiLab = await prisma.laboratory.upsert({
    where: {
      name: "人工智能实验室",
    },
    update: {},
    create: {
      name: "人工智能实验室",
      type: "ADVANCED",
      description: "人工智能和高性能计算实验室",
      openTime: "09:00",
      closeTime: "21:00",
      maxPeople: 20,
      advanceDays: 7,
      requiresTeacherApproval: true,
      requiresAdminApproval: false,
    },
  });

  const robotLab = await prisma.laboratory.upsert({
    where: {
      name: "机器人实验室",
    },
    update: {},
    create: {
      name: "机器人实验室",
      type: "EQUIPMENT",
      description: "机器人与自动化实验室",
      openTime: "10:00",
      closeTime: "18:00",
      maxPeople: 15,
      advanceDays: 5,
      requiresTeacherApproval: true,
      requiresAdminApproval: true,
    },
  });

  // =========================================
  // EQUIPMENT
  // =========================================

  await prisma.equipment.upsert({
    where: {
      laboratoryId_name: {
        laboratoryId: aiLab.id,
        name: "GPU服务器",
      },
    },
    update: {},
    create: {
      laboratoryId: aiLab.id,
      name: "GPU服务器",
      description: "用于AI模型训练",
      requirements: "研究生权限，需要指导教师审核",
      requiresTeacherApproval: true,
      minimumStudentLevel: "MASTER",
    },
  });

  await prisma.equipment.upsert({
    where: {
      laboratoryId_name: {
        laboratoryId: computerLab.id,
        name: "3D打印机",
      },
    },
    update: {},
    create: {
      laboratoryId: computerLab.id,
      name: "3D打印机",
      description: "用于模型和原型打印",
      requirements: "使用前需要完成培训",
    },
  });

  await prisma.equipment.upsert({
    where: {
      laboratoryId_name: {
        laboratoryId: robotLab.id,
        name: "机器人平台",
      },
    },
    update: {},
    create: {
      laboratoryId: robotLab.id,
      name: "机器人平台",
      description: "机器人控制实验平台",
      requirements: "需要指导教师审核",
      requiresTeacherApproval: true,
    },
  });

  console.log("");
  console.log("Seed completed successfully!");
  console.log("");
  console.log("Test accounts:");
  console.log("Admin:   admin / admin123");
  console.log("Teacher: teacher01 / teacher123");
  console.log("Student: student01 / student123");
  console.log("Student: student02 / student123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });