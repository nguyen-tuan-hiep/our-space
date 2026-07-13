"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@/lib/supabase/server";
import { getCoupleId } from "@/lib/couple-settings";
import { getAppSession } from "@/lib/auth";
import { getFinanceData } from "@/lib/data";
import {
  defaultCountryCode,
  defaultCurrency,
  defaultTimeZone,
  expenseCategories,
  isCustomAvatarEmoji,
  isValidCountryCode,
  isValidCurrencyCode,
  memoryTypeValues,
  movieCategories,
  movieStatuses,
  normalizeCountryCode,
  normalizeCurrencyCode,
  normalizeGroupedNumberInput,
} from "@/lib/constants";
import type {
  CurrencyCode,
  DailyMood,
  ExpenseCategory,
  IndividualExpense,
  MemoryMapEntry,
  MemoryType,
  Movie,
  MovieCategory,
  MovieStatus,
  MoodLevel,
  SharedNote,
} from "@/lib/types";

type ExpensePayload = {
  title: string;
  amount: number;
  currency: CurrencyCode;
  transaction_date: string;
  category: ExpenseCategory;
  notes: string | null;
};

type MemoryPayload = {
  title: string;
  description: string | null;
  memory_type: MemoryType;
  latitude: number;
  longitude: number;
  visited_at: string;
  photo_url: string | null;
  photo_public_id: string | null;
};

type MoviePayload = {
  title: string;
  rating: number | null;
  poster_url: string | null;
  category: MovieCategory;
  status: MovieStatus;
  comment: string | null;
  reaction: string | null;
};

const moodLevels: MoodLevel[] = [
  "great",
  "excited",
  "happy",
  "calm",
  "okay",
  "tired",
  "stressed",
  "sad",
];

const memoryTypes = memoryTypeValues;

function ok(message: string): { ok: true; message: string } {
  return { ok: true, message };
}

function fail(message: string): { ok: false; message: string } {
  return { ok: false, message };
}

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableStringValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return value.length ? value : null;
}

function numberValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return Number(normalizeGroupedNumberInput(value));
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("You must be signed in.");
  return { supabase, user };
}

function getExpensePayload(
  formData: FormData,
): { ok: true; payload: ExpensePayload } | { ok: false; message: string } {
  const currency = normalizeCurrencyCode(stringValue(formData, "currency"));
  const amount = numberValue(formData, "amount");
  const category = stringValue(formData, "category") as ExpenseCategory;
  const transactionDate = new Date(stringValue(formData, "transaction_date"));

  if (!expenseCategories.includes(category)) return fail("Invalid category.");
  if (!isValidCurrencyCode(currency)) return fail("Invalid currency.");
  if (!Number.isFinite(amount) || amount <= 0) return fail("Invalid amount.");
  if (Number.isNaN(transactionDate.getTime())) {
    return fail("Please choose a valid transaction date.");
  }

  return {
    ok: true,
    payload: {
      title: stringValue(formData, "title"),
      amount,
      currency,
      transaction_date: transactionDate.toISOString(),
      category,
      notes: nullableStringValue(formData, "notes"),
    },
  };
}

function getMemoryPayload(
  formData: FormData,
): { ok: true; payload: MemoryPayload } | { ok: false; message: string } {
  const memoryType = stringValue(formData, "memory_type") as MemoryType;
  const latitude = Number(stringValue(formData, "latitude"));
  const longitude = Number(stringValue(formData, "longitude"));
  const visitedAt = new Date(stringValue(formData, "visited_at"));
  const title = stringValue(formData, "title");

  if (!title) return fail("Please enter a memory title.");
  if (!memoryTypes.includes(memoryType)) {
    return fail("Please choose a valid memory type.");
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return fail("Latitude must be between -90 and 90.");
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return fail("Longitude must be between -180 and 180.");
  }
  if (Number.isNaN(visitedAt.getTime())) {
    return fail("Please choose a valid memory date.");
  }

  return {
    ok: true,
    payload: {
      title,
      description: nullableStringValue(formData, "description"),
      memory_type: memoryType,
      latitude,
      longitude,
      visited_at: visitedAt.toISOString(),
      photo_url: nullableStringValue(formData, "photo_url"),
      photo_public_id: nullableStringValue(formData, "photo_public_id"),
    },
  };
}

