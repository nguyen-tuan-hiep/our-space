"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ActionMenu } from "@/components/common/action-menu";
import { useToast } from "@/components/feedback/toast";
import { deleteNote } from "@/app/actions";
import { formatAppDateTime } from "@/lib/date-format";
import type { SharedNote } from "@/lib/types";

const ConfirmDialog = dynamic(
	() =>
		import("@/components/common/confirm-dialog").then(
			(mod) => mod.ConfirmDialog,
		),
	{ ssr: false },
);

function getCountdown(unlockAt: string | null, nowMs: number) {
	if (!unlockAt) return "";
	const diff = new Date(unlockAt).getTime() - nowMs;
	if (diff <= 0) return "";
	const totalSeconds = Math.floor(diff / 1000);
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	if (days > 0) return `${days}d ${hours}h ${minutes}m`;
	if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
	return `${minutes}m ${seconds}s`;
}

interface NoteCardProps {
	note: SharedNote;
	currentUserId: string;
	initialNowMs: number;
	timeZone: string;
	onEdit: (note: SharedNote) => void;
	onDeleted: (noteId: string) => void;
}

export function NoteCard({
	note,
	currentUserId,
	initialNowMs,
	timeZone,
	onEdit,
	onDeleted,
}: NoteCardProps) {
	const toast = useToast();
	const [now, setNow] = useState(() =>
		typeof window === "undefined" ? initialNowMs : Date.now(),
	);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pending, startTransition] = useTransition();

	const locked = Boolean(
		note.unlock_at && now < new Date(note.unlock_at).getTime(),
	);
	const countdown = useMemo(
		() => getCountdown(note.unlock_at, now),
		[note.unlock_at, now],
	);
	const canEdit = note.author_id === currentUserId;

	useEffect(() => {
		if (!note.unlock_at) return;
		setNow(Date.now());
		const timer = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(timer);
	}, [note.id, note.unlock_at]);

	const handleEditClick = () => {
		onEdit(note);
	};

	const handleDeleteClick = () => {
		setConfirmOpen(true);
	};

	return (
		<article
			className={[
				"app-card app-card-interactive content-fade-in relative flex flex-col overflow-visible p-4 sm:p-5",
			].join(" ")}
		>
			<div className="flex justify-between items-start gap-2">
				<div className="flex-1 min-w-0">
					<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] uppercase tracking-[0.1em] text-neutral-600">
						<span>From</span>
						<span className="font-semibold">
							{note.author?.display_name ?? "Partner"}{" "}
							{note.author?.avatar_url ?? "🙂"}
						</span>
					</div>
					<div className="text-[12px] text-neutral-400">
						{formatAppDateTime(note.created_at, timeZone)}
					</div>
					<h3 className="my-3 font-serif text-2xl leading-none sm:my-4 sm:mt-3">
						{note.title}
					</h3>
				</div>

				{canEdit && (
					<div className="relative shrink-0">
						<ActionMenu
							label={`Open actions for ${note.title}`}
							sheetTitle="Note actions"
							sheetDescription={note.title}
							onEdit={handleEditClick}
							onDelete={handleDeleteClick}
						/>
					</div>
				)}
			</div>

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

			{locked ? (
				<div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-accentLight/15 dark:border-accentDark/15 bg-hoverLight/85 dark:bg-hoverDark/85 p-4 sm:p-5">
					<p className="eyebrow">Unlocks in</p>
					<p className="mt-2 font-serif text-3xl">{countdown}</p>
					<div className="relative mt-4 min-h-0 flex-1 select-none overflow-hidden rounded-2xl border border-accentLight/10 dark:border-accentDark/10 bg-secondaryLight/90 dark:bg-secondaryDark/90 blur-md">
						<div className="h-full overflow-y-auto">
							<p className="whitespace-pre-line text-md leading-7">
								{note.content}
							</p>
						</div>

						<div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-secondaryLight dark:from-secondaryDark to-transparent" />
					</div>
				</div>
			) : (
				<div className="relative min-h-0 flex-1 overflow-hidden">
					{/* <div className="h-full overflow-y-auto">
						<div className="m-4 whitespace-pre-line text-md leading-6 text-neutral-700">
							{note.content}
						</div>
					</div> */}
					<div className="relative rounded-2xl border border-accentLight/10 dark:border-accentDark/10 bg-hoverLight/55 dark:bg-hoverDark/45 p-4">
						<div
							className="max-h-[12rem] overflow-y-auto pr-3 leading-6 text-neutral-600
												whitespace-pre-wrap break-words
												[&::-webkit-scrollbar]:w-1.5
												[&::-webkit-scrollbar-track]:bg-transparent
												[&::-webkit-scrollbar-thumb]:rounded-full
												[&::-webkit-scrollbar-thumb]:bg-hoverLight
												hover:[&::-webkit-scrollbar-thumb]:bg-accentLight/20
												dark:[&::-webkit-scrollbar-thumb]:bg-hoverDark"
						>
							{note.content}
						</div>
						{/* <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-secondaryLight dark:from-secondaryDark to-transparent" />
					<div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-secondaryLight dark:from-secondaryDark to-transparent" /> */}
					</div>
				</div>
			)}
		</article>
	);
}
