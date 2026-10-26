"use client";

import { useDialogPresence } from "@/components/common/use-dialog-presence";
import { useMediaQuery } from "@/components/common/use-hydrated";
import { useCallback, useState, type RefObject } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { LockKeyhole, X } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNoteLock } from "@/components/notes/use-note-lock";
import { formatReadingTime } from "@/components/notes/note-meta";
import { NoteEnvelope } from "@/components/notes/note-envelope";
import { playLetterIntro } from "@/components/notes/letter-intro";
import { formatAppDateTime } from "@/lib/date-format";
import type { SharedNote } from "@/lib/types";

export function NoteReader({ note: selectedNote, currentUserId, timeZone, initialNowMs, returnFocus, onClose }: {
	note: SharedNote | null;
	currentUserId: string;
	timeZone: string;
	initialNowMs: number;
	returnFocus: RefObject<HTMLElement | null>;
	onClose: () => void;
}) {
	const { content: note, open } = useDialogPresence(selectedNote);
	const { locked, countdown } = useNoteLock(note?.unlock_at ?? null, initialNowMs);
	const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
	const [introDone, setIntroDone] = useState(false);
	const selectedId = selectedNote?.id ?? null;
	const [introFor, setIntroFor] = useState(selectedId);

	// Each opening starts a fresh intro; reduced motion goes straight to the letter.
	if (selectedId !== introFor) {
		setIntroFor(selectedId);
		if (selectedId) setIntroDone(false);
	}

	// The author may reread a letter before it unlocks; only the recipient waits.
	const sealed = locked && note?.author_id !== currentUserId;
	// Every note is a letter, so each opening plays the open-the-envelope intro.
	const playIntro = Boolean(note) && !introDone && !reducedMotion && !sealed;
	const noteId = note?.id;

	// Start the intro once the sheet and envelope are in the DOM; skipping (or
	// switching notes) changes this callback, whose cleanup cancels the animation.
	const paperRef = useCallback((paper: HTMLElement | null) => {
		const envelope = paper?.parentElement?.querySelector<HTMLElement>(".letter-intro-envelope");
		if (!paper || !envelope || !playIntro || !noteId) return;
		const animation = playLetterIntro(paper, envelope);
		animation.finished.then(() => setIntroDone(true), () => {});
		return () => animation.cancel();
	}, [playIntro, noteId]);

	if (!note) return null;
	const sender = note.author?.display_name ?? "Partner";
	const avatar = note.author?.avatar_url ?? "🙂";

	return (
		<Dialog open={open} onOpenChange={(open) => { if (!open) onClose(); }}>
			<DialogPortal>
				<DialogOverlay />
				<DialogPrimitive.Popup
					finalFocus={returnFocus}
					className="glass-dialog note-reader mobile-sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[calc(100svh-env(safe-area-inset-top)-1rem)] min-h-[28rem] w-full flex-col overflow-hidden rounded-t-3xl border text-foreground outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85svh] sm:w-[min(42rem,calc(100vw-3rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2rem]"
				>
					<header className="relative z-30 flex shrink-0 items-center justify-end px-4 pt-3 sm:px-5 sm:pt-4">
						<div aria-hidden="true" className="absolute left-1/2 top-3 h-1 w-10 -translate-x-1/2 rounded-full bg-foreground/15 sm:hidden" />
						<DialogPrimitive.Close render={<Button variant="outline" size="icon" className="size-11 shrink-0 rounded-full" />}>
							<X size={20} aria-hidden="true" /><span className="sr-only">Close note</span>
						</DialogPrimitive.Close>
					</header>
					{/* The stage holds the envelope and the sheet in one stacking context, so the
					    sheet can sit between the envelope's back and its front pocket. */}
					<div
						className={`relative flex min-h-0 flex-1 flex-col px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-6 ${playIntro ? "cursor-pointer" : ""}`}
						onClick={playIntro ? () => setIntroDone(true) : undefined}
					>
						{playIntro ? (
							<NoteEnvelope
								opening
								letter={false}
								className="letter-intro-envelope"
							/>
						) : null}
						<article
							ref={paperRef}
							className="letter-paper relative z-[1] min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl px-6 pb-8 pt-6 sm:px-10 sm:pb-10 sm:pt-8"
						>
							<div className="flex items-start justify-between gap-4 text-xs leading-5 text-black/45">
								<span className="min-w-0 truncate">To {note.recipient?.display_name ?? "you"}</span>
								<span className="shrink-0 text-right">
									<time dateTime={note.created_at}>{formatAppDateTime(note.created_at, timeZone)}</time>
									{sealed ? null : <span className="block">{formatReadingTime(note.content)}</span>}
								</span>
							</div>
							<DialogTitle className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-[#1d1d1f] [overflow-wrap:anywhere] sm:text-3xl">{note.title}</DialogTitle>
							<DialogDescription className="sr-only">Letter from {sender}, {formatAppDateTime(note.created_at, timeZone)}</DialogDescription>
							{locked && !sealed ? (
								<p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-black/[0.05] px-3 py-1 text-xs font-medium text-black/60 tabular-nums" role="status">
									<LockKeyhole size={12} aria-hidden="true" />
									Opens for {note.recipient?.display_name ?? "your partner"} in {countdown}
								</p>
							) : null}
							{sealed ? (
								<div className="mt-6 flex flex-col items-center rounded-2xl bg-black/[0.04] px-6 py-10 text-center text-[#1d1d1f]" role="status">
									<span className="grid size-12 place-items-center rounded-full bg-black/[0.06]"><LockKeyhole size={20} aria-hidden="true" /></span>
									<p className="mt-4 font-semibold">This letter is waiting for its moment.</p>
									<p className="mt-1 text-sm text-black/55 tabular-nums">Unlocks in {countdown}</p>
								</div>
							) : (
								<div className="mt-5 max-w-[62ch] whitespace-pre-wrap text-[1.0625rem] leading-8 text-black/80 [overflow-wrap:anywhere] sm:text-lg sm:leading-9">{note.content}</div>
							)}
							<footer className="mt-10 flex items-center justify-end gap-3 text-[#1d1d1f]">
								<div className="min-w-0 text-right">
									<p className="text-xs text-black/45">With love,</p>
									<p className="truncate font-semibold">{sender}</p>
								</div>
								<span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-black/[0.05] text-xl">{avatar}</span>
							</footer>
						</article>
					</div>
				</DialogPrimitive.Popup>
			</DialogPortal>
		</Dialog>
	);
}
