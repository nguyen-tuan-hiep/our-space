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
import {
  currencySymbols,
  expenseCategories,
  formatGroupedNumber,
  normalizeGroupedNumberInput,
  supportedCurrencies,
} from "@/lib/constants";
import type { CurrencyCode, IndividualExpense, Profile } from "@/lib/types";

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
  const [currency, setCurrency] = useState<CurrencyCode>(profile.currency);
  const [amount, setAmount] = useState("");

  const formatAmountValue = (value: string, selectedCurrency: CurrencyCode) => {
    return formatGroupedNumber(value, selectedCurrency === "VND" ? 0 : 2);
  };

  const getAmountPayload = (value = amount) => normalizeGroupedNumberInput(value);

  useEffect(() => {
    if (!open) return;
    setDate(expense ? dayjs(expense.transaction_date) : dayjs());
    const nextCurrency = expense?.currency ?? profile.currency;
    setCurrency(nextCurrency);
    setAmount(
      expense?.amount
        ? formatGroupedNumber(
            Number(expense.amount),
            nextCurrency === "VND" ? 0 : 2,
          )
        : "",
    );
  }, [expense, open, profile.currency]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle className="form-dialog-title">
        {expense ? "Edit transaction" : "Log expense"}
      </DialogTitle>
      <form
        action={(formData) => {
          const amountDisplay = formData.get("amount_display");
          formData.set("currency", currency);
          formData.set(
            "amount",
            getAmountPayload(typeof amountDisplay === "string" ? amountDisplay : amount),
          );
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
        <DialogContent className="form-dialog-content">
          <TextField
            required
            name="title"
            label="Title"
            defaultValue={expense?.title ?? ""}
          />
          <input type="hidden" name="amount" value={getAmountPayload()} />
          <div className="grid gap-5 sm:grid-cols-[1fr_150px]">
            <TextField
              required
              name="amount_display"
              label={`Amount (${currencySymbols[currency]})`}
              type="text"
              value={amount}
              onChange={(event) =>
                setAmount(formatAmountValue(event.target.value, currency))
              }
              slotProps={{
                htmlInput: {
                  inputMode: currency === "VND" ? "numeric" : "decimal",
                },
              }}
            />
            <TextField
              select
              label="Currency"
              value={currency}
              onChange={(event) => {
                const nextCurrency = event.target.value as CurrencyCode;
                setCurrency(nextCurrency);
                setAmount(formatAmountValue(amount, nextCurrency));
              }}
            >
              {supportedCurrencies.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </div>
          <div className="form-section">
            <p className="form-section-label">Transaction date and time</p>
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
        <DialogActions className="form-dialog-actions">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {pending ? "Saving..." : "Save expense"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
