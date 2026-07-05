"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/components/toast";
import {
  NativeButton,
  NativeInput,
  NativeTabs,
} from "@/components/ui/native-controls";
import { signInWithPassword, signUpWithPassword } from "@/app/actions";

export function LoginForm() {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-neutral-200 bg-paper p-6 sm:p-8">
      <NativeTabs
        value={mode}
        onChange={setMode}
        options={[
          { value: "signin", label: "Sign in" },
          { value: "signup", label: "Sign up" },
        ]}
        className="border-b border-neutral-200"
      />
      <p className="eyebrow mt-6">{mode === "signin" ? "Sign in" : "Sign up"}</p>
      <h2 className="mt-3 font-serif text-4xl leading-none">
        {mode === "signin" ? "Welcome back" : "Create your space"}
      </h2>
      <form
        className="mt-8 grid gap-3"
        action={(formData) => {
          startTransition(async () => {
            const result =
              mode === "signin"
                ? await signInWithPassword(formData)
                : await signUpWithPassword(formData);
            toast(result.message, {
              variant: result.ok ? "success" : "error",
            });
            if (result.ok) {
              if (mode === "signin") {
                router.push("/");
              } else {
                setMode("signin");
              }
            }
            router.refresh();
          });
        }}
      >
        <NativeInput
          required
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
        />
        <NativeInput
          required
          name="password"
          label="Password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
        />
        <NativeButton
          type="submit"
          disabled={pending}
          className="min-h-12"
        >
          {pending
            ? mode === "signin"
              ? "Signing in..."
              : "Creating account..."
            : mode === "signin"
              ? "Sign in"
              : "Sign up"}
        </NativeButton>
      </form>
    </div>
  );
}
