"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Edit2, Trash2, EllipsisVertical } from "lucide-react";
import { useToast } from "@/components/toast";
import { useDelayedRender } from "@/components/ui/use-delayed-render";
import { deleteNote } from "@/app/actions";
import { formatAppDateTime } from "@/lib/date-format";
import type { SharedNote } from "@/lib/types";

const ConfirmDialog = dynamic(
	() => import("@/components/confirm-dialog").then((mod) => mod.ConfirmDialog),
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
}

export function NoteCard({
	note,
	currentUserId,
	initialNowMs,
	timeZone,
	onEdit,
}: NoteCardProps) {
	const toast = useToast();
	const [now, setNow] = useState(initialNowMs);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pending, startTransition] = useTransition();

	const [activeNote, setActiveNote] = useState<SharedNote | null>(null);
	const menuOpen = Boolean(activeNote);
	const { closing: menuClosing, shouldRender: shouldRenderMenu } =
		useDelayedRender(menuOpen);
	const menuRef = useRef<HTMLDivElement | null>(null);

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
		const timer = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(timer);
	}, [note.unlock_at]);

	useEffect(() => {
		if (!menuOpen) return;

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (target instanceof Node && !menuRef.current?.contains(target)) {
				setActiveNote(null);
			}
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setActiveNote(null);
			}
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [menuOpen]);

	const handleMenuOpen = (selectedNote: SharedNote) => {
		setActiveNote((current) =>
			current?.id === selectedNote.id ? null : selectedNote,
		);
	};

	const handleMenuClose = () => {
		setActiveNote(null);
	};

	const handleEditClick = () => {
		if (!activeNote) return;
		handleMenuClose();
		onEdit(activeNote);
	};

	const handleDeleteClick = () => {
		handleMenuClose();
		setConfirmOpen(true);
	};

	return (
		<article
			className={[
				"relative flex h-[20rem] flex-col overflow-visible rounded-2xl border border-neutral-200 bg-paper p-4 shadow-md rounded-2xl sm:p-5",
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
					<div
						className="relative -mr-2 shrink-0"
						ref={activeNote?.id === note.id ? menuRef : null}
					>
						<button
							type="button"
							aria-label="more"
							id={`note-menu-button-${note.id}`}
							aria-controls={
								activeNote?.id === note.id ? "note-menu" : undefined
							}
							aria-expanded={activeNote?.id === note.id ? "true" : undefined}
							aria-haspopup="menu"
							onClick={() => handleMenuOpen(note)}
							className="grid size-9 place-items-center rounded-full text-neutral-500 transition active:scale-[0.8] hover:bg-mui/10 sm:size-8"
						>
							<EllipsisVertical
								size={18}
								className="text-neutral-500"
							/>
						</button>
						{shouldRenderMenu &&
						(activeNote?.id === note.id || menuClosing) ? (
							<>
								<button
									type="button"
									aria-label="Close note actions"
									className={[
										"fixed inset-0 z-[50] bg-black/5 backdrop-blur-sm sm:hidden",
										menuClosing
											? "native-dialog-backdrop-out"
											: "native-dialog-backdrop-in",
									].join(" ")}
									onClick={handleMenuClose}
								/>
								<div
									id="note-menu"
									role="menu"
									aria-labelledby={`note-menu-button-${note.id}`}
									className={[
										"mobile-sheet-motion fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-[70] overflow-hidden rounded-2xl border border-white/80 bg-paper p-2 shadow-[0_18px_60px_rgba(30,25,20,0.24)] backdrop-blur-xl will-change-transform sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-9 sm:w-40 sm:border-neutral-200 sm:p-1 sm:shadow-lg sm:backdrop-blur-none",
										menuClosing ? "native-sheet-out" : "native-sheet-in",
									].join(" ")}
								>
									<button
										type="button"
										role="menuitem"
										onClick={handleEditClick}
										className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-bold text-neutral-800 transition active:scale-[0.8] hover:bg-mui/10 sm:px-3 sm:py-2 sm:text-sm sm:font-medium"
									>
										<span className="grid size-9 place-items-center rounded-full bg-mui/10 text-mui sm:size-auto sm:bg-transparent sm:text-inherit">
											<Edit2 size={16} />
										</span>
										Edit
									</button>
									<button
										type="button"
										role="menuitem"
										onClick={handleDeleteClick}
										className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-bold text-danger transition active:scale-[0.8] hover:bg-danger-bg sm:mt-0 sm:px-3 sm:py-2 sm:text-sm sm:font-medium"
									>
										<span className="grid size-9 place-items-center rounded-full bg-danger-bg text-danger sm:size-auto sm:bg-transparent">
											<Trash2
												size={16}
												className="text-danger"
											/>
										</span>
										Delete
									</button>
								</div>
							</>
						) : null}
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
							if (result.ok) setConfirmOpen(false);
						})
					}
				/>
			) : null}

			{locked ? (
				<div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-dashed border-neutral-400 p-4 bg-paper sm:p-5">
					<p className="eyebrow">Unlocks in</p>
					<p className="mt-2 font-serif text-3xl">{countdown}</p>
					<div className="relative mt-4 min-h-0 flex-1 border border-dashed border-neutral-400 rounded-2xl overflow-hidden select-none blur-md">
						<div className="h-full overflow-y-auto">
							<p className="whitespace-pre-line text-md leading-7">
								{note.content}
							</p>
						</div>

						<div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-paper to-transparent" />
					</div>
				</div>
			) : (
				<div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-dashed border-neutral-400 rounded-2xl">
					<div className="h-full overflow-y-auto">
						<p className="m-4 whitespace-pre-line text-md leading-6 text-neutral-700">
							{note.content}
						</p>
					</div>
					<div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-paper to-transparent" />
					<div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-paper to-transparent" />
				</div>
			)}
		</article>
	);
}
