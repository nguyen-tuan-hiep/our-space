import { convertCurrency } from "@/lib/constants";
import {
  type FilterRange,
  formatPeriodLabel,
  getPeriodKey,
} from "@/lib/dashboard-utils";
import { formatAppDate } from "@/lib/date-format";
import type {
  CurrencyCode,
  ExpenseCategory,
  IndividualExpense,
  Profile,
} from "@/lib/types";

function convertedAmount(
  expense: IndividualExpense,
  displayCurrency: CurrencyCode,
  exchangeRateSgdToVnd: number | null,
) {
  return convertCurrency(
    Number(expense.amount),
    expense.currency,
    displayCurrency,
    exchangeRateSgdToVnd,
  );
}

function getLocalDayKey(value: string | Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(new Date(value));
  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

function createEmptyChartRow(
  key: string,
  label: string,
  profiles: [Profile, Profile],
  displayCurrency: CurrencyCode,
) {
  return profiles.reduce<Record<string, number | string>>(
    (row, profile) => ({ ...row, [profile.id]: 0 }),
    { key, label, currency: displayCurrency },
  );
}

function seedWeekRows({
  selectedPeriod,
  profiles,
  displayCurrency,
  timeZone,
}: {
  selectedPeriod?: string;
  profiles: [Profile, Profile];
  displayCurrency: CurrencyCode;
  timeZone: string;
}) {
  const rows = new Map<string, Record<string, number | string>>();
  if (!selectedPeriod) return rows;

  const [year, month, day] = selectedPeriod.split("-").map(Number);
  if (!year || !month || !day) return rows;

  for (let index = 0; index < 7; index += 1) {
    const date = new Date(Date.UTC(year, month - 1, day + index));
    const key = getLocalDayKey(date, timeZone);
    rows.set(
      key,
      createEmptyChartRow(
        key,
        formatAppDate(date, timeZone),
        profiles,
        displayCurrency,
      ),
    );
  }

  return rows;
}

export function buildFinanceChartData({
  expenses,
  profiles,
  range,
  selectedPeriod,
  displayCurrency,
  exchangeRateSgdToVnd,
  timeZone,
}: {
  expenses: IndividualExpense[];
  profiles: [Profile, Profile];
  range: FilterRange;
  selectedPeriod?: string;
  displayCurrency: CurrencyCode;
  exchangeRateSgdToVnd: number | null;
  timeZone: string;
}) {
  const rows =
    range === "week"
      ? seedWeekRows({ selectedPeriod, profiles, displayCurrency, timeZone })
      : new Map<string, Record<string, number | string>>();

  expenses.forEach((expense) => {
    const key =
      range === "week"
        ? getLocalDayKey(expense.transaction_date, timeZone)
        : getPeriodKey(expense.transaction_date, timeZone, range);
    const label =
      range === "week"
        ? formatAppDate(expense.transaction_date, timeZone)
        : formatPeriodLabel(key, timeZone, range);
    const profile = profiles.find((person) => person.id === expense.owner_id);
    const converted = convertedAmount(
      expense,
      displayCurrency,
      exchangeRateSgdToVnd,
    );

    if (!profile || converted === null) return;

    const row =
      rows.get(key) ??
      createEmptyChartRow(key, label, profiles, displayCurrency);
    row[profile.id] = Number(row[profile.id] ?? 0) + converted;
    rows.set(key, row);
  });

  return Array.from(rows.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([_key, row]) => row);
}

export function buildFinanceBreakdowns({
  expenses,
  profiles,
  displayCurrency,
  exchangeRateSgdToVnd,
}: {
  expenses: IndividualExpense[];
  profiles: [Profile, Profile];
  displayCurrency: CurrencyCode;
  exchangeRateSgdToVnd: number | null;
}) {
  return profiles.map((profile) => {
    const categoryMap = new Map<ExpenseCategory, number>();
    const total = expenses
      .filter((expense) => expense.owner_id === profile.id)
      .reduce((sum, expense) => {
        const converted = convertedAmount(
          expense,
          displayCurrency,
          exchangeRateSgdToVnd,
        );
        if (converted === null) return sum;
        categoryMap.set(
          expense.category,
          (categoryMap.get(expense.category) ?? 0) + converted,
        );
        return sum + converted;
      }, 0);

    return {
      profile,
      total,
      categories: Array.from(categoryMap.entries()).map(([category, value]) => ({
        category,
        value,
        currency: displayCurrency,
      })),
    };
  });
}
