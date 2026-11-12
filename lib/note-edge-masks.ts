/*
 * Cut edges for the letter sheet, as CSS masks. Each edge is a profile (how far
 * the paper is cut in from the outer edge along one side) turned into thin SVG
 * strips for the four sides plus a solid centre. The same profiles draw the
 * silhouettes in the Figma frame "Paper edges", so what is designed there is
 * what the sheet cuts. Pure functions with no imports.
 */

export type PaperEdgeKind =
	| "flat" | "rounded" | "deckle" | "torn" | "scallop" | "zigzag" | "wave" | "stamp" | "ticket" | "snip";

export type StampPerforation = "fine" | "classic" | "bold";

interface Profile {
	/** Thickness of the strip along each side, in px. */
	depth: number;
	/** Periodic edges repeat every `period` px; irregular ones stretch along the side. */
	period?: number;
	/** How far in from the outer edge the paper stops at u (0..1 across a period, or the side). */
	cut: (u: number, side: number) => number;
	/** Which sides (top, right, bottom, left) are cut. */
	sides: [boolean, boolean, boolean, boolean];
}

const mulberry32 = (seed: number) => () => {
	seed = (seed + 0x6d2b79f5) | 0;
	let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Smooth value noise over 0..1 that is identical at both ends, so strips never show a seam. */
function smoothNoise(seed: number, cells: number) {
	const rand = mulberry32(seed);
	const values = Array.from({ length: cells }, () => rand());
	values.push(values[0]);
	return (u: number) => {
		const x = u * cells, i = Math.min(cells - 1, Math.floor(x)), f = x - i;
		const s = f * f * (3 - 2 * f);
		return values[i] * (1 - s) + values[i + 1] * s;
	};
}

function jagged(seed: number, steps: number) {
	const rand = mulberry32(seed);
	const values = Array.from({ length: steps }, (_, i) => (i % 2 ? 0.35 : 0) + rand() * 0.65);
	values.push(values[0]);
	return (u: number) => {
		const x = u * steps, i = Math.min(steps - 1, Math.floor(x)), f = x - i;
		return values[i] * (1 - f) + values[i + 1] * f; // straight segments between random points
	};
}

const PROFILES: Partial<Record<PaperEdgeKind, () => Profile>> = {
	zigzag: () => ({ depth: 7, period: 14, sides: [true, true, true, true], cut: (u) => 7 * (1 - Math.abs(2 * u - 1)) }),
	scallop: () => ({ depth: 7, period: 14, sides: [true, true, true, true], cut: (u) => 7 * (1 - Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2))) }),
	wave: () => ({ depth: 6, period: 30, sides: [true, true, true, true], cut: (u) => 3 * (1 - Math.cos(2 * Math.PI * u)) }),
	deckle: () => {
		const coarse = [smoothNoise(11, 9), smoothNoise(23, 9), smoothNoise(37, 9), smoothNoise(41, 9)];
		const fine = [smoothNoise(5, 40), smoothNoise(7, 40), smoothNoise(13, 40), smoothNoise(17, 40)];
		return { depth: 7, sides: [true, true, true, true], cut: (u, side) => 7 * Math.min(1, 0.12 + 0.62 * coarse[side](u) + 0.34 * fine[side](u)) };
	},
	torn: () => {
		const tops = [jagged(3, 46), jagged(9, 46), jagged(14, 46), jagged(20, 46)];
		return { depth: 12, sides: [true, false, true, false], cut: (u, side) => 12 * tops[side](u) };
	},
};

/** The profile of a strip-cut edge, or null for edges that are not cut with strips. */
export function edgeProfile(id: PaperEdgeKind): Profile | null {
	return PROFILES[id]?.() ?? null;
}

const f = (v: number) => +v.toFixed(2);

/** A data-URI strip for one side. Horizontal sides are `length` wide, vertical sides `length` tall. */
function strip(profile: Profile, side: number, length: number, samples: number, scale: number) {
	const depth = profile.depth * scale;
	const horizontal = side % 2 === 0;
	const outer = side === 0 || side === 3; // paper is kept on the high end of the depth axis
	let d = '';
	const points: Array<[number, number]> = [];
	for (let i = 0; i <= samples; i += 1) {
		const u = i / samples;
		const cut = profile.cut(u, side) * scale;
		const depthAxis = outer ? cut : depth - cut;
		points.push(horizontal ? [u * length, depthAxis] : [depthAxis, u * length]);
	}
	const first = points[0], last = points[points.length - 1];
	const base = (p: [number, number]): [number, number] =>
		horizontal ? [p[0], outer ? depth : 0] : [outer ? depth : 0, p[1]];
	d = `M${f(base(first)[0])} ${f(base(first)[1])}` + points.map((p) => `L${f(p[0])} ${f(p[1])}`).join("") + `L${f(base(last)[0])} ${f(base(last)[1])}Z`;
	const w = horizontal ? length : depth, h = horizontal ? depth : length;
	const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${f(w)}' height='${f(h)}' viewBox='0 0 ${f(w)} ${f(h)}' preserveAspectRatio='none'><path d='${d}'/></svg>`;
	return `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/%20/g, " ").replace(/%3D/g, "=").replace(/%3A/g, ":").replace(/%2F/g, "/").replace(/%2C/g, ",").replace(/%27/g, "'")}")`;
}

