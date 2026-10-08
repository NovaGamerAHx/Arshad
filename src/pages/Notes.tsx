import { useEffect, useMemo, useState } from "react";
import type { Note, Route } from "../lib/types";
import { addDaysISO, faNum, formatJalaali, todayISO } from "../lib/jalali";
import { useStore } from "../store";
import { ConfirmModal, EmptyState, Field, inputCls, Modal } from "../components/ui";
import { IconChevronL, IconNote, IconPencil, IconPin, IconPlus, IconSearch, IconTrash, IconX } from "../components/Icons";

const NOTE_COLORS = ["#0d9488", "#0284c7", "#8b5cf6", "#db2777", "#ea580c", "#64748b"];

function whenLabel(iso: string): string {
  const d = iso.slice(0, 10);
  const t = todayISO();
  if (d === t) return "امروز";
  if (d === addDaysISO(t, -1)) return "دیروز";
  return formatJalaali(d);
}

/* ---------------- ویرایشگر یادداشت ---------------- */
function NoteModal({
  open,
  onClose,
  note,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  note: Note | null;
  onDelete?: (note: Note) => void;
}) {
  const { state, addNote, updateNote, toast } = useStore();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [color, setColor] = useState(NOTE_COLORS[0]);
  const [pinned, setPinned] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(note?.title ?? "");
    setBody(note?.body ?? "");
    setSubjectIds(note?.subjectIds ?? []);
    setColor(note?.color ?? NOTE_COLORS[0]);
    setPinned(note?.pinned ?? false);
    setErr(null);
  }, [open, note]);

  const toggleSubject = (id: string) =>
    setSubjectIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const save = () => {
    if (!title.trim() && !body.trim()) {
      setErr("عنوان یا متن یادداشت را بنویس.");
      return;
    }
    if (note) {
      updateNote(note.id, { title: title.trim(), body: body.trim(), subjectIds, color, pinned });
      toast("یادداشت ویرایش شد");
    } else {
      addNote({ title: title.trim(), body: body.trim(), subjectIds, color, pinned });
      toast("یادداشت ساخته شد");
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={note ? "ویرایش یادداشت" : "یادداشت جدید"}>
      <div className="flex flex-col gap-4">
        <Field label="عنوان" hint="اختیاری">
          <input
            autoFocus
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErr(null); }}
            placeholder="مثلاً: فرمول‌های فصل ۳ احتمال"
            className={inputCls}
          />
        </Field>
        <Field label="متن یادداشت">
          <textarea
            value={body}
            onChange={(e) => { setBody(e.target.value); setErr(null); }}
            rows={6}
            placeholder="بنویس… هر خط یک نکته"
            className={`${inputCls} resize-y leading-7`}
          />
        </Field>
        <Field label="درس‌های مرتبط" hint="خالی = یادداشت عمومی">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {state.subjects.map((s) => {
              const active = subjectIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSubject(s.id)}
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
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Field label="رنگ">
            <div className="flex items-center gap-2">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`رنگ ${c}`}
                  className={`h-7 w-7 rounded-full transition-all active:scale-90 ${color === c ? "scale-110 ring-2 ring-offset-2 ring-offset-surface" : "hover:scale-110"}`}
                  style={{ background: c, ["--tw-ring-color" as string]: c }}
                />
              ))}
            </div>
          </Field>
          <button
            onClick={() => setPinned((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[13px] font-extrabold transition active:scale-95 ${
              pinned ? "border-amber-400/60 bg-amber-400/10 text-amber-500" : "border-line text-mut hover:text-ink"
            }`}
          >
            <IconPin size={16} filled={pinned} />
            {pinned ? "سنجاق شده" : "سنجاق کن"}
          </button>
        </div>
        {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] font-bold text-rose-600 dark:bg-rose-950/40">{err}</p>}
        <div className="flex justify-end gap-2 pt-1">
          {note && onDelete && (
            <button
              onClick={() => onDelete(note)}
              className="me-auto inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50 active:scale-95 dark:border-rose-900/60 dark:hover:bg-rose-950/40"
            >
              <IconTrash size={16} />
              حذف
            </button>
          )}
          <button onClick={onClose} className="rounded-xl border border-line px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-soft">
            انصراف
          </button>
          <button onClick={save} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/25 transition hover:brightness-110 active:scale-95">
            {note ? "ذخیره تغییرات" : "افزودن یادداشت"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- صفحه ---------------- */
export function NotesPage({ navigate, initialFilter }: { navigate: (r: Route) => void; initialFilter?: string }) {
  const { state, deleteNote, updateNote, toast } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>(initialFilter ?? "all");
  const [editor, setEditor] = useState<{ open: boolean; note: Note | null }>({ open: false, note: null });
  const [confirmDel, setConfirmDel] = useState<Note | null>(null);

  useEffect(() => {
    if (initialFilter) setFilter(initialFilter);
  }, [initialFilter]);

  const filtered = useMemo(() => {
    const qq = q.trim();
    return state.notes
      .filter((n) => {
        if (filter === "general" && n.subjectIds.length > 0) return false;
        if (filter !== "all" && filter !== "general" && !n.subjectIds.includes(filter)) return false;
        if (qq && !`${n.title} ${n.body}`.includes(qq)) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [state.notes, filter, q]);

  const filterSubject = state.subjects.find((s) => s.id === filter);

  return (
    <div className="flex flex-col gap-5">
      <div className="anim-page flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wide text-brand">دفترچه شخصی</p>
          <h1 className="font-display mt-1 text-3xl font-extrabold text-ink">یادداشت‌ها</h1>
          <p className="mt-1.5 text-sm font-semibold text-mut">
            {faNum(state.notes.length)} یادداشت — عمومی یا متصل به درس‌ها
            {filterSubject && (
              <button onClick={() => setFilter("all")} className="ms-2 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[12px] font-extrabold" style={{ background: `${filterSubject.color}15`, color: filterSubject.color }}>
                فیلتر: {filterSubject.short}
                <IconX size={12} />
              </button>
            )}
          </p>
        </div>
        <button
          onClick={() => setEditor({ open: true, note: null })}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:brightness-110 active:scale-95"
        >
          <IconPlus size={17} />
          یادداشت جدید
        </button>
      </div>

      {/* جستجو و فیلترها */}
      <div className="anim-card flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3.5">
        <div className="relative">
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mut"><IconSearch size={16} /></span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجو در عنوان و متن یادداشت‌ها…"
            className={`${inputCls} pr-10`}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {([
            { id: "all", label: "همه" },
            { id: "general", label: "عمومی (بدون درس)" },
            ...state.subjects.map((s) => ({ id: s.id, label: s.short, color: s.color })),
          ] as { id: string; label: string; color?: string }[]).map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-extrabold transition active:scale-95 ${
                  active ? "border-transparent text-white shadow-sm" : "border-line text-mut hover:border-mut/50 hover:text-ink"
                }`}
                style={active ? { background: f.color ?? "var(--brand)" } : undefined}
              >
                {"color" in f && f.color && <span className="h-2 w-2 rounded-full" style={{ background: active ? "#fff" : f.color }} />}
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* کارت‌ها */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<IconNote size={26} />}
          title={state.notes.length === 0 ? "دفترچه‌ات خالی است" : "یادداشتی پیدا نشد"}
          desc={
            state.notes.length === 0
              ? "اولین یادداشت را بنویس — عمومی یا مرتبط با یک یا چند درس."
              : "عبارت جستجو یا فیلتر را عوض کن."
          }
          action={
            state.notes.length === 0 ? (
              <button onClick={() => setEditor({ open: true, note: null })} className="rounded-xl bg-brand px-4 py-2 text-[13px] font-bold text-white shadow-md shadow-brand/25 transition hover:brightness-110">
                نوشتن اولین یادداشت
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((n, i) => {
            const subs = n.subjectIds.map((id) => state.subjects.find((s) => s.id === id)).filter(Boolean);
            return (
              <article
                key={n.id}
                onClick={() => setEditor({ open: true, note: n })}
                className={`anim-card group relative cursor-pointer overflow-hidden rounded-2xl border bg-surface transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/[.07] ${
                  n.pinned ? "border-amber-400/50" : "border-line"
                }`}
                style={{ animationDelay: `${Math.min(i, 9) * 45}ms` }}
              >
                <span className="absolute inset-y-0 right-0 w-1.5" style={{ background: n.color }} />
                <div className="flex h-full flex-col p-4 pe-4 ps-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display min-w-0 flex-1 truncate text-[15px] font-bold leading-7 text-ink">
                      {n.title || "بدون عنوان"}
                    </h3>
                    <div className="flex shrink-0 items-center gap-0.5">
                      {n.pinned && (
                        <button
                          onClick={(e) => { e.stopPropagation(); updateNote(n.id, { pinned: false }); toast("از سنجاق درآمد"); }}
                          title="برداشتن سنجاق"
                          className="rounded-lg p-1.5 text-amber-500 transition hover:bg-amber-400/10 active:scale-90"
                        >
                          <IconPin size={15} filled />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditor({ open: true, note: n }); }}
                        title="ویرایش"
                        className="touch-visible rounded-lg p-1.5 text-mut opacity-0 transition hover:bg-soft hover:text-brand group-hover:opacity-100"
                      >
                        <IconPencil size={15} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDel(n); }}
                        title="حذف"
                        className="touch-visible rounded-lg p-1.5 text-mut opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 dark:hover:bg-rose-950/40"
                      >
                        <IconTrash size={15} />
                      </button>
                    </div>
                  </div>

                  <p className="mt-1 line-clamp-2 whitespace-pre-line text-[13px] leading-6 text-mut">
                    {n.body || "—"}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-2 pt-3.5">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      {subs.length === 0 ? (
                        <span className="rounded-md bg-soft px-1.5 py-0.5 text-[10.5px] font-extrabold text-mut">عمومی</span>
                      ) : (
                        subs.slice(0, 3).map((s) => (
                          <span key={s!.id} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-extrabold" style={{ background: `${s!.color}15`, color: s!.color }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: s!.color }} />
                            {s!.short}
                          </span>
                        ))
                      )}
                      {subs.length > 3 && <span className="text-[10.5px] font-bold text-mut">+{faNum(subs.length - 3)}</span>}
                    </div>
                    <span className="shrink-0 text-[10.5px] font-bold text-mut/80">{whenLabel(n.updatedAt)}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* راهنمای اتصال به درس */}
      <button
        onClick={() => navigate({ page: "subjects" })}
        className="anim-card group flex items-center gap-3 rounded-2xl border border-dashed border-line bg-surface/60 px-4 py-3.5 text-start transition hover:border-brand/50 hover:bg-brand/[.03]"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand"><IconNote size={17} /></span>
        <span className="flex-1">
          <span className="block text-[13px] font-extrabold text-ink">یادداشت‌ها را به درس‌ها وصل کن</span>
          <span className="block text-[11.5px] font-semibold text-mut">یادداشت‌های متصل به هر درس، با فیلتر همان درس اینجا دیده می‌شوند — مثل برچسب.</span>
        </span>
        <IconChevronL size={17} className="text-mut/40 transition group-hover:-translate-x-1 group-hover:text-brand" />
      </button>

      <NoteModal
        open={editor.open}
        onClose={() => setEditor({ open: false, note: null })}
        note={editor.note}
        onDelete={(n) => {
          setEditor({ open: false, note: null });
          setConfirmDel(n);
        }}
      />
      <ConfirmModal
        open={confirmDel !== null}
        onClose={() => setConfirmDel(null)}
        title="حذف یادداشت"
        message={<>یادداشت «{confirmDel?.title || "بدون عنوان"}» برای همیشه حذف می‌شود. مطمئنی؟</>}
        onConfirm={() => {
          if (confirmDel) {
            deleteNote(confirmDel.id);
            toast("یادداشت حذف شد", "warn");
          }
        }}
      />
    </div>
  );
}
