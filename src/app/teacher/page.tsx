import { requireRole } from "@/lib/session";

export default async function TeacherPage() {
  const session = await requireRole("TEACHER");

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            教师端
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            欢迎，{session.name}
          </h1>

          <p className="mt-4 text-slate-600">
            教师首页已经成功连接。
          </p>
        </div>
      </div>
    </main>
  );
}