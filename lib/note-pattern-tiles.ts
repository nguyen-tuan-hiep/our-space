/*
 * Repeating prints for the envelope and the letter paper, as small SVG tiles
 * (designed and checked in Figma, frames "Envelope prints" and "Paper
 * patterns"). Each function returns the tile's SVG and its CSS size; the
 * callers turn it into a background layer. Pure functions with no imports, so
 * they also run outside the app.
 */

export interface PatternTile {
	/** A complete `<svg>` document, single-quoted so it embeds in a CSS url(). */
	svg: string;
	width: number;
	height: number;
}

const tile = (width: number, height: number, body: string): PatternTile => ({
	svg: `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>${body}</svg>`,
	width,
	height,
});

const n = (value: number) => +value.toFixed(2);
const HEART = "M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21z";

/** A heart whose top-left is (x, y) at `s` times its 24-unit box. */
const heart = (x: number, y: number, s: number, fill: string, opacity: number) =>
	`<path d='${HEART}' fill='${fill}' fill-opacity='${opacity}' transform='translate(${n(x)} ${n(y)}) scale(${n(s)})'/>`;

/** A concave four-point sparkle centred on (cx, cy). */
const sparkle = (cx: number, cy: number, r: number, fill: string, opacity: number) =>
	`<path d='M${n(cx)} ${n(cy - r)}C${n(cx + r * 0.1)} ${n(cy - r * 0.3)} ${n(cx + r * 0.3)} ${n(cy - r * 0.1)} ${n(cx + r)} ${n(cy)}C${n(cx + r * 0.3)} ${n(cy + r * 0.1)} ${n(cx + r * 0.1)} ${n(cy + r * 0.3)} ${n(cx)} ${n(cy + r)}C${n(cx - r * 0.1)} ${n(cy + r * 0.3)} ${n(cx - r * 0.3)} ${n(cy + r * 0.1)} ${n(cx - r)} ${n(cy)}C${n(cx - r * 0.3)} ${n(cy - r * 0.1)} ${n(cx - r * 0.1)} ${n(cy - r * 0.3)} ${n(cx)} ${n(cy - r)}Z' fill='${fill}' fill-opacity='${opacity}'/>`;

const dot = (cx: number, cy: number, r: number, fill: string, opacity: number) =>
	`<circle cx='${n(cx)}' cy='${n(cy)}' r='${n(r)}' fill='${fill}' fill-opacity='${opacity}'/>`;

/** A leaf pointing up from its base at the origin, `len` long. */
const leafPath = (len: number) => {
	const w = len * 0.3;
	return `M0 0C${n(-w)} ${n(-len * 0.26)} ${n(-w)} ${n(-len * 0.7)} 0 ${n(-len)}C${n(w)} ${n(-len * 0.7)} ${n(w)} ${n(-len * 0.26)} 0 0Z`;
};
const leaf = (x: number, y: number, angle: number, len: number, fill: string, opacity: number) =>
	`<path d='${leafPath(len)}' fill='${fill}' fill-opacity='${opacity}' transform='translate(${n(x)} ${n(y)}) rotate(${angle})'/>`;

/** A leafy sprig growing up from (x, y): a curved stem with paired leaves and a tip. */
const sprig = (x: number, y: number, scale: number, rotate: number, fill: string, opacity: number) =>
	`<g transform='translate(${n(x)} ${n(y)}) rotate(${rotate}) scale(${scale})'><path d='M0 0C2 -10 -2 -20 1 -31' fill='none' stroke='${fill}' stroke-opacity='${n(opacity + 0.06)}' stroke-width='1' stroke-linecap='round'/>${leaf(1.4, -9, -48, 9, fill, opacity)}${leaf(1.4, -9, 48, 9, fill, opacity)}${leaf(0, -18, -46, 8, fill, opacity)}${leaf(0, -18, 46, 8, fill, opacity)}${leaf(0.3, -25, -42, 6.5, fill, opacity)}${leaf(0.3, -25, 42, 6.5, fill, opacity)}${leaf(1, -31, 0, 7, fill, opacity)}</g>`;

