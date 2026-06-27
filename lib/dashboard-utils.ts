import type { IndividualExpense, SharedNote } from "@/lib/types";
import {
  formatAppDate,
  formatAppDayMonthYear,
  formatAppMonthShort,
  getAppMonthKey,
} from "@/lib/date-format";

export type FilterRange = "week" | "month";

export function getRelationshipStats(
  clock: Date,
  timeZone: string,
  anniversaryDate: string,
) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).formatToParts(clock);
  const getPart = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour = getPart("hour");
  const minute = getPart("minute");

  const [startYear = year, startMonth = month, startDay = day] =
    anniversaryDate.split("-").map(Number);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const today = Date.UTC(year, month - 1, day);
  const daysTogether = Math.max(0, Math.floor((today - start) / 86400000) + 1);

  const nextMonth =
    day > startDay || (day === startDay && (hour > 0 || minute > 0))
      ? month
      : month - 1;
  const nextMonthly = new Date(Date.UTC(year, nextMonth, startDay));

  const totalSeconds = Math.floor(
    Math.max(
      0,
      nextMonthly.getTime() - today - (hour * 3600 + minute * 60) * 1000,
    ) / 1000,
  );
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return {
    daysTogether,
    nextMonthlyLabel: formatAppDayMonthYear(nextMonthly, timeZone),
    countdown: `${days}d ${hours}h ${minutes}m`,
  };
}

function getLocalDateParts(value: string | Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(new Date(value));
  const getPart = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
  };
}

function getWeekKey(value: string | Date, timeZone: string) {
  const { year, month, day } = getLocalDateParts(value, timeZone);
  const localDayUtc = Date.UTC(year, month - 1, day);
  const dayOfWeek = new Date(localDayUtc).getUTCDay();
  const mondayOffset = (dayOfWeek + 6) % 7;
  const weekStart = new Date(localDayUtc - mondayOffset * 86400000);
  const weekYear = weekStart.getUTCFullYear();
  const weekMonth = String(weekStart.getUTCMonth() + 1).padStart(2, "0");
  const weekDay = String(weekStart.getUTCDate()).padStart(2, "0");

  return `${weekYear}-${weekMonth}-${weekDay}`;
}

function formatWeekLabel(weekKey: string, timeZone: string) {
  const [year, month, day] = weekKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day));
  const end = new Date(start.getTime() + 6 * 86400000);

  return `${formatAppDate(start, timeZone)} - ${formatAppDate(end, timeZone)}`;
}

export function getPeriodKey(
  value: string | Date,
  timeZone: string,
  range: FilterRange,
) {
  return range === "week"
    ? getWeekKey(value, timeZone)
    : getAppMonthKey(value, timeZone);
}

export function formatPeriodLabel(
  value: string,
  timeZone: string,
  range: FilterRange,
) {
  return range === "week"
    ? formatWeekLabel(value, timeZone)
    : formatAppMonthShort(`${value}-01T00:00:00.000Z`, timeZone);
}

export function getPeriodOptions(
  notes: SharedNote[],
  expenses: IndividualExpense[],
  now: Date,
  timeZone: string,
  range: FilterRange,
) {
  const keys = new Map<string, string>();
  [...notes, ...expenses].forEach((item) => {
    const dateValue =
      "transaction_date" in item ? item.transaction_date : item.created_at;
    const key = getPeriodKey(dateValue, timeZone, range);
    keys.set(key, formatPeriodLabel(key, timeZone, range));
  });

  const currentKey = getPeriodKey(now, timeZone, range);
  if (!keys.has(currentKey)) {
    keys.set(currentKey, formatPeriodLabel(currentKey, timeZone, range));
  }

  return Array.from(keys.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => b.value.localeCompare(a.value));
}

export function isInPeriod(
  dateValue: string,
  selectedPeriod: string,
  timeZone: string,
  range: FilterRange,
) {
  return (
    !selectedPeriod ||
    getPeriodKey(dateValue, timeZone, range) === selectedPeriod
  );
}
