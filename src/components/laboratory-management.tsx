"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Laboratory = {
  id: number;
  name: string;
  type: string;
  description: string | null;
  openTime: string;
  closeTime: string;
  maxPeople: number;
  advanceDays: number;
  requiresTeacherApproval: boolean;
  requiresAdminApproval: boolean;
  isActive: boolean;
};

type Props = {
  laboratories: Laboratory[];
};

export default function LaboratoryManagement({
  laboratories,
}: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [type, setType] =
    useState("NORMAL");

  const [openTime, setOpenTime] =
    useState("08:00");

  const [closeTime, setCloseTime] =
    useState("22:00");

  const [maxPeople, setMaxPeople] =
    useState(20);

  const [advanceDays, setAdvanceDays] =
    useState(7);

  const [
    requiresTeacherApproval,
    setRequiresTeacherApproval,
  ] = useState(false);

  const [
    requiresAdminApproval,
    setRequiresAdminApproval,
  ] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] =
    useState(false);

  async function createLaboratory(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/laboratories",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name,
            type,
            openTime,
            closeTime,
            maxPeople,
            advanceDays,
            requiresTeacherApproval,
            requiresAdminApproval,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "新增失败");
        return;
      }

      setName("");
      router.refresh();
    } catch {
      setError("无法连接服务器");
    } finally {
      setLoading(false);
    }
  }

  async function toggleLaboratory(
    id: number,
    current: boolean
  ) {
    try {
      const response = await fetch(
        `/api/admin/laboratories/${id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            isActive: !current,
          }),
        }
      );

      if (!response.ok) {
        alert("修改失败");
        return;
      }

      router.refresh();
    } catch {
      alert("无法连接服务器");
    }
  }

  return (
    <div className="space-y-8">
      {/* Add laboratory */}
      <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">
          新增实验室
        </h2>

        <form
          onSubmit={createLaboratory}
          className="mt-5 grid gap-4 md:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              实验室名称
            </label>

            <input
              required
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              类型
            </label>

            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
            >
              <option value="NORMAL">
                普通
              </option>

              <option value="ADVANCED">
                高级
              </option>

              <option value="EQUIPMENT">
                设备型
              </option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              开放时间
            </label>

            <input
              type="time"
              value={openTime}
              onChange={(event) =>
                setOpenTime(event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              关闭时间
            </label>

            <input
              type="time"
              value={closeTime}
              onChange={(event) =>
                setCloseTime(event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              最大人数
            </label>

            <input
              type="number"
              min={1}
              value={maxPeople}
              onChange={(event) =>
                setMaxPeople(
                  Number(event.target.value)
                )
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              提前预约天数
            </label>

            <input
              type="number"
              min={0}
              value={advanceDays}
              onChange={(event) =>
                setAdvanceDays(
                  Number(event.target.value)
                )
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={
                requiresTeacherApproval
              }
              onChange={(event) =>
                setRequiresTeacherApproval(
                  event.target.checked
                )
              }
            />

            需要教师审核
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={
                requiresAdminApproval
              }
              onChange={(event) =>
                setRequiresAdminApproval(
                  event.target.checked
                )
              }
            />

            需要管理员审核
          </label>

          {error && (
            <div className="md:col-span-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="md:col-span-2">
            <button
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? "保存中..."
                : "新增实验室"}
            </button>
          </div>
        </form>
      </section>

      {/* List */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          实验室列表
        </h2>

        <div className="space-y-4">
          {laboratories.map((lab) => (
            <div
              key={lab.id}
              className="rounded-xl bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">
                      {lab.name}
                    </h3>

                    <span
                      className={
                        lab.isActive
                          ? "rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700"
                          : "rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700"
                      }
                    >
                      {lab.isActive
                        ? "启用"
                        : "停用"}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-slate-500">
                    <p>
                      开放时间：
                      {lab.openTime} -{" "}
                      {lab.closeTime}
                    </p>

                    <p>
                      最大人数：
                      {lab.maxPeople}
                    </p>

                    <p>
                      提前预约：
                      {lab.advanceDays} 天
                    </p>

                    <p>
                      教师审核：
                      {lab.requiresTeacherApproval
                        ? "需要"
                        : "不需要"}
                    </p>

                    <p>
                      管理员审核：
                      {lab.requiresAdminApproval
                        ? "需要"
                        : "不需要"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    toggleLaboratory(
                      lab.id,
                      lab.isActive
                    )
                  }
                  className={
                    lab.isActive
                      ? "rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                      : "rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-100"
                  }
                >
                  {lab.isActive
                    ? "停用"
                    : "启用"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}