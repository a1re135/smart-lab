"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import ActionPopup from "@/components/action-popup";

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

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

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

  const [loading, setLoading] =
    useState(false);

  const [changingId, setChangingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  const [popup, setPopup] =
    useState({
        open: false,
        title: "",
        message: "",
    });

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
            description,
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

      const raw =
        await response.text();

      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        console.error(
          "Laboratory API returned:",
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
            "新增实验室失败"
        );

        return;
      }

      setName("");
      setDescription("");
      setType("NORMAL");
      setOpenTime("08:00");
      setCloseTime("22:00");
      setMaxPeople(20);
      setAdvanceDays(7);
      setRequiresTeacherApproval(
        false
      );
      setRequiresAdminApproval(
        false
      );

      setPopup({
        open: true,
        title: "实验室创建成功",
        message:
            "新的实验室已经添加到系统。",
        });

        setTimeout(() => {
        setPopup({
            open: false,
            title: "",
            message: "",
        });

        router.refresh();
        }, 1000);
    } catch (error) {
      console.error(
        "Create laboratory request failed:",
        error
      );

      setError("无法连接服务器");
    } finally {
      setLoading(false);
    }
  }

  async function toggleLaboratory(
    id: number,
    current: boolean
  ) {
    setChangingId(id);

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

      const raw =
        await response.text();

      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        alert(
          `服务器错误 (${response.status})`
        );

        return;
      }

      if (!response.ok) {
        alert(
          data.error ??
            "修改实验室状态失败"
        );

        return;
      }

      router.refresh();
    } catch (error) {
      console.error(
        "Toggle laboratory request failed:",
        error
      );

      alert("无法连接服务器");
    } finally {
      setChangingId(null);
    }
  }

  return (
    <>
    <div className="grid gap-8 xl:grid-cols-[380px_minmax(0,1fr)]">
      {/* ================================= */}
      {/* CREATE FORM */}
      {/* ================================= */}

      <aside>
        <div className="sticky top-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">
                +
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  新增实验室
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  创建新的实验室及预约规则
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={createLaboratory}
            className="space-y-5 p-5 sm:p-6"
          >
            <FormField label="实验室名称">
              <input
                required
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="例如：网络安全实验室"
                className={inputClassName}
              />
            </FormField>

            <FormField label="实验室类型">
              <select
                value={type}
                onChange={(event) =>
                  setType(
                    event.target.value
                  )
                }
                className={inputClassName}
              >
                <option value="NORMAL">
                  普通实验室
                </option>

                <option value="ADVANCED">
                  高级实验室
                </option>

                <option value="EQUIPMENT">
                  设备型实验室
                </option>
              </select>
            </FormField>

            <FormField
              label="实验室说明"
              optional
            >
              <textarea
                rows={3}
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="简单介绍实验室用途"
                className={`${inputClassName} resize-none`}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="开放时间">
                <input
                  type="time"
                  required
                  value={openTime}
                  onChange={(event) =>
                    setOpenTime(
                      event.target.value
                    )
                  }
                  className={
                    inputClassName
                  }
                />
              </FormField>

              <FormField label="关闭时间">
                <input
                  type="time"
                  required
                  value={closeTime}
                  onChange={(event) =>
                    setCloseTime(
                      event.target.value
                    )
                  }
                  className={
                    inputClassName
                  }
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="最大人数">
                <input
                  type="number"
                  min={1}
                  required
                  value={maxPeople}
                  onChange={(event) =>
                    setMaxPeople(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className={
                    inputClassName
                  }
                />
              </FormField>

              <FormField label="提前预约">
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    required
                    value={advanceDays}
                    onChange={(event) =>
                      setAdvanceDays(
                        Number(
                          event.target.value
                        )
                      )
                    }
                    className={`${inputClassName} pr-10`}
                  />

                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">
                    天
                  </span>
                </div>
              </FormField>
            </div>

            {/* Approval */}
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700">
                审核流程
              </p>

              <div className="space-y-2">
                <CheckboxCard
                  checked={
                    requiresTeacherApproval
                  }
                  onChange={
                    setRequiresTeacherApproval
                  }
                  title="教师审核"
                  description="学生预约需要指导教师确认"
                />

                <CheckboxCard
                  checked={
                    requiresAdminApproval
                  }
                  onChange={
                    setRequiresAdminApproval
                  }
                  title="管理员审核"
                  description="预约需要管理员进一步确认"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  保存失败
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 font-bold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "正在保存..."
                : "新增实验室"}

              {!loading && (
                <span className="ml-2">
                  →
                </span>
              )}
            </button>
          </form>
        </div>
      </aside>

      {/* ================================= */}
      {/* LABORATORY LIST */}
      {/* ================================= */}

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              LABORATORY LIST
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              实验室列表
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              共 {laboratories.length} 个实验室
            </p>
          </div>
        </div>

        {laboratories.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 font-bold text-slate-400">
              室
            </div>

            <h3 className="mt-4 font-bold text-slate-800">
              暂无实验室
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              使用左侧表单创建第一个实验室。
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {laboratories.map(
              (laboratory) => (
                <article
                  key={laboratory.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  {/* Top */}
                  <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/60 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <LaboratoryTypeBadge
                          type={
                            laboratory.type
                          }
                        />

                        <h3 className="mt-3 text-lg font-bold text-slate-900">
                          {laboratory.name}
                        </h3>
                      </div>

                      <StatusBadge
                        active={
                          laboratory.isActive
                        }
                      />
                    </div>

                    {laboratory.description && (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                        {
                          laboratory.description
                        }
                      </p>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-3">
                      <InfoBox
                        label="开放时间"
                        value={`${laboratory.openTime} - ${laboratory.closeTime}`}
                      />

                      <InfoBox
                        label="最大人数"
                        value={`${laboratory.maxPeople} 人`}
                      />

                      <InfoBox
                        label="提前预约"
                        value={`${laboratory.advanceDays} 天`}
                      />

                      <InfoBox
                        label="审核方式"
                        value={getApprovalText(
                          laboratory.requiresTeacherApproval,
                          laboratory.requiresAdminApproval
                        )}
                      />
                    </div>

                    {/* Approval tags */}
                    <div className="mt-4 flex min-h-7 flex-wrap gap-2">
                      {laboratory.requiresTeacherApproval && (
                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                          教师审核
                        </span>
                      )}

                      {laboratory.requiresAdminApproval && (
                        <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                          管理员审核
                        </span>
                      )}

                      {!laboratory.requiresTeacherApproval &&
                        !laboratory.requiresAdminApproval && (
                          <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                            自动通过
                          </span>
                        )}
                    </div>

                    {/* Action */}
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        disabled={
                          changingId ===
                          laboratory.id
                        }
                        onClick={() =>
                          toggleLaboratory(
                            laboratory.id,
                            laboratory.isActive
                          )
                        }
                        className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          laboratory.isActive
                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                            : "bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        {changingId ===
                        laboratory.id
                          ? "处理中..."
                          : laboratory.isActive
                            ? "停用实验室"
                            : "重新启用"}
                      </button>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </div>
    <ActionPopup
        open={popup.open}
        title={popup.title}
        message={popup.message}
    />
    </>
  );
}

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

function FormField({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700">
          {label}
        </label>

        {optional && (
          <span className="text-xs text-slate-400">
            可选
          </span>
        )}
      </div>

      {children}
    </div>
  );
}

function CheckboxCard({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (
    checked: boolean
  ) => void;
  title: string;
  description: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
        checked
          ? "border-blue-300 bg-blue-50"
          : "border-slate-200 bg-slate-50 hover:border-slate-300"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
        className="mt-1 h-4 w-4 accent-blue-600"
      />

      <div>
        <p className="text-sm font-semibold text-slate-700">
          {title}
        </p>

        <p className="mt-0.5 text-xs leading-5 text-slate-400">
          {description}
        </p>
      </div>
    </label>
  );
}

function LaboratoryTypeBadge({
  type,
}: {
  type: string;
}) {
  const label =
    type === "NORMAL"
      ? "普通实验室"
      : type === "ADVANCED"
        ? "高级实验室"
        : "设备型实验室";

  const style =
    type === "NORMAL"
      ? "bg-blue-100 text-blue-700"
      : type === "ADVANCED"
        ? "bg-purple-100 text-purple-700"
        : "bg-emerald-100 text-emerald-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${style}`}
    >
      {label}
    </span>
  );
}

function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={
        active
          ? "rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
          : "rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700"
      }
    >
      {active
        ? "启用中"
        : "已停用"}
    </span>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function getApprovalText(
  teacher: boolean,
  admin: boolean
) {
  if (teacher && admin) {
    return "教师 + 管理员";
  }

  if (teacher) {
    return "教师审核";
  }

  if (admin) {
    return "管理员审核";
  }

  return "自动通过";
}