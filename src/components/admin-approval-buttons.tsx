"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ActionPopup from "@/components/action-popup";

type Props = {
  reservationId: number;
};

export default function AdminApprovalButtons({
  reservationId,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] =
    useState<
      "APPROVED" | "REJECTED" | null
    >(null);

  const [error, setError] =
    useState("");
  
  const [popup, setPopup] =
    useState<{
      open: boolean;
      title: string;
      message: string;
      variant:
        | "success"
        | "warning";
    }>({
      open: false,
      title: "",
      message: "",
      variant: "success",
    });

  async function handleDecision(
    decision:
      | "APPROVED"
      | "REJECTED"
  ) {
    if (
      decision === "REJECTED" &&
      !window.confirm(
        "确定要拒绝这个预约吗？"
      )
    ) {
      return;
    }

    setLoading(decision);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/approvals/${reservationId}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            decision,
          }),
        }
      );

      const raw =
        await response.text();

      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        console.error(
          "Admin approval API returned:",
          raw
        );

        setError(
          `服务器错误 (${response.status})`
        );

        return;
      }

      if (!response.ok) {
        setError(
          data.error ?? "审核失败"
        );

        return;
      }

      if (
        decision === "APPROVED"
      ) {
        setPopup({
          open: true,
          title: "预约已批准",
          message:
            "管理员已完成该预约的最终审核。",
          variant: "success",
        });
      } else {
        setPopup({
          open: true,
          title: "预约已拒绝",
          message:
            "该预约申请已被管理员拒绝。",
          variant: "warning",
        });
      }

    } catch (error) {
      console.error(
        "Admin approval request failed:",
        error
      );

      setError("无法连接服务器");
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
        管理员审核
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={
            loading !== null
          }
          onClick={() =>
            handleDecision(
              "APPROVED"
            )
          }
          className="flex items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ===
          "APPROVED"
            ? "处理中..."
            : "✓ 通过"}
        </button>

        <button
          type="button"
          disabled={
            loading !== null
          }
          onClick={() =>
            handleDecision(
              "REJECTED"
            )
          }
          className="flex items-center justify-center rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ===
          "REJECTED"
            ? "处理中..."
            : "拒绝"}
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">
          {error}
        </div>
      )}
    </div>
    <ActionPopup
      open={popup.open}
      title={popup.title}
      message={popup.message}
      variant={popup.variant}
      onClose={() => {
        setPopup({
          open: false,
          title: "",
          message: "",
          variant: "success",
        });

        router.refresh();
      }}
    />
  </>
  );
}