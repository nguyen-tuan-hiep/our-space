export const appTimeZone = "Asia/Singapore";

export function formatAppDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: appTimeZone,
  }).format(new Date(value));
}

export function formatAppDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: appTimeZone,
  }).format(new Date(value));
}

export function formatAppMonthLong(value: string | Date) {
  return new Intl.DateTimeFormat("en-SG", {
    month: "long",
    year: "numeric",
    timeZone: appTimeZone,
  }).format(new Date(value));
}

export function getAppMonthKey(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: appTimeZone,
  }).formatToParts(new Date(value));
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
}

export function formatAppDayMonthYear(value: string | Date) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: appTimeZone,
  }).format(new Date(value));
}
