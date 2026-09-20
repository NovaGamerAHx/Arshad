import type { Route } from "../lib/types";
import { faNum } from "../lib/jalali";
import { subjectProgress, useStore } from "../store";
import { Bar } from "../components/ui";
import { IconChevronL, IconLayers, IconList } from "../components/Icons";

export function SubjectsPage({ navigate }: { navigate: (r: Route) => void }) {
  const { state } = useStore();
  const totalSubs = state.subjects.reduce((a, s) => a + s.topics.reduce((x, t) => x + t.subtopics.length, 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="anim-page">
        <p className="text-xs font-bold tracking-wide text-brand">فضای درس‌ها</p>
        <h1 className="font-display mt-1 text-3xl font-extrabold text-ink">مباحث</h1>
        <p className="mt-1.5 text-sm font-semibold text-mut">
          {faNum(state.subjects.length)} درس • {faNum(totalSubs)} ریزمبحث — وارد هر درس شو تا مباحث، بک‌لاگ و یادداشت‌هایش را مدیریت کنی
        </p>
      </div>

      <div className="grid gap-3.5 md:grid-cols-2">
        {state.subjects.map((s, i) => {
          const p = subjectProgress(state.tasks, s.id);
          const subs = s.topics.reduce((a, t) => a + t.subtopics.length, 0);
          return (
            <button
              key={s.id}
              onClick={() => navigate({ page: "subject", subjectId: s.id, subjectTab: "overview" })}
              className="anim-card group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-start transition-all duration-200 hover:-translate-y-0.5 hover:border-transparent hover:shadow-xl hover:shadow-black/[.07]"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <span
                className="font-display flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold transition group-hover:scale-110"
                style={{ background: `${s.color}15`, color: s.color }}
              >
                {s.name.trim().slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-extrabold text-ink">{s.name}</span>
                  <span className="font-display shrink-0 text-sm font-extrabold" style={{ color: s.color }}>
                    {faNum(s.mastery)}٪
                  </span>
                </span>
                <span className="mt-1 flex items-center gap-3 text-[11px] font-bold text-mut">
                  <span className="inline-flex items-center gap-1"><IconLayers size={12} /> {faNum(s.topics.length)} مبحث</span>
                  <span className="inline-flex items-center gap-1"><IconList size={12} /> {faNum(subs)} ریزمبحث</span>
                  <span>{faNum(p.done)}/{faNum(p.total)} تسک</span>
                </span>
                <span className="mt-2.5 flex gap-2">
                  <span className="flex-1"><Bar pct={s.mastery} color="#10b981" h={5} /></span>
                  <span className="flex-1"><Bar pct={p.pct} color="#0284c7" h={5} /></span>
                </span>
              </span>
              <span className="shrink-0 text-mut/50 transition group-hover:-translate-x-1 group-hover:text-brand">
                <IconChevronL size={19} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
