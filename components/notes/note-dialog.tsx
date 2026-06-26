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
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DesktopTimePicker } from "@mui/x-date-pickers/DesktopTimePicker";
import { useSnackbar } from "notistack";
import { createNote, updateNote } from "@/app/actions";
import { AvatarIcon } from "@/components/avatar-icon";
import type { Profile, SharedNote } from "@/lib/types";

interface NoteDialogProps {
  open: boolean;
  onClose: () => void;
  recipient: Profile;
  note?: SharedNote | null;
}

export function NoteDialog({
  open,
  onClose,
  recipient,
  note,
}: NoteDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [pending, startTransition] = useTransition();
  const [unlockDate, setUnlockDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [unlockTime, setUnlockTime] = useState<dayjs.Dayjs | null>(dayjs());
  const [unlockTimezone, setUnlockTimezone] = useState<"VN" | "SG">("SG");
  const handleClose = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const current = note?.unlock_at ? dayjs(note.unlock_at) : dayjs();
    setUnlockDate(current);
    setUnlockTime(current);
    setUnlockTimezone("SG");
  }, [note, open]);

  function getUnlockIso() {
    const offset = unlockTimezone === "VN" ? "+07:00" : "+08:00";
    const dateBase = unlockDate ?? dayjs();
    const timeBase = unlockTime ?? dayjs();
    return dayjs(
      `${dateBase
        .hour(timeBase.hour())
        .minute(timeBase.minute())
        .second(timeBase.second())
        .millisecond(0)
        .format("YYYY-MM-DDTHH:mm:ss")}${offset}`,
    ).toISOString();
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ px: 3, pt: 3, pb: 0 }}>
          {note ? (
            "Edit note"
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-2xl leading-none whitespace-nowrap">
                Write to {recipient.display_name}
              </span>
              <AvatarIcon
                value={recipient.avatar_url}
                label={recipient.display_name}
                className="grid size-6 shrink-0 place-items-center rounded-full text-sm leading-none"
              />
            </div>
          )}
        </DialogTitle>
        <form
          action={(formData) => {
            formData.set("recipient_id", recipient.id);
            formData.set("unlock_at", getUnlockIso());
            if (note) formData.set("id", note.id);

            startTransition(async () => {
              const result = note
                ? await updateNote(formData)
                : await createNote(formData);
              enqueueSnackbar(result.message, {
                variant: result.ok ? "success" : "error",
              });
              if (result.ok) handleClose();
            });
          }}
        >
          <DialogContent sx={{ p: 3 }}>
            <div className="grid gap-4">
              <TextField
                required
                name="title"
                label="Title"
                defaultValue={note?.title ?? ""}
              />
              <TextField
                required
                multiline
                minRows={5}
                name="content"
                label="Content"
                defaultValue={note?.content ?? ""}
              />
              <DatePicker
                format="DD/MM/YYYY"
                label="Unlock date"
                value={unlockDate}
                onChange={(value) => setUnlockDate(value)}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <div className="grid grid-cols-2 gap-3">
                <DesktopTimePicker
                  format="HH:mm"
                  label="Unlock time"
                  value={unlockTime}
                  onChange={(value) => setUnlockTime(value)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <FormControl fullWidth>
                  <InputLabel id="unlock-timezone-label">Timezone</InputLabel>

                  <Select
                    labelId="unlock-timezone-label"
                    id="unlock-timezone"
                    name="unlock_timezone"
                    value={unlockTimezone}
                    label="Timezone"
                    onChange={(event) =>
                      setUnlockTimezone(event.target.value as "VN" | "SG")
                    }
                  >
                    <MenuItem value="VN">Vietnam (UTC+7)</MenuItem>
                    <MenuItem value="SG">Singapore (UTC+8)</MenuItem>
                  </Select>
                </FormControl>
              </div>
              <p className="form-helper">
                The selected date and time will be interpreted in the timezone
                above.
              </p>
            </div>
          </DialogContent>
          <DialogActions sx={{ px: 3, pt: 0, pb: 3 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={pending}>
              {pending ? "Saving..." : "Save note"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
}
