"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import dayjs from "dayjs";
import { useToast } from "@/components/toast";
import {
  NativeButton,
  NativeDialog,
  NativeInput,
  NativeSelect,
  NativeTextarea,
} from "@/components/ui/native-controls";
import { createExpense, updateExpense } from "@/app/actions";
import {
  expenseCategories,
  formatCurrencyInputValue,
  formatStoredAmountForInput,
  getCurrencyFractionDigits,
  getSupportedCurrencyCodes,
  normalizeGroupedNumberInput,
  normalizeCurrencyCode,
} from "@/lib/constants";
import type { CurrencyCode, IndividualExpense, Profile } from "@/lib/types";

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  profile: Profile;
  expense?: IndividualExpense | null;
  onSaved?: (expense: IndividualExpense) => void;
}

export function ExpenseDialog({
  open,
  onClose,
  profile,
  expense,
  onSaved,
}: ExpenseDialogProps) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [transactionDate, setTransactionDate] = useState<dayjs.Dayjs | null>(
    dayjs(),
  );
  const [transactionTime, setTransactionTime] = useState<dayjs.Dayjs | null>(
    dayjs(),
  );
  const [currency, setCurrency] = useState<CurrencyCode>(profile.currency);
  const [amount, setAmount] = useState("");
  const currencyOptions = useMemo(() => getSupportedCurrencyCodes(), []);
  const handleClose = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onClose();
  };

  const getAmountPayload = (
    value = amount,
    selectedCurrency: CurrencyCode = currency,
  ) => {
    return normalizeGroupedNumberInput(
      value,
      getCurrencyFractionDigits(selectedCurrency),
    );
  };

  function getTransactionIso() {
    const dateBase = transactionDate ?? dayjs();
    const timeBase = transactionTime ?? dayjs();

    return dateBase
      .hour(timeBase.hour())
      .minute(timeBase.minute())
      .second(timeBase.second())
      .millisecond(0)
      .toISOString();
  }

  useEffect(() => {
    if (!open) return;

    const nextCurrency = expense?.currency ?? profile.currency;

    const current = expense ? dayjs(expense.transaction_date) : dayjs();

    setTransactionDate(current);
    setTransactionTime(current);
    setCurrency(nextCurrency);
    setAmount(
      expense?.amount !== undefined && expense?.amount !== null
        ? formatStoredAmountForInput(expense.amount, nextCurrency)
        : "",
    );
  }, [expense, open, profile.currency]);

  return (
    <NativeDialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      title={expense ? "Edit transaction" : "Log expense"}
    >

        <form
          action={(formData) => {
            const amountDisplay = formData.get("amount_display");

            const displayAmount =
              typeof amountDisplay === "string" ? amountDisplay : amount;

            formData.set("currency", currency);
            formData.set("amount", getAmountPayload(displayAmount, currency));
            formData.set("transaction_date", getTransactionIso());

            if (expense) {
              formData.set("id", expense.id);
            }

            startTransition(async () => {
              const result = expense
                ? await updateExpense(formData)
                : await createExpense(formData);

              toast(result.message, {
                variant: result.ok ? "success" : "error",
              });

              if (result.ok) {
                onSaved?.(result.expense);
                handleClose();
              }
            });
          }}
        >
            <div className="grid gap-4">
              <NativeInput
                required
                name="title"
                label="Title"
                defaultValue={expense?.title ?? ""}
              />

              <input
                type="hidden"
                name="amount"
                value={getAmountPayload(amount, currency)}
              />

              <div className="grid grid-cols-2 gap-3">
                <NativeInput
                  required
                  name="amount_display"
                  label={`Amount (${currency})`}
                  type="text"
                  value={amount}
                  onChange={(event) => {
                    setAmount(
                      formatCurrencyInputValue(event.target.value, currency),
                    );
                  }}
                  inputMode="numeric"
                />

                <NativeSelect
                    id="currency"
                    value={currency}
                    label="Currency"
                    onChange={(event) => {
                      const nextCurrency = normalizeCurrencyCode(
                        event.target.value,
                      );
                      const currentPayload = getAmountPayload(amount, currency);

                      setCurrency(nextCurrency);
                      setAmount(
                        currentPayload
                          ? formatStoredAmountForInput(
                              currentPayload,
                              nextCurrency,
                            )
                          : "",
                      );
                    }}
                  >
                    {Array.from(new Set([currency, ...currencyOptions])).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                </NativeSelect>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NativeInput
                  type="date"
                  label="Date"
                  value={(transactionDate ?? dayjs()).format("YYYY-MM-DD")}
                  onChange={(event) => setTransactionDate(dayjs(event.target.value))}
                  required
                />
                <NativeInput
                  type="time"
                  label="Time"
                  value={(transactionTime ?? dayjs()).format("HH:mm")}
                  onChange={(event) => {
                    const [hour = 0, minute = 0] = event.target.value
                      .split(":")
                      .map(Number);
                    setTransactionTime((current) =>
                      (current ?? dayjs()).hour(hour).minute(minute).second(0),
                    );
                  }}
                  required
                />
              </div>

              <NativeSelect
                  id="category"
                  name="category"
                  label="Category"
                  defaultValue={expense?.category ?? "Food & Drinks"}
                  required
                >
                  {expenseCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
              </NativeSelect>

              <NativeTextarea
                rows={3}
                name="notes"
                label="Notes"
                defaultValue={expense?.notes ?? ""}
              />
            </div>

          <div className="mt-6 flex justify-end gap-3">
            <NativeButton type="button" variant="text" onClick={handleClose}>
              Cancel
            </NativeButton>
            <NativeButton type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save expense"}
            </NativeButton>
          </div>
        </form>
    </NativeDialog>
  );
}
