import type { Subject } from "../lib/types";
import { MASTERY_LEVELS } from "../lib/types";
import { faNum } from "../lib/jalali";
import { subjectProgress, suggestedMastery, useStore } from "../store";
import { IconInbox, IconLayers, IconList, IconSpark, IconTarget } from "../components/Icons";

const SHORT_LEVELS = ["نخوانده", "تلاش بیشتر", "معمولی", "خوب", "مسلط"];

export function SubjectOverviewPage({ subject }: { subject: Subject }) {
  const { state, setMastery, setTopicLevel, toast } = useStore();
  const p = subjectProgress(state.tasks, subject.id);
  const sug = suggestedMastery(subject);
  const totalSubs = subject.topics.reduce((a, t) => a + t.subtopics.length, 0);
  const readTopics = subject.topics.filter((t) => t.level > 0).length;

  return (
    <div className="flex flex-col gap-5">
      {/* سربرگ درس */}
      <div className="anim-page flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span
            className="font-display flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-extrabold shadow-sm"
            style={{ background: `${subject.color}16`, color: subject.color }}
          >
            {subject.name.trim().slice(0, 1)}
          </span>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{subject.name}</h1>
            <p className="mt-1 text-[13px] font-semibold text-mut">نمای کلی درس — آمار و وضعیت مباحث</p>
          </div>
        </div>
        <div
          className="rounded-2xl px-4 py-2.5 text-center"
          style={{ background: `${subject.color}12`, color: subject.color }}
        >
          <p className="font-display text-2xl font-extrabold leading-7">{faNum(subject.mastery)}٪</p>
          <p className="text-[11px] font-bold">تسلط فعلی</p>
        </div>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: IconInbox, label: "تسک‌های درس", val: `${faNum(p.done)} از ${faNum(p.total)}`, sub: `${faNum(p.pct)}٪ انجام شده`, hex: "#0284c7" },
          { icon: IconLayers, label: "مباحث خوانده‌شده", val: `${faNum(readTopics)} از ${faNum(subject.topics.length)}`, sub: "دارای سطح تسلط", hex: "#8b5cf6" },
          { icon: IconList, label: "ریزمباحث", val: faNum(totalSubs), sub: `در ${faNum(subject.topics.length)} مبحث`, hex: "#ea580c" },
          { icon: IconTarget, label: "تسلط پیشنهادی", val: `${faNum(sug)}٪`, sub: "بر اساس سطح مباحث", hex: "#0d9488" },
        ].map((s, i) => (
          <div key={s.label} className="anim-card rounded-2xl border border-line bg-surface p-4" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center gap-2" style={{ color: s.hex }}>
              <s.icon size={16} />
              <span className="text-[11px] font-bold text-mut">{s.label}</span>
            </div>
            <p className="font-display mt-2 text-xl font-extrabold text-ink">{s.val}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-mut">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* تعیین تسلط */}
      <div className="anim-card rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-extrabold text-ink">تسلط بر کل درس</h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-mut">
              عدد نهایی را خودت تعیین می‌کنی — این فقط یک اسلایدر ساده است، پیشنهاد پایین صرفاً راهنماست.
            </p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-5xl font-extrabold text-brand">{faNum(subject.mastery)}</span>
            <span className="text-lg font-bold text-mut">از ۱۰۰</span>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={subject.mastery}
          onChange={(e) => setMastery(subject.id, Number(e.target.value))}
          className="mastery mt-5"
          style={{ background: `linear-gradient(to left, var(--brand) ${subject.mastery}%, var(--soft) ${subject.mastery}%)` }}
        />
        <div className="mt-1.5 flex justify-between text-[11px] font-bold text-mut">
          <span>۰ — تازه شروع</span>
          <span>۱۰۰ — تسلط کامل</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-xl bg-soft px-3.5 py-3">
          <IconSpark size={17} className="text-brand" />
          <p className="flex-1 text-xs font-semibold text-ink">
            پیشنهاد ارشدیار بر اساس میانگین سطح مباحث: <b className="font-display text-sm text-brand">{faNum(sug)}٪</b>
          </p>
          {sug !== subject.mastery && (
            <button
              onClick={() => { setMastery(subject.id, sug); toast("تسلط پیشنهادی اعمال شد"); }}
              className="rounded-lg bg-brand px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:brightness-110 active:scale-95"
            >
              اعمال پیشنهاد
            </button>
          )}
        </div>
      </div>

      {/* وضعیت مباحث */}
      <section>
        <div className="mb-2.5 flex items-end justify-between">
          <h2 className="font-display text-base font-extrabold text-ink">وضعیت مباحث</h2>
          <p className="text-[11px] font-bold text-mut">سطح هر مبحث را با یک کلیک مشخص کن</p>
        </div>
        {subject.topics.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface/60 p-8 text-center text-sm font-semibold text-mut">
            هنوز مبحثی ثبت نشده — از بخش «ریزمباحث» مبحث‌های این درس را اضافه کن.
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {subject.topics.map((t, i) => {
              const meta = MASTERY_LEVELS[t.level];
              return (
                <div key={t.id} className="anim-card rounded-2xl border border-line bg-surface p-4" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-ink">{t.name}</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-mut">{faNum(t.subtopics.length)} ریزمبحث</p>
                    </div>
                    <span
                      className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold"
                      style={{ background: `${meta.hex}16`, color: meta.hex }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-5 gap-1 rounded-xl bg-soft p-1">
                    {MASTERY_LEVELS.map((lv, idx) => {
                      const active = t.level === lv.value;
                      return (
                        <button
                          key={lv.value}
                          onClick={() => setTopicLevel(subject.id, t.id, lv.value)}
                          title={lv.label}
                          className={`rounded-lg px-1 py-1.5 text-[10.5px] font-bold transition-all active:scale-95 ${
                            active ? "text-white shadow-sm" : "text-mut hover:bg-surface hover:text-ink"
                          }`}
                          style={active ? { background: lv.hex } : undefined}
                        >
                          {SHORT_LEVELS[idx]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
