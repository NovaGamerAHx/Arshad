import type { ComponentType } from "react";
import type { Route } from "../lib/types";
import { IconBack } from "../components/Icons";

export function PlaceholderPage({
  title,
  desc,
  icon: Icon,
  navigate,
}: {
  title: string;
  desc: string;
  icon: ComponentType<{ size?: number }>;
  navigate: (r: Route) => void;
}) {
  return (
    <div className="anim-page flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-dashed border-line bg-surface/70 p-10 text-center">
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand/10 text-brand">
          <Icon size={36} />
          <span className="absolute -left-1.5 -top-1.5 rounded-full bg-brand px-2 py-0.5 text-[10px] font-extrabold text-white shadow-md shadow-brand/30">
            به‌زودی
          </span>
        </div>
        <h1 className="font-display mt-5 text-2xl font-extrabold text-ink">{title}</h1>
        <p className="mt-2.5 text-sm font-semibold leading-7 text-mut">{desc}</p>
        <button
          onClick={() => navigate({ page: "dashboard" })}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink transition hover:border-brand/50 hover:text-brand active:scale-95"
        >
          <IconBack size={16} />
          بازگشت به داشبورد
        </button>
      </div>
    </div>
  );
}