function getMoviePayload(
  formData: FormData,
): { ok: true; payload: MoviePayload } | { ok: false; message: string } {
  const title = stringValue(formData, "title");
  const ratingValue = stringValue(formData, "rating");
  const rating = ratingValue ? Number(ratingValue) : null;
  const category = stringValue(formData, "category") as MovieCategory;
  const status = stringValue(formData, "status") as MovieStatus;
  const reaction = nullableStringValue(formData, "reaction");

  if (!title) return fail("Please enter a movie title.");
  if (title.length > 160) return fail("Movie title must be 160 characters or fewer.");
  if (
    rating !== null &&
    (!Number.isFinite(rating) ||
      rating < 1 ||
      rating > 10 ||
      !Number.isInteger(rating * 2))
  ) {
    return fail("Rating must be from 1 to 10 in 0.5 steps.");
  }
  if (!movieCategories.includes(category)) {
    return fail("Please choose a valid movie category.");
  }
  if (!movieStatuses.includes(status)) {
    return fail("Please choose a valid movie status.");
  }
  if (reaction && !isCustomAvatarEmoji(reaction)) {
    return fail("Reaction must be one emoji.");
  }

  return {
    ok: true,
    payload: {
      title,
      rating,
      poster_url: nullableStringValue(formData, "poster_url"),
      category,
      status,
      comment: nullableStringValue(formData, "comment"),
      reaction,
    },
  };
}

export async function signInWithPassword(formData: FormData) {
  const supabase = await createClient();
  const email = stringValue(formData, "email");
  const password = stringValue(formData, "password");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return fail(error.message);

  revalidatePath("/");
  return ok("Logged in successfully!");
}

export async function signUpWithPassword(formData: FormData) {
  const supabase = await createClient();
  const email = stringValue(formData, "email").toLowerCase();
  const password = stringValue(formData, "password");

  if (password.length < 8) {
    return fail("Password must be at least 8 characters.");
  }

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) return fail(error.message);

  revalidatePath("/");
  return ok("Account created. Please sign in to continue.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createMissingProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const displayName =
    stringValue(formData, "display_name") ||
    user.user_metadata.display_name ||
    user.email?.split("@")[0] ||
    "New user";
  const avatar = stringValue(formData, "avatar") || "💖";
  const countryCode = normalizeCountryCode(
    stringValue(formData, "country_code") || defaultCountryCode,
  );
  const currency = normalizeCurrencyCode(
    stringValue(formData, "currency") || defaultCurrency,
  );
  const timeZone = stringValue(formData, "time_zone") || defaultTimeZone;

  if (displayName.length < 2 || displayName.length > 80) {
    return fail("Name must be between 2 and 80 characters.");
  }

  if (!isCustomAvatarEmoji(avatar)) {
    return fail("Please choose a valid avatar emoji.");
  }

  if (!isValidCountryCode(countryCode)) {
    return fail("Please enter a valid 2-letter country code.");
  }

  if (!isValidCurrencyCode(currency)) {
    return fail("Please enter a valid 3-letter currency code.");
  }

  if (!timeZone || timeZone.length > 80) {
    return fail("Please enter a valid time zone.");
  }

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    email: user.email ?? null,
    display_name: displayName,
    avatar_url: avatar,
    country_code: countryCode,
    currency,
    time_zone: timeZone,
  });

  if (error) return fail(error.message);
  revalidatePath("/");
  return ok("Profile created successfully.");
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const displayName = stringValue(formData, "display_name");
  const avatar = stringValue(formData, "avatar");
  const countryCode = normalizeCountryCode(stringValue(formData, "country_code"));
  const currency = normalizeCurrencyCode(stringValue(formData, "currency"));
  const timeZone = stringValue(formData, "time_zone");

  if (displayName.length < 2 || displayName.length > 80) {
    return fail("Name must be between 2 and 80 characters.");
  }

  if (!isCustomAvatarEmoji(avatar)) {
    return fail("Please choose a valid avatar emoji.");
  }

  if (!isValidCountryCode(countryCode)) {
    return fail("Please enter a valid 2-letter country code.");
  }

  if (!isValidCurrencyCode(currency)) {
    return fail("Please enter a valid 3-letter currency code.");
  }

  if (!timeZone || timeZone.length > 80) {
    return fail("Please enter a valid time zone.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      avatar_url: avatar,
      country_code: countryCode,
      currency,
      time_zone: timeZone,
    })
    .eq("id", user.id);

  if (error) return fail(error.message);
  revalidatePath("/");
  return ok("Profile updated successfully!");
}

