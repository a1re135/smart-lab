"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export default function UserManagement({
  users,
  currentUserId,
}: Props) {
  const router = useRouter();

  const [loadingId, setLoadingId] =
    useState<number | null>(null);

  async function changeStatus(
    userId: number,
    currentStatus: string
  ) {
    const nextStatus =
      currentStatus === "ACTIVE"
        ? "DISABLED"
        : "ACTIVE";

    const confirmed = window.confirm(
      nextStatus === "DISABLED"
        ? "确定要禁用这个账号吗？"
        : "确定要重新启用这个账号吗？"
    );

    if (!confirmed) {
      return;
    }

    setLoadingId(userId);

    try {
      const response = await fetch(
        `/api/admin/users/${userId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const raw = await response.text();

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
          data.error ?? "修改用户失败"
        );
        return;
      }

      router.refresh();
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
    <div className="space-y-4">
      {users.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500">
            暂无用户
          </p>
        </div>
      ) : (
        users.map((user) => (
          <div
            key={user.id}
            className="rounded-xl bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-900">
                    {user.name}
                  </h2>

                  <RoleBadge
                    role={user.role}
                  />

                  <StatusBadge
                    status={user.status}
                  />
                </div>

                <div className="mt-3 space-y-1 text-sm text-slate-500">
                  <p>
                    用户名：{user.username}
                  </p>

                  {user.role ===
                    "STUDENT" && (
                    <>
                      <p>
                        学号：
                        {user.studentNumber ??
                          "-"}
                      </p>

                      <p>
                        学生类型：
                        {getStudentLevel(
                          user.studentLevel
                        )}
                      </p>
                    </>
                  )}

                  {user.role ===
                    "TEACHER" && (
                    <p>
                      教师编号：
                      {user.teacherNumber ??
                        "-"}
                    </p>
                  )}
                </div>
              </div>

              {user.id === currentUserId ? (
                <span className="text-sm text-slate-400">
                  当前账号
                </span>
              ) : (
                <button
                  type="button"
                  disabled={
                    loadingId === user.id
                  }
                  onClick={() =>
                    changeStatus(
                      user.id,
                      user.status
                    )
                  }
                  className={
                    user.status ===
                    "ACTIVE"
                      ? "rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                      : "rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-100 disabled:opacity-50"
                  }
                >
                  {loadingId === user.id
                    ? "处理中..."
                    : user.status ===
                        "ACTIVE"
                      ? "禁用账号"
                      : "启用账号"}
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function RoleBadge({
  role,
}: {
  role: string;
}) {
  const text =
    role === "STUDENT"
      ? "学生"
      : role === "TEACHER"
        ? "教师"
        : "管理员";

  return (
    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
      {text}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className={
        status === "ACTIVE"
          ? "rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
          : "rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
      }
    >
      {status === "ACTIVE"
        ? "正常"
        : "已禁用"}
    </span>
  );
}

function getStudentLevel(
  level: string | null
) {
  if (!level) {
    return "-";
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