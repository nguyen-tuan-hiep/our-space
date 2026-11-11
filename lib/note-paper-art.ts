import type { CSSProperties } from "react";
import {
	LETTER_FONTS,
	PAPER_TEMPLATES,
	TEMPLATE_TEXT_INSET,
	type NoteSticker,
	type NoteStyle,
	type PaperPatternId,
	type StickerId,
	type StickerSlotId,
} from "@/lib/note-style";
import { hexMix, inkColors, paperTint, svgUri, washiRgb } from "@/lib/note-style-css";
import { paperTile } from "@/lib/note-pattern-tiles";

/*
 * The letter sheet's art: background patterns and stickers, all drawn as SVG
 * data URIs in the note's own ink, accent and washi colors. Only the reader
 * and the composer import this module.
 */

interface PaperColors {
	ink: string;
	accent: string;
	/** Softer accent for fills, like the original pink doodles. */
	soft: string;
	/** `rgb(r,g,b)` of the washi tape. */
	washi: string;
}

export function paperColors(style: NoteStyle): PaperColors {
	const ink = inkColors(style);
	return {
		ink: ink.ink,
		accent: ink.accent,
		soft: hexMix(ink.accent, "#ffffff", 0.4),
		washi: `rgb(${washiRgb(style).replace(/ /g, ",")})`,
	};
}

const HEART = "M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21z";
const SPARK = "M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z";

/** A background layer (with position/size) for the sheet, or `none`. The tiles are designed in Figma, see lib/note-pattern-tiles.ts. */
export function paperPatternUri(id: PaperPatternId, colors: PaperColors) {
	if (id === "plain") return "none";
	if (id === "lined") {
		return `repeating-linear-gradient(to bottom, transparent 0 calc(1.9rem - 1px), color-mix(in srgb, ${colors.ink} 10%, transparent) calc(1.9rem - 1px) 1.9rem) 0 0 / 100% auto repeat`;
	}
	const print = paperTile(id, colors);
	return print ? `${svgUri(print.svg)} 0 0 / ${print.width}px ${print.height}px repeat` : "none";
}

function heart(cx: number, cy: number, s: number) {
	return `M${cx} ${cy + s * 0.9}C${cx - s * 1.1} ${cy + s * 0.2} ${cx - s * 0.9} ${cy - s * 0.8} ${cx} ${cy - s * 0.3}C${cx + s * 0.9} ${cy - s * 0.8} ${cx + s * 1.1} ${cy + s * 0.2} ${cx} ${cy + s * 0.9}Z`;
}

interface StickerArt {
	svg: string;
	/** CSS width of the sticker on the sheet. */
	width: string;
}

