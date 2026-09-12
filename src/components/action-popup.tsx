"use client";

type PopupVariant =
  | "success"
  | "warning"
  | "error";

type Props = {
  open: boolean;
  title: string;
  message?: string;
  variant?: PopupVariant;
  onClose: () => void;
};

export default function ActionPopup({
  open,
  title,
  message,
  variant = "success",
  onClose,
}: Props) {
  if (!open) {
    return null;
  }

  const iconStyle =
    variant === "success"
      ? "bg-green-100 text-green-700"
      : variant === "warning"
        ? "bg-orange-100 text-orange-700"
        : "bg-red-100 text-red-700";

  const icon =
    variant === "success"
      ? "✓"
      : variant === "warning"
        ? "!"
        : "×";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-3xl border border-white/70 bg-white p-7 text-center shadow-2xl shadow-slate-950/20">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-xl font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          ×
        </button>

        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl font-bold ${iconStyle}`}
        >
          {icon}
        </div>

        <h2 className="mt-5 text-2xl font-bold text-slate-950">
          {title}
        </h2>

        {message && (
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {message}
          </p>
        )}

        <p className="mt-5 text-xs text-slate-400">
          点击右上角 × 关闭
        </p>
      </div>
    </div>
  );
}