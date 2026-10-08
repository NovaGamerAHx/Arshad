import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { faNum } from "../lib/jalali";
import { IconStar, IconX } from "./Icons";

/* ---------------- Modal ---------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;
  /* پورتال روی body: اگر مودال داخل عنصری با translate/transform رندر شود
     (مثل کارت تسک با hover:-translate-y)، آن عنصر containing block برای
     fixed می‌شود و مودال به اندازه همان کارت کوچک می‌شود. */
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-[#0b1220]/55 backdrop-blur-[3px]" onClick={onClose} />
      <div
        className={`anim-scale relative w-full ${width} max-h-[88vh] overflow-auto rounded-2xl border border-line bg-surface shadow-2xl shadow-black/20`}
      >
        {title !== undefined && (
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface/95 px-5 py-4 backdrop-blur">
            <h3 className="font-display text-base font-bold text-ink">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-mut transition hover:bg-soft hover:text-ink"
              aria-label="بستن"
            >
              <IconX size={18} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

/* ---------------- Confirm ---------------- */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "حذف",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-sm">
      <p className="text-sm leading-7 text-mut">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-soft"
        >
          انصراف
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- Progress Ring ---------------- */
export function Ring({
  value,
  size = 76,
  stroke = 8,
  color = "var(--brand)",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(100, Math.max(0, value)) / 100);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--soft)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset .7s cubic-bezier(.22,.9,.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* ---------------- Progress Bar ---------------- */
export function Bar({ pct, color, h = 6, track = "var(--soft)" }: { pct: number; color: string; h?: number; track?: string }) {
  return (
    <div className="w-full overflow-hidden rounded-full" style={{ height: h, background: track }}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          background: color,
          transition: "width .7s cubic-bezier(.22,.9,.3,1)",
        }}
      />
    </div>
  );
}

/* ---------------- Empty State ---------------- */
export function EmptyState({ icon, title, desc, action }: { icon: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="anim-card flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-soft text-mut">{icon}</div>
      <div>
        <p className="font-display text-base font-bold text-ink">{title}</p>
        {desc && <p className="mt-1.5 max-w-xs text-sm leading-6 text-mut">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------- Field ---------------- */
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-[13px] font-semibold text-ink">
        {label}
        {hint && <span className="text-xs font-normal text-mut">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-mut/70 focus:border-brand focus:ring-2 focus:ring-brand/25";

/* ---------------- CountUp ---------------- */
export function CountUp({ value, duration = 750 }: { value: number; duration?: number }) {
  const [disp, setDisp] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    if (from === value) {
      setDisp(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setDisp(Math.round(from + (value - from) * e));
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      fromRef.current = value;
    };
  }, [value, duration]);
  return <>{faNum(disp)}</>;
}

/* ---------------- Stars (نمایشی) ---------------- */
export function Stars({ value, size = 13 }: { value: number | null; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = value !== null && n <= value;
        return <IconStar key={n} size={size} filled={on} style={{ color: on ? "#fbbf24" : "var(--line)" }} />;
      })}
    </span>
  );
}
