import { useState } from "react";
import type { Subject, Topic } from "../lib/types";
import { MASTERY_LEVELS } from "../lib/types";
import { faNum } from "../lib/jalali";
import { useStore } from "../store";
import { ConfirmModal, inputCls } from "../components/ui";
import {
  IconCheck, IconChevronDown, IconCopy, IconLayers, IconPencil, IconPlus, IconTrash, IconX,
} from "../components/Icons";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}

function formatTopics(subject: Subject, topics: Topic[]): string {
  const lines: string[] = [`درس: ${subject.name}`, ""];
  topics.forEach((t, i) => {
    lines.push(`مبحث ${faNum(i + 1)}: ${t.name}`);
    if (t.subtopics.length) t.subtopics.forEach((s) => lines.push(`   - ${s.text}`));
    else lines.push("   - (بدون ریزمبحث)");
    lines.push("");
  });
  lines.push(`جمع: ${faNum(topics.length)} مبحث و ${faNum(topics.reduce((a, t) => a + t.subtopics.length, 0))} ریزمبحث — ارشدیار`);
  return lines.join("\n");
}

/* ---------- ریزمبحث ---------- */
function SubRow({ subject, topic, subId, text }: { subject: Subject; topic: Topic; subId: string; text: string }) {
  const { renameSubtopic, deleteSubtopic } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const lvl = MASTERY_LEVELS[topic.level];

  const save = () => {
    const v = draft.trim();
    if (v && v !== text) renameSubtopic(subject.id, topic.id, subId, v);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          className={`${inputCls} py-1.5 text-[13px]`}
        />
        <button onClick={save} className="rounded-lg bg-brand p-1.5 text-white transition active:scale-90" aria-label="ذخیره">
          <IconCheck size={14} />
        </button>
        <button onClick={() => setEditing(false)} className="rounded-lg bg-soft p-1.5 text-mut transition" aria-label="انصراف">
          <IconX size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-soft">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: lvl.hex }} />
      <span className="flex-1 text-[13px] font-semibold leading-6 text-ink">{text}</span>
      <button onClick={() => { setDraft(text); setEditing(true); }} className="rounded-md p-1 text-mut opacity-0 transition hover:text-brand group-hover:opacity-100" aria-label="ویرایش">
        <IconPencil size={13} />
      </button>
      <button onClick={() => deleteSubtopic(subject.id, topic.id, subId)} className="rounded-md p-1 text-mut opacity-0 transition hover:text-rose-600 group-hover:opacity-100" aria-label="حذف">
        <IconX size={14} />
      </button>
    </div>
  );
}

