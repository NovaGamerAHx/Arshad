import { useMemo, useState } from "react";
import type { Subject, Task } from "../lib/types";
import { IMPORTANCES, importanceMeta } from "../lib/types";
import { faNum } from "../lib/jalali";
import { taskColumn, useStore } from "../store";
import { EmptyState, inputCls } from "../components/ui";
import { TaskCard } from "../components/TaskCard";
import { TaskModal } from "../components/TaskModal";
import { Board } from "../components/Board";
import { IconInbox, IconKanban, IconList, IconPlus, IconSearch } from "../components/Icons";

export function BacklogPage({
  subject,
  tab,
  onTab,
}: {
  subject?: Subject;
  tab: "list" | "board";
  onTab: (t: "list" | "board") => void;
}) {
  const { state } = useStore();
  const [taskModal, setTaskModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [q, setQ] = useState("");
  const [fSubject, setFSubject] = useState<string>("all");
  const [fImp, setFImp] = useState<string>("all");

  const scopeTasks = useMemo(
    () => (subject ? state.tasks.filter((t) => t.subjectIds.includes(subject.id)) : state.tasks),
    [state.tasks, subject]
  );

  const filtered = useMemo(() => {
    const qq = q.trim();
    return scopeTasks
      .filter((t) => {
        if (fSubject !== "all" && !t.subjectIds.includes(fSubject)) return false;
        if (fImp !== "all" && t.importance !== fImp) return false;
        if (qq && !`${t.title} ${t.description}`.includes(qq)) return false;
        return true;
      })
      .sort((a, b) => {
        const r = importanceMeta(a.importance).rank - importanceMeta(b.importance).rank;
        if (r !== 0) return r;
        const da = a.plannedDate ?? "9999";
        const db = b.plannedDate ?? "9999";
        return da.localeCompare(db);
      });
  }, [scopeTasks, q, fSubject, fImp]);

  const openCount = scopeTasks.filter((t) => !t.done).length;
  const doneCount = scopeTasks.length - openCount;

  return (
    <div className="flex flex-col gap-5">
      <div className="anim-page flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wide text-brand">مدیریت تسک‌ها</p>
          <h1 className="font-display mt-1 flex items-center gap-2.5 text-3xl font-extrabold text-ink">
            {subject ? (
              <>
                بک‌لاگ درس
                <span className="inline-flex items-center gap-2 rounded-xl px-3 py-1 text-lg" style={{ background: `${subject.color}14`, color: subject.color }}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: subject.color }} />
                  {subject.name}
                </span>
              </>
            ) : (
              "بک‌لاگ"
            )}
          </h1>
          <p className="mt-1.5 text-sm font-semibold text-mut">
            {faNum(openCount)} تسک باز • {faNum(doneCount)} انجام‌شده
          </p>
        </div>
        <button
          onClick={() => setTaskModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:brightness-110 active:scale-95"
        >
          <IconPlus size={17} />
          تسک جدید
        </button>
      </div>

      {/* تب‌ها */}
      <div className="anim-card inline-flex w-fit rounded-xl border border-line bg-soft p-1">
        {(
          [
            { id: "list", label: "فهرست تسک‌ها", icon: IconList },
            { id: "board", label: "بورد وظایف", icon: IconKanban },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => onTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-bold transition-all ${
              tab === t.id ? "bg-surface text-brand shadow-sm" : "text-mut hover:text-ink"
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "list" ? (
        <>
          {/* فیلترها */}
          <div className="anim-card flex flex-wrap items-center gap-2.5 rounded-2xl border border-line bg-surface p-3">
            <div className="relative min-w-52 flex-1">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-mut">
                <IconSearch size={16} />
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="جستجو در عنوان و توضیحات…"
                className={`${inputCls} pr-9`}
              />
            </div>
            {!subject && (
              <select value={fSubject} onChange={(e) => setFSubject(e.target.value)} className={`${inputCls} w-auto cursor-pointer`}>
                <option value="all">همه درس‌ها</option>
                {state.subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
            <select value={fImp} onChange={(e) => setFImp(e.target.value)} className={`${inputCls} w-auto cursor-pointer`}>
              <option value="all">همه اهمیت‌ها</option>
              {IMPORTANCES.map((i) => (
                <option key={i.id} value={i.id}>{i.label}</option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<IconInbox size={26} />}
              title={scopeTasks.length === 0 ? "هنوز تسکی نساخته‌ای" : "با این فیلترها تسکی پیدا نشد"}
              desc={scopeTasks.length === 0 ? "اولین تسک را بساز تا در بورد وظایف هم ظاهر شود." : "فیلترها یا عبارت جستجو را تغییر بده."}
              action={
                scopeTasks.length === 0 ? (
                  <button onClick={() => setTaskModal(true)} className="rounded-xl bg-brand px-4 py-2 text-[13px] font-bold text-white shadow-md shadow-brand/25 transition hover:brightness-110">
                    ساخت اولین تسک
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {filtered.map((t, i) => (
                <div key={t.id} className="anim-card" style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}>
                  <TaskCard task={t} view="list" col={taskColumn(t)} onEdit={setEditing} />
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <Board tasks={scopeTasks} onEdit={setEditing} />
      )}

      <TaskModal
        open={taskModal}
        onClose={() => setTaskModal(false)}
        presetSubjectId={subject?.id}
      />
      <TaskModal open={editing !== null} onClose={() => setEditing(null)} task={editing} />
    </div>
  );
}
