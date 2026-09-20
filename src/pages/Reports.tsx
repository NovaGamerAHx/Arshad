import { useMemo, useState } from "react";
import type { Route } from "../lib/types";
import { IMPORTANCES } from "../lib/types";
import {
  activityDaySet, completionsLastDays, longestStreak, streakOf, subjectProgress, useStore,
} from "../store";
import {
  diffDays, faNum, fmtDuration, fmtHoursShort, formatJalaali, isoToJ, jToISO,
  J_MONTHS, J_WEEKDAYS_MIN, monthDaysISO, monthGridDays, todayISO, weekdayIdx,
} from "../lib/jalali";
import { Bar, Stars } from "../components/ui";
import {
  IconCheck, IconChevronL, IconChevronR, IconClock, IconFlame, IconStar, IconTarget,
} from "../components/Icons";

type Tab = "week" | "month" | "long";

/** خطوط راهنمای افقی برای نمودارهای میله‌ای */
function GridLines() {
  return (
    <>
      {[25, 50, 75].map((p) => (
        <div key={p} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line/80" style={{ bottom: `${p}%` }} />
      ))}
    </>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: "week", label: "هفتگی" },
  { id: "month", label: "ماهانه" },
  { id: "long", label: "بلندمدت" },
];

export function ReportsPage({ navigate }: { navigate: (r: Route) => void }) {
  const { state } = useStore();
  const [tab, setTab] = useState<Tab>("week");
  const today = todayISO();
  const todayJ = isoToJ(today);

  /* ---------- داده‌های هفتگی ---------- */
  const week = completionsLastDays(state.tasks, 7);
  const weekTotal = week.reduce((a, d) => a + d.count, 0);
  const streak = streakOf(state.tasks);
  const maxWeek = Math.max(1, ...week.map((d) => d.count));
  const studyWeek = week.map((d) => ({ ...d, minutes: state.dayLogs[d.iso]?.minutes ?? 0, score: state.dayLogs[d.iso]?.score ?? null }));
  const studyTotal = studyWeek.reduce((a, d) => a + d.minutes, 0);
  const maxStudy = Math.max(60, ...studyWeek.map((d) => d.minutes));
  const scoredWeek = studyWeek.filter((d) => d.score !== null);
  const avgScoreWeek = scoredWeek.length
    ? scoredWeek.reduce((a, d) => a + (d.score as number), 0) / scoredWeek.length
    : null;

  /* ---------- داده‌های ماهانه ---------- */
  const [mj, setMj] = useState({ jy: todayJ.jy, jm: todayJ.jm });
  const isCurrentMonth = mj.jy === todayJ.jy && mj.jm === todayJ.jm;
  const shiftMonth = (delta: number) =>
    setMj((p) => {
      let jm = p.jm + delta;
      let jy = p.jy;
      if (jm < 1) { jm = 12; jy -= 1; }
      if (jm > 12) { jm = 1; jy += 1; }
      return { jy, jm };
    });

  const monthData = useMemo(() => {
    const days = monthDaysISO(mj.jy, mj.jm);
    const study = days.reduce((a, iso) => a + (state.dayLogs[iso]?.minutes ?? 0), 0);
    const done = state.tasks.filter((t) => {
      if (!t.completedAt) return false;
      const j = isoToJ(t.completedAt);
      return j.jy === mj.jy && j.jm === mj.jm;
    }).length;
    const scores = days.map((d) => state.dayLogs[d]?.score ?? null).filter((s): s is number => s !== null);
    let bestIso = days[0];
    days.forEach((iso) => {
      if ((state.dayLogs[iso]?.minutes ?? 0) > (state.dayLogs[bestIso]?.minutes ?? 0)) bestIso = iso;
    });
    let pj = mj.jm - 1;
    let py = mj.jy;
    if (pj < 1) { pj = 12; py -= 1; }
    const prevStudy = monthDaysISO(py, pj).reduce((a, iso) => a + (state.dayLogs[iso]?.minutes ?? 0), 0);
    return {
      days,
      study,
      done,
      scores,
      avg: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
      bestIso,
      bestMinutes: state.dayLogs[bestIso]?.minutes ?? 0,
      delta: prevStudy > 0 ? Math.round(((study - prevStudy) / prevStudy) * 100) : null,
      maxM: Math.max(60, ...days.map((d) => state.dayLogs[d]?.minutes ?? 0)),
    };
  }, [mj, state]);

  /* ---------- داده‌های بلندمدت ---------- */
  const longTerm = useMemo(() => {
    const totalStudy = Object.values(state.dayLogs).reduce((a, l) => a + l.minutes, 0);
    const totalDone = state.tasks.filter((t) => t.done).length;
    const longest = longestStreak(state.tasks, state.dayLogs);
    const activeDays = activityDaySet(state.tasks, state.dayLogs).size;
    let bestIso: string | null = null;
    let bestM = 0;
    Object.entries(state.dayLogs).forEach(([iso, l]) => {
      if (l.minutes > bestM) { bestM = l.minutes; bestIso = iso; }
    });
    const dates = [
      ...state.tasks.filter((t) => t.completedAt).map((t) => t.completedAt as string),
      ...Object.keys(state.dayLogs),
    ].sort();
    const firstDate = dates[0] ?? null;

    // روند ماهانه از اولین داده تا امروز (حداکثر ۸ ماه آخر)
    const end = { jy: todayJ.jy, jm: todayJ.jm };
    const start = firstDate ? isoToJ(firstDate) : end;
    const months: { jy: number; jm: number; study: number; done: number }[] = [];
    let { jy, jm } = start;
    let guard = 0;
    while ((jy < end.jy || (jy === end.jy && jm <= end.jm)) && guard < 24) {
      const days = monthDaysISO(jy, jm);
      months.push({
        jy, jm,
        study: days.reduce((a, iso) => a + (state.dayLogs[iso]?.minutes ?? 0), 0),
        done: state.tasks.filter((t) => {
          if (!t.completedAt) return false;
          const j = isoToJ(t.completedAt);
          return j.jy === jy && j.jm === jm;
        }).length,
      });
      jm += 1;
      if (jm > 12) { jm = 1; jy += 1; }
      guard += 1;
    }
    return { totalStudy, totalDone, longest, activeDays, bestIso: bestIso as string | null, bestM, firstDate, months: months.slice(-8) };
  }, [state, todayJ.jy, todayJ.jm]);

  const maxLongStudy = Math.max(60, ...longTerm.months.map((m) => m.study));
  const maxLongDone = Math.max(1, ...longTerm.months.map((m) => m.done));

  const subjectsSorted = [...state.subjects]
    .map((s) => ({ s, p: subjectProgress(state.tasks, s.id) }))
    .sort((a, b) => b.p.pct - a.p.pct);

  const cells = monthGridDays(mj.jy, mj.jm);

  return (
    <div className="flex flex-col gap-5">
      <div className="anim-page flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wide text-brand">عملکرد مطالعه</p>
          <h1 className="font-display mt-1 text-3xl font-extrabold text-ink">گزارش‌ها</h1>
          <p className="mt-1.5 text-sm font-semibold text-mut">هفتگی، ماهانه و بلندمدت — با یک کلیک روی هر روز، به صفحه همان روز برو</p>
        </div>
        <div className="inline-flex rounded-xl border border-line bg-soft p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-5 py-2 text-[13px] font-extrabold transition-all ${
                tab === t.id ? "bg-surface text-brand shadow-sm" : "text-mut hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= هفتگی ================= */}
      {tab === "week" && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: IconCheck, hex: "#10b981", label: "تسک انجام‌شده این هفته", val: faNum(weekTotal), sub: "در ۷ روز گذشته" },
              { icon: IconClock, hex: "#0d9488", label: "مجموع مطالعه این هفته", val: studyTotal ? fmtDuration(studyTotal) : "—", sub: studyTotal ? fmtHoursShort(studyTotal) : "ثبت‌شده در گزارش روز" },
              {
                icon: IconStar, hex: "#f59e0b", label: "میانگین امتیاز روزها",
                val: avgScoreWeek !== null ? `${faNum((Math.round(avgScoreWeek * 10) / 10).toFixed(1).replace(".", "٫"))} از ۵` : "—",
                sub: scoredWeek.length ? `${faNum(scoredWeek.length)} روز امتیاز گرفته` : "هنوز امتیازی ثبت نشده",
              },
              { icon: IconFlame, hex: "#ea580c", label: "روزهای پیاپی فعالیت", val: faNum(streak), sub: streak > 0 ? "همین‌طور ادامه بده" : "از امروز شروع کن" },
            ].map((c, i) => (
              <div key={c.label} className="anim-card flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4" style={{ animationDelay: `${i * 55}ms` }}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${c.hex}14`, color: c.hex }}>
                  <c.icon size={20} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-mut">{c.label}</p>
                  <p className="font-display mt-0.5 truncate text-lg font-extrabold text-ink">{c.val}</p>
                  <p className="text-[11px] font-semibold text-mut">{c.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="anim-card rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-extrabold text-ink">تسک‌های انجام‌شده — ۷ روز اخیر</h2>
                <span className="rounded-lg bg-brand/10 px-2.5 py-1 text-[11px] font-bold text-brand">{faNum(weekTotal)} تسک</span>
              </div>
              <div className="relative mt-6 flex items-end justify-between gap-2 sm:gap-3" style={{ height: 160 }}>
                <GridLines />
                {week.map((d, i) => (
                  <div key={d.iso} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span className={`text-[11px] font-bold ${d.count ? "text-ink" : "text-mut/60"}`}>{d.count ? faNum(d.count) : "—"}</span>
                    <div
                      className={`w-full max-w-12 rounded-t-xl transition-all duration-500 group-hover:brightness-110 ${
                        i === 6 ? "bg-gradient-to-t from-teal-700 to-teal-500" : d.count ? "bg-brand/45" : "bg-soft"
                      }`}
                      style={{ height: `${Math.max(4, (d.count / maxWeek) * 100)}%` }}
                      title={`${formatJalaali(d.iso)} — ${faNum(d.count)} تسک`}
                    />
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`text-[11px] font-bold ${i === 6 ? "text-brand" : "text-mut"}`}>{J_WEEKDAYS_MIN[weekdayIdx(d.iso)]}</span>
                      <span className="text-[10px] font-semibold text-mut/70">{faNum(d.jd)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="anim-card rounded-2xl border border-line bg-surface p-5" style={{ animationDelay: "70ms" }}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-extrabold text-ink">ساعت مطالعه — ۷ روز اخیر</h2>
                <span className="rounded-lg bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  {studyTotal ? fmtDuration(studyTotal) : "—"}
                </span>
              </div>
              <div className="relative mt-6 flex items-end justify-between gap-2 sm:gap-3" style={{ height: 160 }}>
                <GridLines />
                {studyWeek.map((d, i) => (
                  <div key={d.iso} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span className={`text-[10.5px] font-bold ${d.minutes ? "text-ink" : "text-mut/60"}`}>{fmtHoursShort(d.minutes)}</span>
                    <div
                      className={`w-full max-w-12 rounded-t-xl transition-all duration-500 group-hover:brightness-110 ${
                        i === 6 ? "bg-gradient-to-t from-amber-600 to-amber-400" : d.minutes ? "bg-amber-500/45" : "bg-soft"
                      }`}
                      style={{ height: `${Math.max(4, (d.minutes / maxStudy) * 100)}%` }}
                      title={`${formatJalaali(d.iso)} — ${d.minutes ? fmtDuration(d.minutes) : "بدون مطالعه"}${d.score ? ` • امتیاز ${faNum(d.score)}` : ""}`}
                    />
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`text-[11px] font-bold ${i === 6 ? "text-amber-500" : "text-mut"}`}>{J_WEEKDAYS_MIN[weekdayIdx(d.iso)]}</span>
                      {d.score ? <IconStar size={10} filled className="text-amber-400" /> : <span className="text-[10px] font-semibold text-mut/70">{faNum(d.jd)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* جزئیات روزهای هفته */}
          <div className="anim-card rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-extrabold text-ink">جزئیات روزهای هفته</h2>
              <span className="text-[11px] font-bold text-mut">روی هر روز کلیک کن تا به صفحه همان روز بروی</span>
            </div>
            <div className="mt-3 flex flex-col gap-1.5">
              {studyWeek.map((d, i) => {
                const isT = i === 6;
                return (
                  <button
                    key={d.iso}
                    onClick={() => navigate({ page: "today", date: d.iso })}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-start transition hover:border-brand/40 hover:bg-brand/[.03] active:scale-[.995] ${
                      isT ? "border-brand/40 bg-brand/[.04]" : "border-line"
                    }`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg leading-none ${isT ? "bg-brand text-white" : "bg-soft text-mut"}`}>
                      <span className="text-[9.5px] font-bold">{J_WEEKDAYS_MIN[weekdayIdx(d.iso)]}</span>
                      <span className="mt-0.5 text-[12px] font-extrabold">{faNum(d.jd)}</span>
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-extrabold text-ink">
                      {isT ? "امروز" : formatJalaali(d.iso)}
                    </span>
                    <span className="hidden items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 sm:inline-flex">
                      <IconCheck size={11} />
                      {faNum(d.count)} تسک
                    </span>
                    <span className="hidden items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 sm:inline-flex">
                      <IconClock size={11} />
                      {d.minutes ? fmtHoursShort(d.minutes) : "—"}
                    </span>
                    <Stars value={d.score} size={11} />
                    <IconChevronL size={15} className="text-mut/40" />
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ================= ماهانه ================= */}
      {tab === "month" && (
        <>
          <div className="anim-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center gap-1">
              <button onClick={() => shiftMonth(1)} className="rounded-xl border border-line p-2 text-mut transition hover:border-brand/50 hover:text-brand active:scale-90" title="ماه بعد">
                <IconChevronR size={16} />
              </button>
              <button onClick={() => shiftMonth(-1)} className="rounded-xl border border-line p-2 text-mut transition hover:border-brand/50 hover:text-brand active:scale-90" title="ماه قبل">
                <IconChevronL size={16} />
              </button>
            </div>
            <div className="text-center">
              <p className="font-display text-xl font-extrabold text-ink">
                {J_MONTHS[mj.jm - 1]} {faNum(mj.jy)}
              </p>
              {monthData.delta !== null && (
                <p className={`text-[11px] font-bold ${monthData.delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                  {monthData.delta >= 0 ? "▲" : "▼"} {faNum(Math.abs(monthData.delta))}٪ مطالعه نسبت به ماه قبل
                </p>
              )}
            </div>
            <button
              onClick={() => setMj({ jy: todayJ.jy, jm: todayJ.jm })}
              disabled={isCurrentMonth}
              className={`rounded-xl px-3.5 py-2 text-[12px] font-extrabold transition active:scale-95 ${
                isCurrentMonth ? "cursor-default bg-brand/10 text-brand" : "border border-line text-mut hover:border-brand/50 hover:text-brand"
              }`}
            >
              ماه جاری
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: IconCheck, hex: "#10b981", label: "تسک انجام‌شده این ماه", val: faNum(monthData.done), sub: `${J_MONTHS[mj.jm - 1]} ${faNum(mj.jy)}` },
              { icon: IconClock, hex: "#0d9488", label: "مجموع مطالعه ماه", val: monthData.study ? fmtDuration(monthData.study) : "—", sub: monthData.study ? `روزانه ≈ ${fmtHoursShort(Math.round(monthData.study / monthData.days.length))}` : "مطالعه‌ای ثبت نشده" },
              {
                icon: IconStar, hex: "#f59e0b", label: "میانگین امتیاز ماه",
                val: monthData.avg !== null ? `${faNum((Math.round(monthData.avg * 10) / 10).toFixed(1).replace(".", "٫"))} از ۵` : "—",
                sub: monthData.scores.length ? `${faNum(monthData.scores.length)} روز امتیاز گرفته` : "بدون امتیاز",
              },
              { icon: IconTarget, hex: "#8b5cf6", label: "بهترین روز ماه", val: monthData.bestMinutes ? formatJalaali(monthData.bestIso).split(" ").slice(0, 2).join(" ") : "—", sub: monthData.bestMinutes ? `${fmtDuration(monthData.bestMinutes)} مطالعه` : "—", click: monthData.bestMinutes ? monthData.bestIso : null },
            ].map((c, i) => (
              <div
                key={c.label}
                onClick={() => c.click && navigate({ page: "today", date: c.click })}
                className={`anim-card flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 ${c.click ? "cursor-pointer transition hover:border-brand/40 hover:shadow-md" : ""}`}
                style={{ animationDelay: `${i * 55}ms` }}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${c.hex}14`, color: c.hex }}>
                  <c.icon size={20} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-mut">{c.label}</p>
                  <p className="font-display mt-0.5 truncate text-lg font-extrabold text-ink">{c.val}</p>
                  <p className="text-[11px] font-semibold text-mut">{c.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_330px]">
            {/* نقشه حرارتی ماه */}
            <div className="anim-card rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-base font-extrabold text-ink">نقشه مطالعه ماه</h2>
                <div className="flex items-center gap-3 text-[10.5px] font-bold text-mut">
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-teal-600/25" /> کم</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-teal-600" /> زیاد</span>
                  <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> تسک انجام‌شده</span>
                  <span className="inline-flex items-center gap-1"><IconStar size={10} filled className="text-amber-400" /> امتیاز</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-1.5">
                {J_WEEKDAYS_MIN.map((w) => (
                  <div key={w} className="pb-1 text-center text-[11px] font-extrabold text-mut">{w}</div>
                ))}
                {cells.map((d, i) => {
                  if (d === null) return <div key={`e${i}`} />;
                  const iso = jToISO(mj.jy, mj.jm, d);
                  const minutes = state.dayLogs[iso]?.minutes ?? 0;
                  const score = state.dayLogs[iso]?.score ?? null;
                  const done = state.tasks.filter((t) => t.completedAt === iso).length;
                  const isFuture = iso > today;
                  const isTodayCell = iso === today;
                  const alpha = minutes ? 0.2 + 0.75 * (minutes / monthData.maxM) : 0;
                  return (
                    <button
                      key={iso}
                      onClick={() => navigate({ page: "today", date: iso })}
                      title={`${formatJalaali(iso)}${minutes ? ` — ${fmtDuration(minutes)} مطالعه` : ""}${done ? ` — ${faNum(done)} تسک انجام‌شده` : ""}${score ? ` — امتیاز ${faNum(score)}` : ""}`}
                      className={`relative flex h-12 flex-col items-center justify-center rounded-lg text-[12.5px] font-extrabold transition-all hover:z-10 hover:scale-110 hover:shadow-lg active:scale-95 ${
                        isTodayCell ? "ring-2 ring-brand" : ""
                      } ${isFuture ? "bg-soft/40 text-mut/50" : minutes ? "text-white shadow-sm" : "bg-soft/70 text-mut hover:text-ink"}`}
                      style={minutes && !isFuture ? { background: `rgba(13,148,136,${alpha.toFixed(2)})` } : undefined}
                    >
                      {faNum(d)}
                      {done > 0 && !isFuture && (
                        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full" style={{ background: minutes ? "rgba(255,255,255,.9)" : "#0ea5e9" }} />
                      )}
                      {score !== null && !isFuture && (
                        <span className={`absolute bottom-0.5 ${minutes ? "text-amber-300" : "text-amber-400"}`}>
                          <IconStar size={9} filled />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] font-semibold text-mut">شدت رنگ هر روز بر اساس میزان مطالعه است — با کلیک، به صفحه همان روز می‌روی</p>
            </div>

            {/* توزیع امتیازها */}
            <div className="anim-card rounded-2xl border border-line bg-surface p-5" style={{ animationDelay: "70ms" }}>
              <h2 className="font-display text-base font-extrabold text-ink">توزیع امتیازهای ماه</h2>
              <div className="mt-4 flex flex-col gap-3">
                {[5, 4, 3, 2, 1].map((n) => {
                  const cnt = monthData.scores.filter((s) => s === n).length;
                  const pctOf = monthData.scores.length ? Math.round((cnt / monthData.scores.length) * 100) : 0;
                  return (
                    <div key={n}>
                      <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
                        <span className="inline-flex items-center gap-1 text-amber-500">
                          <IconStar size={12} filled />
                          {faNum(n)}
                        </span>
                        <span className="text-mut">{faNum(cnt)} روز — {faNum(pctOf)}٪</span>
                      </div>
                      <Bar pct={pctOf} color="#f59e0b" h={6} />
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 rounded-xl bg-soft px-3.5 py-3 text-[11px] font-semibold leading-6 text-mut">
                {monthData.scores.length === 0
                  ? "هنوز به روزهای این ماه امتیازی نداده‌ای — از صفحه هر روز می‌توانی ستاره بدهی."
                  : `${faNum(monthData.scores.length)} روز از ${faNum(monthData.days.length)} روز ماه امتیاز گرفته است.`}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= بلندمدت ================= */}
      {tab === "long" && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: IconClock, hex: "#0d9488", label: "مجموع مطالعه از ابتدا", val: longTerm.totalStudy ? fmtDuration(longTerm.totalStudy) : "—", sub: longTerm.activeDays ? `${faNum(longTerm.activeDays)} روز فعال` : "—" },
              { icon: IconCheck, hex: "#10b981", label: "کل تسک‌های انجام‌شده", val: faNum(longTerm.totalDone), sub: "در تمام مدت" },
              { icon: IconFlame, hex: "#ea580c", label: "بلندترین زنجیره فعالیت", val: `${faNum(longTerm.longest)} روز`, sub: streakOf(state.tasks) > 0 ? `الان ${faNum(streakOf(state.tasks))} روز پیاپی` : "رکوردت را بساز" },
              {
                icon: IconTarget, hex: "#8b5cf6", label: "بهترین روز مطالعه",
                val: longTerm.bestIso ? formatJalaali(longTerm.bestIso).split(" ").slice(0, 2).join(" ") : "—",
                sub: longTerm.bestIso ? `${fmtDuration(longTerm.bestM)} مطالعه` : "—",
              },
            ].map((c, i) => (
              <div key={c.label} className="anim-card flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4" style={{ animationDelay: `${i * 55}ms` }}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${c.hex}14`, color: c.hex }}>
                  <c.icon size={20} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-mut">{c.label}</p>
                  <p className="font-display mt-0.5 truncate text-lg font-extrabold text-ink">{c.val}</p>
                  <p className="text-[11px] font-semibold text-mut">{c.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="anim-card rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-extrabold text-ink">مطالعه ماهانه</h2>
                <span className="rounded-lg bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  {longTerm.totalStudy ? fmtDuration(longTerm.totalStudy) : "—"}
                </span>
              </div>
              <div className="relative mt-6 flex items-end justify-between gap-2" style={{ height: 150 }}>
                <GridLines />
                {longTerm.months.map((m) => (
                  <div key={`${m.jy}-${m.jm}`} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span className={`text-[10px] font-bold ${m.study ? "text-ink" : "text-mut/60"}`}>{fmtHoursShort(m.study)}</span>
                    <div
                      className="w-full max-w-12 rounded-t-xl bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-500 group-hover:brightness-110"
                      style={{ height: `${Math.max(4, (m.study / maxLongStudy) * 100)}%`, opacity: m.study ? 1 : 0.25, background: m.study ? undefined : "var(--soft)" }}
                    />
                    <span className="text-[10px] font-bold text-mut">{longTerm.months.length > 6 ? J_MONTHS[m.jm - 1].slice(0, 3) : J_MONTHS[m.jm - 1]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="anim-card rounded-2xl border border-line bg-surface p-5" style={{ animationDelay: "70ms" }}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-extrabold text-ink">تسک‌های انجام‌شده ماهانه</h2>
                <span className="rounded-lg bg-brand/10 px-2.5 py-1 text-[11px] font-bold text-brand">{faNum(longTerm.totalDone)} تسک</span>
              </div>
              <div className="relative mt-6 flex items-end justify-between gap-2" style={{ height: 150 }}>
                <GridLines />
                {longTerm.months.map((m) => (
                  <div key={`${m.jy}-${m.jm}`} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span className={`text-[10.5px] font-bold ${m.done ? "text-ink" : "text-mut/60"}`}>{m.done ? faNum(m.done) : "—"}</span>
                    <div
                      className="w-full max-w-12 rounded-t-xl bg-gradient-to-t from-teal-700 to-teal-500 transition-all duration-500 group-hover:brightness-110"
                      style={{ height: `${Math.max(4, (m.done / maxLongDone) * 100)}%`, opacity: m.done ? 1 : 0.25, background: m.done ? undefined : "var(--soft)" }}
                    />
                    <span className="text-[10px] font-bold text-mut">{longTerm.months.length > 6 ? J_MONTHS[m.jm - 1].slice(0, 3) : J_MONTHS[m.jm - 1]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="anim-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/25 bg-brand/[.05] p-4">
            <p className="text-[13px] font-bold text-ink">
              {longTerm.firstDate
                ? <>از اولین ثبت در {formatJalaali(longTerm.firstDate)} تا امروز: <span className="font-display text-brand">{faNum(diffDays(today, longTerm.firstDate) + 1)} روز</span> همراه با ارشدیار بودی.</>
                : "هنوز داده‌ای ثبت نشده — از امروز شروع کن!"}
            </p>
            <p className="text-[11px] font-bold text-mut">
              {faNum(longTerm.activeDays)} روز فعال • {faNum(Math.round((longTerm.activeDays / Math.max(1, longTerm.firstDate ? diffDays(today, longTerm.firstDate) + 1 : 1)) * 100))}٪ پوشش
            </p>
          </div>
        </>
      )}

      {/* ================= مشترک: درس‌ها و اهمیت ================= */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="anim-card rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-extrabold text-ink">پیشرفت تسک‌های هر درس</h2>
            <span className="text-mut/60"><IconTarget size={18} /></span>
          </div>
          <div className="mt-4 flex flex-col gap-3.5">
            {subjectsSorted.map(({ s, p }) => (
              <div key={s.id}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold text-ink">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                  <span className="font-bold text-mut">{faNum(p.done)} از {faNum(p.total)} — {faNum(p.pct)}٪</span>
                </div>
                <Bar pct={p.pct} color={s.color} h={7} />
              </div>
            ))}
          </div>
        </div>

        <div className="anim-card rounded-2xl border border-line bg-surface p-5" style={{ animationDelay: "70ms" }}>
          <h2 className="font-display text-base font-extrabold text-ink">توزیع تسک‌ها بر اساس اهمیت</h2>
          <div className="mt-4 flex flex-col gap-4">
            {IMPORTANCES.map((imp) => {
              const all = state.tasks.filter((t) => t.importance === imp.id);
              const done = all.filter((t) => t.done).length;
              const pct = all.length ? Math.round((done / all.length) * 100) : 0;
              return (
                <div key={imp.id}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: imp.hex }}>
                      <span className="h-2.5 w-2.5 rounded-md" style={{ background: `${imp.hex}22` }}>
                        <span className="m-[3px] block h-1 w-1 rounded-full" style={{ background: imp.hex }} />
                      </span>
                      {imp.label}
                    </span>
                    <span className="font-bold text-mut">{faNum(done)} انجام از {faNum(all.length)}</span>
                  </div>
                  <Bar pct={pct} color={imp.hex} h={7} />
                </div>
              );
            })}
          </div>
          <p className="mt-5 rounded-xl bg-soft px-3.5 py-2.5 text-[11px] font-semibold leading-5 text-mut">
            پیشنهاد: اولِ هر روز، تسک‌های «خیلی مهم» همان روز را انجام بده و بقیه را به بورد فردا منتقل کن.
          </p>
        </div>
      </div>
    </div>
  );
}
