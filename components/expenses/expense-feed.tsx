"use client";

import { useState, useTransition } from "react";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import { Edit2, Trash2 } from "lucide-react";
import { useSnackbar } from "notistack";
import { deleteExpense } from "@/app/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatCurrency } from "@/lib/constants";
import { formatAppDateTime } from "@/lib/date-format";
import type { IndividualExpense } from "@/lib/types";

interface ExpenseFeedProps {
  title: string;
  expenses: IndividualExpense[];
  currentUserId: string;
  readOnly: boolean;
  timeZone: string;
  onEdit?: (expense: IndividualExpense) => void;
}

export function ExpenseFeed({
  title,
  expenses,
  currentUserId,
  readOnly,
  timeZone,
  onEdit,
}: ExpenseFeedProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<IndividualExpense | null>(
    null,
  );
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const visibleExpenses = expanded ? expenses : expenses.slice(0, 5);

  return (
    <Card className="border border-neutral-200 bg-white p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">{readOnly ? "Read only" : "Personal"}</p>
          <h3 className="mt-2 font-serif text-3xl">{title}</h3>
        </div>
      </div>
      <div className="grid gap-3 pr-1">
        {expenses.length ? (
          visibleExpenses.map((expense) => {
            const canEdit = !readOnly && expense.owner_id === currentUserId;
            return (
              <div
                key={expense.id}
                className="border border-neutral-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{expense.title}</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {formatAppDateTime(expense.transaction_date, timeZone)}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold">
                    {formatCurrency(Number(expense.amount), expense.currency)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Chip size="small" label={expense.category} />
                  {expense.notes ? (
                    <span className="text-sm text-neutral-500">{expense.notes}</span>
                  ) : null}
                </div>
                {canEdit ? (
                  <div className="mt-3 flex gap-1">
                    <Button
                      size="small"
                      startIcon={<Edit2 size={15} />}
                      onClick={() => onEdit?.(expense)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<Trash2 size={15} />}
                      disabled={pending && deletingId === expense.id}
                      onClick={() => setExpenseToDelete(expense)}
                    >
                      Delete
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <p className="py-10 text-center text-neutral-500">No transactions yet.</p>
        )}
      </div>
      {expenses.length > 5 ? (
        <Button
          fullWidth
          className="mt-4"
          variant="outlined"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show recent only" : `View all ${expenses.length} transactions`}
        </Button>
      ) : null}
      <ConfirmDialog
        open={Boolean(expenseToDelete)}
        title="Delete transaction?"
        description={
          expenseToDelete
            ? `"${expenseToDelete.title}" will be permanently removed from your ledger.`
            : "This transaction will be permanently removed from your ledger."
        }
        confirmLabel="Delete transaction"
        pending={pending}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={() => {
          if (!expenseToDelete) return;
          setDeletingId(expenseToDelete.id);
          startTransition(async () => {
            const result = await deleteExpense(expenseToDelete.id);
            enqueueSnackbar(result.message, {
              variant: result.ok ? "success" : "error",
            });
            setDeletingId(null);
            if (result.ok) setExpenseToDelete(null);
          });
        }}
      />
    </Card>
  );
}
