"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Logout failed"
        );
      }

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      alert("退出登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleLogout}
      className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="hidden sm:inline">
        {loading
          ? "退出中..."
          : "退出登录"}
      </span>

      <span className="sm:hidden">
        {loading ? "..." : "退出"}
      </span>

      {!loading && (
        <span className="ml-2">
          →
        </span>
      )}
    </button>
  );
}