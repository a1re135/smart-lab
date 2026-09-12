"use client";

import { FormEvent, useState } from "react";
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

  const [laboratoryId, setLaboratoryId] =
    useState(
      laboratories.length > 0
        ? String(laboratories[0].id)
        : ""
    );

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");
  const [requirements, setRequirements] =
    useState("");

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
  const [error, setError] = useState("");

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
        setError(data.error ?? "新增失败");
        return;
      }

      setName("");
      setDescription("");
      setRequirements("");
      setRequiresTeacherApproval(false);
      setMinimumStudentLevel("");

      router.refresh();
    } catch (error) {
      console.error(error);
      setError("无法连接服务器");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(
    id: number,
    status: string
  ) {
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

      if (!response.ok) {
        alert("修改设备状态失败");
        return;
      }

      router.refresh();
    } catch {
      alert("无法连接服务器");
    }
  }

  return (
    <div className="space-y-8">
      {/* Add equipment */}
      <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">
          新增设备
        </h2>

        <form
          onSubmit={createEquipment}
          className="mt-5 grid gap-4 md:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              所属实验室
            </label>

            <select
              value={laboratoryId}
              onChange={(event) =>
                setLaboratoryId(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
            >
              {laboratories.map((lab) => (
                <option
                  key={lab.id}
                  value={lab.id}
                >
                  {lab.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              设备名称
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

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              设备说明
            </label>

            <input
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="例如：用于人工智能模型训练"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              使用要求
            </label>

            <input
              value={requirements}
              onChange={(event) =>
                setRequirements(
                  event.target.value
                )
              }
              placeholder="例如：需要指导教师审核"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              最低学生等级
            </label>

            <select
              value={minimumStudentLevel}
              onChange={(event) =>
                setMinimumStudentLevel(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
            >
              <option value="">
                不限制
              </option>

              <option value="UNDERGRADUATE">
                本科生
              </option>

              <option value="MASTER">
                硕士研究生
              </option>

              <option value="DOCTORAL">
                博士研究生
              </option>
            </select>
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

            需要指导教师审核
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
                : "新增设备"}
            </button>
          </div>
        </form>
      </section>

      {/* Equipment list */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          设备列表
        </h2>

        {equipment.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-500">
              暂无设备
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {equipment.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {item.name}
                    </h3>

                    <p className="mt-1 text-sm text-blue-600">
                      {item.laboratory.name}
                    </p>
                  </div>

                  <EquipmentStatus
                    status={item.status}
                  />
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>
                    说明：
                    {item.description ??
                      "暂无"}
                  </p>

                  <p>
                    使用要求：
                    {item.requirements ??
                      "无特殊要求"}
                  </p>

                  <p>
                    教师审核：
                    {item.requiresTeacherApproval
                      ? "需要"
                      : "不需要"}
                  </p>

                  <p>
                    最低等级：
                    {getStudentLevelName(
                      item.minimumStudentLevel
                    )}
                  </p>
                </div>

                <div className="mt-5">
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    修改状态
                  </label>

                  <select
                    value={item.status}
                    onChange={(event) =>
                      changeStatus(
                        item.id,
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EquipmentStatus({
  status,
}: {
  status: string;
}) {
  const text =
    status === "AVAILABLE"
      ? "可用"
      : status === "IN_USE"
        ? "使用中"
        : status === "MAINTENANCE"
          ? "维护中"
          : "停用";

  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
      {text}
    </span>
  );
}

function getStudentLevelName(
  level: string | null
) {
  if (!level) {
    return "不限制";
  }

  if (level === "UNDERGRADUATE") {
    return "本科生";
  }

  if (level === "MASTER") {
    return "硕士研究生";
  }

  if (level === "DOCTORAL") {
    return "博士研究生";
  }

  return level;
}