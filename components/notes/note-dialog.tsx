"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useOpenSync } from "@/components/common/use-open-sync";
import dayjs from "dayjs";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/components/feedback/toast";
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
import { normalizeNoteStyle, type NoteStyle } from "@/lib/note-style";
import type { Profile, SharedNote } from "@/lib/types";
import { celebrateSave } from "@/components/common/save-celebration";
import { DecoratePanel, previewFocusFor, type DecorateTab } from "@/components/notes/composer/decorate-panel";
import { NoteComposerPreview } from "@/components/notes/composer/note-composer-preview";

interface NoteDialogProps {
	open: boolean;
	onClose: () => void;
	recipient: Profile;
	sender?: Pick<Profile, "display_name">;
	senderTimeZone: string;
	note?: SharedNote | null;
	onSaved?: (note: SharedNote) => void;
}

type Step = "write" | "decorate";

/**
 * Two steps in one form: Write (title, words, unlock moment) then Decorate
 * (envelope, seal, paper, ink, stickers) with a live preview. The write
 * fields stay mounted while hidden so one submit carries everything.
 */
export function NoteDialog({
	open,
	onClose,
	recipient,
	sender,
	senderTimeZone,
	note,
	onSaved,
}: NoteDialogProps) {
	const toast = useToast();
	const formRef = useRef<HTMLFormElement>(null);
	const [pending, startTransition] = useTransition();
	const [step, setStep] = useState<Step>("write");
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [style, setStyle] = useState<NoteStyle>(() => normalizeNoteStyle(note?.style));
	const [focus, setFocus] = useState<"envelope" | "letter">("envelope");
	const [envelopeOpen, setEnvelopeOpen] = useState(false);
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

	if (useOpenSync(open, [note, recipient.time_zone, senderTimeZone])) {
		// Editing shows the unlock moment as wall time in the zone it was written
		// for (older notes without a stored zone fall back to the recipient's).
		const timeZone = normalizeTimeZoneValue(
			note ? note.unlock_time_zone ?? recipient.time_zone : senderTimeZone,
		);
		const current = note?.unlock_at
			? utcIsoToZonedTime(note.unlock_at, timeZone)
			: dayjs();
		setUnlockDate(current);
		setUnlockTime(current);
		setUnlockTimeZone(timeZone);
		setTitle(note?.title ?? "");
		setContent(note?.content ?? "");
		setStyle(normalizeNoteStyle(note?.style));
		setStep("write");
		setFocus("envelope");
		setEnvelopeOpen(false);
	}

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

	const goDecorate = () => {
		if (formRef.current?.reportValidity()) setStep("decorate");
	};
	const saveNote = () => {
		if (step !== "decorate" || pending || !formRef.current?.reportValidity()) return;
		const formData = new FormData(formRef.current);
		formData.set("recipient_id", recipient.id);
		formData.set("unlock_at", getUnlockIso());
		formData.set("unlock_time_zone", unlockTimeZone);
		formData.set("style", JSON.stringify(style));
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
				if (!note) celebrateSave("note");
				handleClose();
			}
		});
	};

	const onTabChange = (tab: DecorateTab) => setFocus(previewFocusFor(tab));

	return (
		<NativeDialog
			open={open}
			onClose={handleClose}
			maxWidth={step === "write" ? "sm" : "xl"}
			title={
				step === "decorate" ? (
					<><span className="sm:hidden">Decorate</span><span className="hidden sm:inline">Decorate your letter</span></>
				) : note ? (
					"Edit note"
				) : (
					<span className="text-2xl leading-tight">
						Write to {recipient.display_name} {recipient.avatar_url ?? "🙂"}
					</span>
				)
			}
			actions={
				<>
					{step === "decorate" ? (
						<NativeButton type="button" variant="text" className="mr-auto" onClick={() => setStep("write")}>
							<ArrowLeft size={16} aria-hidden="true" />
							Back
						</NativeButton>
					) : null}
					<NativeButton type="button" variant="text" onClick={handleClose}>
						Cancel
					</NativeButton>
					{step === "write" ? (
						<NativeButton key="next" type="button" onClick={goDecorate}>
							Next: Decorate
							<ArrowRight size={16} aria-hidden="true" />
						</NativeButton>
					) : (
						<NativeButton key="save" type="button" disabled={pending} onClick={saveNote}>
							{pending ? "Saving..." : "Save note"}
						</NativeButton>
					)}
				</>
			}
		>
			<form
				ref={formRef}
				onSubmit={(event) => {
					event.preventDefault();
					if (step === "write") {
						goDecorate();
					} else {
						saveNote();
					}
				}}
			>
				<p className="sr-only" aria-live="polite">Step {step === "write" ? 1 : 2} of 2: {step === "write" ? "Write" : "Decorate"}</p>
				<div className="grid gap-4" hidden={step !== "write"}>
					<NativeInput
						required
						name="title"
						label="Title"
						maxLength={120}
						value={title}
						onChange={(event) => setTitle(event.target.value)}
					/>
					<NativeTextarea
						required
						rows={6}
						name="content"
						label="Content"
						maxLength={10000}
						value={content}
						onChange={(event) => setContent(event.target.value)}
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
				{step === "decorate" ? (
					<div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2 lg:items-start">
						{/* The preview stays in view: pinned to the top of the sheet on small
						    screens, in its own sticky column on wide ones. */}
						<div className={`note-composer-preview sticky -top-5 z-10 -mx-5 min-w-0 overflow-hidden px-5 py-3 sm:-top-6 sm:-mx-6 sm:px-6 lg:order-last lg:top-0 lg:mx-0 lg:h-auto lg:overflow-visible lg:px-0 lg:py-0 ${focus === "letter" ? "h-80" : "h-52"}`}>
							<NoteComposerPreview
								style={style}
								title={title}
								content={content}
								sender={sender?.display_name ?? "Me"}
								timeZone={senderTimeZone}
								focus={focus}
								envelopeOpen={envelopeOpen}
							/>
						</div>
						<DecoratePanel style={style} onChange={setStyle} onTabChange={onTabChange} onEnvelopeOpenChange={setEnvelopeOpen} senderInitial={(sender?.display_name ?? "M").trim().charAt(0).toUpperCase() || "M"} />
					</div>
				) : null}
			</form>
		</NativeDialog>
	);
}

/** The wall-clock time of `iso` in `timeZone`, as a local dayjs for the inputs. */
function utcIsoToZonedTime(iso: string, timeZone: string) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
		timeZone,
	}).formatToParts(new Date(iso));
	const getPart = (type: string) =>
		parts.find((part) => part.type === type)?.value ?? "00";
	return dayjs(
		`${getPart("year")}-${getPart("month")}-${getPart("day")}T${getPart("hour")}:${getPart("minute")}`,
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
