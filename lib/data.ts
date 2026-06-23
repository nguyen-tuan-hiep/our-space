import { startOfMonth, startOfWeek, subMonths, subWeeks } from "date-fns";
import type {
  AppSettings,
  CategoryPoint,
  CurrencyCode,
  ExpensePoint,
  FinanceAggregate,
  IndividualExpense,
  Profile,
  SharedNote,
} from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

function iso(date: Date) {
  return date.toISOString();
}

function bucketKey(dateValue: string, mode: "week" | "month") {
  const date = new Date(dateValue);
  if (mode === "week") {
    const first = startOfWeek(date, { weekStartsOn: 1 });
    return first.toLocaleDateString("en-SG", { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString("en-SG", { month: "short", year: "2-digit" });
}

function aggregateTimeline(
  expenses: IndividualExpense[],
  mode: "week" | "month",
  currency: CurrencyCode,
): ExpensePoint[] {
  const map = new Map<string, number>();
  expenses.forEach((expense) => {
    const key = bucketKey(expense.transaction_date, mode);
    map.set(key, (map.get(key) ?? 0) + Number(expense.amount));
  });

  return Array.from(map.entries()).map(([label, total]) => ({
    label,
    total,
    currency,
  }));
}

function aggregateCategories(
  expenses: IndividualExpense[],
  currency: CurrencyCode,
): CategoryPoint[] {
  const map = new Map<CategoryPoint["category"], number>();
  expenses.forEach((expense) => {
    map.set(expense.category, (map.get(expense.category) ?? 0) + Number(expense.amount));
  });

  return Array.from(map.entries()).map(([category, total]) => ({
    category,
    total,
    currency,
  }));
}

export async function getDashboardData(profile: Profile, partner: Profile | null) {
  const supabase = await createClient();
  const participantIds = [profile.id, partner?.id].filter(Boolean) as string[];

  const [{ data: notes }, { data: expenses }, { data: settings }] = await Promise.all([
    supabase
      .from("notes")
      .select("*, author:profiles!notes_author_id_fkey(id, display_name, avatar_url, currency), recipient:profiles!notes_recipient_id_fkey(id, display_name, avatar_url, currency)")
      .or(`author_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
      .order("created_at", { ascending: false })
      .returns<SharedNote[]>(),
    supabase
      .from("individual_expenses")
      .select("*, owner:profiles!individual_expenses_owner_id_fkey(id, display_name, avatar_url, currency)")
      .in("owner_id", participantIds)
      .order("transaction_date", { ascending: false })
      .returns<IndividualExpense[]>(),
    supabase
      .from("app_settings")
      .select("*")
      .eq("id", "main")
      .maybeSingle<AppSettings>(),
  ]);

  const now = new Date();
  const chartStart = iso(subMonths(now, 6));
  const recentExpenses = (expenses ?? []).filter(
    (expense) => new Date(expense.transaction_date) >= new Date(chartStart),
  );

  const buildAggregate = (person: Profile): FinanceAggregate => {
    const personExpenses = recentExpenses.filter(
      (expense) => expense.owner_id === person.id,
    );
    const weekStart = startOfWeek(subWeeks(now, 8), { weekStartsOn: 1 });
    const monthStart = startOfMonth(subMonths(now, 6));
    const weekExpenses = personExpenses.filter(
      (expense) => new Date(expense.transaction_date) >= weekStart,
    );
    const monthExpenses = personExpenses.filter(
      (expense) => new Date(expense.transaction_date) >= monthStart,
    );

    return {
      profile: person,
      week: aggregateTimeline(weekExpenses, "week", person.currency),
      month: aggregateTimeline(monthExpenses, "month", person.currency),
      categories: aggregateCategories(monthExpenses, person.currency),
      total: monthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
      currency: person.currency,
    };
  };

  return {
    notes: notes ?? [],
    expenses: expenses ?? [],
    aggregates: [buildAggregate(profile), ...(partner ? [buildAggregate(partner)] : [])],
    settings: settings ?? null,
  };
}
