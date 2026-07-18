"use client";

import { useEffect, useState, useTransition } from "react";
import dayjs from "dayjs";
import { useToast } from "@/components/feedback/toast";
import {
  NativeButton,
  NativeDialog,
  NativeInput,
} from "@/components/ui/native-controls";
import { updateAnniversary } from "@/app/actions";

interface AnniversaryDialogProps {
  open: boolean;
  onClose: () => void;
  currentDate: string;
}

export function AnniversaryDialog({
  open,
  onClose,
  currentDate,
}: AnniversaryDialogProps) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [anniversaryDate, setAnniversaryDate] = useState<dayjs.Dayjs | null>(
    dayjs(currentDate),
  );

  useEffect(() => {
    if (!open) return;
    setAnniversaryDate(dayjs(currentDate));
  }, [currentDate, open]);

  const handleClose = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onClose();
  };

  return (
      <NativeDialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        title="Edit anniversary"
      >
        <form
          action={(formData) => {
            formData.set(
              "anniversary_date",
              (anniversaryDate ?? dayjs()).format("YYYY-MM-DD"),
            );
            startTransition(async () => {
              const result = await updateAnniversary(formData);
              toast(result.message, {
                variant: result.ok ? "success" : "error",
              });
              if (result.ok) handleClose();
            });
          }}
        >
            <NativeInput
              type="date"
              label="Anniversary"
              value={(anniversaryDate ?? dayjs()).format("YYYY-MM-DD")}
              onChange={(event) => setAnniversaryDate(dayjs(event.target.value))}
              required
            />
          <div className="mt-6 flex justify-end gap-3">
            <NativeButton type="button" variant="text" onClick={handleClose}>
              Cancel
            </NativeButton>
            <NativeButton type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save anniversary"}
            </NativeButton>
          </div>
        </form>
      </NativeDialog>
  );
}
