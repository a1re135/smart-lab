import Link from "next/link";

import UserManagement from "@/components/user-management";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default async function UsersPage() {
  const session = await requireRole("ADMIN");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      status: true,
      studentNumber: true,
      teacherNumber: true,
      studentLevel: true,
    },

    orderBy: {
      id: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold text-slate-900">
            用户管理
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            查看和管理系统用户账号
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link
          href="/admin"
          className="mb-5 inline-block text-sm font-medium text-blue-600"
        >
          ← 返回管理员首页
        </Link>

        <UserManagement
          users={users}
          currentUserId={session.userId}
        />
      </div>
    </main>
  );
}