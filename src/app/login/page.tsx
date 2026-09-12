"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
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
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            username,
            password,
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
          "Login API returned:",
          raw
        );

        setError(
          `服务器错误 (${response.status})，请查看 VS Code 终端`
        );

        return;
      }

      if (!response.ok) {
        setError(
          data.error ?? "登录失败"
        );

        return;
      }

      if (
        data.role === "STUDENT"
      ) {
        router.push("/student");
      } else if (
        data.role === "TEACHER"
      ) {
        router.push("/teacher");
      } else if (
        data.role === "ADMIN"
      ) {
        router.push("/admin");
      } else {
        setError("用户角色无效");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error(
        "Login request failed:",
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
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950" />

      <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

      <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        {/* Left information */}
        <section className="hidden flex-col justify-between px-12 py-12 lg:flex xl:px-20">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold text-white ring-1 ring-white/20 backdrop-blur">
                实
              </div>

              <div>
                <p className="text-sm font-medium text-blue-200">
                  SMART LAB
                </p>

                <h1 className="text-xl font-bold text-white">
                  高校智能实验室预约管理系统
                </h1>
              </div>
            </div>
          </div>

          <div className="max-w-xl pb-16">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
              LABORATORY MANAGEMENT
            </p>

            <h2 className="mt-5 text-5xl font-bold leading-tight tracking-tight text-white">
              更高效地管理
              <br />
              实验室预约与使用
            </h2>

            <p className="mt-6 max-w-lg text-base leading-8 text-slate-300">
              为学生、教师和管理员提供统一的实验室预约、审核、签到、设备管理和数据分析服务。
            </p>

            <div className="mt-10 grid grid-cols-3 gap-4">
              <FeatureCard
                title="在线预约"
                description="快速提交实验室申请"
              />

              <FeatureCard
                title="审核流程"
                description="教师与管理员分级审核"
              />

              <FeatureCard
                title="数据统计"
                description="实时查看实验室使用情况"
              />
            </div>
          </div>

          <p className="text-xs text-slate-500">
            University Smart Laboratory Reservation System
          </p>
        </section>

        {/* Login area */}
        <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8 lg:bg-white/[0.03]">
          <div className="w-full max-w-md">
            {/* Mobile brand */}
            <div className="mb-8 text-center lg:hidden">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold text-white ring-1 ring-white/20">
                实
              </div>

              <h1 className="mt-4 text-xl font-bold text-white">
                高校智能实验室预约管理系统
              </h1>

              <p className="mt-2 text-sm text-blue-200">
                Smart Laboratory Reservation
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-2xl shadow-black/30 sm:p-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  SIGN IN
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  欢迎回来
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  使用您的系统账号登录。
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
              >
                {/* Username */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    用户名
                  </label>

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-sm font-bold text-slate-400">
                      U
                    </div>

                    <input
                      type="text"
                      required
                      autoComplete="username"
                      value={username}
                      onChange={(event) =>
                        setUsername(
                          event.target.value
                        )
                      }
                      placeholder="请输入用户名"
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    密码
                  </label>

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-sm font-bold text-slate-400">
                      P
                    </div>

                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      placeholder="请输入密码"
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 font-bold text-red-700">
                        !
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-red-800">
                          登录失败
                        </p>

                        <p className="mt-1 text-sm text-red-600">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "正在登录..."
                    : "登录系统"}

                  {!loading && (
                    <span className="ml-2">
                      →
                    </span>
                  )}
                </button>
              </form>

              {/* Demo accounts */}
              <div className="mt-8 border-t border-slate-100 pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  测试账号
                </p>

                <div className="mt-3 grid gap-2">
                  <DemoAccount
                    role="学生"
                    username="student01"
                    password="student123"
                    onSelect={() => {
                      setUsername(
                        "student01"
                      );

                      setPassword(
                        "student123"
                      );
                    }}
                  />

                  <DemoAccount
                    role="教师"
                    username="teacher01"
                    password="teacher123"
                    onSelect={() => {
                      setUsername(
                        "teacher01"
                      );

                      setPassword(
                        "teacher123"
                      );
                    }}
                  />

                  <DemoAccount
                    role="管理员"
                    username="admin"
                    password="admin123"
                    onSelect={() => {
                      setUsername(
                        "admin"
                      );

                      setPassword(
                        "admin123"
                      );
                    }}
                  />
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-400">
                  点击测试账号可自动填入登录信息。
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <div className="mb-3 h-1 w-8 rounded-full bg-blue-400" />

      <p className="font-semibold text-white">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        {description}
      </p>
    </div>
  );
}

function DemoAccount({
  role,
  username,
  password,
  onSelect,
}: {
  role: string;
  username: string;
  password: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
    >
      <div>
        <p className="text-xs font-bold text-blue-700">
          {role}
        </p>

        <p className="mt-0.5 text-sm font-semibold text-slate-700">
          {username}
        </p>
      </div>

      <span className="text-xs text-slate-400">
        {password}
      </span>
    </button>
  );
}