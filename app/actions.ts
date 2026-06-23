"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { expenseCategories, isAvatarKey } from "@/lib/constants";
import type { CurrencyCode, ExpenseCategory } from "@/lib/types";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableStringValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return value.length ? value : null;
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

export async function signInWithPassword(formData: FormData) {
  const supabase = await createClient();
  const email = stringValue(formData, "email");
  const password = stringValue(formData, "password");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard");
  return { ok: true, message: "Logged in successfully!" };
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

  if (displayName.length < 2 || displayName.length > 80) {
    return { ok: false, message: "Name must be between 2 and 80 characters." };
  }

  if (!isAvatarKey(avatar)) {
    return { ok: false, message: "Please choose a valid avatar icon." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      avatar_url: avatar,
    })
    .eq("id", user.id);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard");
  return { ok: true, message: "Profile updated successfully!" };
}

export async function updatePassword(formData: FormData) {
  const { supabase } = await requireUser();
  const password = stringValue(formData, "password");
  const confirmPassword = stringValue(formData, "confirm_password");

  if (password.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { ok: false, message: "Passwords do not match." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Password changed successfully!" };
}

export async function updateHeroImage(formData: FormData) {
  const { supabase, user } = await requireUser();
  const heroImageUrl = stringValue(formData, "hero_image_url");
  const heroImagePublicId = nullableStringValue(formData, "hero_image_public_id");

  if (!heroImageUrl.startsWith("https://")) {
    return { ok: false, message: "Please upload a valid hero image." };
  }

  const { error } = await supabase.from("app_settings").upsert({
    id: "main",
    hero_image_url: heroImageUrl,
    hero_image_public_id: heroImagePublicId,
    updated_by: user.id,
  });

  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard");
  return { ok: true, message: "Hero image updated successfully!" };
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
    attachment_url: nullableStringValue(formData, "attachment_url"),
    attachment_public_id: nullableStringValue(formData, "attachment_public_id"),
    unlock_at: unlockAt ? new Date(unlockAt).toISOString() : null,
  });

  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard");
  return { ok: true, message: "Note created successfully!" };
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
      attachment_url: nullableStringValue(formData, "attachment_url"),
      attachment_public_id: nullableStringValue(formData, "attachment_public_id"),
      unlock_at: unlockAt ? new Date(unlockAt).toISOString() : null,
    })
    .eq("id", noteId);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard");
  return { ok: true, message: "Note updated successfully!" };
}

export async function deleteNote(noteId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("notes").delete().eq("id", noteId);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard");
  return { ok: true, message: "Note deleted!" };
}

export async function createExpense(formData: FormData) {
  const { supabase, user } = await requireUser();
  const amount = Number(stringValue(formData, "amount"));
  const currency = stringValue(formData, "currency") as CurrencyCode;
  const category = stringValue(formData, "category") as ExpenseCategory;
  const transactionDate = new Date(stringValue(formData, "transaction_date"));

  if (!expenseCategories.includes(category)) {
    return { ok: false, message: "Invalid category." };
  }

  if (Number.isNaN(transactionDate.getTime())) {
    return { ok: false, message: "Please choose a valid transaction date." };
  }

  const { error } = await supabase.from("individual_expenses").insert({
    owner_id: user.id,
    title: stringValue(formData, "title"),
    amount,
    currency,
    transaction_date: transactionDate.toISOString(),
    category,
    notes: nullableStringValue(formData, "notes"),
  });

  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard");
  return { ok: true, message: "Expense logged successfully!" };
}

export async function updateExpense(formData: FormData) {
  const { supabase } = await requireUser();
  const expenseId = stringValue(formData, "id");
  const amount = Number(stringValue(formData, "amount"));
  const category = stringValue(formData, "category") as ExpenseCategory;
  const transactionDate = new Date(stringValue(formData, "transaction_date"));

  if (!expenseCategories.includes(category)) {
    return { ok: false, message: "Invalid category." };
  }

  if (Number.isNaN(transactionDate.getTime())) {
    return { ok: false, message: "Please choose a valid transaction date." };
  }

  const { error } = await supabase
    .from("individual_expenses")
    .update({
      title: stringValue(formData, "title"),
      amount,
      transaction_date: transactionDate.toISOString(),
      category,
      notes: nullableStringValue(formData, "notes"),
    })
    .eq("id", expenseId);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard");
  return { ok: true, message: "Transaction updated!" };
}

export async function deleteExpense(expenseId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("individual_expenses")
    .delete()
    .eq("id", expenseId);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard");
  return { ok: true, message: "Transaction removed!" };
}