/** Sketchbook stickers: ink outlines with accent, soft and washi fills. */
export function stickerArt(id: StickerId, colors: PaperColors): StickerArt {
	const { ink, accent, soft, washi } = colors;
	const line = `fill='none' stroke='${ink}' stroke-width='2.5' stroke-linejoin='round' stroke-linecap='round'`;
	const outlined = (fill: string) => `fill='${fill}' stroke='${ink}' stroke-width='2.5' stroke-linejoin='round' stroke-linecap='round'`;
	const wrap = (w: number, h: number, body: string) =>
		`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'>${body}</svg>`;
	switch (id) {
		case "sparkles":
			return {
				width: "3.5rem",
				svg: wrap(60, 50, `<path fill='${washi}' opacity='.6' transform='translate(6 8) scale(.85)' d='${SPARK}'/><path fill='${washi}' opacity='.45' transform='translate(32 26) scale(.5)' d='${SPARK}'/><path fill='${soft}' opacity='.5' transform='translate(36 4) scale(.35)' d='${SPARK}'/>`),
			};
		case "hearts":
			return {
				width: "7.5rem",
				svg: wrap(120, 90, `<path fill='${soft}' opacity='.6' transform='translate(18 34) rotate(-14) scale(1.5)' d='${HEART}'/><path fill='${washi}' opacity='.55' transform='translate(60 52) rotate(12) scale(.9)' d='${HEART}'/><path fill='${soft}' opacity='.35' transform='translate(56 18) rotate(-6) scale(.6)' d='${HEART}'/><path fill='${washi}' opacity='.6' transform='translate(88 30) scale(.55)' d='${SPARK}'/>`),
			};
		case "bow":
			return {
				width: "5.5rem",
				svg: wrap(100, 80, `<path d='M50 34C36 14 14 20 22 36C12 52 34 58 50 34Z' ${outlined(soft)}/><path d='M50 34C64 14 86 20 78 36C88 52 66 58 50 34Z' ${outlined(soft)}/><path d='M46 38L36 70M54 38L64 70' ${line}/><path d='M36 70l6-6M64 70l-6-6' ${line}/><circle cx='50' cy='34' r='6' ${outlined(accent)}/>`),
			};
		case "flower":
			return {
				width: "5rem",
				svg: wrap(90, 100, `<path d='M46 52C44 70 44 84 46 96' ${line}/><path d='M46 76C36 74 30 66 30 58C40 60 46 66 46 76Z' ${outlined(washi)}/><g ${outlined(soft)}><ellipse cx='46' cy='22' rx='9' ry='13'/><ellipse cx='46' cy='22' rx='9' ry='13' transform='rotate(72 46 38)'/><ellipse cx='46' cy='22' rx='9' ry='13' transform='rotate(144 46 38)'/><ellipse cx='46' cy='22' rx='9' ry='13' transform='rotate(216 46 38)'/><ellipse cx='46' cy='22' rx='9' ry='13' transform='rotate(288 46 38)'/></g><circle cx='46' cy='38' r='7' ${outlined(accent)}/>`),
			};
		case "butterfly":
			return {
				width: "5.5rem",
				svg: wrap(100, 80, `<path d='M50 40C40 14 10 10 12 30C14 46 36 48 50 40Z' ${outlined(washi)}/><path d='M50 40C60 14 90 10 88 30C86 46 64 48 50 40Z' ${outlined(washi)}/><path d='M50 42C38 44 20 54 24 64C28 72 44 60 50 42Z' ${outlined(soft)}/><path d='M50 42C62 44 80 54 76 64C72 72 56 60 50 42Z' ${outlined(soft)}/><circle cx='28' cy='30' r='4' fill='${accent}' opacity='.6'/><circle cx='72' cy='30' r='4' fill='${accent}' opacity='.6'/><rect x='47' y='28' width='6' height='34' rx='3' fill='${ink}'/><path d='M48 28c-4-6-8-8-12-8M52 28c4-6 8-8 12-8' ${line}/>`),
			};
		case "rainbow":
			return {
				width: "6rem",
				svg: wrap(110, 70, `<path d='M12 58A43 43 0 0 1 98 58' fill='none' stroke='${accent}' stroke-width='9' stroke-linecap='round'/><path d='M22 58A33 33 0 0 1 88 58' fill='none' stroke='${soft}' stroke-width='9' stroke-linecap='round'/><path d='M32 58A23 23 0 0 1 78 58' fill='none' stroke='${washi}' stroke-width='9' stroke-linecap='round'/><path d='M12 58A43 43 0 0 1 98 58M36 58A19 19 0 0 1 74 58' ${line} stroke-width='2'/><path d='M8 58c-6 0-6-10 1-10c1-7 11-7 12 0c6 0 6 10 0 10Z' ${outlined("#fffefd")}/><path d='M90 58c-6 0-6-10 1-10c1-7 11-7 12 0c6 0 6 10 0 10Z' ${outlined("#fffefd")}/>`),
			};
		case "stars":
			return {
				width: "5rem",
				svg: wrap(90, 90, `<path d='${HEART}' fill='none'/><path transform='translate(8 8) scale(1.6)' d='${SPARK}' ${outlined(soft)}/><path transform='translate(50 18) scale(1.1)' d='${SPARK}' ${outlined(washi)}/><path transform='translate(40 54) scale(1.3)' d='${SPARK}' ${line}/><circle cx='22' cy='66' r='3' fill='${accent}' opacity='.6'/><circle cx='74' cy='54' r='2.2' fill='${accent}' opacity='.5'/>`),
			};
		case "moon":
			return {
				width: "4.5rem",
				svg: wrap(80, 80, `<path d='M52 10A31 31 0 1 0 70 60A24 24 0 0 1 52 10Z' ${outlined(soft)}/><path d='M34 40q4 4 8 0' ${line} stroke-width='2'/><circle cx='30' cy='46' r='3' fill='${accent}' opacity='.4'/><path transform='translate(56 14) scale(.6)' d='${SPARK}' fill='${washi}'/><path transform='translate(62 40) scale(.4)' d='${SPARK}' fill='${washi}'/>`),
			};
		case "coffee":
			return {
				width: "4.75rem",
				svg: wrap(90, 90, `<path d='M30 18c-4 6 4 8 0 14M44 14c-4 6 4 8 0 14M58 18c-4 6 4 8 0 14' ${line} stroke-opacity='.6' stroke-width='2'/><path d='M16 40H72V58A20 20 0 0 1 52 78H36A20 20 0 0 1 16 58Z' ${outlined("#fffefd")}/><path d='M72 46c10 0 12 14 0 16' ${line}/><path d='${heart(44, 58, 8)}' fill='${soft}' stroke='${ink}' stroke-width='2'/><path d='M22 84h44' ${line} stroke-opacity='.5'/>`),
			};
		case "plane":
			return {
				width: "5.5rem",
				svg: wrap(100, 80, `<path d='M6 66c8-8 14-14 26-22' ${line} stroke-dasharray='4 5' stroke-opacity='.6'/><path d='M34 42L92 14L70 70L54 52Z' ${outlined("#fffefd")}/><path d='M34 42L54 52L92 14' ${line}/><path d='M54 52L50 70L60 58' ${outlined(soft)}/><path d='${heart(82, 56, 6)}' fill='${accent}' opacity='.7'/>`),
			};
		case "cherries":
			return {
				width: "4.5rem",
				svg: wrap(80, 90, `<path d='M30 62C32 40 44 24 60 14M56 60C54 42 56 30 60 14' ${line}/><path d='M60 14c10-4 18 0 20 8c-8 2-16 0-20-8Z' ${outlined(washi)}/><circle cx='28' cy='70' r='13' ${outlined(accent)}/><circle cx='56' cy='68' r='13' ${outlined(accent)}/><circle cx='23' cy='65' r='3' fill='#fffefd' opacity='.7'/><circle cx='51' cy='63' r='3' fill='#fffefd' opacity='.7'/>`),
			};
		case "xoxo":
			return {
				width: "5.75rem",
				svg: wrap(110, 44, `<path d='M8 10L26 34M26 10L8 34' stroke='${accent}' stroke-width='4' stroke-linecap='round' fill='none'/><circle cx='44' cy='22' r='11' fill='none' stroke='${ink}' stroke-width='4'/><path d='M62 10L80 34M80 10L62 34' stroke='${accent}' stroke-width='4' stroke-linecap='round' fill='none'/><circle cx='98' cy='22' r='11' fill='none' stroke='${ink}' stroke-width='4'/>`),
			};
		case "sun":
			return {
				width: "5rem",
				svg: wrap(90, 90, `<circle cx='45' cy='45' r='22' ${outlined(soft)}/><path d='M45 5v12M45 73v12M5 45h12M73 45h12M17 17l9 9M64 64l9 9M73 17l-9 9M26 64l-9 9' ${line}/><path d='M35 41h1M54 41h1M36 53q9 8 18 0' ${line}/>`),
			};
		case "tulip":
			return {
				width: "4.75rem",
				svg: wrap(85, 100, `<path d='M42 49C30 42 27 27 31 18l11 9l11-9c4 9 1 24-11 31Z' ${outlined(soft)}/><path d='M42 49v46M42 70c-8-10-16-12-22-10c4 12 12 16 22 15M42 78c8-11 17-13 24-11c-6 13-14 17-24 16' ${line}/><path d='M31 18c5 3 9 4 11 9c2-5 6-6 11-9' ${line}/>`),
			};
		case "dove":
			return {
				width: "5.5rem",
				svg: wrap(110, 80, `<path d='M13 56C27 56 31 49 38 42C41 27 56 16 72 16C70 29 63 35 55 40C68 37 78 41 87 50C75 49 69 54 63 60C48 67 34 64 25 60Z' ${outlined("#fffefd")}/><path d='M39 42C49 47 55 51 63 60M50 37C62 26 73 26 84 29' ${line}/><circle cx='72' cy='44' r='2' fill='${ink}'/><path d='M87 50l12 3l-12 4' ${outlined(soft)}/>`),
			};
		case "key":
			return {
				width: "5rem",
				svg: wrap(100, 80, `<circle cx='29' cy='31' r='17' ${outlined(soft)}/><path d='${heart(29, 30, 7)}' fill='${accent}' opacity='.7'/><path d='M42 43L80 72L88 62L81 56L75 62L69 57L75 51L50 35' ${outlined(washi)}/>`),
			};
	}
}

