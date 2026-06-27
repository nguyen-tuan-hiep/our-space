export const appTimeZone = "UTC";

export function formatAppDate(value: string | Date, timeZone = appTimeZone) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(new Date(value));
}

export function formatAppDateTime(
  value: string | Date,
  timeZone = appTimeZone,
) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
}

export function formatAppMonthShort(
  value: string | Date,
  timeZone = appTimeZone,
) {
  return new Intl.DateTimeFormat("en-SG", {
    month: "short",
    year: "numeric",
    timeZone,
  }).format(new Date(value));
}

export function getAppMonthKey(value: string | Date, timeZone = appTimeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone,
  }).formatToParts(new Date(value));
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
}

export function formatAppDayMonthYear(
  value: string | Date,
  timeZone = appTimeZone,
) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(new Date(value));
}
