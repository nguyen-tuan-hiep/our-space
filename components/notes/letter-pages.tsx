"use client";

import { useCallback, useLayoutEffect, useState, type ReactNode, type Ref } from "react";
import { WaxSeal } from "@/components/notes/note-envelope";
import { noteSignoff, type NoteStyle } from "@/lib/note-style";
import { paperDataAttrs } from "@/lib/note-paper-art";

export function LetterPage({ style, title, body, sender, date, dateTime, readingTime, first, last, pageNumber, pageCount, sealedMessage, lockedNotice, sheetRef }: {
	style: NoteStyle;
	title: string;
	body: string;
	sender: string;
	date: string | null;
	dateTime?: string;
	readingTime?: string;
	first: boolean;
	last: boolean;
	pageNumber: number;
	pageCount: number;
	sealedMessage?: ReactNode;
	lockedNotice?: ReactNode;
	sheetRef?: Ref<HTMLDivElement>;
}) {
	const closing = noteSignoff(style);
	return (
		<div ref={sheetRef} className="letter-sheet letter-page" data-page-first={first ? "true" : "false"} {...paperDataAttrs(style)}>
			<article className="letter-paper letter-page-paper">
				<p data-page-meta className="letter-meta" style={first ? undefined : { display: "none" }}>
					{date ? <time className="letter-date" dateTime={dateTime}>{date}</time> : null}
					{readingTime ? <span className="block">{readingTime}</span> : null}
				</p>
				<h2 data-page-title className="letter-title" style={first ? undefined : { display: "none" }}>{title}</h2>
				<p data-page-continuation className="letter-page-continuation" style={first ? { display: "none" } : undefined}>Page {pageNumber} of {pageCount}</p>
				{first ? lockedNotice : null}
				{sealedMessage ?? <div data-page-body className="letter-body">{body}</div>}
				<footer data-page-footer className="letter-signoff" style={last ? undefined : { display: "none" }}>
					{closing ? <p className="letter-closing">{closing}</p> : null}
					<div className="letter-signoff-row">
						<p className="letter-signature">{style.details.signatureText || sender}</p>
						<span aria-hidden="true" className="letter-seal"><WaxSeal color={style.seal.color} motif={style.seal.motif} /></span>
					</div>
				</footer>
			</article>
		</div>
	);
}

/** Split on rendered line height, including the heading and closing on their respective pages. */
export function useLetterPages({ content, title, sender, date, style, enabled = true }: {
	content: string;
	title: string;
	sender: string;
	date: string | null;
	style: NoteStyle;
	enabled?: boolean;
}) {
	const [measureNode, setMeasureNode] = useState<HTMLDivElement | null>(null);
	const measureRef = useCallback((node: HTMLDivElement | null) => setMeasureNode(node), []);
	const [pages, setPages] = useState<string[]>([content]);

	useLayoutEffect(() => {
		if (!enabled) return;
		const host = measureNode;
		const article = host?.querySelector<HTMLElement>(".letter-page-paper");
		const sheet = host?.querySelector<HTMLElement>(".letter-page");
		const body = host?.querySelector<HTMLElement>("[data-page-body]");
		const meta = host?.querySelector<HTMLElement>("[data-page-meta]");
		const heading = host?.querySelector<HTMLElement>("[data-page-title]");
		const continuation = host?.querySelector<HTMLElement>("[data-page-continuation]");
		const footer = host?.querySelector<HTMLElement>("[data-page-footer]");
		if (!article || !sheet || !body || !meta || !heading || !continuation || !footer) return;

		let disposed = false;
		let frame = 0;
		const fits = (text: string, first: boolean, last: boolean) => {
			sheet.dataset.pageFirst = first ? "true" : "false";
			meta.style.display = first ? "" : "none";
			heading.style.display = first ? "" : "none";
			continuation.style.display = first ? "none" : "";
			footer.style.display = last ? "" : "none";
			body.textContent = text;
			return article.scrollHeight <= article.clientHeight + 1;
		};
		const paginate = () => {
			if (disposed || article.clientHeight === 0) return;
			const chars = Array.from(content);
			const next: string[] = [];
			let offset = 0;
			if (!chars.length) next.push("");
		while (offset < chars.length) {
				const first = next.length === 0;
				const remaining = chars.slice(offset).join("");
				if (fits(remaining, first, true)) {
					next.push(remaining);
					offset = chars.length;
					break;
				}
				let low = 0;
				let high = chars.length - offset;
				while (low < high) {
					const mid = Math.ceil((low + high) / 2);
					if (fits(chars.slice(offset, offset + mid).join(""), first, false)) low = mid;
					else high = mid - 1;
				}
				if (low === 0) {
					// A very long title can occupy the whole first sheet.
					if (first) { next.push(""); continue; }
					low = 1;
				}
				let cut = low;
				for (let index = low - 1; index >= Math.floor(low * 0.65); index -= 1) {
					if (/\s/u.test(chars[offset + index])) { cut = index + 1; break; }
				}
				next.push(chars.slice(offset, offset + cut).join(""));
				offset += cut;
			}
			if (next.length && !fits(next.at(-1) ?? "", next.length === 1, true)) next.push("");
			if (!disposed) setPages((current) => current.length === next.length && current.every((page, index) => page === next[index]) ? current : next);
		};
		const schedule = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(paginate);
		};
		schedule();
		const observer = new ResizeObserver(schedule);
		observer.observe(host!);
		document.fonts.ready.then(schedule);
		return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); };
	}, [content, title, sender, date, style, enabled, measureNode]);

	return { pages: enabled ? pages : [content], measureRef };
}
