import { useRef, useState } from "react";
import { diffDays, faNum, formatJalaali, todayISO } from "../lib/jalali";
import { normalizeImport, useStore, type ImportResult } from "../store";
import { ConfirmModal } from "../components/ui";
import { DatePickerModal } from "../components/DatePickerModal";
import { IconCap, IconDownload, IconMoon, IconReset, IconSun, IconTrash, IconUpload } from "../components/Icons";

export function SettingsPage() {
  const { state, setExamDate, setTheme, importState, resetAll, clearData, restoreSamples, toast } = useStore();
  const [picker, setPicker] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmSamples, setConfirmSamples] = useState(false);
  const [pendingImport, setPendingImport] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const daysLeft = diffDays(state.settings.examDate, todayISO());
  const logDays = Object.keys(state.dayLogs).length;

  const exportData = () => {
    const payload = {
      app: "ersadyar",
      version: 1,
      exportedAt: new Date().toISOString(),
      data: state,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ersadyar-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("فایل پشتیبان دانلود شد");
  };

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(r.result));
      } catch {
        toast("فایل انتخابی JSON معتبر نیست", "warn");
        return;
      }
      const res = normalizeImport(parsed);
      if (!res.state) {
        toast(res.error ?? "فایل معتبر نیست", "warn");
        return;
      }
      setPendingImport(res);
    };
    r.readAsText(f);
    e.target.value = "";
  };

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div className="anim-page">
        <p className="text-xs font-bold tracking-wide text-brand">پیکربندی برنامه</p>
        <h1 className="font-display mt-1 text-3xl font-extrabold text-ink">تنظیمات</h1>
      </div>

      {/* کنکور */}
      <div className="anim-card rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand"><IconCap size={18} /></span>
          <h2 className="font-display text-base font-extrabold text-ink">تاریخ کنکور</h2>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-soft p-4">
          <div>
            <p className="font-display text-lg font-extrabold text-ink">{formatJalaali(state.settings.examDate, true)}</p>
            <p className="mt-1 text-xs font-semibold text-mut">
              {daysLeft >= 0
                ? `${faNum(daysLeft)} روز دیگر — با تغییر تاریخ، شمارش معکوس همه‌جا به‌روز می‌شود.`
                : "این تاریخ گذشته است — تاریخ کنکور بعدی را تنظیم کن."}
            </p>
          </div>
          <button
            onClick={() => setPicker(true)}
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/25 transition hover:brightness-110 active:scale-95"
          >
            تغییر تاریخ
          </button>
        </div>
      </div>

      {/* ظاهر */}
      <div className="anim-card rounded-2xl border border-line bg-surface p-5" style={{ animationDelay: "60ms" }}>
        <h2 className="font-display text-base font-extrabold text-ink">ظاهر برنامه</h2>
        <p className="mt-1 text-xs font-semibold text-mut">تم پیش‌فرض روشن است؛ هر وقت خواستی تیره‌اش کن.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {(
            [
              { id: "light", label: "روشن", icon: IconSun, desc: "پیش‌فرض" },
              { id: "dark", label: "تیره", icon: IconMoon, desc: "برای شب‌خوانی" },
            ] as const
          ).map((t) => {
            const active = state.settings.theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); toast(`تم ${t.label} فعال شد`); }}
                className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-start transition-all active:scale-[.98] ${
                  active ? "border-brand bg-brand/[.06] shadow-md shadow-brand/10" : "border-line hover:border-mut/40"
                }`}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-brand text-white" : "bg-soft text-mut"}`}>
                  <t.icon size={19} />
                </span>
                <span>
                  <span className={`block text-sm font-extrabold ${active ? "text-brand" : "text-ink"}`}>{t.label}</span>
                  <span className="text-[11px] font-semibold text-mut">{t.desc}</span>
                </span>
                {active && <span className="mr-auto h-2.5 w-2.5 rounded-full bg-brand" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* داده‌ها */}
      <div className="anim-card rounded-2xl border border-line bg-surface p-5" style={{ animationDelay: "120ms" }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-extrabold text-ink">پشتیبان‌گیری و داده‌ها</h2>
          <div className="flex flex-wrap gap-1.5 text-[11px] font-extrabold">
            <span className="rounded-lg bg-soft px-2 py-1 text-mut">{faNum(state.tasks.length)} تسک</span>
            <span className="rounded-lg bg-soft px-2 py-1 text-mut">{faNum(state.notes.length)} یادداشت</span>
            <span className="rounded-lg bg-soft px-2 py-1 text-mut">{faNum(logDays)} روز ثبت‌شده</span>
          </div>
        </div>
        <p className="mt-1 text-xs font-semibold text-mut">
          همه‌چیز فقط روی همین دستگاه (localStorage مرورگر) ذخیره می‌شود — برای جابه‌جایی یا اطمینان، پشتیبان بگیر.
        </p>

        {/* پشتیبان */}
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <button onClick={exportData} className="flex items-center gap-3 rounded-2xl border border-line p-3.5 text-start transition hover:border-brand/50 hover:bg-brand/[.03] active:scale-[.98]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"><IconDownload size={18} /></span>
            <span>
              <span className="block text-sm font-extrabold text-ink">گرفتن پشتیبان</span>
              <span className="block text-[11px] font-semibold text-mut">خروجی کامل به صورت فایل JSON</span>
            </span>
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-3 rounded-2xl border border-line p-3.5 text-start transition hover:border-brand/50 hover:bg-brand/[.03] active:scale-[.98]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"><IconUpload size={18} /></span>
            <span>
              <span className="block text-sm font-extrabold text-ink">وارد کردن پشتیبان</span>
              <span className="block text-[11px] font-semibold text-mut">با اعتبارسنجی و تأیید قبل از جایگزینی</span>
            </span>
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImportFile} />
        </div>

        {/* داده‌های نمونه */}
        <div className="mt-4 rounded-2xl border border-dashed border-line p-3.5">
          <p className="text-[12px] font-extrabold text-ink">داده‌های نمونه</p>
          <p className="mt-0.5 text-[11px] font-semibold leading-5 text-mut">
            برای تست، می‌توانی تسک‌ها، گزارش روزانه و یادداشت‌های نمونه را پاک کنی یا دوباره برگردانی. درس‌ها و ریزمباحث همیشه حفظ می‌شوند.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => setConfirmClear(true)} className="inline-flex items-center gap-2 rounded-xl border border-line px-3.5 py-2 text-[13px] font-bold text-ink transition hover:border-rose-300 hover:text-rose-600 active:scale-95">
              <IconTrash size={15} />
              پاک کردن داده‌ها (شروع تازه)
            </button>
            <button onClick={() => setConfirmSamples(true)} className="inline-flex items-center gap-2 rounded-xl border border-brand/40 px-3.5 py-2 text-[13px] font-bold text-brand transition hover:bg-brand/10 active:scale-95">
              <IconReset size={15} />
              بازگردانی داده‌های نمونه
            </button>
          </div>
        </div>

        {/* بازنشانی کامل */}
        <button onClick={() => setConfirmReset(true)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-600 hover:text-white dark:border-rose-900 active:scale-[.98]">
          <IconReset size={16} />
          بازنشانی کامل برنامه (همه‌چیز به حالت اولیه)
        </button>
      </div>

      {/* درباره */}
      <div className="anim-card rounded-2xl border border-dashed border-line bg-surface/60 p-5 text-center" style={{ animationDelay: "180ms" }}>
        <p className="font-display text-sm font-extrabold text-ink">ارشدیار — نسخه ۱٫۰</p>
        <p className="mx-auto mt-1.5 max-w-md text-xs font-semibold leading-6 text-mut">
          دستیار شخصی برنامه‌ریزی برای کنکور کارشناسی ارشد مهندسی کامپیوتر؛ کاملاً آفلاین، بدون ثبت‌نام و بدون سرور.
        </p>
      </div>

      <DatePickerModal
        open={picker}
        onClose={() => setPicker(false)}
        value={state.settings.examDate}
        onChange={(d) => {
          if (d) {
            setExamDate(d);
            toast("تاریخ کنکور به‌روزرسانی شد");
          }
        }}
        title="تاریخ روز کنکور"
      />
      <ConfirmModal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="بازنشانی کامل"
        confirmLabel="بازنشانی"
        message="همه تسک‌ها، مباحث، یادداشت‌ها و تنظیمات به حالت اولیه برمی‌گردد. قبلش خروجی پشتیبان بگیری بهتر است!"
        onConfirm={() => {
          resetAll();
          toast("برنامه به حالت اولیه برگشت", "warn");
        }}
      />
      <ConfirmModal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="پاک کردن داده‌ها"
        confirmLabel="پاک کن"
        message={
          <>
            همه <b>{faNum(state.tasks.length)} تسک</b>، <b>{faNum(logDays)} روز گزارش</b> و <b>{faNum(state.notes.length)} یادداشت</b> پاک
            می‌شوند تا از صفر شروع کنی. درس‌ها، ریزمباحث و تنظیمات دست‌نخورده می‌مانند. این عمل قابل بازگشت نیست — مگر با وارد کردن پشتیبان.
          </>
        }
        onConfirm={() => {
          clearData();
          toast("داده‌ها پاک شد — شروع تازه", "warn");
        }}
      />
      <ConfirmModal
        open={confirmSamples}
        onClose={() => setConfirmSamples(false)}
        title="بازگردانی داده‌های نمونه"
        confirmLabel="بازگردانی"
        message="تسک‌ها، گزارش‌های روزانه و یادداشت‌های فعلی با داده‌های نمونه جایگزین می‌شوند (برای تست). درس‌ها و تنظیمات حفظ می‌شوند."
        onConfirm={() => {
          restoreSamples();
          toast("داده‌های نمونه برگشتند");
        }}
      />
      <ConfirmModal
        open={pendingImport !== null}
        onClose={() => setPendingImport(null)}
        title="وارد کردن پشتیبان"
        confirmLabel="جایگزین کن"
        message={
          pendingImport ? (
            <>
              فایل معتبر است و شامل <b>{faNum(pendingImport.counts.tasks)} تسک</b>، <b>{faNum(pendingImport.counts.subjects)} درس</b> و{" "}
              <b>{faNum(pendingImport.counts.notes)} یادداشت</b> است. همه داده‌های فعلی با این فایل <b>جایگزین</b> می‌شوند. ادامه بدهم؟
            </>
          ) : (
            ""
          )
        }
        onConfirm={() => {
          if (pendingImport?.state) {
            importState(pendingImport.state);
            toast(`وارد شد: ${faNum(pendingImport.counts.tasks)} تسک و ${faNum(pendingImport.counts.notes)} یادداشت`);
          }
        }}
      />
    </div>
  );
}