/** Where each slot sits on the sheet, clear of the close button and the seal. */
const SLOT_POSITION: Record<StickerSlotId, string> = {
	tl: "left 1rem top 1rem",
	tr: "right 3.25rem top 1rem",
	bl: "left 0.5rem bottom 0.5rem",
	br: "right 0.75rem bottom 3.75rem",
};

/** Comma-separated background layers for `--paper-stickers`, or `none`. */
export function stickerLayers(stickers: NoteSticker[], colors: PaperColors) {
	if (!stickers.length) return "none";
	return stickers
		.map(({ id, slot }) => {
			const art = stickerArt(id, colors);
			return `${svgUri(art.svg)} ${SLOT_POSITION[slot]} / ${art.width} auto no-repeat`;
		})
		.join(", ");
}

/** One sticker as a standalone data URI (for picker tiles). */
export function stickerImage(id: StickerId, colors: PaperColors) {
	return svgUri(stickerArt(id, colors).svg);
}

export function letterFont(style: NoteStyle) {
	return LETTER_FONTS.find((entry) => entry.id === style.ink.font) ?? LETTER_FONTS[0];
}

function detailFont(id: NoteStyle["details"]["titleFont"]) {
	return LETTER_FONTS.find((entry) => entry.id === id) ?? LETTER_FONTS[0];
}

