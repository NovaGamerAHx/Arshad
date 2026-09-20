import { useEffect, useState, type ComponentType } from "react";
import type { Route } from "../lib/types";
import { addDaysISO, diffDays, faNum, fmtDuration, formatJalaali, pad2, todayISO } from "../lib/jalali";
import { useStore } from "../store";
import {
  IconBoard, IconBook, IconCap, IconChart, IconClock, IconGear, IconHome,
  IconInbox, IconLayers, IconNote, IconToday, IconX,
} from "./Icons";

interface NavItem {
  key: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  active: boolean;
  badge?: number;
  dot?: string;
  go: () => void;
}

function Item({ it }: { it: NavItem }) {
  return (
    <button
      onClick={it.go}
      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
        it.active
          ? "bg-brand/10 font-bold text-brand"
          : "font-semibold text-mut hover:bg-soft hover:text-ink"
      }`}
    >
      <span className={`absolute inset-y-2 right-0 w-[3px] rounded-full transition-all ${it.active ? "bg-brand" : "bg-transparent"}`} />
      <it.icon size={18} />
      <span className="flex-1 text-start">{it.label}</span>
      {it.dot && <span className="h-2.5 w-2.5 rounded-full" style={{ background: it.dot }} />}
      {it.badge !== undefined && it.badge > 0 && (
        <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${it.active ? "bg-brand text-white" : "bg-soft text-mut"}`}>
          {faNum(it.badge)}
        </span>
      )}
    </button>
  );
}

