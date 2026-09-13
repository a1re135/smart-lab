import Link from "next/link";

import RegisterForm from "@/components/register-form";

import { prisma } from "@/lib/prisma";

export default async function RegisterPage() {
  const teachers =
    await prisma.user.findMany({
      where: {
        role: "TEACHER",
        status: "ACTIVE",
      },

      select: {
        id: true,
        name: true,
        teacherNumber: true,
      },

      orderBy: {
        name: "asc",
      },
    });

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950" />

      <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

      <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/login"
          className="inline-flex items-center text-sm font-medium text-blue-200 transition hover:text-white"
        >
          ← 返回登录
        </Link>

        <div className="mx-auto mt-8 max-w-lg pb-12">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold text-white ring-1 ring-white/20">
              实
            </div>

            <h1 className="mt-4 text-xl font-bold text-white">
              高校智能实验室预约管理系统
            </h1>

            <p className="mt-2 text-sm text-blue-200">
              Smart Laboratory Reservation
            </p>
          </div>

          <RegisterForm
            teachers={teachers}
          />

          <p className="mt-6 text-center text-xs leading-5 text-slate-500">
            管理员账号不能通过公开注册创建。
          </p>
        </div>
      </div>
    </main>
  );
}