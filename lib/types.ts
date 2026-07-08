import type { User } from "@supabase/supabase-js";

export type CurrencyCode = string;
export type LocationCode = string;

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
  country_code: LocationCode;
  currency: CurrencyCode;
  time_zone: string;
  pair_code: string | null;
  partner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PairingRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  created_at: string;
  updated_at: string;
  requester?: Pick<Profile, "id" | "display_name" | "avatar_url" | "pair_code">;
  recipient?: Pick<Profile, "id" | "display_name" | "avatar_url" | "pair_code">;
}

export interface AppSettings {
  id: string;
  hero_image_url: string | null;
  hero_image_public_id: string | null;
  anniversary_date: string | null;
  exchange_rates_base: string | null;
  exchange_rates: Record<string, number> | null;
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

export type MoodLevel =
  | "great"
  | "excited"
  | "happy"
  | "calm"
  | "okay"
  | "tired"
  | "stressed"
  | "sad";

export interface DailyMood {
  id: string;
  owner_id: string;
  mood_date: string;
  mood: MoodLevel;
  note: string | null;
  created_at: string;
  updated_at: string;
  owner?: Pick<Profile, "id" | "display_name" | "avatar_url" | "currency">;
}

export type MemoryType =
  | "date"
  | "food"
  | "trip"
  | "anniversary"
  | "photo"
  | "milestone"
  | "other";

export interface MemoryMapEntry {
  id: string;
  couple_id: string;
  title: string;
  description: string | null;
  memory_type: MemoryType;
  latitude: number;
  longitude: number;
  visited_at: string;
  photo_url: string | null;
  photo_public_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: Pick<Profile, "id" | "display_name" | "avatar_url" | "currency">;
}

export interface LoveQuote {
  text: string;
  author: string | null;
  source: string;
}

export interface AppSession {
  user: User;
  profile: Profile;
  partner: Profile | null;
}