/** نمودار میله‌ای کوچک مطالعه ۷ روز اخیر */
function WeeklyMini({ today }: { today: string }) {
  const { state } = useStore();
  const days = Array.from({ length: 7 }, (_, i) => ({ iso: addDaysISO(today, -(6 - i)), i }));
  const withMin = days.map((d) => ({ ...d, m: state.dayLogs[d.iso]?.minutes ?? 0 }));
  const max = Math.max(30, ...withMin.map((d) => d.m));
  const total = withMin.reduce((a, d) => a + d.m, 0);
  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <div className="mb-2 flex items-center justify-between text-[10px] font-extrabold">
        <span className="text-mut">مطالعه این هفته</span>
        <span className="text-brand">{total ? fmtDuration(total) : "—"}</span>
      </div>
      <div className="flex h-8 items-end justify-between gap-1">
        {withMin.map((d) => (
          <span
            key={d.iso}
            title={`${formatJalaali(d.iso)} — ${d.m ? fmtDuration(d.m) : "بدون مطالعه"}`}
            className="flex-1 rounded-sm transition-all duration-500 hover:brightness-110"
            style={{
              height: `${Math.max(12, (d.m / max) * 100)}%`,
              background: d.m ? (d.i === 6 ? "#0d9488" : "#f59e0b") : "var(--line)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function Sidebar({
  route,
  navigate,
  open,
  onClose,
}: {
  route: Route;
  navigate: (r: Route) => void;
  open: boolean;
  onClose: () => void;
}) {
  const { state } = useStore();
  const today = todayISO();
  const todayPending = state.tasks.filter((t) => !t.done && t.plannedDate === today).length;
  const openTasks = state.tasks.filter((t) => !t.done).length;
  const daysLeft = diffDays(state.settings.examDate, today);
  const subject = route.page === "subject" ? state.subjects.find((s) => s.id === route.subjectId) : undefined;
  const inSubject = Boolean(subject);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(i);
  }, []);

  const go = (r: Route) => {
    navigate(r);
    onClose();
  };

  const mainItems: NavItem[] = [
    { key: "dashboard", label: "داشبورد", icon: IconHome, active: route.page === "dashboard", go: () => go({ page: "dashboard" }) },
    { key: "today", label: "امروز", icon: IconToday, active: route.page === "today", badge: todayPending, go: () => go({ page: "today" }) },
    { key: "subjects", label: "مباحث", icon: IconLayers, active: route.page === "subjects", go: () => go({ page: "subjects" }) },
    { key: "backlog", label: "بک‌لاگ", icon: IconInbox, active: route.page === "backlog", badge: openTasks, go: () => go({ page: "backlog", backlogTab: "list" }) },
  ];
  const toolItems: NavItem[] = [
    { key: "reports", label: "گزارش‌ها", icon: IconChart, active: route.page === "reports", go: () => go({ page: "reports" }) },
    { key: "notes", label: "یادداشت‌ها", icon: IconNote, active: route.page === "notes", badge: state.notes.length, go: () => go({ page: "notes" }) },
    { key: "whiteboard", label: "تخته سفید", icon: IconBoard, active: route.page === "whiteboard", go: () => go({ page: "whiteboard" }) },
  ];

  const tab = route.subjectTab ?? "overview";
  const subjectItems: NavItem[] = subject
    ? [
        { key: "home", label: "داشبورد اصلی", icon: IconHome, active: false, go: () => go({ page: "dashboard" }) },
        { key: "overview", label: subject.name, icon: IconBook, active: tab === "overview", dot: subject.color, go: () => go({ page: "subject", subjectId: subject.id, subjectTab: "overview" }) },
        { key: "topics", label: "ریزمباحث", icon: IconLayers, active: tab === "topics", go: () => go({ page: "subject", subjectId: subject.id, subjectTab: "topics" }) },
        { key: "backlog", label: "بک‌لاگ درس", icon: IconInbox, active: tab === "backlog", go: () => go({ page: "subject", subjectId: subject.id, subjectTab: "backlog" }) },
        { key: "notes", label: "یادداشت‌های درس", icon: IconNote, active: tab === "notes", go: () => go({ page: "subject", subjectId: subject.id, subjectTab: "notes" }) },
      ]
    : [];

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-[272px] flex-col border-l border-line bg-side transition-transform duration-300 ease-out lg:translate-x-0 ${
          open ? "translate-x-0 shadow-2xl" : "translate-x-full lg:shadow-none"
        }`}
      >
        {/* لوگو */}
        <div className="flex items-center gap-3 px-5 pb-5 pt-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30">
            <IconCap size={24} />
          </div>
          <div className="flex-1">
            <p className="font-lalezar text-[23px] leading-7 text-ink">ارشدیار</p>
            <p className="text-[11px] font-semibold text-mut">کنکور ارشد کامپیوتر</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-mut transition hover:bg-soft lg:hidden" aria-label="بستن منو">
            <IconX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {inSubject ? (
            <>
              <div className="mb-2 px-2 text-[11px] font-bold text-mut">فضای درس</div>
              <div className="flex flex-col gap-1">
                {subjectItems.map((it) => <Item key={it.key} it={it} />)}
              </div>
            </>
          ) : (
            <>
              <div className="mb-2 px-2 text-[11px] font-bold text-mut">منوی اصلی</div>
              <div className="flex flex-col gap-1">
                {mainItems.map((it) => <Item key={it.key} it={it} />)}
              </div>
              <div className="mb-2 mt-5 px-2 text-[11px] font-bold text-mut">ابزارها</div>
              <div className="flex flex-col gap-1">
                {toolItems.map((it) => <Item key={it.key} it={it} />)}
              </div>
            </>
          )}
        </div>

        {/* مطالعه این هفته */}
        <div className="px-4 pb-2.5">
          <WeeklyMini today={today} />
        </div>

        {/* کارت کنکور */}
        <div className="px-4 pb-3">
          <button
            onClick={() => go(inSubject ? { page: "dashboard" } : { page: "settings" })}
            className="group w-full rounded-2xl border border-brand/25 bg-brand/[.06] p-3.5 text-start transition hover:border-brand/50 hover:bg-brand/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-brand">تا کنکور ارشد</span>
              <span className="text-brand/70 transition group-hover:scale-110"><IconCap size={17} /></span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-[32px] font-extrabold leading-9 text-ink">
                {daysLeft >= 0 ? faNum(daysLeft) : "۰"}
              </span>
              <span className="text-xs font-semibold text-mut">{daysLeft >= 0 ? "روز مانده" : "برگزار شده"}</span>
            </div>
            <div className="mt-1.5 text-[11px] font-semibold text-mut">
              {formatJalaali(state.settings.examDate)} — قابل تغییر در تنظیمات
            </div>
          </button>
        </div>

        {/* پایین */}
        <div className="border-t border-line px-3 py-3">
          <div className="flex flex-col gap-1">
            <Item
              it={{
                key: "settings",
                label: "تنظیمات",
                icon: IconGear,
                active: route.page === "settings",
                go: () => go({ page: "settings" }),
              }}
            />
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-soft px-3 py-2 text-[11px] font-semibold text-mut">
            <IconClock size={14} />
            <span className="flex-1 truncate">{formatJalaali(today)}</span>
            <span className="font-display font-bold text-brand" dir="ltr">
              {faNum(`${pad2(now.getHours())}:${pad2(now.getMinutes())}`)}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