export async function pairWithCode(formData: FormData) {
  const { supabase } = await requireUser();
  const pairCode = stringValue(formData, "pair_code");

  if (!/^[A-Za-z0-9]{6,16}$/.test(pairCode)) {
    return fail("Please enter a valid pairing code.");
  }

  const { error } = await supabase.rpc("request_pairing_with_code", {
    target_pair_code: pairCode,
  });

  if (error) return fail(error.message);
  revalidatePath("/");
  return ok("Pairing request sent. Your partner needs to accept it.");
}

export async function acceptPairingRequest(formData: FormData) {
  const { supabase } = await requireUser();
  const requestId = stringValue(formData, "request_id");

  if (!requestId) {
    return fail("Missing pairing request.");
  }

  const { error } = await supabase.rpc("accept_pairing_request", {
    pairing_request_id: requestId,
  });

  if (error) return fail(error.message);
  revalidatePath("/");
  return ok("Pairing accepted!");
}

export async function updatePassword(formData: FormData) {
  const { supabase } = await requireUser();
  const password = stringValue(formData, "password");
  const confirmPassword = stringValue(formData, "confirm_password");

  if (password.length < 8) {
    return fail("Password must be at least 8 characters.");
  }

  if (password !== confirmPassword) {
    return fail("Passwords do not match.");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return fail(error.message);
  return ok("Password changed successfully!");
}

export async function updateHeroImage(formData: FormData) {
  const { supabase, user } = await requireUser();
  const heroImageUrl = stringValue(formData, "hero_image_url");
  const heroImagePublicId = nullableStringValue(
    formData,
    "hero_image_public_id",
  );

  if (!heroImageUrl.startsWith("https://")) {
    return fail("Please upload a valid hero image.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, partner_id")
    .eq("id", user.id)
    .maybeSingle<{ id: string; partner_id: string | null }>();

  if (profileError) return fail(profileError.message);
  if (!profile?.partner_id) {
    return fail("Please pair with your partner before changing the hero image.");
  }

  const settingsId = getCoupleId(profile, { id: profile.partner_id });

  const { data: currentSettings, error: settingsError } = await supabase
    .from("couple")
    .select("hero_image_public_id")
    .eq("id", settingsId)
    .maybeSingle();

  if (settingsError) return fail(settingsError.message);

  const currentHeroPublicId = currentSettings?.hero_image_public_id ?? null;

  if (
    currentHeroPublicId &&
    currentHeroPublicId !== heroImagePublicId &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  ) {
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    await cloudinary.uploader.destroy(currentHeroPublicId, {
      resource_type: "image",
      invalidate: true,
    });
  }

  const { error } = await supabase.from("couple").upsert({
    id: settingsId,
    hero_image_url: heroImageUrl,
    hero_image_public_id: heroImagePublicId,
    updated_by: user.id,
  });

  if (error) return fail(error.message);
  revalidatePath("/");
  return ok("Hero image updated successfully!");
}

export async function updateAnniversary(formData: FormData) {
  const { supabase, user } = await requireUser();
  const anniversaryDate = stringValue(formData, "anniversary_date");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(anniversaryDate)) {
    return fail("Please choose a valid anniversary date.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, partner_id")
    .eq("id", user.id)
    .maybeSingle<{ id: string; partner_id: string | null }>();

  if (profileError) return fail(profileError.message);
  if (!profile?.partner_id) {
    return fail("Please pair with your partner before editing anniversary.");
  }

  const settingsId = getCoupleId(profile, { id: profile.partner_id });
  const { error } = await supabase.from("couple").upsert({
    id: settingsId,
    anniversary_date: anniversaryDate,
    updated_by: user.id,
  });

  if (error) return fail(error.message);
  revalidatePath("/");
  return ok("Anniversary updated successfully!");
}

export async function createNote(formData: FormData) {
  const { supabase, user } = await requireUser();
  const recipientId = stringValue(formData, "recipient_id");
  const unlockAt = nullableStringValue(formData, "unlock_at");

  const { data, error } = await supabase
    .from("notes")
    .insert({
      author_id: user.id,
      recipient_id: recipientId,
      title: stringValue(formData, "title"),
      content: stringValue(formData, "content"),
      unlock_at: unlockAt ? new Date(unlockAt).toISOString() : null,
    })
    .select(
      "*, author:profiles!notes_author_id_fkey(id, display_name, avatar_url, currency), recipient:profiles!notes_recipient_id_fkey(id, display_name, avatar_url, currency)",
    )
    .single<SharedNote>();

  if (error) return fail(error.message);
  revalidatePath("/");
  return { ...ok("Note created successfully!"), note: data };
}

export async function updateNote(formData: FormData) {
  const { supabase } = await requireUser();
  const noteId = stringValue(formData, "id");
  const unlockAt = nullableStringValue(formData, "unlock_at");

  const { data, error } = await supabase
    .from("notes")
    .update({
      title: stringValue(formData, "title"),
      content: stringValue(formData, "content"),
      unlock_at: unlockAt ? new Date(unlockAt).toISOString() : null,
    })
    .eq("id", noteId)
    .select(
      "*, author:profiles!notes_author_id_fkey(id, display_name, avatar_url, currency), recipient:profiles!notes_recipient_id_fkey(id, display_name, avatar_url, currency)",
    )
    .single<SharedNote>();

  if (error) return fail(error.message);
  revalidatePath("/");
  return { ...ok("Note updated successfully!"), note: data };
}

export async function deleteNote(noteId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("notes").delete().eq("id", noteId);

  if (error) return fail(error.message);
  revalidatePath("/");
  return ok("Note deleted!");
}

export async function createExpense(formData: FormData) {
  const { supabase, user } = await requireUser();
  const expense = getExpensePayload(formData);
  if (!expense.ok) return expense;

  const { data, error } = await supabase
    .from("individual_expenses")
    .insert({
      owner_id: user.id,
      ...expense.payload,
    })
    .select("*")
    .single<IndividualExpense>();

  if (error) return fail(error.message);
  revalidatePath("/");
  return { ...ok("Expense logged successfully!"), expense: data };
}

export async function updateExpense(formData: FormData) {
  const { supabase } = await requireUser();
  const expenseId = stringValue(formData, "id");
  const expense = getExpensePayload(formData);
  if (!expense.ok) return expense;

  const { data, error } = await supabase
    .from("individual_expenses")
    .update(expense.payload)
    .eq("id", expenseId)
    .select("*")
    .single<IndividualExpense>();

  if (error) return fail(error.message);
  revalidatePath("/");
  return { ...ok("Transaction updated!"), expense: data };
}

export async function deleteExpense(expenseId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("individual_expenses")
    .delete()
    .eq("id", expenseId);

  if (error) return fail(error.message);
  revalidatePath("/");
  return ok("Transaction removed!");
}


export async function upsertMood(formData: FormData) {
  const { supabase, user } = await requireUser();
  const moodDate = stringValue(formData, "mood_date");
  const mood = stringValue(formData, "mood") as MoodLevel;
  const note = nullableStringValue(formData, "note");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(moodDate)) {
    return fail("Please choose a valid date.");
  }

  if (!moodLevels.includes(mood)) {
    return fail("Please choose a valid mood.");
  }

  if (note && note.length > 500) {
    return fail("Mood note must be 500 characters or fewer.");
  }

  const { data, error } = await supabase
    .from("daily_moods")
    .upsert(
      {
        owner_id: user.id,
        mood_date: moodDate,
        mood,
        note,
      },
      { onConflict: "owner_id,mood_date" },
    )
    .select(
      "*, owner:profiles!daily_moods_owner_id_fkey(id, display_name, avatar_url, currency)",
    )
    .single<DailyMood>();

  if (error) return fail(error.message);
  revalidatePath("/");
  return { ...ok("Mood saved."), mood: data };
}

export async function deleteMood(moodId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("daily_moods").delete().eq("id", moodId);

  if (error) return fail(error.message);
  revalidatePath("/");
  return ok("Mood removed.");
}

export async function createMemory(formData: FormData) {
  const { supabase, user } = await requireUser();
  const memory = getMemoryPayload(formData);
  if (!memory.ok) return memory;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, partner_id")
    .eq("id", user.id)
    .maybeSingle<{ id: string; partner_id: string | null }>();

  if (profileError) return fail(profileError.message);
  if (!profile?.partner_id) {
    return fail("Please pair with your partner before adding memories.");
  }

  const coupleId = getCoupleId(profile, { id: profile.partner_id });
  const { data, error } = await supabase
    .from("memory_map_entries")
    .insert({
      ...memory.payload,
      couple_id: coupleId,
      created_by: user.id,
    })
    .select(
      "*, creator:profiles!memory_map_entries_created_by_fkey(id, display_name, avatar_url, currency)",
    )
    .single<MemoryMapEntry>();

  if (error) return fail(error.message);
  revalidatePath("/");
  return { ...ok("Memory added to the map."), memory: data };
}

export async function updateMemory(formData: FormData) {
  const { supabase, user } = await requireUser();
  const memoryId = stringValue(formData, "id");
  const memory = getMemoryPayload(formData);
  if (!memory.ok) return memory;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, partner_id")
    .eq("id", user.id)
    .maybeSingle<{ id: string; partner_id: string | null }>();

  if (profileError) return fail(profileError.message);
  if (!profile?.partner_id) {
    return fail("Please pair with your partner before editing memories.");
  }

  const coupleId = getCoupleId(profile, { id: profile.partner_id });
  const { data, error } = await supabase
    .from("memory_map_entries")
    .update({
      ...memory.payload,
      couple_id: coupleId,
    })
    .eq("id", memoryId)
    .select(
      "*, creator:profiles!memory_map_entries_created_by_fkey(id, display_name, avatar_url, currency)",
    )
    .single<MemoryMapEntry>();

  if (error) return fail(error.message);
  revalidatePath("/");
  return { ...ok("Memory updated."), memory: data };
}

export async function deleteMemory(memoryId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("memory_map_entries")
    .delete()
    .eq("id", memoryId);

  if (error) return fail(error.message);
  revalidatePath("/");
  return ok("Memory deleted.");
}

export async function createMovie(formData: FormData) {
  const { supabase, user } = await requireUser();
  const movie = getMoviePayload(formData);
  if (!movie.ok) return movie;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, partner_id")
    .eq("id", user.id)
    .maybeSingle<{ id: string; partner_id: string | null }>();

  if (profileError) return fail(profileError.message);
  if (!profile?.partner_id) {
    return fail("Please pair with your partner before adding movies.");
  }

  const coupleId = getCoupleId(profile, { id: profile.partner_id });
  const { data, error } = await supabase
    .from("movies")
    .insert({
      ...movie.payload,
      couple_id: coupleId,
      created_by: user.id,
    })
    .select(
      "*, creator:profiles!movies_created_by_fkey(id, display_name, avatar_url, currency)",
    )
    .single<Movie>();

  if (error) return fail(error.message);
  revalidatePath("/");
  return { ...ok("Movie added."), movie: data };
}

export async function updateMovie(formData: FormData) {
  const { supabase, user } = await requireUser();
  const movieId = stringValue(formData, "id");
  const movie = getMoviePayload(formData);
  if (!movie.ok) return movie;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, partner_id")
    .eq("id", user.id)
    .maybeSingle<{ id: string; partner_id: string | null }>();

  if (profileError) return fail(profileError.message);
  if (!profile?.partner_id) {
    return fail("Please pair with your partner before editing movies.");
  }

  const coupleId = getCoupleId(profile, { id: profile.partner_id });
  const { data, error } = await supabase
    .from("movies")
    .update({
      ...movie.payload,
      couple_id: coupleId,
    })
    .eq("id", movieId)
    .select(
      "*, creator:profiles!movies_created_by_fkey(id, display_name, avatar_url, currency)",
    )
    .single<Movie>();

  if (error) return fail(error.message);
  revalidatePath("/");
  return { ...ok("Movie updated."), movie: data };
}

export async function updateMovieStatus(movieId: string, status: MovieStatus) {
  const { supabase } = await requireUser();

  if (!movieStatuses.includes(status)) {
    return fail("Please choose a valid movie status.");
  }

  const { data, error } = await supabase
    .from("movies")
    .update({ status })
    .eq("id", movieId)
    .select(
      "*, creator:profiles!movies_created_by_fkey(id, display_name, avatar_url, currency)",
    )
    .single<Movie>();

  if (error) return fail(error.message);
  revalidatePath("/");
  return { ...ok("Movie status updated."), movie: data };
}

export async function deleteMovie(movieId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("movies").delete().eq("id", movieId);

  if (error) return fail(error.message);
  revalidatePath("/");
  return ok("Movie deleted.");
}

export async function loadFinanceDashboardData() {
  const appSession = await getAppSession();

  if (!appSession?.partner) {
    throw new Error("Please pair with your partner before viewing finances.");
  }

  return getFinanceData(appSession.profile, appSession.partner);
}
