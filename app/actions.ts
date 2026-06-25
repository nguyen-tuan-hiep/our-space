"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@/lib/supabase/server";
import {
  expenseCategories,
  isAvatarKey,
  isCustomAvatarEmoji,
  locationSettings,
  normalizeGroupedNumberInput,
  supportedCurrencies,
  supportedLocations,
} from "@/lib/constants";
import type { CurrencyCode, ExpenseCategory, LocationCode } from "@/lib/types";

type ExpensePayload = {
  title: string;
  amount: number;
  currency: CurrencyCode;
  transaction_date: string;
  category: ExpenseCategory;
  notes: string | null;
};

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
  const currency = stringValue(formData, "currency") as CurrencyCode;
  const amount = numberValue(formData, "amount");
  const category = stringValue(formData, "category") as ExpenseCategory;
  const transactionDate = new Date(stringValue(formData, "transaction_date"));

  if (!expenseCategories.includes(category)) return fail("Invalid category.");
  if (!supportedCurrencies.includes(currency)) return fail("Invalid currency.");
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

export async function signInWithPassword(formData: FormData) {
  const supabase = await createClient();
  const email = stringValue(formData, "email");
  const password = stringValue(formData, "password");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return fail(error.message);

  revalidatePath("/");
  return ok("Logged in successfully!");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const displayName = stringValue(formData, "display_name");
  const avatar = stringValue(formData, "avatar");
  const location = stringValue(formData, "location") as LocationCode;

  if (displayName.length < 2 || displayName.length > 80) {
    return fail("Name must be between 2 and 80 characters.");
  }

  if (!isAvatarKey(avatar) && !isCustomAvatarEmoji(avatar)) {
    return fail("Please choose a valid avatar emoji.");
  }

  if (!supportedLocations.includes(location)) {
    return fail("Invalid default location.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      avatar_url: avatar,
      country_code: location,
      currency: locationSettings[location].currency,
    })
    .eq("id", user.id);

  if (error) return fail(error.message);
  revalidatePath("/");
  return ok("Profile updated successfully!");
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
  const heroImagePublicId = nullableStringValue(formData, "hero_image_public_id");

  if (!heroImageUrl.startsWith("https://")) {
    return fail("Please upload a valid hero image.");
  }

  const { data: currentSettings, error: settingsError } = await supabase
    .from("app_settings")
    .select("hero_image_public_id")
    .eq("id", "main")
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

  const { error } = await supabase.from("app_settings").upsert({
    id: "main",
    hero_image_url: heroImageUrl,
    hero_image_public_id: heroImagePublicId,
    updated_by: user.id,
  });

  if (error) return fail(error.message);
  revalidatePath("/");
  return ok("Hero image updated successfully!");
}

export async function createNote(formData: FormData) {
  const { supabase, user } = await requireUser();
  const recipientId = stringValue(formData, "recipient_id");
  const unlockAt = nullableStringValue(formData, "unlock_at");

  const { error } = await supabase.from("notes").insert({
    author_id: user.id,
    recipient_id: recipientId,
    title: stringValue(formData, "title"),
    content: stringValue(formData, "content"),
    unlock_at: unlockAt ? new Date(unlockAt).toISOString() : null,
  });

  if (error) return fail(error.message);
  revalidatePath("/");
  return ok("Note created successfully!");
}

export async function updateNote(formData: FormData) {
  const { supabase } = await requireUser();
  const noteId = stringValue(formData, "id");
  const unlockAt = nullableStringValue(formData, "unlock_at");

  const { error } = await supabase
    .from("notes")
    .update({
      title: stringValue(formData, "title"),
      content: stringValue(formData, "content"),
      unlock_at: unlockAt ? new Date(unlockAt).toISOString() : null,
    })
    .eq("id", noteId);

  if (error) return fail(error.message);
  revalidatePath("/");
  return ok("Note updated successfully!");
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

  const { error } = await supabase.from("individual_expenses").insert({
    owner_id: user.id,
    ...expense.payload,
  });

  if (error) return fail(error.message);
  revalidatePath("/");
  return ok("Expense logged successfully!");
}

export async function updateExpense(formData: FormData) {
  const { supabase } = await requireUser();
  const expenseId = stringValue(formData, "id");
  const expense = getExpensePayload(formData);
  if (!expense.ok) return expense;

  const { error } = await supabase
    .from("individual_expenses")
    .update(expense.payload)
    .eq("id", expenseId);

  if (error) return fail(error.message);
  revalidatePath("/");
  return ok("Transaction updated!");
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
