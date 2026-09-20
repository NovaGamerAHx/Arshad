import { useState } from "react";
import type { ColumnId, Subject, Task } from "../lib/types";
import { importanceMeta } from "../lib/types";
import { addDaysISO, faNum, formatJalaali, isoToJ, J_MONTHS, relativeDay, todayISO, type DayTone } from "../lib/jalali";
import { useStore } from "../store";
import { ConfirmModal } from "./ui";
import { DatePickerModal } from "./DatePickerModal";
import {
  IconCalendar, IconCheck, IconDots, IconDown, IconGrip, IconPencil,
  IconToday, IconTrash, IconUp, IconX,
} from "./Icons";

const toneStyle: Record<DayTone, { color: string; bg: string }> = {
  late: { color: "#f43f5e", bg: "rgba(244,63,94,.13)" },
  today: { color: "#0d9488", bg: "rgba(13,148,136,.13)" },
  tomorrow: { color: "#0284c7", bg: "rgba(2,132,199,.12)" },
  soon: { color: "#0284c7", bg: "rgba(2,132,199,.12)" },
  far: { color: "var(--mut)", bg: "var(--soft)" },
};

export function TaskCard({
  task,
  view,
  col,
  onEdit,
  canUp,
  canDown,
  onUp,
  onDown,
  isDragging,
}: {
  task: Task;
  view: "board" | "list";
  col: ColumnId;
  onEdit: (t: Task) => void;
  canUp?: boolean;
  canDown?: boolean;
  onUp?: () => void;
  onDown?: () => void;
  isDragging?: boolean;
}) {
  const { state, toggleDone, deleteTask, moveTask, planTask, toast } = useStore();
  const [menu, setMenu] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [picker, setPicker] = useState(false);

  const subjects = task.subjectIds
    .map((id) => state.subjects.find((s) => s.id === id))
    .filter(Boolean) as Subject[];
  const imp = importanceMeta(task.importance);
  const day: { text: string; tone: DayTone } | null =
    col === "done" && task.completedAt
      ? (() => {
          const { jd, jm } = isoToJ(task.completedAt);
          return { text: `انجام شد: ${faNum(jd)} ${J_MONTHS[jm - 1]}`, tone: "far" };
        })()
      : task.plannedDate
        ? relativeDay(task.plannedDate)
        : null;

  const items: { label: string; icon: (p: { size?: number }) => React.ReactNode; fn: () => void; danger?: boolean }[] = [];
  if (col !== "done") items.push({ label: "انجام شد", icon: IconCheck, fn: () => { moveTask(task.id, "done"); toast("به انجام‌شده منتقل شد"); } });
  if (col === "unplanned") {
    items.push({ label: "برای امروز", icon: IconToday, fn: () => { moveTask(task.id, "planned", todayISO()); toast("برای امروز برنامه‌ریزی شد"); } });
    items.push({ label: "برای فردا", icon: IconCalendar, fn: () => { moveTask(task.id, "planned", addDaysISO(todayISO(), 1)); toast("برای فردا برنامه‌ریزی شد"); } });
  }
  if (col === "planned") {
    items.push({ label: "تغییر تاریخ…", icon: IconCalendar, fn: () => setPicker(true) });
    items.push({ label: "حذف تاریخ", icon: IconX, fn: () => { planTask(task.id, null); toast("به برنامه‌ریزی‌نشده منتقل شد"); } });
  }
  if (col === "done") {
    items.push({ label: "برگشت به برنامه‌ریزی‌شده", icon: IconCalendar, fn: () => moveTask(task.id, "planned") });
    items.push({ label: "برگشت به بک‌لاگ", icon: IconX, fn: () => moveTask(task.id, "unplanned") });
  }
  items.push({ label: "ویرایش", icon: IconPencil, fn: () => onEdit(task) });
  items.push({ label: "حذف", icon: IconTrash, fn: () => setConfirmDel(true), danger: true });

  return (
    <div
      className={`group relative rounded-xl border bg-surface transition-all duration-200 ${
        task.done ? "border-line opacity-75" : "border-line hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/[.06]"
      } ${isDragging ? "scale-[.98] opacity-40" : ""} ${view === "board" ? "p-3" : "p-4"}`}
    >
      <div className="flex items-start gap-2.5">
        {view === "board" && (
          <span className="mt-1.5 hidden cursor-grab text-mut/40 group-hover:block">
            <IconGrip size={15} />
          </span>
        )}

        <button
          onClick={() => {
            toggleDone(task.id);
            toast(task.done ? "تسک به لیست برگشت" : "آفرین! انجام شد");
          }}
          aria-label="تکمیل تسک"
          className={`mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-2 transition-all active:scale-90 ${
            task.done
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-mut/50 bg-surface hover:border-emerald-500"
          }`}
        >
          {task.done && (
            <span className="anim-pop">
              <IconCheck size={11} strokeWidth={3} />
            </span>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className={`text-sm font-bold leading-6 ${task.done ? "text-mut line-through" : "text-ink"}`}>
            {task.title}
          </p>
          {task.description && (
            <p className="mt-0.5 text-xs leading-5 text-mut line-clamp-2">{task.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {subjects.slice(0, 2).map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
                style={{ background: `${s.color}18`, color: s.color }}
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                {s.short}
              </span>
            ))}
            {subjects.length > 2 && (
              <span className="text-[11px] font-bold text-mut">+{faNum(subjects.length - 2)}</span>
            )}
            <span
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
              style={{ background: `${imp.hex}16`, color: imp.hex }}
            >
              {imp.label}
            </span>
            {!task.plannedDate && !task.done && (
              <button
                onClick={() => setPicker(true)}
                className="inline-flex items-center gap-1 rounded-md border border-dashed border-line px-1.5 py-0.5 text-[11px] font-bold text-mut transition hover:border-brand/60 hover:bg-brand/5 hover:text-brand"
              >
                <IconCalendar size={11} />
                تعیین تاریخ
              </button>
            )}
            {day && (
              <button
                onClick={() => setPicker(true)}
                title={task.plannedDate ? formatJalaali(task.plannedDate, true) : undefined}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold transition hover:opacity-75"
                style={{ background: toneStyle[day.tone].bg, color: toneStyle[day.tone].color }}
              >
                {day.tone === "today" && <span className="anim-pulse-soft inline-block h-1.5 w-1.5 rounded-full bg-current" />}
                {day.tone !== "today" && <IconCalendar size={11} />}
                {day.text}
              </button>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="relative">
            <button
              onClick={() => setMenu((m) => !m)}
              aria-label="گزینه‌ها"
              className={`rounded-lg p-1 text-mut transition hover:bg-soft hover:text-ink ${menu ? "bg-soft text-ink" : ""}`}
            >
              <IconDots size={16} />
            </button>
            {menu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenu(false)} />
                <div className="anim-scale absolute left-0 top-8 z-30 w-48 rounded-xl border border-line bg-surface p-1.5 shadow-xl shadow-black/10">
                  {items.map((it) => (
                    <button
                      key={it.label}
                      onClick={() => {
                        setMenu(false);
                        it.fn();
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition ${
                        it.danger ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40" : "text-ink hover:bg-soft"
                      }`}
                    >
                      <it.icon size={15} />
                      {it.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {view === "board" && (
            <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                disabled={!canUp}
                onClick={onUp}
                aria-label="بالا"
                className="rounded-md bg-soft p-1 text-mut transition hover:text-brand disabled:opacity-30"
              >
                <IconUp size={12} />
              </button>
              <button
                disabled={!canDown}
                onClick={onDown}
                aria-label="پایین"
                className="rounded-md bg-soft p-1 text-mut transition hover:text-brand disabled:opacity-30"
              >
                <IconDown size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        title="حذف تسک"
        message={<>آیا از حذف «{task.title}» مطمئن هستی؟ این عمل قابل بازگشت نیست.</>}
        onConfirm={() => {
          deleteTask(task.id);
          toast("تسک حذف شد", "warn");
        }}
      />
      <DatePickerModal
        open={picker}
        onClose={() => setPicker(false)}
        value={task.plannedDate}
        onChange={(d) => {
          planTask(task.id, d);
          if (d) toast(`برای ${relativeDay(d).text} برنامه‌ریزی شد`);
        }}
        allowClear
      />
    </div>
  );
}
