"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NoteEnvelope } from "@/components/notes/note-envelope";
import { LetterPage, useLetterPages } from "@/components/notes/letter-pages";
import { formatReadingTime } from "@/components/notes/note-meta";
import { describeNoteStyle, type NoteStyle } from "@/lib/note-style";
import { paperStyleVars } from "@/lib/note-paper-art";
import { formatNoteDate } from "@/lib/note-date-style";

const MAX_SHEET_WIDTH_PX = 480;

export function NoteComposerPreview({ style, title, content, sender, timeZone, focus }: {
  style: NoteStyle;
  title: string;
  content: string;
  sender: string;
  timeZone: string;
  focus: "envelope" | "letter";
}) {
  const paperVars = useMemo(() => paperStyleVars(style), [style]);
  const boxRef = useRef<HTMLDivElement>(null);
  const [sheetWidth, setSheetWidth] = useState(MAX_SHEET_WIDTH_PX);
  const [zoom, setZoom] = useState(0.5);
  const [pageIndex, setPageIndex] = useState(0);
  const today = useMemo(() => formatNoteDate(new Date(), timeZone, style.details.dateStyle), [timeZone, style.details.dateStyle]);
  const previewTitle = title.trim() || "A title for your letter";
  const previewContent = content || "Your words will go here.";
  const readingTime = formatReadingTime(previewContent);
  const { pages, measureRef } = useLetterPages({ content: previewContent, title: previewTitle, sender, date: today, style });
  const activePage = Math.min(pageIndex, pages.length - 1);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const updateSize = () => {
      const mobile = window.matchMedia("(max-width: 1023px)").matches;
      const availableHeight = mobile ? (pages.length > 1 ? 240 : 264) : window.innerHeight * 0.52;
      const width = Math.min(MAX_SHEET_WIDTH_PX, window.innerHeight * 0.565, window.innerWidth - 16);
      setSheetWidth(width);
      setZoom(Math.min(1, box.clientWidth / width, availableHeight / (width * 1.5)));
    };
    const observer = new ResizeObserver(updateSize);
    observer.observe(box);
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => { observer.disconnect(); window.removeEventListener("resize", updateSize); };
  }, [pages.length]);

  return (
    <div className="letter-vars grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4" style={paperVars}>
      <p className="sr-only" aria-live="polite">Preview: {describeNoteStyle(style)}.</p>
      <div aria-hidden="true" className={`${focus === "envelope" ? "grid" : "hidden lg:grid"} place-items-center py-2`}>
        <NoteEnvelope className="w-52 sm:w-64 lg:w-80" style={style} letter={<span className="block space-y-1.5 px-2.5 py-2"><span className="block h-1 w-3/5 rounded-full bg-black/25" /><span className="block h-1 w-4/5 rounded-full bg-black/10" /></span>} />
      </div>
      <div ref={boxRef} className={`${focus === "letter" ? "flex" : "hidden lg:flex"} min-w-0 w-full flex-col items-center justify-center gap-2`}>
        <div style={{ width: sheetWidth * zoom, height: sheetWidth * 1.5 * zoom }} aria-hidden="true">
          <div style={{ width: sheetWidth, height: sheetWidth * 1.5, transform: `scale(${zoom})`, transformOrigin: "top left" }}>
            <LetterPage style={style} title={previewTitle} body={pages[activePage] ?? ""} sender={sender} date={today} readingTime={readingTime} first={activePage === 0} last={activePage === pages.length - 1} pageNumber={activePage + 1} pageCount={pages.length} />
          </div>
        </div>
        {pages.length > 1 ? <nav className="letter-preview-nav" aria-label="Preview pages">
          <button type="button" aria-label="Previous preview page" disabled={activePage === 0} onClick={() => setPageIndex(activePage - 1)}><ChevronLeft size={16} /></button>
          <span aria-live="polite">{activePage + 1} / {pages.length}</span>
          <button type="button" aria-label="Next preview page" disabled={activePage === pages.length - 1} onClick={() => setPageIndex(activePage + 1)}><ChevronRight size={16} /></button>
        </nav> : null}
      </div>
      <div ref={measureRef} className="letter-page-measure letter-page-measure--preview" aria-hidden="true"><LetterPage style={style} title={previewTitle} body="" sender={sender} date={today} readingTime={readingTime} first last pageNumber={1} pageCount={1} /></div>
    </div>
  );
}
