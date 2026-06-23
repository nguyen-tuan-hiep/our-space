import type { Session, User } from "@supabase/supabase-js";

export type CurrencyCode = "VND" | "SGD";

export type ExpenseCategory =
  | "Food & Drinks"
  | "Shopping"
  | "Travel/Transport"
  | "Entertainment"
  | "Groceries"
  | "Utilities"
  | "Others";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string;
  avatar_url: string | null;
  country_code: "VN" | "SG";
  currency: CurrencyCode;
  partner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  id: "main";
  hero_image_url: string | null;
  hero_image_public_id: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedNote {
  id: string;
  author_id: string;
  recipient_id: string;
  title: string;
  content: string;
  attachment_url: string | null;
  attachment_public_id: string | null;
  unlock_at: string | null;
  created_at: string;
  updated_at: string;
  author?: Pick<Profile, "id" | "display_name" | "avatar_url" | "currency">;
  recipient?: Pick<Profile, "id" | "display_name" | "avatar_url" | "currency">;
}

export interface IndividualExpense {
  id: string;
  owner_id: string;
  title: string;
  amount: number;
  currency: CurrencyCode;
  transaction_date: string;
  category: ExpenseCategory;
  notes: string | null;
  created_at: string;
  updated_at: string;
  owner?: Pick<Profile, "id" | "display_name" | "avatar_url" | "currency">;
}

export interface AppSession {
  session: Session;
  user: User;
  profile: Profile;
  partner: Profile | null;
}

export interface ExpensePoint {
  label: string;
  total: number;
  currency: CurrencyCode;
}

export interface CategoryPoint {
  category: ExpenseCategory;
  total: number;
  currency: CurrencyCode;
}

export interface FinanceAggregate {
  profile: Profile;
  week: ExpensePoint[];
  month: ExpensePoint[];
  categories: CategoryPoint[];
  total: number;
  currency: CurrencyCode;
}
