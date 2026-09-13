"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import ActionPopup from "@/components/action-popup";

type Teacher = {
  id: number;
  name: string;
  teacherNumber: string | null;
};

type Props = {
  teachers: Teacher[];
};

type RegisterRole =
  | "STUDENT"
  | "TEACHER";

export default function RegisterForm({
  teachers,
}: Props) {
  const router = useRouter();

  const [role, setRole] =
    useState<RegisterRole>(
      "STUDENT"
    );

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [name, setName] =
    useState("");

  const [
    studentNumber,
    setStudentNumber,
  ] = useState("");

  const [
    studentLevel,
    setStudentLevel,
  ] = useState(
    "UNDERGRADUATE"
  );

  const [teacherId, setTeacherId] =
    useState(
      teachers.length > 0
        ? String(
            teachers[0].id
          )
        : ""
    );

  const [
    teacherNumber,
    setTeacherNumber,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showSuccess, setShowSuccess] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "两次输入的密码不一致"
      );

      return;
    }

    if (
      role === "STUDENT" &&
      teachers.length === 0
    ) {
      setError(
        "当前没有可选择的指导教师，请先注册教师账号。"
      );

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/register",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            role,
            username,
            password,
            name,

            studentNumber:
              role === "STUDENT"
                ? studentNumber
                : undefined,

            studentLevel:
              role === "STUDENT"
                ? studentLevel
                : undefined,

            teacherId:
              role === "STUDENT"
                ? Number(
                    teacherId
                  )
                : undefined,

            teacherNumber:
              role === "TEACHER"
                ? teacherNumber
                : undefined,
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
        console.error(
          "Register API returned:",
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
            "注册失败"
        );

        return;
      }

      setShowSuccess(true);
    } catch (error) {
      console.error(
        "Register request failed:",
        error
      );

      setError(
        "无法连接服务器"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl shadow-black/30">
        <div className="p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
            CREATE ACCOUNT
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            注册账号
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            创建学生或教师账号。
          </p>

          {/* Role selector */}
          <div className="mt-7 grid grid-cols-2 rounded-2xl bg-slate-100 p-1.5">
            <button
              type="button"
              onClick={() => {
                setRole(
                  "STUDENT"
                );

                setError("");
              }}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                role === "STUDENT"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              学生注册
            </button>

            <button
              type="button"
              onClick={() => {
                setRole(
                  "TEACHER"
                );

                setError("");
              }}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                role === "TEACHER"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              教师注册
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-5"
          >
            <FormField label="姓名">
              <input
                required
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="请输入真实姓名"
                className={
                  inputClassName
                }
              />
            </FormField>

            <FormField label="用户名">
              <input
                required
                minLength={3}
                autoComplete="username"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
                placeholder="用于登录系统"
                className={
                  inputClassName
                }
              />
            </FormField>

            {/* Student fields */}
            {role === "STUDENT" && (
              <>
                <FormField label="学号">
                  <input
                    required
                    value={
                      studentNumber
                    }
                    onChange={(
                      event
                    ) =>
                      setStudentNumber(
                        event.target
                          .value
                      )
                    }
                    placeholder="例如：S003"
                    className={
                      inputClassName
                    }
                  />
                </FormField>

                <FormField label="学生类型">
                  <select
                    value={
                      studentLevel
                    }
                    onChange={(
                      event
                    ) =>
                      setStudentLevel(
                        event.target
                          .value
                      )
                    }
                    className={
                      inputClassName
                    }
                  >
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
                </FormField>

                <FormField label="指导教师">
                  <select
                    required
                    value={
                      teacherId
                    }
                    disabled={
                      teachers.length ===
                      0
                    }
                    onChange={(
                      event
                    ) =>
                      setTeacherId(
                        event.target
                          .value
                      )
                    }
                    className={
                      inputClassName
                    }
                  >
                    {teachers.length ===
                    0 ? (
                      <option value="">
                        暂无可选教师
                      </option>
                    ) : (
                      teachers.map(
                        (teacher) => (
                          <option
                            key={
                              teacher.id
                            }
                            value={
                              teacher.id
                            }
                          >
                            {
                              teacher.name
                            }
                            {teacher.teacherNumber
                              ? ` (${teacher.teacherNumber})`
                              : ""}
                          </option>
                        )
                      )
                    )}
                  </select>

                  {teachers.length ===
                    0 && (
                    <p className="mt-2 text-xs text-orange-600">
                      当前没有教师账号，请先注册教师账号。
                    </p>
                  )}
                </FormField>
              </>
            )}

            {/* Teacher fields */}
            {role === "TEACHER" && (
              <FormField label="教师编号">
                <input
                  required
                  value={
                    teacherNumber
                  }
                  onChange={(event) =>
                    setTeacherNumber(
                      event.target
                        .value
                    )
                  }
                  placeholder="例如：T002"
                  className={
                    inputClassName
                  }
                />
              </FormField>
            )}

            <FormField label="密码">
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="至少6个字符"
                className={
                  inputClassName
                }
              />
            </FormField>

            <FormField label="确认密码">
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={
                  confirmPassword
                }
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="再次输入密码"
                className={
                  inputClassName
                }
              />
            </FormField>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-bold text-red-800">
                  注册失败
                </p>

                <p className="mt-1 text-sm leading-6 text-red-600">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                (role ===
                  "STUDENT" &&
                  teachers.length ===
                    0)
              }
              className="flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "正在注册..."
                : role ===
                    "STUDENT"
                  ? "注册学生账号"
                  : "注册教师账号"}

              {!loading && (
                <span className="ml-2">
                  →
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-500">
              已有账号？
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/login"
                )
              }
              className="mt-2 text-sm font-bold text-blue-700 transition hover:text-blue-800"
            >
              返回登录
            </button>
          </div>
        </div>
      </div>

      <ActionPopup
        open={showSuccess}
        title="注册成功"
        message={
          role === "STUDENT"
            ? "学生账号已创建，现在可以登录系统。"
            : "教师账号已创建，现在可以登录系统。"
        }
        onClose={() => {
          setShowSuccess(false);

          router.push("/login");
          router.refresh();
        }}
      />
    </>
  );
}

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100";

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      {children}
    </div>
  );
}