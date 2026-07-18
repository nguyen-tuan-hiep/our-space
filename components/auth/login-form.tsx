"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/components/feedback/toast";
import {
  NativeButton,
  NativeInput,
  NativeTabs,
} from "@/components/ui/native-controls";
import {
  requestPasswordReset,
  signInWithPassword,
  signUpWithPassword,
} from "@/app/actions";

type AuthMode = "signin" | "signup" | "forgot";

type LoginFormProps = {
  message?: string | null;
};

export function LoginForm({ message }: LoginFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [pending, startTransition] = useTransition();
  const isForgot = mode === "forgot";

  return (
    <div className="rounded-2xl border border-neutral-200 bg-paper p-6 sm:p-8">
      {message ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {message}
        </p>
      ) : null}
      {isForgot ? null : (
        <NativeTabs
          value={mode}
          onChange={setMode}
          options={[
            { value: "signin", label: "Sign in" },
            { value: "signup", label: "Sign up" },
          ]}
          className="border-b border-neutral-200"
        />
      )}
      <p className="eyebrow mt-4 sm:mt-6">
        {isForgot ? "Reset password" : mode === "signin" ? "Sign in" : "Sign up"}
      </p>
      <h2 className="mt-3 font-serif text-4xl leading-none">
        {isForgot
          ? "Get a reset link"
          : mode === "signin"
            ? "Welcome back"
            : "Create your space"}
      </h2>
      <form
        className="mt-8 grid gap-3"
        action={(formData) => {
          startTransition(async () => {
            const result = isForgot
              ? await requestPasswordReset(formData)
              : mode === "signin"
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
        {isForgot ? null : (
          <NativeInput
            required
            name="password"
            label="Password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />
        )}
        <NativeButton
          type="submit"
          disabled={pending}
          className="min-h-12"
        >
          {pending
            ? isForgot
              ? "Sending email..."
              : mode === "signin"
              ? "Signing in..."
              : "Creating account..."
            : isForgot
              ? "Send reset email"
              : mode === "signin"
              ? "Sign in"
              : "Sign up"}
        </NativeButton>
        {mode === "signin" ? (
          <button
            type="button"
            className="justify-self-center px-3 py-2 text-sm font-bold text-neutral-500 transition hover:text-neutral-950"
            onClick={() => setMode("forgot")}
          >
            Forgot password?
          </button>
        ) : null}
        {isForgot ? (
          <button
            type="button"
            className="justify-self-center px-3 py-2 text-sm font-bold text-neutral-500 transition hover:text-neutral-950"
            onClick={() => setMode("signin")}
          >
            Back to sign in
          </button>
        ) : null}
      </form>
    </div>
  );
}
