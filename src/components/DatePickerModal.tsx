import { useState } from "react";
import { faNum, isoToJ, J_MONTHS, J_WEEKDAYS_MIN, jToISO, monthGridDays, todayISO } from "../lib/jalali";
import { Modal } from "./ui";
import { IconChevronL, IconChevronR } from "./Icons";

/** تقویم شمسی قابل انتخاب */
export function JalaliCalendar({
  value,
  onPick,
}: {
  value: string | null;
  onPick: (iso: string) => void;
}) {
  const today = todayISO();
  const initJ = value ? isoToJ(value) : isoToJ(today);
  const [view, setView] = useState({ jy: initJ.jy, jm: initJ.jm });
  const cells = monthGridDays(view.jy, view.jm);
  const todayJ = isoToJ(today);

  const shift = (d: number) => {
    let jm = view.jm + d;
    let jy = view.jy;
    if (jm < 1) { jm = 12; jy -= 1; }
    if (jm > 12) { jm = 1; jy += 1; }
    setView({ jy, jm });
  };

  return (
    <div className="no-select">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button onClick={() => shift(1)} className="rounded-lg p-1.5 text-mut transition hover:bg-soft hover:text-ink" aria-label="ماه بعد">
            <IconChevronR size={17} />
          </button>
          <button onClick={() => shift(-1)} className="rounded-lg p-1.5 text-mut transition hover:bg-soft hover:text-ink" aria-label="ماه قبل">
            <IconChevronL size={17} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={view.jm}
            onChange={(e) => setView((v) => ({ ...v, jm: Number(e.target.value) }))}
            className="rounded-lg border border-line bg-surface px-1.5 py-1 text-sm font-bold text-ink outline-none"
          >
            {J_MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={view.jy}
            onChange={(e) => setView((v) => ({ ...v, jy: Number(e.target.value) }))}
            className="rounded-lg border border-line bg-surface px-1.5 py-1 text-sm font-bold text-ink outline-none"
          >
            {Array.from({ length: 8 }, (_, i) => todayJ.jy - 3 + i).map((y) => (
              <option key={y} value={y}>{faNum(y)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {J_WEEKDAYS_MIN.map((w) => (
          <div key={w} className="pb-1 text-[11px] font-bold text-mut">{w}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const iso = jToISO(view.jy, view.jm, d);
          const isSel = value === iso;
          const isToday = today === iso;
          return (
            <button
              key={i}
              onClick={() => onPick(iso)}
              className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition active:scale-90 ${
                isSel
                  ? "bg-brand text-white shadow-md shadow-teal-600/30"
                  : isToday
                    ? "bg-soft text-brand ring-1 ring-brand/50"
                    : "text-ink hover:bg-soft"
              }`}
            >
              {faNum(d)}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setView({ jy: todayJ.jy, jm: todayJ.jm })}
        className="mt-3 w-full rounded-xl border border-dashed border-line py-2 text-xs font-bold text-mut transition hover:border-brand/50 hover:text-brand"
      >
        برو به امروز — {faNum(todayJ.jd)} {J_MONTHS[todayJ.jm - 1]}
      </button>
    </div>
  );
}

/** مودال انتخاب تاریخ شمسی */
export function DatePickerModal({
  open,
  onClose,
  value,
  onChange,
  title = "انتخاب تاریخ",
  allowClear = false,
}: {
  open: boolean;
  onClose: () => void;
  value: string | null;
  onChange: (iso: string | null) => void;
  title?: string;
  allowClear?: boolean;
}) {
  /* بدون لیسنر Escape تکراری: خود Modal (با استک مودال‌ها) این کار را می‌کند،
     تا با یک Escape فقط همین تقویم بسته شود نه مودال زیرین. */
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-xs">
      <JalaliCalendar
        value={value}
        onPick={(iso) => {
          onChange(iso);
          onClose();
        }}
      />
      {allowClear && value && (
        <button
          onClick={() => {
            onChange(null);
            onClose();
          }}
          className="mt-2 w-full rounded-xl bg-soft py-2 text-xs font-bold text-mut transition hover:text-rose-600"
        >
          حذف تاریخ (برنامه‌ریزی‌نشده)
        </button>
      )}
    </Modal>
  );
}
