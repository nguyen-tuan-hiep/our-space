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
		<NativeDialog
			open={open}
			onClose={handleClose}
			maxWidth="sm"
			title={
				note ? (
					"Edit note"
				) : (
					<span className="text-2xl leading-tight">
						Write to {recipient.display_name} {recipient.avatar_url ?? "🙂"}
					</span>
				)
			}
		>
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
				<div className="grid gap-4">
					<NativeInput
						required
						name="title"
						label="Title"
						defaultValue={note?.title ?? ""}
					/>
					<NativeTextarea
						required
						rows={8}
						name="content"
						label="Content"
						defaultValue={note?.content ?? ""}
					/>
					<NativeInput
						type="date"
						label="Unlock date"
						value={(unlockDate ?? dayjs()).format("YYYY-MM-DD")}
						onChange={(event) => setUnlockDate(dayjs(event.target.value))}
					/>

					<div className="grid grid-cols-2 gap-3">
						<NativeInput
							type="time"
							label="Unlock time"
							value={(unlockTime ?? dayjs()).format("HH:mm")}
							onChange={(event) => {
								const [hour = 0, minute = 0] = event.target.value
									.split(":")
									.map(Number);
								setUnlockTime((current) =>
									(current ?? dayjs()).hour(hour).minute(minute),
								);
							}}
						/>
						<NativeSelect
							value={unlockTimeZone}
							label="Time zone"
							onChange={(event) => setUnlockTimeZone(event.target.value)}
						>
							{timeZoneOptions.map((timeZone) => (
								<option
									key={timeZone.value}
									value={timeZone.value}
								>
									{timeZone.label}
								</option>
							))}
						</NativeSelect>
					</div>
					<p className="form-helper">
						The selected date and time will use this time zone.
					</p>
				</div>
				<div className="mt-6 flex justify-end gap-3">
					<NativeButton
						type="button"
						variant="text"
						onClick={handleClose}
					>
						Cancel
					</NativeButton>
					<NativeButton
						type="submit"
						disabled={pending}
					>
						{pending ? "Saving..." : "Save note"}
					</NativeButton>
				</div>
			</form>
		</NativeDialog>
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
