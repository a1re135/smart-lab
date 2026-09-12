"use client";

import { useState } from "react";

type Props = {
  reservationId: number;
};

export default function CheckInCodeButton({
  reservationId,
}: Props) {
  const [code, setCode] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  async function generateCode() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/checkin/${reservationId}`,
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
          "Check-in code API returned:",
          raw
        );

        setError(
          `服务器错误 (${response.status})`
        );

        return;
      }

      if (!response.ok) {
        setError(
          data.error ??
            "生成签到码失败"
        );

        return;
      }

      setCode(data.code);
    } catch (error) {
      console.error(
        "Generate check-in code failed:",
        error
      );

      setError("无法连接服务器");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!code) {
        return;
    }

    try {
        await navigator.clipboard.writeText(
        code
        );

        setCopied(true);

        setTimeout(() => {
        setCopied(false);
        }, 1500);
    } catch (error) {
        console.error(
        "Copy code failed:",
        error
        );
    }
    }

  return (
    <div className="mt-5">
      {!code ? (
        <button
          type="button"
          disabled={loading}
          onClick={generateCode}
          className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "正在生成..."
            : "生成签到验证码"}
        </button>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50">
          <div className="border-b border-blue-100 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              CHECK-IN CODE
            </p>

            <p className="mt-1 text-sm font-semibold text-blue-900">
              学生签到验证码
            </p>
          </div>

          <div className="p-4">
            <div className="rounded-xl bg-white px-4 py-4 text-center ring-1 ring-blue-100">
              <p className="text-3xl font-black tracking-[0.3em] text-blue-700">
                {code}
              </p>
            </div>

            <button
              type="button"
              onClick={copyCode}
              className="mt-3 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-blue-700 ring-1 ring-blue-200 transition hover:bg-blue-100"
            >
              {copied
                ? "✓ 已复制"
                : "复制验证码"}
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-blue-700">
              将验证码提供给对应学生完成签到。
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}