"use client";

import {
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import ActionPopup from "@/components/action-popup";

type User = {
  id: number;
  username: string;
  name: string;
  role: string;
  status: string;
  studentNumber: string | null;
  teacherNumber: string | null;
  studentLevel: string | null;
};

type Props = {
  users: User[];
  currentUserId: number;
};

type Filter =
  | "ALL"
  | "STUDENT"
  | "TEACHER"
  | "ADMIN";

export default function UserManagement({
  users,
  currentUserId,
}: Props) {
  const router = useRouter();

  const [filter, setFilter] =
    useState<Filter>("ALL");

  const [search, setSearch] =
    useState("");

  const [popup, setPopup] =
    useState({
        open: false,
        title: "",
        message: "",
    });

  const [
    loadingId,
    setLoadingId,
  ] = useState<number | null>(
    null
  );

  const filteredUsers =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return users.filter(
        (user) => {
          const roleMatches =
            filter === "ALL" ||
            user.role === filter;

          const searchMatches =
            !keyword ||
            user.name
              .toLowerCase()
              .includes(keyword) ||
            user.username
              .toLowerCase()
              .includes(keyword) ||
            user.studentNumber
              ?.toLowerCase()
              .includes(keyword) ||
            user.teacherNumber
              ?.toLowerCase()
              .includes(keyword);

          return (
            roleMatches &&
            searchMatches
          );
        }
      );
    }, [
      users,
      filter,
      search,
    ]);

  async function changeStatus(
    userId: number,
    currentStatus: string
  ) {
    const nextStatus =
      currentStatus === "ACTIVE"
        ? "DISABLED"
        : "ACTIVE";

    const confirmed =
      window.confirm(
        nextStatus ===
          "DISABLED"
          ? "确定要禁用这个账号吗？禁用后该用户将无法登录系统。"
          : "确定要重新启用这个账号吗？"
      );

    if (!confirmed) {
      return;
    }

    setLoadingId(userId);

    try {
      const response =
        await fetch(
          `/api/admin/users/${userId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              status:
                nextStatus,
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
        alert(
          `服务器错误 (${response.status})`
        );

        return;
      }

      if (!response.ok) {
        alert(
          data.error ??
            "修改用户状态失败"
        );

        return;
      }

      setPopup({
        open: true,

        title:
            nextStatus === "DISABLED"
            ? "账号已禁用"
            : "账号已启用",

        message:
            nextStatus === "DISABLED"
            ? "该用户现在无法登录系统。"
            : "该用户现在可以重新登录系统。",
        });
        setPopup({
            open: false,
            title: "",
            message: "",
        });
    } catch (error) {
      console.error(
        "Update user request failed:",
        error
      );

      alert("无法连接服务器");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <>
    <div>
      {/* Controls */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              USER DIRECTORY
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              用户列表
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              共 {users.length} 个用户账号
            </p>
          </div>

          <div className="w-full lg:max-w-sm">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
              搜索用户
            </label>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="姓名、用户名、学号或教师编号"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 flex flex-wrap gap-2">
          <FilterButton
            active={
              filter === "ALL"
            }
            onClick={() =>
              setFilter("ALL")
            }
            label="全部"
            count={users.length}
          />

          <FilterButton
            active={
              filter ===
              "STUDENT"
            }
            onClick={() =>
              setFilter("STUDENT")
            }
            label="学生"
            count={
              users.filter(
                (user) =>
                  user.role ===
                  "STUDENT"
              ).length
            }
          />

          <FilterButton
            active={
              filter ===
              "TEACHER"
            }
            onClick={() =>
              setFilter("TEACHER")
            }
            label="教师"
            count={
              users.filter(
                (user) =>
                  user.role ===
                  "TEACHER"
              ).length
            }
          />

          <FilterButton
            active={
              filter === "ADMIN"
            }
            onClick={() =>
              setFilter("ADMIN")
            }
            label="管理员"
            count={
              users.filter(
                (user) =>
                  user.role ===
                  "ADMIN"
              ).length
            }
          />
        </div>
      </div>

      {/* Results */}
      <div className="mt-6">
        {filteredUsers.length ===
        0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 font-bold text-slate-400">
              ?
            </div>

            <h3 className="mt-4 font-bold text-slate-800">
              没有找到用户
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              请尝试修改搜索关键词或筛选条件。
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {filteredUsers.map(
              (user) => (
                <article
                  key={user.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  {/* Top */}
                  <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/60 p-5">
                    <div className="flex items-start gap-4">
                      <UserAvatar
                        name={
                          user.name
                        }
                        role={
                          user.role
                        }
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-bold text-slate-900">
                            {
                              user.name
                            }
                          </h3>

                          <RoleBadge
                            role={
                              user.role
                            }
                          />

                          <UserStatusBadge
                            status={
                              user.status
                            }
                          />
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          @
                          {
                            user.username
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoBox
                        label="用户编号"
                        value={`#${user.id}`}
                      />

                      <InfoBox
                        label="账号状态"
                        value={
                          user.status ===
                          "ACTIVE"
                            ? "正常使用"
                            : "已禁用"
                        }
                      />

                      {user.role ===
                        "STUDENT" && (
                        <>
                          <InfoBox
                            label="学号"
                            value={
                              user.studentNumber ??
                              "-"
                            }
                          />

                          <InfoBox
                            label="学生类型"
                            value={getStudentLevel(
                              user.studentLevel
                            )}
                          />
                        </>
                      )}

                      {user.role ===
                        "TEACHER" && (
                        <InfoBox
                          label="教师编号"
                          value={
                            user.teacherNumber ??
                            "-"
                          }
                        />
                      )}

                      {user.role ===
                        "ADMIN" && (
                        <InfoBox
                          label="用户类型"
                          value="系统管理员"
                        />
                      )}
                    </div>

                    {/* Action */}
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      {user.id ===
                      currentUserId ? (
                        <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
                          <div>
                            <p className="text-sm font-bold text-blue-800">
                              当前登录账号
                            </p>

                            <p className="mt-0.5 text-xs text-blue-600">
                              为防止失去管理权限，不能禁用自己。
                            </p>
                          </div>

                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                            当前
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={
                            loadingId ===
                            user.id
                          }
                          onClick={() =>
                            changeStatus(
                              user.id,
                              user.status
                            )
                          }
                          className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            user.status ===
                            "ACTIVE"
                              ? "bg-red-50 text-red-700 hover:bg-red-100"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {loadingId ===
                          user.id
                            ? "处理中..."
                            : user.status ===
                                "ACTIVE"
                              ? "禁用账号"
                              : "启用账号"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </div>
    </div>
  <ActionPopup
    open={popup.open}
    title={popup.title}
    message={popup.message}
    onClose={() => {
      setPopup({
        open: false,
        title: "",
        message: "",
      });

      router.refresh();
    }}
    />
    </>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-slate-950 text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}

      <span
        className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
          active
            ? "bg-white/15 text-white"
            : "bg-white text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function UserAvatar({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  const style =
    role === "STUDENT"
      ? "bg-blue-100 text-blue-700"
      : role === "TEACHER"
        ? "bg-purple-100 text-purple-700"
        : "bg-slate-900 text-white";

  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${style}`}
    >
      {name.slice(0, 1)}
    </div>
  );
}

function RoleBadge({
  role,
}: {
  role: string;
}) {
  const label =
    role === "STUDENT"
      ? "学生"
      : role === "TEACHER"
        ? "教师"
        : "管理员";

  const style =
    role === "STUDENT"
      ? "bg-blue-100 text-blue-700"
      : role === "TEACHER"
        ? "bg-purple-100 text-purple-700"
        : "bg-slate-200 text-slate-700";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${style}`}
    >
      {label}
    </span>
  );
}

function UserStatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className={
        status === "ACTIVE"
          ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700"
          : "rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700"
      }
    >
      {status === "ACTIVE"
        ? "正常"
        : "已禁用"}
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

function getStudentLevel(
  level: string | null
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

  return "-";
}