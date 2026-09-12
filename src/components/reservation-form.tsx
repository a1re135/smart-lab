"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ReservationFormProps = {
  laboratoryId: number;
  laboratoryName: string;
  openTime: string;
  closeTime: string;
  maxPeople: number;
  advanceDays: number;
};

export default function ReservationForm({
  laboratoryId,
  laboratoryName,
  openTime,
  closeTime,
  maxPeople,
  advanceDays,
}: ReservationFormProps) {
  const router = useRouter();

  const [date, setDate] = useState("");
  const [startTime, setStartTime] =
    useState(openTime);
  const [endTime, setEndTime] =
    useState(closeTime);

  const [peopleCount, setPeopleCount] =
    useState(1);

  const [purpose, setPurpose] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
    const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
        laboratoryId,
        date,
        startTime,
        endTime,
        peopleCount,
        purpose,
        }),
    });

    const raw = await response.text();

    let data;

    try {
        data = JSON.parse(raw);
    } catch {
        console.error("Reservation API returned:", raw);

        setError(
        `服务器错误 (${response.status})，请查看 VS Code 终端`
        );
        return;
    }

    if (!response.ok) {
        setError(data.error ?? "预约失败");
        return;
    }

    router.push("/student/reservations");
    router.refresh();
    } catch (error) {
    console.error("Reservation request failed:", error);

    setError("请求失败，请查看 VS Code 终端");
    } finally {
    setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div>
        <p className="text-sm text-slate-500">
          预约实验室
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          {laboratoryName}
        </h1>

        <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-500">
          <span>
            开放时间：{openTime} - {closeTime}
          </span>

          <span>•</span>

          <span>
            最大人数：{maxPeople}
          </span>

          <span>•</span>

          <span>
            可提前 {advanceDays} 天
          </span>
        </div>
      </div>

      <div className="border-t border-slate-200" />

      {/* Date */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          预约日期
        </label>

        <input
          type="date"
          required
          value={date}
          onChange={(event) =>
            setDate(event.target.value)
          }
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Times */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            开始时间
          </label>

          <input
            type="time"
            required
            value={startTime}
            onChange={(event) =>
              setStartTime(event.target.value)
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            结束时间
          </label>

          <input
            type="time"
            required
            value={endTime}
            onChange={(event) =>
              setEndTime(event.target.value)
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* People */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          使用人数
        </label>

        <input
          type="number"
          min={1}
          max={maxPeople}
          required
          value={peopleCount}
          onChange={(event) =>
            setPeopleCount(
              Number(event.target.value)
            )
          }
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Purpose */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          使用目的
        </label>

        <textarea
          required
          rows={4}
          value={purpose}
          onChange={(event) =>
            setPurpose(event.target.value)
          }
          placeholder="请输入实验室使用目的"
          className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {loading
          ? "提交中..."
          : "提交预约"}
      </button>
    </form>
  );
}