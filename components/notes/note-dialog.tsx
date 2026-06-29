"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import dayjs from "dayjs";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DesktopTimePicker } from "@mui/x-date-pickers/DesktopTimePicker";
import { useToast } from "@/components/toast";
import { createNote, updateNote } from "@/app/actions";
import {
	defaultTimeZone,
	getUtcTimeZoneOptions,
	normalizeTimeZoneValue,
} from "@/lib/constants";
import type { Profile, SharedNote } from "@/lib/types";

interface NoteDialogProps {
	open: boolean;
	onClose: () => void;
	recipient: Profile;
	senderTimeZone: string;
	note?: SharedNote | null;
	onSaved?: (note: SharedNote) => void;
}

export function NoteDialog({
	open,
	onClose,
	recipient,
	senderTimeZone,
	note,
	onSaved,
}: NoteDialogProps) {
	const toast = useToast();
	const [pending, startTransition] = useTransition();
	const [unlockDate, setUnlockDate] = useState<dayjs.Dayjs | null>(dayjs());
	const [unlockTime, setUnlockTime] = useState<dayjs.Dayjs | null>(dayjs());
	const [unlockTimeZone, setUnlockTimeZone] = useState(defaultTimeZone);
	const timeZoneOptions = useMemo(() => getUtcTimeZoneOptions(), []);
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
		setUnlockTimeZone(
			normalizeTimeZoneValue(note ? recipient.time_zone : senderTimeZone),
		);
	}, [note, open, recipient.time_zone, senderTimeZone, timeZoneOptions]);

	function getUnlockIso() {
		const dateBase = unlockDate ?? dayjs();
		const timeBase = unlockTime ?? dayjs();
		return zonedTimeToUtcIso(
			dateBase
				.hour(timeBase.hour())
				.minute(timeBase.minute())
				.second(0)
				.millisecond(0)
				.format("YYYY-MM-DDTHH:mm:ss"),
			unlockTimeZone,
		);
	}

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<Dialog
				open={open}
				onClose={handleClose}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle sx={{ px: 3, pt: 3, pb: 0 }}>
					{note ? (
						"Edit note"
					) : (
						<div className="flex items-center gap-1.5">
							<span className="font-serif text-2xl leading-1">
								Write to {recipient.display_name} {recipient.avatar_url ?? "🙂"}
							</span>
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
							toast(result.message, {
								variant: result.ok ? "success" : "error",
							});
							if (result.ok) {
								onSaved?.(result.note);
								handleClose();
							}
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
									<InputLabel id="unlock-time-zone-label">Time zone</InputLabel>
									<Select
										labelId="unlock-time-zone-label"
										value={unlockTimeZone}
										label="Time zone"
										onChange={(event) => setUnlockTimeZone(event.target.value)}
									>
										{timeZoneOptions.map((timeZone) => (
											<MenuItem
												key={timeZone.value}
												value={timeZone.value}
											>
												{timeZone.label}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</div>
							<p className="form-helper">
								The selected date and time will use this time zone.
							</p>
						</div>
					</DialogContent>
					<DialogActions sx={{ px: 3, pt: 0, pb: 3 }}>
						<Button onClick={handleClose}>Cancel</Button>
						<Button
							type="submit"
							variant="contained"
							disabled={pending}
						>
							{pending ? "Saving..." : "Save note"}
						</Button>
					</DialogActions>
				</form>
			</Dialog>
		</LocalizationProvider>
	);
}

function zonedTimeToUtcIso(localIso: string, timeZone: string) {
	const [datePart = "", timePart = ""] = localIso.split("T");
	const [year = 0, month = 1, day = 1] = datePart.split("-").map(Number);
	const [hour = 0, minute = 0, second = 0] = timePart.split(":").map(Number);
	const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
	const formatter = new Intl.DateTimeFormat("en-CA", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
		timeZone,
	});
	const parts = formatter.formatToParts(new Date(utcGuess));
	const getPart = (type: string) =>
		Number(parts.find((part) => part.type === type)?.value ?? 0);
	const zonedAsUtc = Date.UTC(
		getPart("year"),
		getPart("month") - 1,
		getPart("day"),
		getPart("hour"),
		getPart("minute"),
		getPart("second"),
	);
	const offset = zonedAsUtc - utcGuess;

	return new Date(utcGuess - offset).toISOString();
}
