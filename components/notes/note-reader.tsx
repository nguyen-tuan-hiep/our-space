"use client";

import { useDialogPresence } from "@/components/common/use-dialog-presence";
import { useMediaQuery } from "@/components/common/use-hydrated";
import { useCallback, useState, type RefObject } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { LockKeyhole, X } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNoteLock } from "@/components/notes/use-note-lock";
import { formatReadingTime } from "@/components/notes/note-meta";
import { NoteEnvelope, WaxSeal } from "@/components/notes/note-envelope";
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

	const recipient = note.recipient?.display_name ?? "you";

	return (
		<Dialog open={open} onOpenChange={(open) => { if (!open) onClose(); }}>
			<DialogPortal>
				<DialogOverlay />
				{/* No dialog chrome: over the blurred backdrop only the letter itself shows. */}
				<DialogPrimitive.Popup
					finalFocus={returnFocus}
					className="note-reader-bare note-reader mobile-sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[calc(100svh-env(safe-area-inset-top)-1rem)] min-h-[28rem] w-full flex-col text-foreground outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85svh] sm:w-[min(40rem,calc(100vw-3rem))] sm:-translate-x-1/2 sm:-translate-y-1/2"
				>
					{/* The stage holds the envelope and the sheet in one stacking context, so the
					    sheet can sit between the envelope's back and its front pocket. */}
					<div
						className={`relative flex min-h-0 flex-1 flex-col px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 sm:px-0 sm:pb-0 sm:pt-0 ${playIntro ? "cursor-pointer" : ""}`}
						onClick={playIntro ? () => setIntroDone(true) : undefined}
					>
						{/* Pinned over the sheet's top-right corner (outside the scroller so it
						    stays put while a long letter scrolls); hidden during the intro. */}
						<DialogPrimitive.Close className={`note-reader-close absolute right-6 top-5 z-30 grid size-9 place-items-center rounded-full active:scale-95 sm:right-4 sm:top-4 ${playIntro ? "invisible" : ""}`}>
							<X size={18} aria-hidden="true" /><span className="sr-only">Close note</span>
						</DialogPrimitive.Close>
						{playIntro ? (
							<NoteEnvelope
								opening
								letter={false}
								className="letter-intro-envelope"
							/>
						) : null}
						<article
							ref={paperRef}
							className="letter-paper relative z-[1] flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-7 pb-10 pt-9 sm:px-12 sm:pb-12 sm:pt-12"
						>
							<p className="letter-meta">
								<time dateTime={note.created_at}>{formatAppDateTime(note.created_at, timeZone)}</time>
								{sealed ? null : <span className="block">{formatReadingTime(note.content)}</span>}
							</p>
							<DialogTitle className="letter-title">
								{note.title}
							</DialogTitle>
							<DialogDescription className="sr-only">Letter from {sender}, {formatAppDateTime(note.created_at, timeZone)}</DialogDescription>
							<p className="letter-script letter-greeting">Dear {recipient},</p>
							{locked && !sealed ? (
								<p className="letter-chip mt-3 self-start" role="status">
									<LockKeyhole size={12} aria-hidden="true" />
									Opens for {note.recipient?.display_name ?? "your partner"} in {countdown}
								</p>
							) : null}
							{sealed ? (
								<div className="letter-sealed" role="status">
									<LockKeyhole size={20} aria-hidden="true" />
									<p className="mt-3 font-semibold">This letter is waiting for its moment.</p>
									<p className="mt-1 text-sm tabular-nums opacity-70">Unlocks in {countdown}</p>
								</div>
							) : (
								<div className="letter-body">{note.content}</div>
							)}
							<footer className="letter-signoff">
								<div className="min-w-0 text-right">
									<p className="letter-closing">With love,</p>
									<p className="letter-script letter-signature">{sender}</p>
								</div>
								<span aria-hidden="true" className="letter-seal"><WaxSeal /></span>
							</footer>
						</article>
					</div>
				</DialogPrimitive.Popup>
			</DialogPortal>
		</Dialog>
	);
}
