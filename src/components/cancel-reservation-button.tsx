"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  reservationId: number;
};

export default function CancelReservationButton({
  reservationId,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleCancel() {
    const confirmed =
      window.confirm(
        "确定要取消这个预约吗？取消后将无法恢复。"
      );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/reservations/${reservationId}/cancel`,
        {
          method: "POST",
        }
      );

      const raw =
        await response.text();

      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        console.error(
          "Cancel API returned:",
          raw
        );

        setError(
          `服务器错误 (${response.status})`
        );

        return;
      }

      if (!response.ok) {
        setError(
          data.error ?? "取消失败"
        );

        return;
      }

      router.refresh();
    } catch (error) {
      console.error(
        "Cancel reservation request failed:",
        error
      );

      setError("无法连接服务器");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={handleCancel}
        className="flex w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {loading
          ? "正在取消..."
          : "取消预约"}
      </button>

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}