/* ---------- مبحث ---------- */
function TopicBlock({
  subject,
  topic,
  open,
  onToggle,
  selected,
  onSelect,
}: {
  subject: Subject;
  topic: Topic;
  open: boolean;
  onToggle: () => void;
  selected: boolean;
  onSelect: () => void;
}) {
  const { renameTopic, deleteTopic, addSubtopic, toast } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(topic.name);
  const [newSub, setNewSub] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const meta = MASTERY_LEVELS[topic.level];

  const copyOne = async () => {
    const ok = await copyText(formatTopics(subject, [topic]));
    toast(ok ? "مبحث کپی شد" : "کپی انجام نشد", ok ? "ok" : "warn");
  };

  const addSub = () => {
    const v = newSub.trim();
    if (!v) return;
    addSubtopic(subject.id, topic.id, v);
    setNewSub("");
  };

  return (
    <div className="anim-card overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-mut/40">
      <div className="flex items-center gap-2 px-3 py-3">
        <button
          onClick={onSelect}
          aria-label="انتخاب برای کپی"
          className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-2 transition active:scale-90 ${
            selected ? "border-brand bg-brand text-white" : "border-mut/40 bg-surface hover:border-brand"
          }`}
        >
          {selected && <IconCheck size={11} strokeWidth={3.2} />}
        </button>
        <button onClick={onToggle} className="shrink-0 rounded-lg p-1 text-mut transition hover:bg-soft hover:text-ink" aria-label="باز و بسته">
          <IconChevronDown size={16} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        {editing ? (
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = draft.trim();
                  if (v) renameTopic(subject.id, topic.id, v);
                  setEditing(false);
                }
                if (e.key === "Escape") setEditing(false);
              }}
              className={`${inputCls} py-1.5`}
            />
            <button
              onClick={() => {
                const v = draft.trim();
                if (v) renameTopic(subject.id, topic.id, v);
                setEditing(false);
              }}
              className="rounded-lg bg-brand p-1.5 text-white transition active:scale-90"
              aria-label="ذخیره نام"
            >
              <IconCheck size={14} />
            </button>
          </div>
        ) : (
          <button onClick={onToggle} className="min-w-0 flex-1 text-start">
            <span className="block truncate text-sm font-extrabold text-ink">{topic.name}</span>
          </button>
        )}

        <span className="hidden rounded-lg px-2 py-1 text-[10.5px] font-bold sm:inline" style={{ background: `${meta.hex}16`, color: meta.hex }}>
          {meta.label}
        </span>
        <span className="shrink-0 rounded-full bg-soft px-2 py-1 text-[11px] font-bold text-mut">
          {faNum(topic.subtopics.length)} ریزمبحث
        </span>

        <div className="flex shrink-0 items-center gap-0.5">
          <button onClick={copyOne} title="کپی این مبحث" className="rounded-lg p-1.5 text-mut transition hover:bg-soft hover:text-brand">
            <IconCopy size={15} />
          </button>
          <button onClick={() => { setDraft(topic.name); setEditing(true); }} title="تغییر نام" className="rounded-lg p-1.5 text-mut transition hover:bg-soft hover:text-brand">
            <IconPencil size={15} />
          </button>
          <button onClick={() => setConfirmDel(true)} title="حذف مبحث" className="rounded-lg p-1.5 text-mut transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40">
            <IconTrash size={15} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-wash/40 px-3 py-2.5">
          {topic.subtopics.length === 0 && (
            <p className="px-2 py-2 text-[12px] font-semibold text-mut">ریزمبحثی نیست — اولین مورد را پایین اضافه کن.</p>
          )}
          <div className="flex flex-col gap-0.5">
            {topic.subtopics.map((st) => (
              <SubRow key={st.id} subject={subject} topic={topic} subId={st.id} text={st.text} />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5 px-2">
            <input
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSub()}
              placeholder="ریزمبحث جدید… (Enter)"
              className={`${inputCls} py-2 text-[13px]`}
            />
            <button
              onClick={addSub}
              disabled={!newSub.trim()}
              className="shrink-0 rounded-xl bg-brand p-2.5 text-white shadow-sm transition hover:brightness-110 active:scale-90 disabled:opacity-40"
              aria-label="افزودن ریزمبحث"
            >
              <IconPlus size={15} />
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        title="حذف مبحث"
        message={<>مبحث «{topic.name}» همراه با {faNum(topic.subtopics.length)} ریزمبحث آن حذف می‌شود. مطمئنی؟</>}
        onConfirm={() => {
          deleteTopic(subject.id, topic.id);
          toast("مبحث حذف شد", "warn");
        }}
      />
    </div>
  );
}

/* ---------- صفحه ---------- */
export function SubjectTopicsPage({ subject }: { subject: Subject }) {
  const { addTopic, toast } = useStore();
  const [openId, setOpenId] = useState<string | null>(subject.topics[0]?.id ?? null);
  const [selected, setSelected] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const totalSubs = subject.topics.reduce((a, t) => a + t.subtopics.length, 0);
  const selectedTopics = subject.topics.filter((t) => selected.includes(t.id));

  const doCopy = async (topics: Topic[], label: string) => {
    const ok = await copyText(formatTopics(subject, topics));
    toast(ok ? label : "کپی انجام نشد", ok ? "ok" : "warn");
  };

  const submitNew = () => {
    const v = newName.trim();
    if (!v) return;
    addTopic(subject.id, v);
    setNewName("");
    setAdding(false);
    toast("مبحث جدید اضافه شد");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="anim-page flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wide" style={{ color: subject.color }}>ریزمباحث</p>
          <h1 className="font-display mt-1 flex items-center gap-2.5 text-3xl font-extrabold text-ink">
            {subject.name}
          </h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-mut">
            <IconLayers size={15} />
            {faNum(subject.topics.length)} مبحث • {faNum(totalSubs)} ریزمبحث
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selected.length > 0 && (
            <button
              onClick={() => doCopy(selectedTopics, "مباحث انتخاب‌شده کپی شد")}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:brightness-110 active:scale-95"
            >
              <IconCopy size={16} />
              کپی انتخاب‌شده‌ها ({faNum(selected.length)})
            </button>
          )}
          <button
            onClick={() => doCopy(subject.topics, "همه زیرمباحث کپی شد")}
            disabled={subject.topics.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink transition hover:border-brand/50 hover:text-brand active:scale-95 disabled:opacity-40"
          >
            <IconCopy size={16} />
            کپی همه زیرمباحث
          </button>
          <button
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:brightness-110 active:scale-95"
          >
            <IconPlus size={16} />
            مبحث جدید
          </button>
        </div>
      </div>

      {adding && (
        <div className="anim-scale flex items-center gap-2 rounded-2xl border border-brand/40 bg-brand/[.04] p-3">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitNew()}
            placeholder="نام مبحث جدید، مثلاً: مدیریت ورودی/خروجی"
            className={`${inputCls} bg-surface`}
          />
          <button onClick={submitNew} disabled={!newName.trim()} className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition disabled:opacity-40">
            افزودن
          </button>
        </div>
      )}

      {subject.topics.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface/60 p-10 text-center">
          <p className="font-display text-base font-bold text-ink">هنوز مبحثی ثبت نشده</p>
          <p className="mt-1.5 text-sm text-mut">مبحث‌های این درس را اضافه کن تا بتوانی ریزمباحث را مدیریت و کپی کنی.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {subject.topics.map((t) => (
            <TopicBlock
              key={t.id}
              subject={subject}
              topic={t}
              open={openId === t.id}
              onToggle={() => setOpenId((v) => (v === t.id ? null : t.id))}
              selected={selected.includes(t.id)}
              onSelect={() => setSelected((p) => (p.includes(t.id) ? p.filter((x) => x !== t.id) : [...p, t.id]))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
