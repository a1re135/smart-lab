"use client";

import { useState } from "react";

type Props = {
  reservationId: number;
};

export default function CheckInCodeButton({
  reservationId,
}: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        setError(data.error ?? "生成失败");
        return;
      }

      setCode(data.code);
    } catch (error) {
      console.error(error);
      setError("无法连接服务器");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={loading}
        onClick={generateCode}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "生成中..." : "生成签到码"}
      </button>

      {code && (
        <div className="mt-3 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-slate-500">
            签到验证码
          </p>

          <p className="mt-1 text-3xl font-bold tracking-widest text-blue-700">
            {code}
          </p>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}