import type { CSSProperties } from "react";
import { envelopeTile } from "@/lib/note-pattern-tiles";
import { textureTile } from "@/lib/note-paper-texture";
import {
	ENVELOPE_COLORS,
	INK_COLORS,
	PAPER_TINTS,
	WASHI_COLORS,
	WAX_COLORS,
	type EnvelopePatternId,
	type EnvelopeFlapId,
	type NoteStyle,
} from "@/lib/note-style";

/*
 * Turns a NoteStyle into the CSS custom properties the envelope reads. The
 * card, the reader and the composer all import this; the heavier paper art
 * (patterns, stickers) lives in lib/note-paper-art.ts so the card chunk stays
 * small.
 */

/** Inline an SVG as a compact, CSS-safe data URI layer. */
export function svgUri(svg: string) {
	const encoded = encodeURIComponent(svg.replace(/\s+/g, " ").trim())
		.replace(/%20/g, " ")
		.replace(/%3D/g, "=")
		.replace(/%3A/g, ":")
		.replace(/%2F/g, "/")
		.replace(/%2C/g, ",")
		.replace(/%27/g, "'");
	return `url("data:image/svg+xml,${encoded}")`;
}

function channel(hex: string, index: number) {
	return parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16);
}

/** Blend `hex` toward `toward` by `amount` (0 keeps `hex`, 1 is `toward`). */
export function hexMix(hex: string, toward: string, amount: number) {
	const mix = (index: number) =>
		Math.round(channel(hex, index) + (channel(toward, index) - channel(hex, index)) * amount)
			.toString(16)
			.padStart(2, "0");
	return `#${mix(0)}${mix(1)}${mix(2)}`;
}

/** Shades of one wax color for the seal's gradients and strokes. */
export function waxPalette(hex: string) {
	return {
		light: hexMix(hex, "#ffffff", 0.34),
		mid: hex,
		dark: hexMix(hex, "#000000", 0.18),
		deep: hexMix(hex, "#000000", 0.38),
		rimLight: hexMix(hex, "#ffffff", 0.48),
		rimDark: hexMix(hex, "#000000", 0.42),
		discLight: hexMix(hex, "#ffffff", 0.08),
		discDark: hexMix(hex, "#000000", 0.26),
		motifLight: hexMix(hex, "#ffffff", 0.5),
		motifDark: hexMix(hex, "#000000", 0.12),
		edge: hexMix(hex, "#000000", 0.55),
		shadowInk: hexMix(hex, "#000000", 0.62),
		highlight: hexMix(hex, "#ffffff", 0.82),
	};
}

export function envelopeColors(style: NoteStyle) {
	return ENVELOPE_COLORS.find((entry) => entry.id === style.envelope.color) ?? ENVELOPE_COLORS[0];
}

export function inkColors(style: NoteStyle) {
	return INK_COLORS.find((entry) => entry.id === style.ink.color) ?? INK_COLORS[0];
}

export function paperTint(style: NoteStyle) {
	return (PAPER_TINTS.find((entry) => entry.id === style.paper.tint) ?? PAPER_TINTS[0]).hex;
}

export function washiRgb(style: NoteStyle) {
	return (WASHI_COLORS.find((entry) => entry.id === style.paper.washi) ?? WASHI_COLORS[0]).rgb;
}

export function waxHex(style: NoteStyle) {
	return (WAX_COLORS.find((entry) => entry.id === style.seal.color) ?? WAX_COLORS[0]).hex;
}

