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
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { useSnackbar } from "notistack";
import { createNote, updateNote } from "@/app/actions";
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
	const [unlockAt, setUnlockAt] = useState<dayjs.Dayjs | null>(null);
	const [unlockTimezone, setUnlockTimezone] = useState<"VN" | "SG">("SG");
	const [attachmentUrl, setAttachmentUrl] = useState("");
	const [attachmentPublicId, setAttachmentPublicId] = useState("");
	const [uploading, setUploading] = useState(false);

	useEffect(() => {
		if (!open) return;
		setUnlockAt(note?.unlock_at ? dayjs(note.unlock_at) : null);
		setUnlockTimezone("SG");
		setAttachmentUrl(note?.attachment_url ?? "");
		setAttachmentPublicId(note?.attachment_public_id ?? "");
	}, [note, open]);

	async function uploadAttachment(file: File) {
		const body = new FormData();
		body.append("file", file);
		setUploading(true);
		try {
			const response = await fetch("/api/cloudinary/upload", {
				method: "POST",
				body,
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error ?? "Upload failed");
			setAttachmentUrl(result.secure_url);
			setAttachmentPublicId(result.public_id);
			enqueueSnackbar("File uploaded successfully!", { variant: "success" });
		} catch (error) {
			enqueueSnackbar(
				error instanceof Error ? error.message : "Upload failed",
				{
					variant: "error",
				},
			);
		} finally {
			setUploading(false);
		}
	}

	function getUnlockIso() {
		if (!unlockAt) return "";
		const offset = unlockTimezone === "VN" ? "+07:00" : "+08:00";
		return dayjs(
			`${unlockAt.format("YYYY-MM-DDTHH:mm:ss")}${offset}`,
		).toISOString();
	}

	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullWidth
			maxWidth="sm"
		>
			<DialogTitle className="form-dialog-title">
				{note ? "Edit note" : `Write to ${recipient.display_name}`}
			</DialogTitle>
			<form
				action={(formData) => {
					formData.set("recipient_id", recipient.id);
					formData.set("unlock_at", getUnlockIso());
					formData.set("attachment_url", attachmentUrl);
					formData.set("attachment_public_id", attachmentPublicId);
					if (note) formData.set("id", note.id);

					startTransition(async () => {
						const result = note
							? await updateNote(formData)
							: await createNote(formData);
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
					<div className="form-section sm:grid-cols-[1fr_170px]">
						<p className="form-section-label sm:col-span-2">Time lock</p>
						<DateTimePicker
							label="Unlock at (optional)"
							value={unlockAt}
							onChange={(value) => setUnlockAt(value)}
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
						<p className="form-helper sm:col-span-2">
							The selected date and time will be interpreted in the timezone
							above.
						</p>
					</div>
					<div className="form-section">
						<p className="form-section-label">Attachment</p>
						<Button
							variant="outlined"
							component="label"
							disabled={uploading}
						>
							{uploading ? "Uploading..." : "Upload attachment"}
							<input
								id="note-attachment-file"
								name="note-attachment-file"
								aria-label="Upload note attachment"
								hidden
								type="file"
								accept="image/*,.pdf"
								onChange={(event) => {
									const file = event.target.files?.[0];
									if (file) void uploadAttachment(file);
								}}
							/>
						</Button>
						{attachmentUrl ? (
							<a
								className="truncate text-sm text-lagoon underline"
								href={attachmentUrl}
								target="_blank"
								rel="noreferrer"
							>
								{attachmentUrl}
							</a>
						) : null}
					</div>
				</DialogContent>
				<DialogActions className="form-dialog-actions">
					<Button onClick={onClose}>Cancel</Button>
					<Button
						type="submit"
						variant="contained"
						disabled={pending || uploading}
					>
						{pending ? "Saving..." : "Save note"}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
