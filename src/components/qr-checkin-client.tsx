"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import ActionPopup from "@/components/action-popup";

type Props = {
  token: string;
};

export default function QrCheckInClient({
  token,
}: Props) {
  const router = useRouter();

  const started =
    useRef(false);

  const [status, setStatus] =
    useState<
      "loading" |
      "success" |
      "error"
    >("loading");

  const [message, setMessage] =
    useState(
      "正在验证二维码..."
    );

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;

    if (!token) {
      setStatus("error");
      setMessage(
        "二维码缺少签到信息。"
      );

      return;
    }

    async function checkIn() {
      try {
        const response =
          await fetch(
            "/api/checkin/qr",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                token,
              }),
            }
          );

        const raw =
          await response.text();

        let data;

        try {
          data =
            JSON.parse(raw);
        } catch {
          setStatus("error");

          setMessage(
            `服务器错误 (${response.status})`
          );

          return;
        }

        if (!response.ok) {
          setStatus("error");

          setMessage(
            data.error ??
              "二维码签到失败"
          );

          return;
        }

        setStatus("success");

        setMessage(
          data.laboratoryName
            ? `您已成功签到：${data.laboratoryName}`
            : "您的实验室签到已完成。"
        );
      } catch (error) {
        console.error(
          "QR check-in failed:",
          error
        );

        setStatus("error");

        setMessage(
          "无法连接服务器，请稍后重试。"
        );
      }
    }

    checkIn();
  }, [token]);

  return (
    <>
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        {status ===
          "loading" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
              ...
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              正在签到
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {message}
            </p>
          </>
        )}

        {status ===
          "error" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl font-bold text-red-700">
              ×
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              签到失败
            </h2>

            <p className="mt-2 text-sm leading-6 text-red-600">
              {message}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/student/reservations"
                )
              }
              className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              返回我的预约
            </button>
          </>
        )}
      </div>

      <ActionPopup
        open={
          status === "success"
        }
        title="签到成功"
        message={message}
        onClose={() => {
          router.push(
            "/student/reservations"
          );

          router.refresh();
        }}
      />
    </>
  );
}