/** A rosebud on a short stem: a cupped bud with a fold line and two leaves. */
const rosebud = (x: number, y: number, s: number, fill: string) =>
	`<g transform='translate(${n(x)} ${n(y)}) scale(${s})'><path d='M0 5V14' fill='none' stroke='${fill}' stroke-opacity='0.4' stroke-width='1' stroke-linecap='round'/>${leaf(0.2, 11, -58, 6.5, fill, 0.3)}${leaf(0.2, 11, 58, 6.5, fill, 0.3)}<path d='M0 5.4C-5.6 4 -5.8 -3.6 -1.8 -6.4C-0.6 -4.8 0.6 -4.8 1.8 -6.4C5.8 -3.6 5.6 4 0 5.4Z' fill='${fill}' fill-opacity='0.36'/><path d='M0 4.6C-2 1.4 -2 -2.4 -0.6 -5.4M0 4.6C2 1.4 2 -2.4 0.6 -5.4' fill='none' stroke='${fill}' stroke-opacity='0.6' stroke-width='0.8' stroke-linecap='round'/></g>`;

/** A bow: two loops, a knot and short tails, centred on the origin. */
const bow = (x: number, y: number, s: number, fill: string) =>
	`<g transform='translate(${n(x)} ${n(y)}) scale(${s})' fill='${fill}'><path fill-opacity='0.34' d='M-0.5 1L-3.4 8.6L-0.6 7L0 9.2L0.6 7L3.4 8.6L0.5 1Z'/><path fill-opacity='0.4' d='M0 0C-3.6 -5.2 -9.4 -4.6 -8.6 0C-9.4 4.6 -3.6 5.2 0 0ZM0 0C3.6 -5.2 9.4 -4.6 8.6 0C9.4 4.6 3.6 5.2 0 0Z'/><circle r='1.8' fill-opacity='0.55'/></g>`;

/** A daisy: eight petals around a centre. */
const daisy = (cx: number, cy: number, s: number, petal: string, centre: string, opacity: number) => {
	let petals = "";
	for (let i = 0; i < 8; i += 1) {
		petals += `<ellipse cx='${n(cx)}' cy='${n(cy - 6.4 * s)}' rx='${n(2.2 * s)}' ry='${n(4.8 * s)}' transform='rotate(${i * 45} ${n(cx)} ${n(cy)})' fill='${petal}' fill-opacity='${opacity}'/>`;
	}
	return `${petals}${dot(cx, cy, 2.6 * s, centre, n(Math.min(1, opacity * 3)))}`;
};

export type EnvelopePrintId =
	| "pinstripe" | "gingham" | "polka" | "hearts" | "stars" | "diagonal" | "waves"
	| "lattice" | "botanical" | "sunburst" | "rosebuds" | "bows" | "moons";

