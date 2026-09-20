import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js";

export const J_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

export const J_WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
export const J_WEEKDAYS_MIN = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** تبدیل ارقام لاتین به فارسی */
export function faNum(v: number | string): string {
  return String(v).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** تاریخ میلادی امروز به صورت ISO محلی */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysISO(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** اختلاف روز بین دو تاریخ (a - b) */
export function diffDays(a: string, b: string): number {
  return Math.round((parseISO(a).getTime() - parseISO(b).getTime()) / 86400000);
}

export function isoToJ(iso: string): { jy: number; jm: number; jd: number } {
  const d = parseISO(iso);
  return toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function jToISO(jy: number, jm: number, jd: number): string {
  const g = toGregorian(jy, jm, jd);
  return `${g.gy}-${pad2(g.gm)}-${pad2(g.gd)}`;
}

/** روز هفته: شنبه = ۰ … جمعه = ۶ */
export function weekdayIdx(iso: string): number {
  return (parseISO(iso).getDay() + 1) % 7;
}

export function formatJalaali(iso: string, withWeekday = false): string {
  const { jy, jm, jd } = isoToJ(iso);
  const core = `${faNum(jd)} ${J_MONTHS[jm - 1]} ${faNum(jy)}`;
  return withWeekday ? `${J_WEEKDAYS[weekdayIdx(iso)]}، ${core}` : core;
}

export function jMonthLen(jy: number, jm: number): number {
  return jalaaliMonthLength(jy, jm);
}

/** خانه‌های یک ماه شمسی برای تقویم (۶ ردیف ۷ ستونه، شروع از شنبه) */
export function monthGridDays(jy: number, jm: number): (number | null)[] {
  const startIdx = weekdayIdx(jToISO(jy, jm, 1));
  const len = jMonthLen(jy, jm);
  const cells: (number | null)[] = [];
  for (let i = 0; i < startIdx; i++) cells.push(null);
  for (let d = 1; d <= len; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export type DayTone = "late" | "today" | "tomorrow" | "soon" | "far";

/** برچسب نسبی روز نسبت به امروز: امروز، فردا، ۵ روز دیگر، ۳ روز تأخیر و… */
export function relativeDay(iso: string): { text: string; tone: DayTone } {
  const n = diffDays(iso, todayISO());
  if (n === 0) return { text: "امروز", tone: "today" };
  if (n === 1) return { text: "فردا", tone: "tomorrow" };
  if (n === 2) return { text: "پس‌فردا", tone: "soon" };
  if (n > 2 && n <= 21) return { text: `${faNum(n)} روز دیگر`, tone: "soon" };
  if (n > 21) {
    const { jm, jd } = isoToJ(iso);
    return { text: `${faNum(jd)} ${J_MONTHS[jm - 1]}`, tone: "far" };
  }
  return { text: `${faNum(-n)} روز تأخیر`, tone: "late" };
}

/** برچسب نسبی خنثی برای صفحه روز: امروز، دیروز، فردا، ۳ روز قبل/بعد */
export function neutralDayLabel(iso: string): string {
  const n = diffDays(iso, todayISO());
  if (n === 0) return "امروز";
  if (n === 1) return "فردا";
  if (n === -1) return "دیروز";
  if (n === 2) return "پس‌فردا";
  return n > 0 ? `${faNum(n)} روز بعد` : `${faNum(-n)} روز قبل`;
}

/** «۲ ساعت و ۴۵ دقیقه» */
export function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${faNum(m)} دقیقه`;
  if (m === 0) return `${faNum(h)} ساعت`;
  return `${faNum(h)} ساعت و ${faNum(m)} دقیقه`;
}

/** همه روزهای یک ماه شمسی به صورت ISO */
export function monthDaysISO(jy: number, jm: number): string[] {
  const len = jMonthLen(jy, jm);
  return Array.from({ length: len }, (_, i) => jToISO(jy, jm, i + 1));
}

/** «۲٫۵ ساعت» برای نمودارها */
export function fmtHoursShort(mins: number): string {
  if (mins <= 0) return "—";
  if (mins < 60) return `${faNum(mins)} دقیقه`;
  const hrs = Math.round(mins / 30) / 2;
  const s = (Number.isInteger(hrs) ? String(hrs) : hrs.toFixed(1)).replace(".", "٫");
  return `${faNum(s)} ساعت`;
}
