import { useEffect, useRef, useState } from "react";
import type { Route, Subject } from "../lib/types";
import { faNum } from "../lib/jalali";
import { useStore } from "../store";
import { IconChevronL, IconNote } from "../components/Icons";

export function SubjectNotesPage({ subject, navigate }: { subject: Subject; navigate: (r: Route) => void }) {
  const { state, setSubjectNotes } = useStore();
  const [text, setText] = useState(subject.notes);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const skipFirst = useRef(true);

  useEffect(() => {
    setText(subject.notes);
    skipFirst.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject.id]);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (text !== subject.notes) {
        setSubjectNotes(subject.id, text);
        const d = new Date();
        setSavedAt(`${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`);
      }
    }, 650);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="anim-page flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wide" style={{ color: subject.color }}>یادداشت‌های درس</p>
          <h1 className="font-display mt-1 text-3xl font-extrabold text-ink">{subject.name}</h1>
          <p className="mt-1.5 text-sm font-semibold text-mut">خلاصه‌ها، فرمول‌ها و نکته‌های این درس — ذخیره خودکار</p>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
            savedAt ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-soft text-mut"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${savedAt ? "bg-emerald-500" : "bg-mut/50"}`} />
          {savedAt ? `ذخیره شد — ساعت ${faNum(savedAt)}` : "ذخیره خودکار فعال"}
        </div>
      </div>

      <div className="anim-card overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${subject.color}14`, color: subject.color }}>
            <IconNote size={16} />
          </span>
          <p className="text-sm font-extrabold text-ink">دفترچه {subject.name}</p>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"اینجا بنویس…\nمثلاً:\n- فرمول‌های مهم فصل ۲\n- نکته تست‌های سال ۱۴۰۱: …"}
          className="block min-h-[440px] w-full resize-y bg-surface p-5 text-sm leading-8 text-ink outline-none placeholder:text-mut/60"
        />
        <div className="flex items-center justify-between border-t border-line bg-wash/50 px-4 py-2.5 text-[11px] font-bold text-mut">
          <span>{faNum(words)} کلمه • {faNum(text.length)} حرف</span>
          <span>همه‌چیز به‌صورت خودکار روی همین دستگاه ذخیره می‌شود</span>
        </div>
      </div>

      <button
        onClick={() => navigate({ page: "notes", notesFilter: subject.id })}
        className="anim-card group flex items-center gap-3 rounded-2xl border border-dashed border-line bg-surface/60 px-4 py-3.5 text-start transition hover:border-brand/50 hover:bg-brand/[.03]"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${subject.color}14`, color: subject.color }}>
          <IconNote size={17} />
        </span>
        <span className="flex-1">
          <span className="block text-[13px] font-extrabold text-ink">یادداشت‌های متصل به این درس</span>
          <span className="block text-[11.5px] font-semibold text-mut">
            {faNum(state.notes.filter((n) => n.subjectIds.includes(subject.id)).length)} یادداشت در بخش «یادداشت‌ها» — این دفترچه و آن‌ها جدا از هم‌اند
          </span>
        </span>
        <IconChevronL size={17} className="text-mut/40 transition group-hover:-translate-x-1 group-hover:text-brand" />
      </button>
    </div>
  );
}