/** Prints for the envelope paper, in one tone: its own deeper shade, or white on dark paper. */
export function envelopeTile(id: EnvelopePrintId, c: string): PatternTile | null {
	switch (id) {
		case "pinstripe":
			return tile(12, 12, `<rect x='2' width='1' height='12' fill='${c}' fill-opacity='0.26'/><rect x='5' width='0.5' height='12' fill='${c}' fill-opacity='0.15'/>`);
		case "gingham":
			return tile(20, 20, `<rect width='10' height='20' fill='${c}' fill-opacity='0.1'/><rect width='20' height='10' fill='${c}' fill-opacity='0.1'/>`);
		case "polka":
			return tile(24, 24, `${dot(6, 6, 2.6, c, 0.26)}${dot(18, 18, 2.6, c, 0.26)}${dot(18, 6, 1.2, c, 0.16)}${dot(6, 18, 1.2, c, 0.16)}`);
		case "hearts":
			return tile(36, 32, `${heart(5, 3, 0.62, c, 0.42)}${heart(22, 19, 0.46, c, 0.3)}${dot(30, 6, 0.9, c, 0.26)}${dot(12, 26, 0.8, c, 0.22)}`);
		case "stars":
			return tile(36, 36, `${sparkle(11, 11, 5.5, c, 0.34)}${sparkle(28, 27, 3.2, c, 0.26)}${dot(29, 8, 0.9, c, 0.3)}${dot(7, 29, 0.8, c, 0.22)}`);
		case "diagonal":
			return tile(24, 24, `<path d='M12 0L24 12L12 24L0 12Z' fill='${c}' fill-opacity='0.09'/><path d='M12 5L19 12L12 19L5 12Z' fill='none' stroke='${c}' stroke-opacity='0.24' stroke-width='0.7'/>`);
		case "waves":
			return tile(18, 18, `<g fill='none' stroke='${c}' stroke-opacity='0.26' stroke-width='0.9'><circle cx='0' cy='0' r='9'/><circle cx='18' cy='0' r='9'/><circle cx='9' cy='9' r='9'/><circle cx='0' cy='18' r='9'/><circle cx='18' cy='18' r='9'/></g>`);
		case "lattice":
			return tile(22, 22, `<path d='M0 0L22 22M22 0L0 22' stroke='${c}' stroke-opacity='0.2' stroke-width='0.8'/>${dot(11, 11, 1.5, c, 0.3)}${dot(0, 0, 1.5, c, 0.3)}${dot(22, 0, 1.5, c, 0.3)}${dot(0, 22, 1.5, c, 0.3)}${dot(22, 22, 1.5, c, 0.3)}`);
		case "botanical":
			return tile(44, 44, `${sprig(11, 38, 0.8, -8, c, 0.3)}${sprig(33, 40, 0.8, 8, c, 0.3)}`);
		case "sunburst":
			return tile(20, 20, `<path d='M10 6V14M6 10H14' stroke='${c}' stroke-opacity='0.32' stroke-width='1.2' stroke-linecap='round'/>${dot(0, 0, 0.9, c, 0.2)}${dot(20, 0, 0.9, c, 0.2)}${dot(0, 20, 0.9, c, 0.2)}${dot(20, 20, 0.9, c, 0.2)}`);
		case "rosebuds":
			return tile(40, 40, `${rosebud(10, 9, 1, c)}${rosebud(30, 27, 0.85, c)}${dot(31, 7, 0.9, c, 0.24)}${dot(9, 33, 0.8, c, 0.2)}`);
		case "bows":
			return tile(40, 34, `${bow(11, 9, 1, c)}${bow(31, 26, 0.8, c)}`);
		case "moons":
			return tile(40, 40, `<path d='M20 4C14 4 10 9 10 14C10 19 14 24 20 24C22 24 23.6 23.4 25 22.4C20 22.4 17 19 17 14C17 9 20 5.6 25 5.6C23.6 4.6 22 4 20 4Z' fill='${c}' fill-opacity='0.36'/>${sparkle(31, 12, 3.4, c, 0.3)}${sparkle(12, 33, 2.4, c, 0.26)}${dot(32, 31, 0.9, c, 0.22)}`);
		default:
			return null;
	}
}

export interface PaperPatternColors {
	ink: string;
	accent: string;
	soft: string;
}

export type PaperPrintId =
	| "dots" | "grid" | "hearts" | "stars" | "confetti" | "stripes" | "floral"
	| "waves" | "botanical" | "clouds" | "checker" | "speckles";

