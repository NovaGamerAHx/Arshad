import { useEffect, useState } from "react";
import type { Subject, Task } from "../lib/types";
import {
  addDaysISO, faNum, fmtDuration, formatJalaali, neutralDayLabel, relativeDay, todayISO,
} from "../lib/jalali";
import { useStore } from "../store";
import { Bar, EmptyState, Modal, Stars } from "../components/ui";
import { TaskCard } from "../components/TaskCard";
import { TaskModal } from "../components/TaskModal";
import { DatePickerModal } from "../components/DatePickerModal";
import {
  IconCalendar, IconCheck, IconChevronDown, IconChevronL, IconChevronR,
  IconClock, IconInbox, IconPlus, IconStar,
} from "../components/Icons";

const SCORE_LABELS = ["امتیازی ثبت نشده", "ضعیف", "معمولی", "خوب", "عالی", "فوق‌العاده"];

export function TodayPage({ initialDate }: { initialDate?: string }) {
  const { state, toggleDone, moveTask, planTask, addStudy, setDayScore, toast } = useStore();
  const [viewDate, setViewDate] = useState(initialDate ?? todayISO());

  useEffect(() => {
    if (initialDate) setViewDate(initialDate);
  }, [initialDate]);
  const [taskModal, setTaskModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [fromBacklog, setFromBacklog] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [picker, setPicker] = useState(false);

  const today = todayISO();
  const isToday = viewDate === today;
  const pending = state.tasks.filter((t) => !t.done && t.plannedDate === viewDate);
  const doneDay = state.tasks.filter((t) => t.done && t.completedAt === viewDate);
  const overdue = isToday
    ? state.tasks.filter((t) => !t.done && t.plannedDate !== null && t.plannedDate < today)
    : [];
  const backlogFree = state.tasks.filter((t) => !t.done && t.plannedDate === null);
  const log = state.dayLogs[viewDate] ?? { minutes: 0, score: null };

  const total = pending.length + doneDay.length;
  const pct = total ? Math.round((doneDay.length / total) * 100) : 0;
  const dayLabel = neutralDayLabel(viewDate);

  return (
    <div className="flex flex-col gap-5">
      {/* سربرگ + ناوبری روز */}
      <div className="anim-page flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wide text-brand">برنامه روزانه</p>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="font-display text-3xl font-extrabold text-ink">
              {isToday ? "امروز" : formatJalaali(viewDate)}
            </h1>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
                isToday ? "bg-brand/12 text-brand" : "bg-soft text-mut"
              }`}
            >
              {dayLabel}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-mut">{formatJalaali(viewDate, true)}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11px] font-extrabold text-mut">
              <IconClock size={13} className="text-brand" />
              {log.minutes ? fmtDuration(log.minutes) : "مطالعه ثبت‌نشده"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11px] font-extrabold text-mut">
              <Stars value={log.score} size={12} />
              {SCORE_LABELS[log.score ?? 0]}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11px] font-extrabold text-mut">
              <IconCheck size={13} className="text-emerald-500" />
              {faNum(doneDay.length)} انجام از {faNum(total)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* ناوبری تاریخ */}
          <div className="flex items-center gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-sm">
            <button
              onClick={() => setViewDate(addDaysISO(viewDate, -1))}
              title="روز قبل"
              className="rounded-xl p-2 text-mut transition hover:bg-soft hover:text-ink active:scale-90"
            >
              <IconChevronR size={17} />
            </button>
            <button
              onClick={() => setViewDate(today)}
              disabled={isToday}
              className={`rounded-xl px-3.5 py-2 text-[13px] font-extrabold transition active:scale-95 ${
                isToday ? "cursor-default bg-brand/10 text-brand" : "text-mut hover:bg-soft hover:text-brand"
              }`}
            >
              امروز
            </button>
            <button
              onClick={() => setViewDate(addDaysISO(viewDate, 1))}
              title="روز بعد"
              className="rounded-xl p-2 text-mut transition hover:bg-soft hover:text-ink active:scale-90"
            >
              <IconChevronL size={17} />
            </button>
            <span className="mx-0.5 h-6 w-px bg-line" />
            <button
              onClick={() => setPicker(true)}
              title="رفتن به تاریخ دلخواه"
              className="rounded-xl p-2 text-mut transition hover:bg-brand/10 hover:text-brand active:scale-90"
            >
              <IconCalendar size={17} />
            </button>
          </div>

          <button
            onClick={() => setFromBacklog(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink transition hover:border-brand/50 hover:text-brand active:scale-95"
          >
            <IconInbox size={17} />
            از بک‌لاگ
          </button>
          <button
            onClick={() => setTaskModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:brightness-110 active:scale-95"
          >
            <IconPlus size={17} />
            تسک جدید
          </button>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_330px]">
        {/* ستون اصلی */}
        <div className="flex flex-col gap-5">
          {/* نوار پیشرفت روز */}
          <div className="anim-card rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-ink">
                {total === 0
                  ? `برای ${dayLabel} تسکی نداری`
                  : pct === 100
                    ? "همه تسک‌های این روز انجام شد — عالی!"
                    : `${faNum(doneDay.length)} از ${faNum(total)} تسک ${isToday ? "امروز" : "این روز"} انجام شده`}
              </span>
              <span className="font-display text-base font-extrabold text-brand">{faNum(pct)}٪</span>
            </div>
            <div className="mt-2.5">
              <Bar pct={pct} color="#0d9488" h={9} />
            </div>
          </div>

          {/* عقب‌افتاده‌ها — فقط در امروز */}
          {overdue.length > 0 && (
            <div className="anim-card rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/60 dark:bg-rose-950/25">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600">
                    <IconCalendar size={15} />
                  </span>
                  <p className="text-sm font-extrabold text-rose-700 dark:text-rose-300">
                    {faNum(overdue.length)} تسک عقب‌افتاده از روزهای قبل
                  </p>
                </div>
                <button
                  onClick={() => {
                    overdue.forEach((t) => planTask(t.id, today));
                    toast("همه به امروز منتقل شدند");
                  }}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700 active:scale-95"
                >
                  انتقال همه به امروز
                </button>
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                {overdue.map((t) => {
                  const day = relativeDay(t.plannedDate as string);
                  return (
                    <div key={t.id} className="flex items-center gap-2.5 rounded-xl bg-surface/80 px-3 py-2">
                      <span className="flex-1 truncate text-[13px] font-semibold text-ink">{t.title}</span>
                      <span className="rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[11px] font-bold text-rose-600">{day.text}</span>
                      <button
                        onClick={() => { planTask(t.id, today); toast("به امروز منتقل شد"); }}
                        className="rounded-lg border border-rose-200 px-2.5 py-1 text-[11px] font-bold text-rose-600 transition hover:bg-rose-600 hover:text-white dark:border-rose-800"
                      >
                        به امروز
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* تسک‌های روز */}
          <section>
            <h2 className="font-display mb-2.5 text-sm font-bold text-ink">
              {isToday ? "تسک‌های امروز" : `تسک‌های ${dayLabel}`}
              {pending.length > 0 && (
                <span className="mr-2 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-bold text-brand">{faNum(pending.length)}</span>
              )}
            </h2>
            {pending.length === 0 ? (
              <EmptyState
                icon={<IconCheck size={26} />}
                title={doneDay.length ? "کارهای این روز تمام شده" : "برای این روز برنامه‌ای نیست"}
                desc={
                  isToday
                    ? "تسکی از بک‌لاگ اضافه کن یا همین‌جا تسک جدید بساز؛ خودکار در بورد «برنامه‌ریزی‌شده» هم قرار می‌گیرد."
                    : "حتی برای روزهای قبل یا بعد هم می‌توانی تسک ثبت کنی و ساعت مطالعه‌ات را بنویسی."
                }
                action={
                  <div className="flex gap-2">
                    <button onClick={() => setFromBacklog(true)} className="rounded-xl border border-line bg-surface px-4 py-2 text-[13px] font-bold text-ink transition hover:border-brand/50 hover:text-brand">
                      از بک‌لاگ
                    </button>
                    <button onClick={() => setTaskModal(true)} className="rounded-xl bg-brand px-4 py-2 text-[13px] font-bold text-white shadow-md shadow-brand/25 transition hover:brightness-110">
                      تسک جدید
                    </button>
                  </div>
                }
              />
            ) : (
              <div className="flex flex-col gap-2.5">
                {pending.map((t, i) => (
                  <div key={t.id} className="anim-card" style={{ animationDelay: `${i * 40}ms` }}>
                    <TaskCard task={t} view="list" col="planned" onEdit={setEditing} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* انجام‌شده‌های روز */}
          {doneDay.length > 0 && (
            <section>
              <button onClick={() => setShowDone((v) => !v)} className="mb-2.5 flex items-center gap-2 text-sm font-bold text-mut transition hover:text-ink">
                <IconCheck size={16} className="text-emerald-500" />
                انجام‌شده‌های {isToday ? "امروز" : "این روز"} ({faNum(doneDay.length)})
                <IconChevronDown size={15} className={`transition-transform ${showDone ? "rotate-180" : ""}`} />
              </button>
              {showDone && (
                <div className="flex flex-col gap-1.5">
                  {doneDay.map((t) => (
                    <div key={t.id} className="anim-card flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5">
                      <span className="flex h-[17px] w-[17px] items-center justify-center rounded-full bg-emerald-500 text-white">
                        <IconCheck size={10} strokeWidth={3} />
                      </span>
                      <span className="flex-1 truncate text-[13px] font-semibold text-mut line-through">{t.title}</span>
                      <button onClick={() => toggleDone(t.id)} className="rounded-lg border border-line px-2.5 py-1 text-[11px] font-bold text-mut transition hover:border-rose-300 hover:text-rose-600">
                        برگردان
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* گزارش روز */}
        <aside className="anim-card flex flex-col gap-4 lg:sticky lg:top-6" style={{ animationDelay: "100ms" }}>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="font-display text-sm font-bold text-ink">گزارش روز</h2>
              <span className="rounded-lg bg-soft px-2 py-1 text-[11px] font-bold text-mut">{dayLabel}</span>
            </div>

            <div className="p-4">
              {/* ساعت مطالعه */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-700 via-teal-800 to-teal-950 p-4 text-white">
                <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-white/[.07]" />
                <div className="relative">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-teal-100">
                    <IconClock size={14} />
                    مجموع مطالعه این روز
                  </p>
                  <p className="font-display mt-2 text-[26px] font-extrabold leading-8">
                    {log.minutes ? fmtDuration(log.minutes) : "هنوز ثبت نشده"}
                  </p>
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {[
                      { label: "۱۵ دقیقه", v: 15 },
                      { label: "۳۰ دقیقه", v: 30 },
                      { label: "۱ ساعت", v: 60 },
                    ].map((b) => (
                      <button
                        key={b.v}
                        onClick={() => addStudy(viewDate, b.v)}
                        className="rounded-lg bg-white/15 px-2.5 py-1.5 text-[11.5px] font-extrabold backdrop-blur transition hover:bg-white/25 active:scale-90"
                      >
                        + {b.label}
                      </button>
                    ))}
                    {log.minutes > 0 && (
                      <button
                        onClick={() => addStudy(viewDate, -15)}
                        className="rounded-lg bg-black/20 px-2.5 py-1.5 text-[11.5px] font-extrabold transition hover:bg-black/35 active:scale-90"
                      >
                        − ۱۵ دقیقه
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* امتیاز روز */}
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-ink">امتیاز این روز</span>
                  <span className={`text-[11px] font-bold ${log.score ? "text-amber-500" : "text-mut"}`}>
                    {SCORE_LABELS[log.score ?? 0]}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between rounded-xl bg-soft px-3 py-2.5">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = (log.score ?? 0) >= n;
                    return (
                      <button
                        key={n}
                        onClick={() => {
                          if (log.score === n) {
                            setDayScore(viewDate, null);
                            toast("امتیاز روز پاک شد", "warn");
                          } else {
                            setDayScore(viewDate, n);
                            toast(`امتیاز روز: ${SCORE_LABELS[n]}`);
                          }
                        }}
                        aria-label={`امتیاز ${faNum(n)}`}
                        className="transition-transform hover:scale-125 active:scale-90"
                      >
                        <span key={`${n}-${active}`} className={`inline-flex ${active ? "anim-pop" : ""}`}>
                          <IconStar size={27} filled={active} style={{ color: active ? "#fbbf24" : "var(--line)" }} />
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-center text-[10.5px] font-semibold text-mut">
                  روی ستاره‌ها کلیک کن؛ با کلیک دوباره روی ستاره آخر، امتیاز پاک می‌شود
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-line bg-surface/60 p-4 text-[11.5px] font-semibold leading-6 text-mut">
            ساعت مطالعه و امتیاز هر روز ذخیره می‌شود و در «گزارش‌ها» نمودار هفتگی‌اش را می‌بینی.
          </div>
        </aside>
      </div>

      <TaskModal open={taskModal} onClose={() => setTaskModal(false)} defaultDate={viewDate} />
      <TaskModal open={editing !== null} onClose={() => setEditing(null)} task={editing} />

      {/* افزودن از بک‌لاگ */}
      <Modal open={fromBacklog} onClose={() => setFromBacklog(false)} title={`افزودن به ${dayLabel} از بک‌لاگ`}>
        {backlogFree.length === 0 ? (
          <p className="py-6 text-center text-sm font-semibold text-mut">همه تسک‌های باز، برنامه‌ریزی شده‌اند.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {backlogFree.map((t) => {
              const subs = t.subjectIds.map((id) => state.subjects.find((s) => s.id === id)).filter(Boolean) as Subject[];
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    moveTask(t.id, "planned", viewDate);
                    toast(`به ${dayLabel} اضافه شد`);
                  }}
                  className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-2.5 text-start transition hover:border-brand/50 hover:bg-brand/[.04] active:scale-[.99]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <IconPlus size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold text-ink">{t.title}</span>
                    <span className="mt-0.5 flex items-center gap-1.5">
                      {subs.map((s) => (
                        <span key={s.id} className="inline-flex items-center gap-1 text-[10px] font-bold" style={{ color: s.color }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                          {s.short}
                        </span>
                      ))}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Modal>

      <DatePickerModal
        open={picker}
        onClose={() => setPicker(false)}
        value={viewDate}
        onChange={(d) => d && setViewDate(d)}
        title="رفتن به تاریخ دلخواه"
      />
    </div>
  );
}