/** Custom properties for `.letter-sheet` / `.letter-paper`. */
export function paperStyleVars(style: NoteStyle): CSSProperties {
	const colors = paperColors(style);
	const template = PAPER_TEMPLATES.find((entry) => entry.id === style.paper.template);
	return {
		"--ink": colors.ink,
		"--accent": colors.accent,
		"--paper-tint": paperTint(style),
		"--paper-pattern": paperPatternUri(style.paper.pattern, colors),
		"--paper-stickers": style.paper.template === "none" ? stickerLayers(style.stickers, colors) : "none",
		"--paper-template": template?.image ? `url("${template.image}") center / 100% 100% no-repeat` : "none",
		"--tpl-pad": TEMPLATE_TEXT_INSET,
		"--washi": washiRgb(style),
		"--letter-font": letterFont(style).family,
		"--title-font": detailFont(style.details.titleFont).family,
		"--signature-font": detailFont(style.details.signatureFont).family,
	} as CSSProperties;
}

export function paperDataAttrs(style: NoteStyle) {
	return {
		"data-paper-edge": style.paper.edge,
		"data-stamp-size": style.paper.stampSize,
		"data-letter-font": letterFont(style).handwritten ? "handwritten" : "print",
		"data-title-font": detailFont(style.details.titleFont).handwritten ? "handwritten" : "print",
		"data-signature-font": detailFont(style.details.signatureFont).handwritten ? "handwritten" : "print",
		"data-paper-template": style.paper.template,
		"data-date-style": style.details.dateStyle,
	};
}
