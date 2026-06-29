"use client";

import { useEffect, useState, useTransition } from "react";
import dayjs from "dayjs";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useToast } from "@/components/toast";
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
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle>Edit anniversary</DialogTitle>
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
          <DialogContent>
            <DatePicker
              format="DD/MM/YYYY"
              label="Anniversary"
              value={anniversaryDate}
              onChange={(value) => setAnniversaryDate(value)}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
}
