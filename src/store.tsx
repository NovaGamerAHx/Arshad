import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import type { AppState, ColumnId, DayLog, MasteryLevel, Note, Subject, Task } from "./lib/types";
import { buildDayLogs, buildDefaultState, buildNotes, buildTasks } from "./lib/data";
import { addDaysISO, diffDays, faNum, isoToJ, J_MONTHS, todayISO } from "./lib/jalali";

const KEY = "ersadyar:v1";

let counter = 0;
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}_${Math.random().toString(36).slice(2, 6)}`;
}

/* ---------------- reducer ---------------- */

type Action =
  | { type: "ADD_TASK"; task: Task }
  | { type: "UPDATE_TASK"; id: string; patch: Partial<Task> }
  | { type: "DELETE_TASK"; id: string }
  | { type: "TOGGLE_DONE"; id: string }
  | { type: "PLAN"; id: string; date: string | null }
  | { type: "MOVE"; id: string; col: ColumnId; date?: string | null }
  | { type: "DROP"; dragId: string; col: ColumnId; targetId: string | null }
  | { type: "REORDER"; dragId: string; targetId: string | null }
  | { type: "SUBJ"; sid: string; fn: (s: Subject) => Subject }
  | { type: "DAY"; date: string; patch: Partial<DayLog> }
  | { type: "ADD_NOTE"; note: Note }
  | { type: "UPDATE_NOTE"; id: string; patch: Partial<Note> }
  | { type: "DELETE_NOTE"; id: string }
  | { type: "SET_EXAM"; date: string }
  | { type: "SET_THEME"; theme: "light" | "dark" }
  | { type: "IMPORT"; state: AppState }
  | { type: "RESET" }
  | { type: "CLEAR_DATA" }
  | { type: "RESTORE_SAMPLES" };

export function taskColumn(t: Task): ColumnId {
  if (t.done) return "done";
  return t.plannedDate ? "planned" : "unplanned";
}

export function colList(tasks: Task[], col: ColumnId): Task[] {
  return tasks.filter((t) => taskColumn(t) === col);
}

function colPatch(col: ColumnId, t: Task, date?: string | null): Partial<Task> {
  if (col === "done") return { done: true, completedAt: t.completedAt ?? todayISO() };
  if (col === "unplanned") return { done: false, completedAt: null, plannedDate: null };
  return { done: false, completedAt: null, plannedDate: date ?? t.plannedDate ?? todayISO() };
}

function reorderInList(tasks: Task[], dragId: string, targetId: string | null): Task[] {
  const drag = tasks.find((t) => t.id === dragId);
  if (!drag) return tasks;
  const rest = tasks.filter((t) => t.id !== dragId);
  if (!targetId) return [...rest, drag];
  const idx = rest.findIndex((t) => t.id === targetId);
  if (idx === -1) return [...rest, drag];
  return [...rest.slice(0, idx), drag, ...rest.slice(idx)];
}

function reducer(state: AppState, a: Action): AppState {
  switch (a.type) {
    case "ADD_TASK":
      return { ...state, tasks: [...state.tasks, a.task] };
    case "UPDATE_TASK":
      return { ...state, tasks: state.tasks.map((t) => (t.id === a.id ? { ...t, ...a.patch } : t)) };
    case "DELETE_TASK":
      return { ...state, tasks: state.tasks.filter((t) => t.id !== a.id) };
    case "TOGGLE_DONE":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === a.id ? { ...t, done: !t.done, completedAt: !t.done ? todayISO() : null } : t
        ),
      };
    case "PLAN":
      return { ...state, tasks: state.tasks.map((t) => (t.id === a.id ? { ...t, plannedDate: a.date } : t)) };
    case "MOVE": {
      const t = state.tasks.find((x) => x.id === a.id);
      if (!t) return state;
      const updated = { ...t, ...colPatch(a.col, t, a.date) };
      return { ...state, tasks: [...state.tasks.filter((x) => x.id !== a.id), updated] };
    }
    case "DROP": {
      if (a.dragId === a.targetId) return state;
      const t = state.tasks.find((x) => x.id === a.dragId);
      if (!t) return state;
      const updated = { ...t, ...colPatch(a.col, t) };
      const withPatch = state.tasks.map((x) => (x.id === a.dragId ? updated : x));
      return { ...state, tasks: reorderInList(withPatch, a.dragId, a.targetId) };
    }
    case "REORDER":
      return { ...state, tasks: reorderInList(state.tasks, a.dragId, a.targetId) };
    case "SUBJ":
      return { ...state, subjects: state.subjects.map((s) => (s.id === a.sid ? a.fn(s) : s)) };
    case "DAY": {
      const cur = state.dayLogs[a.date] ?? { minutes: 0, score: null };
      const next: DayLog = { ...cur, ...a.patch };
      next.minutes = Math.max(0, Math.round(next.minutes));
      const logs = { ...state.dayLogs };
      if (next.minutes === 0 && next.score === null) delete logs[a.date];
      else logs[a.date] = next;
      return { ...state, dayLogs: logs };
    }
    case "ADD_NOTE":
      return { ...state, notes: [a.note, ...state.notes] };
    case "UPDATE_NOTE":
      return { ...state, notes: state.notes.map((n) => (n.id === a.id ? { ...n, ...a.patch } : n)) };
    case "DELETE_NOTE":
      return { ...state, notes: state.notes.filter((n) => n.id !== a.id) };
    case "SET_EXAM":
      return { ...state, settings: { ...state.settings, examDate: a.date } };
    case "SET_THEME":
      return { ...state, settings: { ...state.settings, theme: a.theme } };
    case "IMPORT":
      return a.state;
    case "RESET":
      return buildDefaultState();
    case "CLEAR_DATA":
      return { ...state, tasks: [], dayLogs: {}, notes: [] };
    case "RESTORE_SAMPLES":
      return { ...state, tasks: buildTasks(), dayLogs: buildDayLogs(), notes: buildNotes() };
    default:
      return state;
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as AppState;
      if (s && Array.isArray(s.tasks) && Array.isArray(s.subjects) && s.settings) {
        return {
          ...buildDefaultState(),
          ...s,
          settings: { ...buildDefaultState().settings, ...s.settings },
          dayLogs: s.dayLogs && typeof s.dayLogs === "object" ? s.dayLogs : {},
          notes: Array.isArray(s.notes) ? s.notes : [],
        };
      }
    }
  } catch {
    /* داده خراب — شروع تازه */
  }
  return buildDefaultState();
}

/* ---------------- selectors ---------------- */

export function taskProgress(tasks: Task[]): { total: number; done: number; pct: number } {
  const done = tasks.filter((t) => t.done).length;
  return { total: tasks.length, done, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
}

export function subjectProgress(tasks: Task[], sid: string) {
  return taskProgress(tasks.filter((t) => t.subjectIds.includes(sid)));
}

export function avgMastery(subjects: Subject[]): number {
  if (!subjects.length) return 0;
  return Math.round(subjects.reduce((a, s) => a + s.mastery, 0) / subjects.length);
}

/** تسلط پیشنهادی بر اساس میانگین سطح مباحث */
export function suggestedMastery(s: Subject): number {
  if (!s.topics.length) return 0;
  const sum = s.topics.reduce((a, t) => a + t.level, 0);
  return Math.round((sum / s.topics.length / 4) * 100);
}

/** روزهای پیاپی انجام تسک (شامل امروز یا شروع از دیروز) */
export function streakOf(tasks: Task[]): number {
  const doneDays = new Set(tasks.filter((t) => t.completedAt).map((t) => t.completedAt as string));
  let streak = 0;
  let cursor = todayISO();
  if (!doneDays.has(cursor)) cursor = addDaysISO(cursor, -1);
  while (doneDays.has(cursor)) {
    streak += 1;
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}

/** روزهای دارای فعالیت (انجام تسک یا ثبت مطالعه) */
export function activityDaySet(tasks: Task[], dayLogs: Record<string, DayLog>): Set<string> {
  const days = new Set<string>();
  tasks.forEach((t) => {
    if (t.completedAt) days.add(t.completedAt);
  });
  Object.entries(dayLogs).forEach(([d, l]) => {
    if (l.minutes > 0) days.add(d);
  });
  return days;
}

/** بلندترین زنجیره روزهای پیاپیِ فعالیت در کل تاریخچه */
export function longestStreak(tasks: Task[], dayLogs: Record<string, DayLog>): number {
  const sorted = [...activityDaySet(tasks, dayLogs)].sort();
  let best = 0;
  let cur = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    cur = prev !== null && diffDays(d, prev) === 1 ? cur + 1 : 1;
    if (cur > best) best = cur;
    prev = d;
  }
  return best;
}

export function completionsLastDays(tasks: Task[], days: number) {
  const out: { iso: string; count: number; jd: number; jm: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const iso = addDaysISO(todayISO(), -i);
    out.push({ iso, count: tasks.filter((t) => t.completedAt === iso).length, ...isoToJ(iso) });
  }
  return out;
}

/* ---------------- context ---------------- */

export interface StoreApi {
  state: AppState;
  toast: (msg: string, kind?: "ok" | "warn") => void;
  addTask: (input: Omit<Task, "id" | "createdAt" | "done" | "completedAt">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleDone: (id: string) => void;
  planTask: (id: string, date: string | null) => void;
  moveTask: (id: string, col: ColumnId, date?: string | null) => void;
  dropTask: (dragId: string, col: ColumnId, targetId: string | null) => void;
  reorderAdjacent: (id: string, dir: -1 | 1, col: ColumnId) => void;
  setMastery: (sid: string, v: number) => void;
  setTopicLevel: (sid: string, tid: string, lv: MasteryLevel) => void;
  addTopic: (sid: string, name: string) => void;
  renameTopic: (sid: string, tid: string, name: string) => void;
  deleteTopic: (sid: string, tid: string) => void;
  addSubtopic: (sid: string, tid: string, text: string) => void;
  renameSubtopic: (sid: string, tid: string, subId: string, text: string) => void;
  deleteSubtopic: (sid: string, tid: string, subId: string) => void;
  setSubjectNotes: (sid: string, text: string) => void;
  addStudy: (date: string, deltaMinutes: number) => void;
  setDayScore: (date: string, score: number | null) => void;
  addNote: (input: Omit<Note, "id" | "updatedAt">) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setExamDate: (iso: string) => void;
  setTheme: (t: "light" | "dark") => void;
  importState: (s: AppState) => void;
  resetAll: () => void;
  clearData: () => void;
  restoreSamples: () => void;
}

const Ctx = createContext<StoreApi | null>(null);

interface ToastItem {
  id: number;
  msg: string;
  kind: "ok" | "warn";
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.settings.theme === "dark");
  }, [state.settings.theme]);

  const api = useMemo<StoreApi>(() => {
    const subj = (sid: string, fn: (s: Subject) => Subject) => dispatch({ type: "SUBJ", sid, fn });
    return {
      state,
      toast: (msg, kind = "ok") => {
        const id = Date.now() + Math.random();
        setToasts((p) => [...p.slice(-2), { id, msg, kind }]);
        setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 2800);
      },
      addTask: (input) =>
        dispatch({
          type: "ADD_TASK",
          task: { ...input, id: uid("t"), createdAt: todayISO(), done: false, completedAt: null },
        }),
      updateTask: (id, patch) => dispatch({ type: "UPDATE_TASK", id, patch }),
      deleteTask: (id) => dispatch({ type: "DELETE_TASK", id }),
      toggleDone: (id) => dispatch({ type: "TOGGLE_DONE", id }),
      planTask: (id, date) => dispatch({ type: "PLAN", id, date }),
      moveTask: (id, col, date) => dispatch({ type: "MOVE", id, col, date }),
      dropTask: (dragId, col, targetId) => dispatch({ type: "DROP", dragId, col, targetId }),
      reorderAdjacent: (id, dir, col) => {
        const list = colList(state.tasks, col);
        const idx = list.findIndex((t) => t.id === id);
        if (idx === -1) return;
        if (dir === -1) {
          const prev = list[idx - 1];
          if (prev) dispatch({ type: "REORDER", dragId: id, targetId: prev.id });
        } else {
          const after = list[idx + 2];
          dispatch({ type: "REORDER", dragId: id, targetId: after ? after.id : null });
        }
      },
      setMastery: (sid, v) => subj(sid, (s) => ({ ...s, mastery: v })),
      setTopicLevel: (sid, tid, lv) =>
        subj(sid, (s) => ({ ...s, topics: s.topics.map((t) => (t.id === tid ? { ...t, level: lv } : t)) })),
      addTopic: (sid, name) =>
        subj(sid, (s) => ({ ...s, topics: [...s.topics, { id: uid("tp"), name, level: 0, subtopics: [] }] })),
      renameTopic: (sid, tid, name) =>
        subj(sid, (s) => ({ ...s, topics: s.topics.map((t) => (t.id === tid ? { ...t, name } : t)) })),
      deleteTopic: (sid, tid) => subj(sid, (s) => ({ ...s, topics: s.topics.filter((t) => t.id !== tid) })),
      addSubtopic: (sid, tid, text) =>
        subj(sid, (s) => ({
          ...s,
          topics: s.topics.map((t) => (t.id === tid ? { ...t, subtopics: [...t.subtopics, { id: uid("sb"), text }] } : t)),
        })),
      renameSubtopic: (sid, tid, subId, text) =>
        subj(sid, (s) => ({
          ...s,
          topics: s.topics.map((t) =>
            t.id === tid
              ? { ...t, subtopics: t.subtopics.map((x) => (x.id === subId ? { ...x, text } : x)) }
              : t
          ),
        })),
      deleteSubtopic: (sid, tid, subId) =>
        subj(sid, (s) => ({
          ...s,
          topics: s.topics.map((t) => (t.id === tid ? { ...t, subtopics: t.subtopics.filter((x) => x.id !== subId) } : t)),
        })),
      setSubjectNotes: (sid, text) => subj(sid, (s) => ({ ...s, notes: text })),
      addStudy: (date, deltaMinutes) =>
        dispatch({
          type: "DAY",
          date,
          patch: { minutes: (state.dayLogs[date]?.minutes ?? 0) + deltaMinutes },
        }),
      setDayScore: (date, score) => dispatch({ type: "DAY", date, patch: { score } }),
      addNote: (input) =>
        dispatch({
          type: "ADD_NOTE",
          note: { ...input, id: uid("n"), updatedAt: new Date().toISOString() },
        }),
      updateNote: (id, patch) =>
        dispatch({ type: "UPDATE_NOTE", id, patch: { ...patch, updatedAt: new Date().toISOString() } }),
      deleteNote: (id) => dispatch({ type: "DELETE_NOTE", id }),
      setExamDate: (iso) => dispatch({ type: "SET_EXAM", date: iso }),
      setTheme: (t) => dispatch({ type: "SET_THEME", theme: t }),
      importState: (s) => dispatch({ type: "IMPORT", state: s }),
      resetAll: () => dispatch({ type: "RESET" }),
      clearData: () => dispatch({ type: "CLEAR_DATA" }),
      restoreSamples: () => dispatch({ type: "RESTORE_SAMPLES" }),
    };
  }, [state]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-5 z-[70] flex flex-col gap-2" dir="rtl">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`anim-toast flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-lg ${
              t.kind === "ok"
                ? "border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-100"
                : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100"
            }`}
          >
            <span
              className={`inline-block h-2 w-2 rounded-full ${t.kind === "ok" ? "bg-teal-500" : "bg-rose-500"}`}
            />
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useStore(): StoreApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore خارج از StoreProvider");
  return v;
}

export function useJMonthLabel(iso: string): string {
  const { jy, jm } = isoToJ(iso);
  return `${J_MONTHS[jm - 1]} ${faNum(jy)}`;
}

/* ---------------- اعتبارسنجی فایل بکاپ ---------------- */

export interface ImportResult {
  state: AppState | null;
  error: string | null;
  counts: { tasks: number; subjects: number; notes: number };
}

/** هم فایل‌های خام (AppState) و هم فایل‌های بسته‌بندی‌شده با متادیتا را می‌پذیرد */
export function normalizeImport(raw: unknown): ImportResult {
  const fail = (error: string): ImportResult => ({ state: null, error, counts: { tasks: 0, subjects: 0, notes: 0 } });
  try {
    const obj =
      raw && typeof raw === "object" && "data" in (raw as Record<string, unknown>)
        ? (raw as { data: unknown }).data
        : raw;
    const s = obj as Partial<AppState> | null;
    if (!s || typeof s !== "object") return fail("محتوای فایل JSON معتبر نیست.");
    if (!Array.isArray(s.tasks) || !Array.isArray(s.subjects))
      return fail("ساختار فایل درست نیست — آرایه تسک‌ها یا درس‌ها پیدا نشد.");

    const tasks = (s.tasks as unknown[]).filter(
      (t): t is Task => !!t && typeof t === "object" && typeof (t as Task).id === "string" && typeof (t as Task).title === "string"
    );
    const subjects = (s.subjects as unknown[]).filter(
      (x): x is Subject => !!x && typeof x === "object" && typeof (x as Subject).id === "string" && Array.isArray((x as Subject).topics)
    );
    const notes = Array.isArray(s.notes)
      ? (s.notes as unknown[]).filter((n): n is Note => !!n && typeof n === "object" && typeof (n as Note).id === "string")
      : [];
    const dayLogs = s.dayLogs && typeof s.dayLogs === "object" ? (s.dayLogs as Record<string, DayLog>) : {};
    const base = buildDefaultState();

    const state: AppState = {
      tasks,
      subjects,
      notes,
      dayLogs,
      settings: { ...base.settings, ...(s.settings ?? {}) },
    };
    return { state, error: null, counts: { tasks: tasks.length, subjects: subjects.length, notes: notes.length } };
  } catch {
    return fail("خواندن فایل ناموفق بود.");
  }
}
