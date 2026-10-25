"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updatePassword } from "@/app/actions";
import { useToast } from "@/components/feedback/toast";
import { NativeButton, NativeInput } from "@/components/ui/native-controls";

export function ResetPasswordForm() {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <div className="app-card p-6 sm:p-8">
      <p className="eyebrow">Reset password</p>
      <h1 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">
        Create a new password
      </h1>
      <form
        aria-busy={pending} className="mt-7 grid gap-4"
        action={(formData) => {
          startTransition(async () => {
            const result = await updatePassword(formData);
            toast(result.message, {
              variant: result.ok ? "success" : "error",
            });
            if (result.ok) router.push("/");
            router.refresh();
          });
        }}
      >
        <NativeInput
          required
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
        />
        <NativeInput
          required
          name="confirm_password"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
        />
        <NativeButton
          type="submit"
          disabled={pending}
          className="min-h-12"
        >
          {pending ? "Saving..." : "Save new password"}
        </NativeButton>
      </form>
    </div>
  );
}
