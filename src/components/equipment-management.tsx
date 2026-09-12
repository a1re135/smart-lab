"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

type Laboratory = {
  id: number;
  name: string;
};

type Equipment = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  requirements: string | null;
  requiresTeacherApproval: boolean;
  minimumStudentLevel: string | null;

  laboratory: {
    id: number;
    name: string;
  };
};

type Props = {
  laboratories: Laboratory[];
  equipment: Equipment[];
};

export default function EquipmentManagement({
  laboratories,
  equipment,
}: Props) {
  const router = useRouter();

  const [
    laboratoryId,
    setLaboratoryId,
  ] = useState(
    laboratories.length > 0
      ? String(laboratories[0].id)
      : ""
  );

  const [name, setName] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    requirements,
    setRequirements,
  ] = useState("");

  const [
    requiresTeacherApproval,
    setRequiresTeacherApproval,
  ] = useState(false);

  const [
    minimumStudentLevel,
    setMinimumStudentLevel,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    changingId,
    setChangingId,
  ] = useState<number | null>(null);

  const [error, setError] =
    useState("");

  async function createEquipment(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/equipment",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            laboratoryId:
              Number(laboratoryId),

            name,
            description,
            requirements,

            requiresTeacherApproval,

            minimumStudentLevel,
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
          "Equipment API returned:",
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
            "新增设备失败"
        );

        return;
      }

      setName("");
      setDescription("");
      setRequirements("");
      setRequiresTeacherApproval(
        false
      );
      setMinimumStudentLevel("");

      router.refresh();
    } catch (error) {
      console.error(
        "Create equipment request failed:",
        error
      );

      setError("无法连接服务器");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(
    id: number,
    status: string
  ) {
    setChangingId(id);

    try {
      const response = await fetch(
        `/api/admin/equipment/${id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            status,
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
            "修改设备状态失败"
        );

        return;
      }

      router.refresh();
    } catch (error) {
      console.error(
        "Change equipment status failed:",
        error
      );

      alert("无法连接服务器");
    } finally {
      setChangingId(null);
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[380px_minmax(0,1fr)]">
      {/* =============================== */}
      {/* ADD EQUIPMENT */}
      {/* =============================== */}

      <aside>
        <div className="sticky top-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">
                +
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  新增设备
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  添加新的实验室设备
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={createEquipment}
            className="space-y-5 p-5 sm:p-6"
          >
            {/* Laboratory */}
            <FormField label="所属实验室">
              <select
                required
                value={laboratoryId}
                onChange={(event) =>
                  setLaboratoryId(
                    event.target.value
                  )
                }
                className={
                  inputClassName
                }
              >
                {laboratories.length ===
                0 ? (
                  <option value="">
                    暂无实验室
                  </option>
                ) : (
                  laboratories.map(
                    (laboratory) => (
                      <option
                        key={
                          laboratory.id
                        }
                        value={
                          laboratory.id
                        }
                      >
                        {
                          laboratory.name
                        }
                      </option>
                    )
                  )
                )}
              </select>
            </FormField>

            {/* Name */}
            <FormField label="设备名称">
              <input
                required
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="例如：高性能GPU服务器"
                className={
                  inputClassName
                }
              />
            </FormField>

            {/* Description */}
            <FormField
              label="设备说明"
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
                placeholder="例如：用于深度学习模型训练"
                className={`${inputClassName} resize-none`}
              />
            </FormField>

            {/* Requirement */}
            <FormField
              label="使用要求"
              optional
            >
              <textarea
                rows={3}
                value={requirements}
                onChange={(event) =>
                  setRequirements(
                    event.target.value
                  )
                }
                placeholder="例如：使用前需接受设备培训"
                className={`${inputClassName} resize-none`}
              />
            </FormField>

            {/* Student level */}
            <FormField label="最低学生等级">
              <select
                value={
                  minimumStudentLevel
                }
                onChange={(event) =>
                  setMinimumStudentLevel(
                    event.target.value
                  )
                }
                className={
                  inputClassName
                }
              >
                <option value="">
                  不限制
                </option>

                <option value="UNDERGRADUATE">
                  本科生及以上
                </option>

                <option value="MASTER">
                  硕士研究生及以上
                </option>

                <option value="DOCTORAL">
                  博士研究生
                </option>
              </select>
            </FormField>

            {/* Teacher approval */}
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                requiresTeacherApproval
                  ? "border-blue-300 bg-blue-50"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300"
              }`}
            >
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
                className="mt-1 h-4 w-4 accent-blue-600"
              />

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  需要教师审核
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  学生选择此设备时，预约将先进入指导教师审核流程。
                </p>
              </div>
            </label>

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
              disabled={
                loading ||
                laboratories.length === 0
              }
              className="flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 font-bold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "正在保存..."
                : "新增设备"}

              {!loading && (
                <span className="ml-2">
                  →
                </span>
              )}
            </button>

            {laboratories.length ===
              0 && (
              <p className="text-center text-xs text-orange-600">
                请先创建实验室后再添加设备。
              </p>
            )}
          </form>
        </div>
      </aside>

      {/* =============================== */}
      {/* EQUIPMENT LIST */}
      {/* =============================== */}

      <section>
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
            EQUIPMENT LIST
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            设备列表
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            共 {equipment.length} 台 / 项设备
          </p>
        </div>

        {equipment.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 font-bold text-slate-400">
              设
            </div>

            <h3 className="mt-4 font-bold text-slate-800">
              暂无设备
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              使用左侧表单添加实验设备。
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {equipment.map(
              (item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  {/* Top */}
                  <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/60 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                          {
                            item
                              .laboratory
                              .name
                          }
                        </p>

                        <h3 className="mt-2 text-lg font-bold text-slate-900">
                          {item.name}
                        </h3>
                      </div>

                      <EquipmentStatusBadge
                        status={
                          item.status
                        }
                      />
                    </div>

                    {item.description && (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="p-5">
                    {/* Main info */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoBox
                        label="最低权限"
                        value={getStudentLevelName(
                          item.minimumStudentLevel
                        )}
                      />

                      <InfoBox
                        label="教师审核"
                        value={
                          item.requiresTeacherApproval
                            ? "需要"
                            : "不需要"
                        }
                      />
                    </div>

                    {/* Requirements */}
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        使用要求
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {item.requirements ??
                          "无特殊使用要求"}
                      </p>
                    </div>

                    {/* Permission badges */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.requiresTeacherApproval && (
                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                          教师审核
                        </span>
                      )}

                      {item.minimumStudentLevel && (
                        <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                          {getStudentLevelName(
                            item.minimumStudentLevel
                          )}
                          权限
                        </span>
                      )}

                      {!item.requiresTeacherApproval &&
                        !item.minimumStudentLevel && (
                          <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                            无特殊权限限制
                          </span>
                        )}
                    </div>

                    {/* Status control */}
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          设备状态
                        </label>

                        {changingId ===
                          item.id && (
                          <span className="text-xs text-blue-600">
                            保存中...
                          </span>
                        )}
                      </div>

                      <select
                        value={
                          item.status
                        }
                        disabled={
                          changingId ===
                          item.id
                        }
                        onChange={(event) =>
                          changeStatus(
                            item.id,
                            event.target
                              .value
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:opacity-50"
                      >
                        <option value="AVAILABLE">
                          可用
                        </option>

                        <option value="IN_USE">
                          使用中
                        </option>

                        <option value="MAINTENANCE">
                          维护中
                        </option>

                        <option value="DISABLED">
                          停用
                        </option>
                      </select>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </div>
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
      <div className="mb-2 flex items-center justify-between gap-3">
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

function EquipmentStatusBadge({
  status,
}: {
  status: string;
}) {
  const label =
    status === "AVAILABLE"
      ? "可用"
      : status === "IN_USE"
        ? "使用中"
        : status ===
            "MAINTENANCE"
          ? "维护中"
          : "已停用";

  const className =
    status === "AVAILABLE"
      ? "bg-green-100 text-green-700"
      : status === "IN_USE"
        ? "bg-blue-100 text-blue-700"
        : status ===
            "MAINTENANCE"
          ? "bg-orange-100 text-orange-700"
          : "bg-red-100 text-red-700";

  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {label}
    </span>
  );
}

function getStudentLevelName(
  level: string | null
) {
  if (!level) {
    return "不限制";
  }

  if (
    level === "UNDERGRADUATE"
  ) {
    return "本科生及以上";
  }

  if (level === "MASTER") {
    return "硕士研究生及以上";
  }

  if (level === "DOCTORAL") {
    return "博士研究生";
  }

  return level;
}