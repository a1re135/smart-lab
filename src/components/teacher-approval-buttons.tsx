"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ActionPopup from "@/components/action-popup";

type Props = {
  reservationId: number;
};

export default function TeacherApprovalButtons({
  reservationId,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

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
    decision: "APPROVED" | "REJECTED"
  ) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/teacher/approvals/${reservationId}`,
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

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "审核失败");
        return;
      }

      if (
        decision === "APPROVED"
      ) {
        setPopup({
          open: true,
          title: "预约已通过",
          message:
            "该学生的预约申请已成功通过审核。",
          variant: "success",
        });
      } else {
        setPopup({
          open: true,
          title: "预约已拒绝",
          message:
            "该学生的预约申请已被拒绝。",
          variant: "warning",
        });
      }

      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch {
      setError("无法连接服务器");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mt-4">
        <div className="flex gap-3">
          <button
            disabled={loading}
            onClick={() =>
              handleDecision("APPROVED")
            }
            className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            通过
          </button>

          <button
            disabled={loading}
            onClick={() =>
              handleDecision("REJECTED")
            }
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            拒绝
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      <ActionPopup
        open={popup.open}
        title={popup.title}
        message={popup.message}
        variant={popup.variant}
      />
    </>
  );
}