"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useSnackbar } from "notistack";
import { pairWithCode } from "@/app/actions";

export function PairingForm() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_auto]"
      action={(formData) => {
        startTransition(async () => {
          const result = await pairWithCode(formData);
          enqueueSnackbar(result.message, {
            variant: result.ok ? "success" : "error",
          });
          if (result.ok) router.refresh();
        });
      }}
    >
      <TextField
        required
        name="pair_code"
        label="Partner pairing code"
        placeholder="AB12CD34"
        slotProps={{
          htmlInput: {
            maxLength: 16,
            style: { textTransform: "uppercase" },
          },
        }}
      />
      <Button
        type="submit"
        variant="contained"
        disabled={pending}
        className="min-h-14 px-6 text-white hover:bg-neutral-700"
      >
        {pending ? "Sending..." : "Send request"}
      </Button>
    </form>
  );
}
