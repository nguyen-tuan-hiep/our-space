"use client";

import { NativeInput } from "@/components/ui/native-controls";
import { TileGrid } from "@/components/notes/composer/pickers";
import {
	DATE_STYLES,
	LETTER_FONTS,
	type NoteStyle,
} from "@/lib/note-style";
import { inkColors, paperTint } from "@/lib/note-style-css";

export function DetailControls({ style, onChange }: {
	style: NoteStyle;
	onChange: (values: Partial<NoteStyle["details"]>) => void;
}) {
	const tint = paperTint(style);
	const ink = inkColors(style);
	const fontOptions = (sample: string) => LETTER_FONTS.map((font) => ({
		id: font.id,
		label: font.label,
		preview: <span className="px-1 leading-none" style={{ fontFamily: font.family, color: ink.ink, fontSize: font.handwritten ? "1.4rem" : "1.1rem" }}>{sample}</span>,
		previewStyle: { background: tint },
	}));
	return (
		<div role="tabpanel" className="grid min-w-0 gap-5">
			<TileGrid
				label="Title lettering"
				options={fontOptions("Yêu em")}
				value={style.details.titleFont}
				onChange={(titleFont) => onChange({ titleFont })}
				columns="grid-cols-3 sm:grid-cols-5"
			/>
			<TileGrid
				label="Date on the letter"
				options={DATE_STYLES.map((date) => ({
					id: date.id,
					label: date.label,
					preview: <span className="px-1 text-[11px] leading-tight" style={{ color: ink.ink, fontFamily: date.id === "handwritten" ? "var(--font-script), cursive" : date.id === "postmark" || date.id === "minimal" ? "var(--font-sans)" : "ui-serif, Georgia, serif", fontStyle: date.id === "classic" ? "italic" : "normal" }}>{date.id === "hidden" ? "—" : date.id === "minimal" ? "11.11.26" : date.id === "postmark" ? "NOV 11" : "11 Nov"}</span>,
					previewStyle: { background: tint },
				}))}
				value={style.details.dateStyle}
				onChange={(dateStyle) => onChange({ dateStyle })}
				columns="grid-cols-3 sm:grid-cols-5"
			/>
			<NativeInput
				label="Signature text"
				helperText="Leave blank to use your display name."
				maxLength={40}
				value={style.details.signatureText}
				onChange={(event) => onChange({ signatureText: event.target.value })}
			/>
			<TileGrid
				label="Signature lettering"
				options={fontOptions("Yêu em")}
				value={style.details.signatureFont}
				onChange={(signatureFont) => onChange({ signatureFont })}
				columns="grid-cols-3 sm:grid-cols-5"
			/>
			<NativeInput
				label="Closing words"
				helperText="Write your own closing, or leave blank to omit it."
				maxLength={80}
				value={style.details.closingText}
				onChange={(event) => onChange({ closingText: event.target.value })}
			/>
		</div>
	);
}
