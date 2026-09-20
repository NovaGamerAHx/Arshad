import { useEffect, useState } from "react";
import type { Importance, Task } from "../lib/types";
import { IMPORTANCES } from "../lib/types";
import { addDaysISO, todayISO } from "../lib/jalali";
import { useStore } from "../store";
import { Field, inputCls, Modal } from "./ui";
import { DatePickerModal } from "./DatePickerModal";
import { IconCalendar } from "./Icons";

export function TaskModal({
  open,
  onClose,
  task = null,
  presetSubjectId,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  /** در بک‌لاگ درس، درس از قبل مشخص است */
  presetSubjectId?: string;
  /** تاریخ پیش‌فرض برای تسک جدید */
  defaultDate?: string | null;
}) {
  const { state, addTask, updateTask, toast } = useStore();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [importance, setImportance] = useState<Importance>("medium");
  const [date, setDate] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setDesc(task?.description ?? "");
    setSubjectIds(task?.subjectIds ?? (presetSubjectId ? [presetSubjectId] : []));
    setImportance(task?.importance ?? "medium");
    setDate(task ? task.plannedDate : defaultDate ?? null);
    setErr(null);
    setPicker(false);
  }, [open, task, presetSubjectId, defaultDate]);

  const presetSubject = presetSubjectId ? state.subjects.find((s) => s.id === presetSubjectId) : null;

  const toggleSubject = (id: string) =>
    setSubjectIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const save = () => {
    const t = title.trim();
    if (!t) { setErr("عنوان تسک را بنویس."); return; }
    const ids = presetSubjectId ? [presetSubjectId] : subjectIds;
    if (ids.length === 0) { setErr("حداقل یک درس برای تسک انتخاب کن."); return; }
    if (task) {
      updateTask(task.id, { title: t, description: desc.trim(), subjectIds: ids, importance, plannedDate: date });
      toast("تسک ویرایش شد");
    } else {
      addTask({ title: t, description: desc.trim(), subjectIds: ids, importance, plannedDate: date });
      toast("تسک ساخته شد");
    }
    onClose();
  };

  const quickDates: { label: string; iso: string | null }[] = [
    { label: "بدون تاریخ", iso: null },
    { label: "امروز", iso: todayISO() },
    { label: "فردا", iso: addDaysISO(todayISO(), 1) },
    { label: "پس‌فردا", iso: addDaysISO(todayISO(), 2) },
  ];

  return (
    <>
      <Modal open={open} onClose={onClose} title={task ? "ویرایش تسک" : "تسک جدید"}>
        <div className="flex flex-col gap-4">
          <Field label="عنوان تسک">
            <input
              autoFocus
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErr(null); }}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder="مثلاً: حل ۲۰ تست فصل گراف"
              className={inputCls}
            />
          </Field>

          <Field label="توضیحات" hint="اختیاری">
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              placeholder="جزئیات، منابع، صفحه‌ها…"
              className={`${inputCls} resize-none`}
            />
          </Field>

          <Field label="درس‌ها" hint={presetSubject ? undefined : "یک یا چند درس"}>
            {presetSubject ? (
              <div
                className="inline-flex w-fit items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold"
                style={{ background: `${presetSubject.color}15`, color: presetSubject.color }}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: presetSubject.color }} />
                {presetSubject.name}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {state.subjects.map((s) => {
                  const active = subjectIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => { toggleSubject(s.id); setErr(null); }}
                      className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-[13px] font-semibold transition active:scale-[.97] ${
                        active ? "border-transparent shadow-sm" : "border-line text-mut hover:border-mut/50 hover:text-ink"
                      }`}
                      style={active ? { background: `${s.color}18`, color: s.color } : undefined}
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: active ? s.color : "var(--line)" }} />
                      <span className="truncate">{s.short}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Field>

          <Field label="درجه اهمیت">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {IMPORTANCES.map((i) => {
                const active = importance === i.id;
                return (
                  <button
                    key={i.id}
                    onClick={() => setImportance(i.id)}
                    className={`rounded-xl border px-2 py-2 text-[13px] font-bold transition active:scale-[.97] ${
                      active ? "border-transparent shadow-sm" : "border-line text-mut hover:text-ink"
                    }`}
                    style={active ? { background: `${i.hex}18`, color: i.hex } : undefined}
                  >
                    {i.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="برنامه‌ریزی برای روز">
            <div className="flex flex-wrap items-center gap-1.5">
              {quickDates.map((q) => {
                const active = date === q.iso;
                return (
                  <button
                    key={q.label}
                    onClick={() => setDate(q.iso)}
                    className={`rounded-xl border px-3 py-2 text-[13px] font-bold transition active:scale-[.97] ${
                      active
                        ? "border-brand/60 bg-brand/10 text-brand"
                        : "border-line text-mut hover:border-mut/50 hover:text-ink"
                    }`}
                  >
                    {q.label}
                  </button>
                );
              })}
              <button
                onClick={() => setPicker(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-brand/50 px-3 py-2 text-[13px] font-bold text-brand transition hover:bg-brand/5 active:scale-[.97]"
              >
                <IconCalendar size={15} />
                تقویم…
              </button>
            </div>
          </Field>

          {err && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] font-bold text-rose-600 dark:bg-rose-950/40">
              {err}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="rounded-xl border border-line px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-soft">
              انصراف
            </button>
            <button
              onClick={save}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/25 transition hover:brightness-110 active:scale-95"
            >
              {task ? "ذخیره تغییرات" : "افزودن تسک"}
            </button>
          </div>
        </div>
      </Modal>
      <DatePickerModal open={picker} onClose={() => setPicker(false)} value={date} onChange={setDate} allowClear />
    </>
  );
}
