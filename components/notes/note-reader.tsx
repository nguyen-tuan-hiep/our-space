"use client";

import { useDialogPresence } from "@/components/common/use-dialog-presence";
import { useMediaQuery } from "@/components/common/use-hydrated";
import { useCallback, useMemo, useState, type RefObject } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, LockKeyhole, X } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNoteLock } from "@/components/notes/use-note-lock";
import { formatReadingTime } from "@/components/notes/note-meta";
import { NoteEnvelope } from "@/components/notes/note-envelope";
import { LetterPage, useLetterPages } from "@/components/notes/letter-pages";
import { playLetterIntro } from "@/components/notes/letter-intro";
import { formatAppDateTime } from "@/lib/date-format";
import { normalizeNoteStyle } from "@/lib/note-style";
import { paperStyleVars } from "@/lib/note-paper-art";
import { formatNoteDate } from "@/lib/note-date-style";
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
  const [pageFor, setPageFor] = useState(selectedId);
  const [pageIndex, setPageIndex] = useState(0);
  if (selectedId !== introFor) {
    setIntroFor(selectedId);
    if (selectedId) setIntroDone(false);
  }
  if (selectedId !== pageFor) {
    setPageFor(selectedId);
    setPageIndex(0);
  }

  const sealed = locked && note?.author_id !== currentUserId;
  const playIntro = Boolean(note) && !introDone && !reducedMotion && !sealed;
  const noteId = note?.id;
  const style = useMemo(() => normalizeNoteStyle(note?.style), [note?.style]);
  const paperVars = useMemo(() => paperStyleVars(style), [style]);
  const sender = note?.author?.display_name ?? "Partner";
  const visibleDate = note ? formatNoteDate(note.created_at, timeZone, style.details.dateStyle) : null;
  const { pages, measureRef } = useLetterPages({ content: sealed ? "" : note?.content ?? "", title: note?.title ?? "", sender, date: visibleDate, style, enabled: Boolean(note) && !sealed });
  const activePage = Math.min(pageIndex, pages.length - 1);

  const paperRef = useCallback((paper: HTMLElement | null) => {
    const envelope = paper?.parentElement?.querySelector<HTMLElement>(".letter-intro-envelope");
    if (!paper || !envelope || !playIntro || !noteId) return;
    const animation = playLetterIntro(paper, envelope);
    animation.finished.then(() => setIntroDone(true), () => {});
    return () => animation.cancel();
  }, [playIntro, noteId]);

  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup
          finalFocus={returnFocus}
          className="note-reader-bare note-reader note-reader--paged mobile-sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full flex-col text-foreground outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" && activePage < pages.length - 1) { event.preventDefault(); setPageIndex(activePage + 1); }
            if (event.key === "ArrowLeft" && activePage > 0) { event.preventDefault(); setPageIndex(activePage - 1); }
          }}
        >
          <DialogTitle className="sr-only">{note.title}</DialogTitle>
          <DialogDescription className="sr-only">Letter from {sender}, {formatAppDateTime(note.created_at, timeZone)}</DialogDescription>
          <div className={`letter-vars relative flex min-h-0 flex-1 flex-col ${playIntro ? "cursor-pointer" : ""}`} style={paperVars} onClick={playIntro ? () => setIntroDone(true) : undefined}>
            <DialogPrimitive.Close className={`note-reader-close absolute right-4 top-4 z-30 grid size-9 place-items-center rounded-full active:scale-95 ${playIntro ? "invisible" : ""}`}>
              <X size={18} aria-hidden="true" /><span className="sr-only">Close note</span>
            </DialogPrimitive.Close>
            {playIntro ? <NoteEnvelope opening letter={false} style={style} className="letter-intro-envelope" /> : null}
            <LetterPage
              sheetRef={activePage === 0 ? paperRef : undefined}
              style={style} title={note.title} body={pages[activePage] ?? ""} sender={sender}
              date={visibleDate} dateTime={note.created_at} readingTime={sealed ? undefined : formatReadingTime(note.content)}
              first={activePage === 0} last={activePage === pages.length - 1}
              pageNumber={activePage + 1} pageCount={pages.length}
              lockedNotice={locked && !sealed ? <p className="letter-chip mt-3 self-start" role="status"><LockKeyhole size={12} aria-hidden="true" />Opens for {note.recipient?.display_name ?? "your partner"} in {countdown}</p> : undefined}
              sealedMessage={sealed ? <div className="letter-sealed" role="status"><LockKeyhole size={20} aria-hidden="true" /><p className="mt-3 font-semibold">This letter is waiting for its moment.</p><p className="mt-1 text-sm tabular-nums opacity-70">Unlocks in {countdown}</p></div> : undefined}
            />
            {pages.length > 1 && !playIntro ? <nav className="letter-page-nav" aria-label="Letter pages">
              <button type="button" aria-label="Previous page" disabled={activePage === 0} onClick={() => setPageIndex(activePage - 1)}><ChevronLeft size={18} /></button>
              <span aria-live="polite">{activePage + 1} / {pages.length}</span>
              <button type="button" aria-label="Next page" disabled={activePage === pages.length - 1} onClick={() => setPageIndex(activePage + 1)}><ChevronRight size={18} /></button>
            </nav> : null}
            {!sealed ? <div ref={measureRef} className="letter-page-measure" aria-hidden="true"><LetterPage style={style} title={note.title} body="" sender={sender} date={visibleDate} dateTime={note.created_at} readingTime={formatReadingTime(note.content)} first last pageNumber={1} pageCount={1} /></div> : null}
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
