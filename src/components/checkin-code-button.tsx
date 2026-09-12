"use client";

import { useState } from "react";
import QRCode from "qrcode";

type Props = {
  reservationId: number;
};

export default function CheckInCodeButton({
  reservationId,
}: Props) {
  const [code, setCode] =
    useState("");

  const [qrDataUrl, setQrDataUrl] =
    useState("");

  const [qrLink, setQrLink] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const [linkCopied, setLinkCopied] =
    useState(false);

  const [error, setError] =
    useState("");

  async function generateCheckIn() {
    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
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
          data.error ??
            "生成签到信息失败"
        );

        return;
      }

      const link =
        `${window.location.origin}/student/checkin/qr?token=${encodeURIComponent(
          data.qrToken
        )}`;

      const generatedQr =
        await QRCode.toDataURL(
          link,
          {
            width: 320,
            margin: 2,
          }
        );

      setCode(data.code);
      setQrLink(link);
      setQrDataUrl(
        generatedQr
      );
    } catch (error) {
      console.error(
        "Generate check-in failed:",
        error
      );

      setError(
        "无法生成签到信息"
      );
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

  async function copyQrLink() {
    if (!qrLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        qrLink
      );

      setLinkCopied(true);

      setTimeout(() => {
        setLinkCopied(false);
      }, 1500);
    } catch (error) {
      console.error(
        "Copy QR link failed:",
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
          onClick={
            generateCheckIn
          }
          className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "正在生成..."
            : "生成签到信息"}
        </button>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50">
          <div className="border-b border-blue-100 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              CHECK-IN
            </p>

            <p className="mt-1 text-sm font-semibold text-blue-900">
              学生签到信息
            </p>
          </div>

          <div className="p-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Verification code */}
              <div className="rounded-2xl bg-white p-4 text-center ring-1 ring-blue-100">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  验证码签到
                </p>

                <div className="mt-4 flex min-h-[220px] items-center justify-center rounded-2xl bg-slate-50 px-4 py-6">
                  <div className="flex w-full items-center justify-evenly">
                    {code.split("").map((digit, index) => (
                      <span
                        key={`${digit}-${index}`}
                        className="text-[18px] font-black leading-none text-blue-700 sm:text-2xl"
                      >
                        {digit}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={copyCode}
                  className="mt-4 w-full rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  {copied
                    ? "✓ 已复制"
                    : "复制验证码"}
                </button>
              </div>

              {/* QR code */}
              <div className="rounded-2xl bg-white p-4 text-center ring-1 ring-blue-100">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  二维码签到
                </p>

                <div className="mt-4 flex min-h-[220px] items-center justify-center rounded-2xl bg-slate-50 px-4 py-4">
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="学生签到二维码"
                      className="h-auto w-full max-w-[220px] object-contain"
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={copyQrLink}
                  className="mt-4 w-full rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
                >
                  {linkCopied
                    ? "✓ 已复制"
                    : "复制二维码链接"}
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-blue-100/70 px-4 py-3">
              <p className="text-center text-xs leading-5 text-blue-800">
                学生可以输入6位验证码，或使用手机扫描二维码完成签到。
              </p>
            </div>
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