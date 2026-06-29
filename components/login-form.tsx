"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/components/toast";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import { signInWithPassword, signUpWithPassword } from "@/app/actions";

export function LoginForm() {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [pending, startTransition] = useTransition();

  return (
    <Card className="border border-neutral-200 bg-paper p-6 sm:p-8 !shadow-2xl">
      <Tabs
        value={mode}
        onChange={(_, value) => setMode(value)}
        className="border-b border-neutral-200"
      >
        <Tab value="signin" label="Sign in" />
        <Tab value="signup" label="Sign up" />
      </Tabs>
      <p className="eyebrow mt-6">{mode === "signin" ? "Sign in" : "Sign up"}</p>
      <h2 className="mt-3 font-serif text-4xl leading-none">
        {mode === "signin" ? "Welcome back" : "Create your space"}
      </h2>
      <form
        className="mt-8 grid gap-5"
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
        <TextField
          required
          fullWidth
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
        />
        <TextField
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={pending}
          className="min-h-12 text-white hover:bg-neutral-700"
        >
          {pending
            ? mode === "signin"
              ? "Signing in..."
              : "Creating account..."
            : mode === "signin"
              ? "Sign in"
              : "Sign up"}
        </Button>
      </form>
    </Card>
  );
}
