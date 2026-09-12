"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  reservationId: number;
};

export default function AdminApprovalButtons({
  reservationId,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDecision(
    decision: "APPROVED" | "REJECTED"
  ) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/approvals/${reservationId}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            decision,
          }),
        }
      );

      const raw = await response.text();

      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        console.error(
          "Admin approval API returned:",
          raw
        );

        setError(
          `服务器错误 (${response.status})，请查看 VS Code 终端`
        );

        return;
      }

      if (!response.ok) {
        setError(data.error ?? "审核失败");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error(
        "Admin approval request failed:",
        error
      );

      setError("请求失败，请查看 VS Code 终端");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() =>
            handleDecision("APPROVED")
          }
          className="flex-1 rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "处理中..." : "通过"}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() =>
            handleDecision("REJECTED")
          }
          className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "处理中..." : "拒绝"}
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}