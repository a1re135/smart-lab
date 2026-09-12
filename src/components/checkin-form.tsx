"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  reservationId: number;
};

export default function CheckInForm({
  reservationId,
}: Props) {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState("");

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

      const raw = await response.text();

      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        setError(
          `服务器错误 (${response.status})`
        );
        return;
      }

      if (!response.ok) {
        setError(data.error ?? "签到失败");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      setError("无法连接服务器");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4"
    >
      <label className="mb-2 block text-sm font-medium text-slate-700">
        签到验证码
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(event) =>
            setCode(event.target.value)
          }
          placeholder="请输入6位验证码"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "签到中..." : "签到"}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}