const STAMP = {
	fine: { notch: 5, hole: 3, pitch: 12 },
	classic: { notch: 7, hole: 4.5, pitch: 16 },
	bold: { notch: 9, hole: 5.5, pitch: 20 },
} as const;

/**
 * The CSS `mask` value that cuts the sheet's outline for an edge, or null for
 * edges that need no mask (flat, rounded).
 */
export function edgeMask(id: PaperEdgeKind, perforation: StampPerforation = "classic", scale = 1): string | null {
	if (id === "flat" || id === "rounded") return null;

	if (id === "stamp") {
		const { notch: n, hole: h, pitch: p } = STAMP[perforation];
		const bite = (at: string, size: string, repeat: string, position: string) =>
			`radial-gradient(circle at ${at}, transparent ${h - 0.5}px, #000 ${h}px) ${position} / ${size} ${repeat}`;
		return [
			`linear-gradient(#000 0 0) ${n}px ${n}px / calc(100% - ${2 * n}px) calc(100% - ${2 * n}px) no-repeat`,
			bite("50% 0", `${p}px ${n}px`, "repeat-x", "top"),
			bite("50% 100%", `${p}px ${n}px`, "repeat-x", "bottom"),
			bite("0 50%", `${n}px ${p}px`, "repeat-y", "left"),
			bite("100% 50%", `${n}px ${p}px`, "repeat-y", "right"),
		].join(", ");
	}

	if (id === "ticket") {
		const r = 14;
		const corner = (at: string, position: string) =>
			`radial-gradient(circle at ${at}, transparent ${r}px, #000 ${r + 0.5}px) ${position} / ${r}px ${r}px no-repeat`;
		return [
			`linear-gradient(#000 0 0) ${r}px 0 / calc(100% - ${2 * r}px) 100% no-repeat`,
			`linear-gradient(#000 0 0) 0 ${r}px / 100% calc(100% - ${2 * r}px) no-repeat`,
			corner("0 0", "top left"), corner("100% 0", "top right"), corner("0 100%", "bottom left"), corner("100% 100%", "bottom right"),
		].join(", ");
	}

	if (id === "snip") {
		const r = 18;
		const corner = (angle: number, position: string) =>
			`linear-gradient(${angle}deg, transparent ${r * 0.7071}px, #000 ${r * 0.7071 + 0.5}px) ${position} / ${r}px ${r}px no-repeat`;
		return [
			`linear-gradient(#000 0 0) ${r}px 0 / calc(100% - ${2 * r}px) 100% no-repeat`,
			`linear-gradient(#000 0 0) 0 ${r}px / 100% calc(100% - ${2 * r}px) no-repeat`,
			corner(135, "top left"), corner(225, "top right"), corner(45, "bottom left"), corner(315, "bottom right"),
		].join(", ");
	}

	const profile = edgeProfile(id);
	if (!profile) return null;
	const depth = profile.depth * scale;
	const period = profile.period ? profile.period * scale : undefined;
	const layers: string[] = [];
	// the solid centre, inset where the sides are cut
	const [top, right, bottom, left] = profile.sides.map((on) => (on ? depth : 0));
	layers.push(`linear-gradient(#000 0 0) ${f(left)}px ${f(top)}px / calc(100% - ${f(left + right)}px) calc(100% - ${f(top + bottom)}px) no-repeat`);
	const sides: Array<[number, string]> = [[0, "top left"], [1, "top right"], [2, "bottom left"], [3, "top left"]];
	for (const [side, position] of sides) {
		if (!profile.sides[side]) continue;
		const horizontal = side % 2 === 0;
		const length = period ?? 160;
		const image = strip(profile, side, length, period ? 28 : 160, scale);
		if (period) {
			layers.push(horizontal ? `${image} ${position} / ${f(period)}px ${f(depth)}px repeat-x` : `${image} ${position} / ${f(depth)}px ${f(period)}px repeat-y`);
		} else {
			layers.push(horizontal ? `${image} ${position} / 100% ${f(depth)}px no-repeat` : `${image} ${position} / ${f(depth)}px 100% no-repeat`);
		}
	}
	return layers.join(", ");
}

/** How far each edge cuts into the outline, in px: used to keep text and the tape clear of it. */
export function edgeInset(id: PaperEdgeKind): number {
	if (id === "stamp") return 9;
	if (id === "ticket") return 14;
	if (id === "snip") return 18;
	return edgeProfile(id)?.depth ?? 0;
}
