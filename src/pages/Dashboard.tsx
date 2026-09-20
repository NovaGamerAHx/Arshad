import { useState } from "react";
import type { Route } from "../lib/types";
import { addDaysISO, diffDays, faNum, fmtDuration, formatJalaali, isoToJ, J_WEEKDAYS_MIN, todayISO, weekdayIdx } from "../lib/jalali";
import { avgMastery, streakOf, subjectProgress, taskProgress, useStore } from "../store";
import { Bar, CountUp, Ring, Stars } from "../components/ui";
import { DatePickerModal } from "../components/DatePickerModal";
import { IconCap, IconCheck, IconChevronL, IconClock, IconFlame, IconInbox, IconPencil, IconPlus, IconStar, IconTarget } from "../components/Icons";

/** نوار ۷ روز اخیر با میزان مطالعه — کلیک هر روز به صفحه همان روز می‌برد */
function WeeklyStrip({ today, navigate }: { today: string; navigate: (r: Route) => void }) {
  const { state } = useStore();
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(today, -(6 - i)));
  const maxM = Math.max(60, ...days.map((iso) => state.dayLogs[iso]?.minutes ?? 0));
  const weekStudy = days.reduce((a, iso) => a + (state.dayLogs[iso]?.minutes ?? 0), 0);
  const weekDone = state.tasks.filter((t) => t.completedAt && days.includes(t.completedAt)).length;

  return (
    <section className="anim-card rounded-2xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold text-ink">هفته جاری</h2>
        <span className="text-[11px] font-bold text-mut">
          {weekStudy ? fmtDuration(weekStudy) : "بدون مطالعه"} • {faNum(weekDone)} تسک انجام‌شده — روی هر روز کلیک کن
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((iso, i) => {
          const minutes = state.dayLogs[iso]?.minutes ?? 0;
          const done = state.tasks.filter((t) => t.completedAt === iso).length;
          const score = state.dayLogs[iso]?.score ?? null;
          const isT = iso === today;
          const h = minutes ? 10 + Math.round((minutes / maxM) * 26) : 4;
          return (
            <button
              key={iso}
              onClick={() => navigate({ page: "today", date: iso })}
              title={`${formatJalaali(iso)} — ${minutes ? fmtDuration(minutes) : "بدون مطالعه"}${done ? ` • ${faNum(done)} تسک` : ""}${score ? ` • امتیاز ${faNum(score)}` : ""}`}
              className={`group flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/[.06] ${
                isT ? "border-brand/50 bg-brand/[.05]" : "border-line hover:border-brand/30"
              }`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className={`text-[10px] font-extrabold ${isT ? "text-brand" : "text-mut"}`}>{J_WEEKDAYS_MIN[weekdayIdx(iso)]}</span>
              <span className="flex h-9 w-full items-end justify-center">
                <span
                  className="w-2.5 rounded-full transition-all duration-500 group-hover:brightness-110"
                  style={{ height: h, background: minutes ? "#f59e0b" : "var(--line)" }}
                />
              </span>
              <span className={`font-display text-[12px] font-bold ${isT ? "text-brand" : "text-ink"}`}>{faNum(isoToJ(iso).jd)}</span>
              {score !== null ? <IconStar size={9} filled className="text-amber-400" /> : <span className="h-[9px]" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function DashboardPage({ navigate }: { navigate: (r: Route) => void }) {
  const { state, toggleDone, setExamDate, toast } = useStore();
  const [picker, setPicker] = useState(false);

  const today = todayISO();
  const tp = taskProgress(state.tasks);
  const mastery = avgMastery(state.subjects);
  const streak = streakOf(state.tasks);
  const daysLeft = diffDays(state.settings.examDate, today);
  const todaysPending = state.tasks.filter((t) => !t.done && t.plannedDate === today);
  const todaysDone = state.tasks.filter((t) => t.done && t.completedAt === today);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "صبح بخیر" : hour < 17 ? "ظهر بخیر" : hour < 21 ? "عصر بخیر" : "شب بخیر";

  return (
    <div className="flex flex-col gap-6">
      {/* سربرگ */}
      <div className="anim-page flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wide text-brand">{greet}، خسته نباشی</p>
          <h1 className="font-display mt-1 text-3xl font-extrabold text-ink">داشبورد</h1>
          <p className="mt-1.5 text-sm font-semibold text-mut">{formatJalaali(today, true)}</p>
        </div>
        <button
          onClick={() => navigate({ page: "backlog", backlogTab: "list" })}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:brightness-110 active:scale-95"
        >
          <IconPlus size={17} />
          تسک جدید
        </button>
      </div>

      {/* ردیف آمار */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* پیشرفت کلی */}
        <div className="anim-card flex items-center gap-5 rounded-2xl border border-line bg-surface p-5">
          <Ring value={tp.pct} size={96} stroke={10}>
            <span className="font-display text-xl font-extrabold text-ink"><CountUp value={tp.pct} />٪</span>
            <span className="text-[10px] font-bold text-mut">پیشرفت</span>
          </Ring>
          <div className="grid flex-1 grid-cols-2 gap-2">
            {[
              { icon: IconInbox, label: "کل تسک‌ها", val: faNum(tp.total), color: "#0284c7", go: () => navigate({ page: "backlog", backlogTab: "list" }) },
              { icon: IconCheck, label: "انجام‌شده", val: faNum(tp.done), color: "#10b981", go: () => navigate({ page: "backlog", backlogTab: "board" }) },
              { icon: IconTarget, label: "میانگین تسلط", val: `${faNum(mastery)}٪`, color: "#8b5cf6", go: () => navigate({ page: "subjects" }) },
              { icon: IconFlame, label: "روز پیاپی", val: faNum(streak), color: "#ea580c", go: () => navigate({ page: "reports" }) },
            ].map((s) => (
              <button
                key={s.label}
                onClick={s.go}
                title={`${s.label} — کلیک کن`}
                className="rounded-xl bg-soft px-3 py-2.5 text-start transition-all hover:-translate-y-0.5 hover:bg-line/60 active:scale-95"
              >
                <div className="flex items-center gap-1.5" style={{ color: s.color }}>
                  <s.icon size={14} />
                  <span className="text-[10px] font-bold text-mut">{s.label}</span>
                </div>
                <p className="font-display mt-0.5 text-lg font-extrabold leading-6 text-ink">{s.val}</p>
              </button>
            ))}
          </div>
        </div>

        {/* شمارش معکوس */}
        <div className="anim-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-700 via-teal-800 to-teal-950 p-5 text-white shadow-xl shadow-teal-900/25" style={{ animationDelay: "60ms" }}>
          <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-white/[.07]" />
          <div className="absolute -bottom-14 -right-6 h-40 w-40 rounded-full bg-black/[.12]" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-100">
                <IconCap size={15} />
                شمارش معکوس کنکور
              </span>
              <button
                onClick={() => setPicker(true)}
                className="rounded-lg bg-white/15 p-1.5 text-teal-50 transition hover:bg-white/25 active:scale-90"
                title="تغییر تاریخ کنکور"
              >
                <IconPencil size={13} />
              </button>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-lalezar text-[56px] font-normal leading-none tracking-tight">
                <CountUp value={daysLeft >= 0 ? daysLeft : 0} duration={900} />
              </span>
              <span className="text-sm font-bold text-teal-100">{daysLeft >= 0 ? "روز مانده" : "برگزار شد"}</span>
            </div>
            <p className="mt-2.5 text-xs font-semibold text-teal-200">
              کارشناسی ارشد مهندسی کامپیوتر — {formatJalaali(state.settings.examDate)}
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white/90"
                style={{ width: `${Math.min(100, Math.max(2, 100 - (daysLeft / 365) * 100))}%`, transition: "width .8s ease" }}
              />
            </div>
            <p className="mt-1.5 text-[10px] font-semibold text-teal-200/90">هر روز، یک قدم نزدیک‌تر</p>
          </div>
        </div>

        {/* برنامه امروز */}
        <div className="anim-card flex flex-col rounded-2xl border border-line bg-surface p-5" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-ink">برنامه امروز</h2>
            <button
              onClick={() => navigate({ page: "today" })}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand transition hover:opacity-70"
            >
              مشاهده همه
              <IconChevronL size={14} />
            </button>
          </div>
          <div className="mt-3 flex flex-1 flex-col gap-2">
            {todaysPending.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line p-5 text-center">
                <p className="text-sm font-bold text-ink">{todaysDone.length ? "همه کارهای امروز انجام شد" : "برای امروز برنامه‌ای نیست"}</p>
                <button onClick={() => navigate({ page: "today" })} className="text-xs font-bold text-brand hover:underline">
                  {todaysDone.length ? "دیدن گزارش روز" : "افزودن تسک به امروز"}
                </button>
              </div>
            )}
            {todaysPending.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-center gap-2.5 rounded-xl bg-soft px-3 py-2 transition hover:bg-line/60">
                <button
                  onClick={() => { toggleDone(t.id); toast("آفرین! انجام شد"); }}
                  aria-label="انجام شد"
                  className="flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full border-2 border-mut/50 bg-surface transition hover:border-emerald-500 active:scale-90"
                />
                <span className="flex-1 truncate text-[13px] font-semibold text-ink">{t.title}</span>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: state.subjects.find((s) => s.id === t.subjectIds[0])?.color ?? "#94a3b8" }} />
              </div>
            ))}
            {todaysPending.length > 4 && (
              <p className="text-center text-[11px] font-bold text-mut">و {faNum(todaysPending.length - 4)} تسک دیگر…</p>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-mut">
              <IconClock size={13} />
              مطالعه امروز
            </span>
            {state.dayLogs[today]?.minutes ? (
              <span className="inline-flex items-center gap-2.5 text-[11px] font-extrabold text-brand">
                {state.dayLogs[today].score !== null && state.dayLogs[today].score !== undefined && (
                  <Stars value={state.dayLogs[today].score} size={10} />
                )}
                {fmtDuration(state.dayLogs[today].minutes)}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-mut/70">هنوز ثبت نشده</span>
            )}
          </div>
        </div>
      </div>

      {/* هفته جاری */}
      <WeeklyStrip today={today} navigate={navigate} />

      {/* درس‌ها */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-display text-lg font-extrabold text-ink">درس‌های کنکور</h2>
            <p className="mt-0.5 text-xs font-semibold text-mut">برای ورود به فضای هر درس، روی کارت آن کلیک کن</p>
          </div>
          <div className="hidden items-center gap-4 text-[11px] font-bold text-mut sm:flex">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> تسلط</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-600" /> انجام تسک‌ها</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {state.subjects.map((s, i) => {
            const p = subjectProgress(state.tasks, s.id);
            return (
              <button
                key={s.id}
                onClick={() => navigate({ page: "subject", subjectId: s.id, subjectTab: "overview" })}
                className="anim-card group rounded-2xl border border-line bg-surface p-4 text-start transition-all duration-200 hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:shadow-black/[.07]"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <div className="flex items-start justify-between">
                  <span
                    className="font-display flex h-10 w-10 items-center justify-center rounded-xl text-base font-extrabold transition group-hover:scale-110"
                    style={{ background: `${s.color}16`, color: s.color }}
                  >
                    {s.name.replace(" ", "").slice(0, 1)}
                  </span>
                  <span className="font-display text-sm font-extrabold text-mut transition group-hover:text-ink">
                    {faNum(s.mastery)}٪
                  </span>
                </div>
                <p className="font-display mt-3 min-h-10 text-[13px] font-bold leading-5 text-ink">{s.name}</p>
                <div className="mt-3 flex flex-col gap-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[10px] font-bold">
                      <span className="text-emerald-600 dark:text-emerald-400">تسلط</span>
                      <span className="text-mut">{faNum(s.mastery)}٪</span>
                    </div>
                    <Bar pct={s.mastery} color="#10b981" h={5} />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[10px] font-bold">
                      <span className="text-sky-600 dark:text-sky-400">تسک‌ها</span>
                      <span className="text-mut">{faNum(p.done)}/{faNum(p.total)}</span>
                    </div>
                    <Bar pct={p.pct} color="#0284c7" h={5} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <DatePickerModal
        open={picker}
        onClose={() => setPicker(false)}
        value={state.settings.examDate}
        onChange={(d) => {
          if (d) {
            setExamDate(d);
            toast("تاریخ کنکور به‌روزرسانی شد");
          }
        }}
        title="تاریخ روز کنکور"
      />
    </div>
  );
}
