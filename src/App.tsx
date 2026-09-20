import { useEffect, useState, type ReactNode } from "react";
import type { Route } from "./lib/types";
import { StoreProvider, useStore } from "./store";
import { Sidebar } from "./components/Sidebar";
import { DashboardPage } from "./pages/Dashboard";
import { TodayPage } from "./pages/Today";
import { SubjectsPage } from "./pages/Subjects";
import { BacklogPage } from "./pages/Backlog";
import { ReportsPage } from "./pages/Reports";
import { SettingsPage } from "./pages/Settings";
import { NotesPage } from "./pages/Notes";
import { PlaceholderPage } from "./pages/Placeholder";
import { SubjectOverviewPage } from "./pages/SubjectOverview";
import { SubjectTopicsPage } from "./pages/SubjectTopics";
import { SubjectNotesPage } from "./pages/SubjectNotes";
import { IconBoard, IconMenu } from "./components/Icons";

function Shell() {
  const { state } = useStore();
  const [route, setRoute] = useState<Route>({ page: "dashboard" });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  const navigate = (r: Route) => setRoute(r);

  const subject = route.page === "subject" ? state.subjects.find((s) => s.id === route.subjectId) : undefined;

  let content: ReactNode;
  let routeKey = route.page;

  switch (route.page) {
    case "today":
      content = <TodayPage initialDate={route.date} />;
      routeKey += route.date ?? "";
      break;
    case "subjects":
      content = <SubjectsPage navigate={navigate} />;
      break;
    case "backlog":
      content = (
        <BacklogPage
          tab={route.backlogTab ?? "list"}
          onTab={(t) => setRoute((r) => ({ ...r, backlogTab: t }))}
        />
      );
      routeKey += route.backlogTab ?? "list";
      break;
    case "reports":
      content = <ReportsPage navigate={navigate} />;
      break;
    case "notes":
      content = <NotesPage navigate={navigate} initialFilter={route.notesFilter} />;
      routeKey += route.notesFilter ?? "";
      break;
    case "whiteboard":
      content = (
        <PlaceholderPage
          title="تخته سفید"
          desc="تخته سفید برای رسم نمودار، فلوچارت الگوریتم‌ها و مرور چشمی — این بخش در آینده پیاده‌سازی خواهد شد."
          icon={IconBoard}
          navigate={navigate}
        />
      );
      break;
    case "settings":
      content = <SettingsPage />;
      break;
    case "subject": {
      if (!subject) {
        content = <DashboardPage navigate={navigate} />;
        break;
      }
      const tab = route.subjectTab ?? "overview";
      routeKey += `${subject.id}-${tab}`;
      if (tab === "topics") content = <SubjectTopicsPage subject={subject} />;
      else if (tab === "backlog")
        content = (
          <BacklogPage
            subject={subject}
            tab={route.backlogTab ?? "list"}
            onTab={(t) => setRoute((r) => ({ ...r, backlogTab: t }))}
          />
        );
      else if (tab === "notes") content = <SubjectNotesPage subject={subject} navigate={navigate} />;
      else content = <SubjectOverviewPage subject={subject} />;
      break;
    }
    default:
      content = <DashboardPage navigate={navigate} />;
  }

  return (
    <div className="min-h-screen">
      {/* لایه‌های محیطی پس‌زمینه */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 right-1/4 h-[420px] w-[420px] rounded-full bg-teal-600/[.07] blur-3xl" />
        <div className="absolute -left-32 bottom-10 h-[380px] w-[380px] rounded-full bg-amber-500/[.06] blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 rounded-full bg-sky-500/[.05] blur-3xl" />
      </div>

      <Sidebar route={route} navigate={navigate} open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* نوار بالای موبایل */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-wash/85 px-4 py-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="باز کردن منو"
          className="rounded-xl border border-line bg-surface p-2 text-ink shadow-sm transition active:scale-90"
        >
          <IconMenu size={18} />
        </button>
        <span className="font-display text-base font-extrabold text-ink">ارشدیار</span>
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">کنکور ارشد کامپیوتر</span>
      </div>

      <main className="relative z-10 px-4 pb-16 pt-6 sm:px-6 lg:pr-[300px] lg:pt-9">
        <div key={routeKey} className="mx-auto max-w-6xl">
          {content}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