function envelopeFlapMask(id: EnvelopeFlapId) {
	const path = {
		classic: "M0 0H300L171 111Q150 130 129 111Z",
		square: "M0 0H300V105H0Z",
		heart: "M0 0H300V26C300 70 245 78 209 91C180 101 163 119 150 137C137 119 120 101 91 91C55 78 0 70 0 26Z",
		scallop: "M0 0H300V91Q285 119 270 91Q255 119 240 91Q225 119 210 91Q195 119 180 91Q165 119 150 91Q135 119 120 91Q105 119 90 91Q75 119 60 91Q45 119 30 91Q15 119 0 91Z",
		wave: "M0 0H300V93C270 48 240 136 210 93S150 48 120 93S60 136 30 93S10 70 0 93Z",
		crescent: "M0 0H300V48Q150 180 0 48Z",
	}[id];
	return svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200' preserveAspectRatio='none'><path d='${path}'/></svg>`);
}

/**
 * Background layer(s) printed on the envelope's pocket and flap, in a darker
 * shade of the envelope's own color (white on a dark envelope) so every color
 * stays tonal. `none` for plain. The tiles are designed in Figma, see
 * lib/note-pattern-tiles.ts.
 */
export function envelopePatternUri(id: EnvelopePatternId, deep: string, light: boolean) {
	if (id === "none") return "none";
	if (id === "airmail") {
		const stripes = (angle: number) =>
			`repeating-linear-gradient(${angle}deg, #c8414b 0 7px, transparent 7px 14px, #2f5fa8 14px 21px, transparent 21px 28px)`;
		return [
			`${stripes(135)} top / 100% 5px no-repeat`,
			`${stripes(135)} bottom / 100% 5px no-repeat`,
			`${stripes(45)} left / 5px 100% no-repeat`,
			`${stripes(45)} right / 5px 100% no-repeat`,
		].join(", ");
	}
	// Hearts keep their own rose; every other print is tonal.
	const tone = id === "hearts" ? "#a62452" : light ? hexMix(deep, "#000000", 0.22) : "#ffffff";
	const print = envelopeTile(id, tone);
	return print ? `${svgUri(print.svg)} 0 0 / ${print.width}px ${print.height}px repeat` : "none";
}

/** The paper texture on the envelope's outside (the same tiles as the letter paper). */
function envelopeTextureUri(style: NoteStyle) {
	const tile = textureTile(style.envelope.texture);
	return tile ? `${svgUri(tile.svg)} 0 0 / ${tile.width}px ${tile.height}px repeat` : "none";
}

const DIAMOND_LINING = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 0L0 12L12 24L24 12Z' fill='none' stroke='white' stroke-opacity='0.22' stroke-width='0.8' stroke-linecap='round'/><circle cx='12' cy='12' r='1.2' fill='black' fill-opacity='0.08'/></svg>";

/** The print on the envelope's lining as a background layer, or `none` for a plain lining. */
export function envelopeLiningLayer(lining: NoteStyle["envelope"]["lining"], deep: string) {
	if (lining === "plain") return "none";
	if (lining === "diamond") return `${svgUri(DIAMOND_LINING)} 0 0 / 12px 12px repeat`;
	// The lining is a deeper shade than the paper, so its print is lighter than it.
	const print = envelopeTile(lining, hexMix(deep, "#ffffff", 0.7));
	return print ? `${svgUri(print.svg)} 0 0 / ${print.width}px ${print.height}px repeat` : "none";
}

function envelopeLiningVars(style: NoteStyle, deep: string): CSSProperties {
	return { "--envelope-liner": envelopeLiningLayer(style.envelope.lining, deep) } as CSSProperties;
}

/** Custom properties for `.envelope`: base/deep tones, the peeking letter's paper and the print. */
export function envelopeStyleVars(style: NoteStyle): CSSProperties {
	const color = envelopeColors(style);
	const light = style.envelope.color !== "midnight";
	return {
		"--env-base": color.base,
		"--env-deep": color.deep,
		"--envelope-paper": paperTint(style),
		"--envelope-pattern": envelopePatternUri(style.envelope.pattern, color.deep, light),
		"--envelope-flap-mask": envelopeFlapMask(style.envelope.flap),
		"--envelope-texture": envelopeTextureUri(style),
		...envelopeLiningVars(style, color.deep),
	} as CSSProperties;
}
