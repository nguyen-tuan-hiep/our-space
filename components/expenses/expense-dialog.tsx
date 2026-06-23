"use client";

import { useEffect, useState, useTransition } from "react";
import dayjs from "dayjs";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { useSnackbar } from "notistack";
import { createExpense, updateExpense } from "@/app/actions";
import { expenseCategories, currencySymbols } from "@/lib/constants";
import type { IndividualExpense, Profile } from "@/lib/types";

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  profile: Profile;
  expense?: IndividualExpense | null;
}

export function ExpenseDialog({
  open,
  onClose,
  profile,
  expense,
}: ExpenseDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState<dayjs.Dayjs | null>(dayjs());

  useEffect(() => {
    if (!open) return;
    setDate(expense ? dayjs(expense.transaction_date) : dayjs());
  }, [expense, open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle className="font-serif text-3xl">
        {expense ? "Edit transaction" : "Log expense"}
      </DialogTitle>
      <form
        action={(formData) => {
          formData.set("currency", profile.currency);
          formData.set("transaction_date", date ? date.toISOString() : dayjs().toISOString());
          if (expense) formData.set("id", expense.id);

          startTransition(async () => {
            const result = expense
              ? await updateExpense(formData)
              : await createExpense(formData);
            enqueueSnackbar(result.message, {
              variant: result.ok ? "success" : "error",
            });
            if (result.ok) onClose();
          });
        }}
      >
        <DialogContent className="grid gap-5 pt-3">
          <TextField
            required
            name="title"
            label="Title"
            defaultValue={expense?.title ?? ""}
          />
          <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
            <TextField
              required
              name="amount"
              label={`Amount (${currencySymbols[profile.currency]})`}
              type="number"
              inputProps={{ min: 0, step: profile.currency === "VND" ? 1000 : 0.01 }}
              defaultValue={expense?.amount ?? ""}
            />
            <TextField label="Currency" value={profile.currency} disabled />
          </div>
          <div className="border border-neutral-200 p-4">
            <p className="mb-3 text-sm font-semibold text-neutral-700">
              Transaction date and time
            </p>
            <DateTimePicker
              label="Date and time"
              value={date}
              onChange={(value) => setDate(value)}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
          </div>
          <TextField
            required
            select
            name="category"
            label="Category"
            defaultValue={expense?.category ?? "Food & Drinks"}
          >
            {expenseCategories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            multiline
            minRows={3}
            name="notes"
            label="Notes"
            defaultValue={expense?.notes ?? ""}
          />
        </DialogContent>
        <DialogActions className="px-6 pb-6">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {pending ? "Saving..." : "Save expense"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
