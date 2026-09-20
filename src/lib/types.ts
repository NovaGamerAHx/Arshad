export type Importance = "critical" | "high" | "medium" | "low";

export interface ImportanceMeta {
  id: Importance;
  label: string;
  hex: string;
  rank: number;
}

export const IMPORTANCES: ImportanceMeta[] = [
  { id: "critical", label: "خیلی مهم", hex: "#e11d48", rank: 0 },
  { id: "high", label: "مهم", hex: "#d97706", rank: 1 },
  { id: "medium", label: "متوسط", hex: "#0284c7", rank: 2 },
  { id: "low", label: "اهمیت پایین", hex: "#94a3b8", rank: 3 },
];

export function importanceMeta(id: Importance): ImportanceMeta {
  return IMPORTANCES.find((i) => i.id === id) ?? IMPORTANCES[3];
}

export type ColumnId = "unplanned" | "planned" | "done";

export interface Task {
  id: string;
  title: string;
  description: string;
  subjectIds: string[];
  importance: Importance;
  /** تاریخ شمسی برنامه‌ریزی‌شده به صورت ISO میلادی */
  plannedDate: string | null;
  done: boolean;
  completedAt: string | null;
  createdAt: string;
}

export type MasteryLevel = 0 | 1 | 2 | 3 | 4;

export interface MasteryMeta {
  value: MasteryLevel;
  label: string;
  hex: string;
}

export const MASTERY_LEVELS: MasteryMeta[] = [
  { value: 0, label: "هنوز مطالعه نکرده‌ام", hex: "#94a3b8" },
  { value: 1, label: "نیاز به تلاش بیشتر", hex: "#f43f5e" },
  { value: 2, label: "معمولی", hex: "#f59e0b" },
  { value: 3, label: "تسلط خوب", hex: "#0ea5e9" },
  { value: 4, label: "کاملاً مسلط", hex: "#10b981" },
];

export interface Subtopic {
  id: string;
  text: string;
}

export interface Topic {
  id: string;
  name: string;
  level: MasteryLevel;
  subtopics: Subtopic[];
}

export interface Subject {
  id: string;
  name: string;
  short: string;
  color: string;
  /** تسلط کلی درس از ۱۰۰ — تعیین شده توسط کاربر */
  mastery: number;
  notes: string;
  topics: Topic[];
}

export interface Settings {
  examDate: string;
  theme: "light" | "dark";
}

/** گزارش یک روز: مجموع مطالعه (دقیقه) و امتیاز روز (۱ تا ۵) */
export interface DayLog {
  minutes: number;
  score: number | null;
}

/** یادداشت — عمومی (بدون درس) یا مرتبط با یک یا چند درس */
export interface Note {
  id: string;
  title: string;
  body: string;
  subjectIds: string[];
  color: string;
  pinned: boolean;
  updatedAt: string;
}

export interface AppState {
  tasks: Task[];
  subjects: Subject[];
  settings: Settings;
  dayLogs: Record<string, DayLog>;
  notes: Note[];
}

export type Page =
  | "dashboard"
  | "today"
  | "subjects"
  | "backlog"
  | "reports"
  | "notes"
  | "whiteboard"
  | "settings"
  | "subject";

export type SubjectTab = "overview" | "topics" | "backlog" | "notes";

export interface Route {
  page: Page;
  subjectId?: string;
  subjectTab?: SubjectTab;
  backlogTab?: "list" | "board";
  /** تاریخ هدف برای صفحه امروز/روز */
  date?: string;
  /** فیلتر اولیه صفحه یادداشت‌ها: 'general' یا آیدی درس */
  notesFilter?: string;
}