/** Prints for the letter sheet, in the note's ink, accent and softer accent. */
export function paperTile(id: PaperPrintId, { ink, accent, soft }: PaperPatternColors): PatternTile | null {
	const capsule = (x: number, y: number, angle: number, fill: string, opacity: number) =>
		`<rect x='${n(x - 5)}' y='${n(y - 2)}' width='10' height='4' rx='2' fill='${fill}' fill-opacity='${opacity}' transform='rotate(${angle} ${n(x)} ${n(y)})'/>`;
	switch (id) {
		case "dots":
			return tile(22, 22, dot(11, 11, 1.3, ink, 0.2));
		case "grid":
			return tile(28, 28, `<path d='M0 27.5H28M27.5 0V28' stroke='${ink}' stroke-opacity='0.1' stroke-width='1'/>`);
		case "hearts":
			return tile(48, 48, `${heart(6, 6, 0.7, accent, 0.24)}${heart(31, 29, 0.5, accent, 0.17)}${dot(37, 9, 1.2, soft, 0.6)}${dot(10, 39, 1, ink, 0.1)}`);
		case "stars":
			return tile(56, 56, `${sparkle(14, 14, 6.5, accent, 0.26)}${sparkle(40, 38, 4, ink, 0.12)}${dot(44, 12, 1.2, accent, 0.24)}${dot(12, 44, 1, ink, 0.12)}`);
		case "confetti":
			return tile(60, 60, `${capsule(12, 10, -30, accent, 0.26)}${capsule(42, 14, 25, soft, 0.6)}${capsule(24, 36, 70, ink, 0.12)}${capsule(50, 46, -20, accent, 0.2)}${capsule(8, 52, 40, soft, 0.5)}${dot(34, 8, 1.6, ink, 0.12)}${dot(52, 28, 2, accent, 0.22)}${dot(30, 54, 1.5, soft, 0.6)}`);
		case "stripes":
			return tile(24, 24, `<rect width='10' height='24' fill='${accent}' fill-opacity='0.06'/><rect x='12' width='1.2' height='24' fill='${accent}' fill-opacity='0.16'/>`);
		case "floral":
			return tile(72, 72, `${daisy(18, 20, 1, accent, soft, 0.22)}${daisy(54, 56, 0.76, accent, soft, 0.17)}${leaf(36, 40, -50, 7, accent, 0.16)}${leaf(36, 40, 50, 7, accent, 0.16)}${dot(56, 14, 1.2, soft, 0.6)}${dot(14, 58, 1, soft, 0.6)}`);
		case "waves":
			return tile(24, 24, `<g fill='none' stroke='${ink}' stroke-opacity='0.1' stroke-width='0.8'><circle cx='0' cy='0' r='12'/><circle cx='24' cy='0' r='12'/><circle cx='12' cy='12' r='12'/><circle cx='0' cy='24' r='12'/><circle cx='24' cy='24' r='12'/></g>`);
		case "botanical":
			return tile(68, 76, `${sprig(18, 66, 1.05, -10, accent, 0.22)}${sprig(50, 70, 0.9, 12, accent, 0.18)}${dot(36, 20, 1.2, soft, 0.6)}${dot(62, 24, 1, soft, 0.6)}`);
		case "clouds": {
			const cloud = (x: number, y: number, s: number, opacity: number) =>
				`<path d='M12 38C5 38 2 33 3 29C4 24 9 22 13 23C14 15 24 11 31 15C36 9 47 11 49 19C55 19 58 24 56 29C55 34 51 38 46 38Z' fill='${accent}' fill-opacity='${opacity}' transform='translate(${x} ${y}) scale(${s})'/>`;
			return tile(88, 64, `${cloud(2, 4, 0.8, 0.09)}${cloud(48, 34, 0.5, 0.07)}${sparkle(70, 14, 3, accent, 0.2)}${dot(14, 54, 1.1, soft, 0.6)}`);
		}
		case "checker":
			return tile(32, 32, `<rect width='16' height='16' fill='${accent}' fill-opacity='0.06'/><rect x='16' y='16' width='16' height='16' fill='${accent}' fill-opacity='0.06'/>`);
		case "speckles":
			return tile(48, 48, `${dot(6, 10, 1.2, ink, 0.15)}${dot(34, 6, 1.8, accent, 0.2)}${dot(20, 28, 1, ink, 0.18)}${dot(42, 38, 1.4, accent, 0.16)}${dot(8, 42, 1.6, soft, 0.45)}`);
		default:
			return null;
	}
}
