import Link from "next/link";

import QrCheckInClient from "@/components/qr-checkin-client";

import { requireRole } from "@/lib/session";

type Props = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function QrCheckInPage({
  searchParams,
}: Props) {
  await requireRole("STUDENT");

  const { token } =
    await searchParams;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900">
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
          <Link
            href="/student/reservations"
            className="text-sm font-medium text-blue-200 transition hover:text-white"
          >
            ← 返回我的预约
          </Link>

          <div className="pt-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-200">
              QR CHECK-IN
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white">
              二维码签到
            </h1>

            <p className="mt-2 text-sm text-blue-100/80">
              系统正在验证您的预约和签到二维码。
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-8 max-w-xl px-4 pb-12 sm:px-6">
        <QrCheckInClient
          token={token ?? ""}
        />
      </div>
    </main>
  );
}