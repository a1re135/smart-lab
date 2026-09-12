"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

type EquipmentOption = {
  id: number;
  name: string;
  requirements: string | null;
  requiresTeacherApproval: boolean;
  minimumStudentLevel: string | null;
};

type ReservationFormProps = {
  laboratoryId: number;
  laboratoryName: string;
  openTime: string;
  closeTime: string;
  maxPeople: number;
  advanceDays: number;
  equipment: EquipmentOption[];
};

export default function ReservationForm({
  laboratoryId,
  laboratoryName,
  openTime,
  closeTime,
  maxPeople,
  advanceDays,
  equipment,
}: ReservationFormProps) {
  const router = useRouter();

  const [date, setDate] =
    useState("");

  const [startTime, setStartTime] =
    useState(openTime);

  const [endTime, setEndTime] =
    useState(closeTime);

  const [
    peopleCount,
    setPeopleCount,
  ] = useState(1);

  const [purpose, setPurpose] =
    useState("");

  const [
    selectedEquipment,
    setSelectedEquipment,
  ] = useState<number[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  function toggleEquipment(
    id: number
  ) {
    setSelectedEquipment(
      (current) =>
        current.includes(id)
          ? current.filter(
              (equipmentId) =>
                equipmentId !== id
            )
          : [...current, id]
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/reservations",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            laboratoryId,
            date,
            startTime,
            endTime,
            peopleCount,
            purpose,
            equipmentIds:
              selectedEquipment,
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
          "Reservation API returned:",
          raw
        );

        setError(
          `服务器错误 (${response.status})，请查看 VS Code 终端`
        );

        return;
      }

      if (!response.ok) {
        setError(
          data.error ?? "预约失败"
        );

        return;
      }

      router.push(
        "/student/reservations"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Reservation request failed:",
        error
      );

      setError(
        "请求失败，请查看 VS Code 终端"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
          BOOKING FORM
        </p>

        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          填写预约信息
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          当前预约：
          <span className="font-semibold text-slate-700">
            {laboratoryName}
          </span>
        </p>
      </div>

      {/* Basic information */}
      <section>
        <SectionTitle
          number="01"
          title="日期与时间"
          description="请选择实验室使用时间"
        />

        <div className="mt-4 space-y-4">
          <FormField
            label="预约日期"
            hint={`最多可提前 ${advanceDays} 天`}
          >
            <input
              type="date"
              required
              value={date}
              onChange={(event) =>
                setDate(
                  event.target.value
                )
              }
              className={inputClassName}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="开始时间"
              hint={`开放 ${openTime}`}
            >
              <input
                type="time"
                required
                value={startTime}
                onChange={(event) =>
                  setStartTime(
                    event.target.value
                  )
                }
                className={
                  inputClassName
                }
              />
            </FormField>

            <FormField
              label="结束时间"
              hint={`关闭 ${closeTime}`}
            >
              <input
                type="time"
                required
                value={endTime}
                onChange={(event) =>
                  setEndTime(
                    event.target.value
                  )
                }
                className={
                  inputClassName
                }
              />
            </FormField>
          </div>
        </div>
      </section>

      <div className="border-t border-slate-100" />

      {/* People */}
      <section>
        <SectionTitle
          number="02"
          title="使用信息"
          description="填写使用人数和实验目的"
        />

        <div className="mt-4 space-y-4">
          <FormField
            label="使用人数"
            hint={`实验室最多容纳 ${maxPeople} 人`}
          >
            <input
              type="number"
              min={1}
              max={maxPeople}
              required
              value={peopleCount}
              onChange={(event) =>
                setPeopleCount(
                  Number(
                    event.target.value
                  )
                )
              }
              className={inputClassName}
            />
          </FormField>

          <FormField label="使用目的">
            <textarea
              required
              rows={4}
              value={purpose}
              onChange={(event) =>
                setPurpose(
                  event.target.value
                )
              }
              placeholder="例如：完成机器学习课程实验、科研项目测试等"
              className={`${inputClassName} resize-none`}
            />
          </FormField>
        </div>
      </section>

      <div className="border-t border-slate-100" />

      {/* Equipment */}
      <section>
        <SectionTitle
          number="03"
          title="使用设备"
          description="如不需要设备，可直接跳过"
        />

        <div className="mt-4">
          {equipment.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white font-bold text-slate-400 shadow-sm">
                设
              </div>

              <p className="mt-3 text-sm font-medium text-slate-600">
                当前实验室暂无可用设备
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {equipment.map(
                (item) => {
                  const selected =
                    selectedEquipment.includes(
                      item.id
                    );

                  return (
                    <label
                      key={item.id}
                      className={`relative cursor-pointer rounded-2xl border p-4 transition ${
                        selected
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={
                            selected
                          }
                          onChange={() =>
                            toggleEquipment(
                              item.id
                            )
                          }
                          className="mt-1 h-4 w-4 accent-blue-600"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-semibold text-slate-900">
                              {item.name}
                            </p>

                            {selected && (
                              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                已选择
                              </span>
                            )}
                          </div>

                          {item.requirements && (
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              {
                                item.requirements
                              }
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.requiresTeacherApproval && (
                              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                                教师审核
                              </span>
                            )}

                            {item.minimumStudentLevel && (
                              <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                                {getStudentLevelName(
                                  item.minimumStudentLevel
                                )}
                                及以上
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                }
              )}
            </div>
          )}

          {selectedEquipment.length >
            0 && (
            <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
              已选择{" "}
              <strong>
                {
                  selectedEquipment.length
                }
              </strong>{" "}
              项设备
            </div>
          )}
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 font-bold text-red-700">
              !
            </div>

            <div>
              <p className="text-sm font-semibold text-red-800">
                无法提交预约
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="mb-4 text-xs leading-5 text-slate-500">
          提交预约表示您确认预约信息无误，并同意遵守实验室使用规定。
        </p>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "正在提交预约..."
            : "提交预约申请"}

          {!loading && (
            <span className="ml-2">
              →
            </span>
          )}
        </button>
      </div>
    </form>
  );
}

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

function SectionTitle({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700">
        {number}
      </div>

      <div>
        <h3 className="font-bold text-slate-900">
          {title}
        </h3>

        <p className="mt-0.5 text-sm text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label className="text-sm font-semibold text-slate-700">
          {label}
        </label>

        {hint && (
          <span className="text-xs text-slate-400">
            {hint}
          </span>
        )}
      </div>

      {children}
    </div>
  );
}

function getStudentLevelName(
  level: string
) {
  if (
    level === "UNDERGRADUATE"
  ) {
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