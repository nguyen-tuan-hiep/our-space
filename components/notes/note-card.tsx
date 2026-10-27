"use client";

import dynamic from "next/dynamic";
import { useState, useTransition } from "react";
import { ArrowRight, LockKeyhole, MailOpen } from "lucide-react";
import { useNoteLock } from "@/components/notes/use-note-lock";
import { formatReadingTime, isUnreadLetter } from "@/components/notes/note-meta";
import { NoteEnvelope } from "@/components/notes/note-envelope";
import { ActionMenu } from "@/components/common/action-menu";
import { useToast } from "@/components/feedback/toast";
import { deleteNote } from "@/app/actions";
import { formatAppDate, formatAppDateTime } from "@/lib/date-format";
import type { SharedNote } from "@/lib/types";

const ConfirmDialog = dynamic(
	() =>
		import("@/components/common/confirm-dialog").then(
			(mod) => mod.ConfirmDialog,
		),
	{ ssr: false },
);

interface NoteCardProps {
	note: SharedNote;
	currentUserId: string;
	initialNowMs: number;
	timeZone: string;
	onOpen: (note: SharedNote) => void;
	onEdit: (note: SharedNote) => void;
	onDeleted: (noteId: string) => void;
}

export function NoteCard({
	note,
	currentUserId,
	initialNowMs,
	timeZone,
	onOpen,
	onEdit,
	onDeleted,
}: NoteCardProps) {
	const toast = useToast();
	const { locked, countdown } = useNoteLock(note.unlock_at, initialNowMs);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pending, startTransition] = useTransition();
	const canEdit = note.author_id === currentUserId;
	const unread = isUnreadLetter(note, currentUserId);
	// The author can always reread their own letter; the recipient waits for the unlock.
	const sealedForViewer = locked && !canEdit;
	// Recipient-opened letters (or notes from before read tracking) show the envelope opened.
	const opened = note.read_at !== null && !locked;
	const hideTitle = !canEdit && (unread || locked);
	const sender = note.author?.display_name ?? "Partner";
	const avatar = note.author?.avatar_url ?? "🙂";

	const handleEditClick = () => {
		onEdit(note);
	};

	const handleDeleteClick = () => {
		setConfirmOpen(true);
	};

	return (
		<article className="app-card note-card relative flex h-full min-w-0 flex-col p-5" style={{ viewTransitionName: `note-${note.id}` }}>
			{/* Every state shares one layout (status, envelope stage, title, sender) so the grid stays even. */}
			<div className={`flex h-8 min-w-0 items-center gap-1.5 text-xs ${canEdit ? "pr-9" : ""}`}>
				{locked ? (
					<span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-foreground tabular-nums" title={`Opens in ${countdown}`}>
						<LockKeyhole size={13} className="shrink-0" aria-hidden="true" />
						<span className="sr-only">Opens in </span>
						<span className="truncate">{countdown}</span>
					</span>
				) : unread ? (
					<span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
						<span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-[#c08f2c]" />
						New letter
					</span>
				) : canEdit && note.read_at === null ? (
					<span className="truncate text-muted-foreground">Not opened yet</span>
				) : (
					<span className="truncate text-muted-foreground">{formatReadingTime(note.content)}</span>
				)}
			</div>
			{canEdit && (
				<div className="absolute right-3.5 top-5">
					<ActionMenu
						label={`Open actions for ${note.title}`}
						sheetTitle="Note actions"
						sheetDescription={note.title}
						onEdit={handleEditClick}
						onDelete={handleDeleteClick}
					/>
				</div>
			)}
			<button
				type="button"
				className="note-preview note-envelope-trigger flex min-w-0 flex-1 flex-col text-left"
				disabled={sealedForViewer}
				aria-label={
					sealedForViewer
						? `Sealed letter from ${sender}, opens in ${countdown}`
						: unread ? `Open new letter from ${sender}` : `Read note: ${note.title}`
				}
				aria-haspopup={sealedForViewer ? undefined : "dialog"}
				onClick={() => onOpen(note)}
			>
				<span className="note-envelope-stage relative mt-1 flex h-[8.25rem] items-center justify-center">
					<NoteEnvelope
						className="h-20"
						open={opened}
						letter={
							<span className="block space-y-1.5 px-2.5 py-2">
								<span className="block h-1 w-3/5 rounded-full bg-black/25" />
								<span className="block h-1 w-4/5 rounded-full bg-black/10" />
							</span>
						}
					/>
				</span>
				<h3 className={`mt-3 h-6 truncate text-base leading-6 tracking-tight ${hideTitle ? "text-muted-foreground" : "font-semibold text-foreground"}`}>
					{hideTitle ? "A letter for you" : note.title}
				</h3>
				<span className="mt-auto flex w-full items-center gap-2.5 border-t border-foreground/8 pt-4">
					<span aria-hidden="true" className="glass-chip grid size-8 shrink-0 place-items-center rounded-full text-base">
						{avatar}
					</span>
					<span className="min-w-0 flex-1">
						<span className="flex min-w-0 items-center gap-1.5 text-xs leading-4">
							<span className="truncate font-semibold text-foreground">{sender}</span>
							{canEdit ? <span className="glass-chip shrink-0 rounded-full px-1.5 text-[10px] font-medium leading-[14px] text-muted-foreground">You</span> : null}
						</span>
						<time dateTime={note.created_at} title={formatAppDateTime(note.created_at, timeZone)} className="block truncate text-[11px] leading-4 text-muted-foreground">
							{formatAppDate(note.created_at, timeZone)}
						</time>
					</span>
					<span aria-hidden="true" className={`grid size-8 shrink-0 place-items-center rounded-full ${sealedForViewer ? "text-muted-foreground" : "note-open-chip glass-chip text-foreground"}`}>
						{sealedForViewer ? <LockKeyhole size={14} /> : unread ? <MailOpen size={15} /> : <ArrowRight size={15} />}
					</span>
				</span>
			</button>

			{confirmOpen ? (
				<ConfirmDialog
					open={confirmOpen}
					title="Delete note?"
					description="This note will be permanently removed for both of you."
					confirmLabel="Delete note"
					pending={pending}
					onClose={() => setConfirmOpen(false)}
					onConfirm={() =>
						startTransition(async () => {
							const result = await deleteNote(note.id);
							toast(result.message, {
								variant: result.ok ? "success" : "error",
							});
							if (result.ok) {
								setConfirmOpen(false);
								onDeleted(note.id);
							}
						})
					}
				/>
			) : null}

		</article>
	);
}
