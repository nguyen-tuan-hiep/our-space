import type { Session, User } from "@supabase/supabase-js";

export type CurrencyCode = "VND" | "SGD";
export type LocationCode = "VN" | "SG";

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
  onesignal_subscription_id: string | null;
  country_code: LocationCode;
  currency: CurrencyCode;
  partner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  id: "main";
  hero_image_url: string | null;
  hero_image_public_id: string | null;
  exchange_rate_sgd_vnd: number | null;
  exchange_rate_updated_at: string | null;
  exchange_rate_source: string | null;
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
