"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

type Props = {
  reservationId: number;
};

export default function CheckInForm({
  reservationId,
}: Props) {
  const router = useRouter();

  const [code, setCode] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/checkin",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            reservationId,
            code,
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
          "Check-in API returned:",
          raw
        );

        setError(
          `服务器错误 (${response.status})`
        );

        return;
      }

      if (!response.ok) {
        setError(
          data.error ?? "签到失败"
        );

        return;
      }

      setCode("");
      router.refresh();
    } catch (error) {
      console.error(
        "Check-in request failed:",
        error
      );

      setError("无法连接服务器");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/60">
      <div className="border-b border-blue-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
            ✓
          </div>

          <div>
            <p className="text-sm font-bold text-blue-900">
              实验室签到
            </p>

            <p className="mt-0.5 text-xs text-blue-700">
              输入管理员提供的6位签到验证码
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            value={code}
            onChange={(event) =>
              setCode(
                event.target.value
                  .replace(
                    /\D/g,
                    ""
                  )
                  .slice(0, 6)
              )
            }
            placeholder="请输入6位验证码"
            className="min-w-0 flex-1 rounded-xl border border-blue-200 bg-white px-4 py-3 text-center text-lg font-bold tracking-[0.3em] text-slate-900 placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <button
            type="submit"
            disabled={
              loading ||
              code.length !== 6
            }
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "签到中..."
              : "确认签到"}
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}