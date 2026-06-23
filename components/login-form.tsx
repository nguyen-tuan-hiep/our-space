"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useSnackbar } from "notistack";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import { signInWithPassword } from "@/app/actions";

export function LoginForm() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [pending, startTransition] = useTransition();

  return (
    <Card className="border border-neutral-200 bg-white p-6 sm:p-8">
      <p className="eyebrow">Sign in</p>
      <h2 className="mt-3 font-serif text-4xl leading-none">Welcome back</h2>
      <form
        className="mt-8 grid gap-5"
        action={(formData) => {
          startTransition(async () => {
            const result = await signInWithPassword(formData);
            enqueueSnackbar(result.message, {
              variant: result.ok ? "success" : "error",
            });
            if (result.ok) router.push("/dashboard");
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
          autoComplete="current-password"
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={pending}
          className="min-h-12 bg-ink text-white hover:bg-neutral-700"
        >
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Card>
  );
}
