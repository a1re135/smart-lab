import Link from "next/link";
import { notFound } from "next/navigation";

import ReservationForm from "@/components/reservation-form";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReservePage({
  params,
}: PageProps) {
  await requireRole("STUDENT");

  const { id } = await params;

  const laboratoryId = Number(id);

  if (!laboratoryId) {
    notFound();
  }

  const laboratory =
    await prisma.laboratory.findUnique({
      where: {
        id: laboratoryId,
      },
    });

  if (!laboratory || !laboratory.isActive) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/student"
          className="mb-5 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← 返回实验室列表
        </Link>

        <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <ReservationForm
            laboratoryId={laboratory.id}
            laboratoryName={
              laboratory.name
            }
            openTime={laboratory.openTime}
            closeTime={laboratory.closeTime}
            maxPeople={laboratory.maxPeople}
            advanceDays={
              laboratory.advanceDays
            }
          />
        </div>
      </div>
    </main>
  );
}