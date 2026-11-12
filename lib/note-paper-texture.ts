/*
 * Paper textures as seamless vector tiles: fibers, flecks, laid lines, woven
 * threads and soft mottling, drawn from a fixed seed so every viewer sees the
 * same sheet. Designed and checked in Figma (frame "Paper textures"); the same
 * tiles texture the envelope paper. Pure functions with no imports.
 */

export type TextureId = "smooth" | "laid" | "linen" | "cotton" | "kraft" | "handmade" | "parchment" | "recycled" | "crumpled" | "stained";

export interface TextureTile {
	svg: string;
	width: number;
	height: number;
}

const mulberry32 = (seed: number) => () => {
	seed = (seed + 0x6d2b79f5) | 0;
	let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const f = (v: number) => +v.toFixed(1);

/**
 * Draws `shape` once for every offset of the tile at which it still touches the
 * tile, so what leaves one edge re-enters at the opposite edge.
 */
function wrapped(width: number, height: number, bounds: [number, number, number, number], shape: (dx: number, dy: number) => string) {
	const [x0, y0, x1, y1] = bounds;
	let out = "";
	for (const dy of [-height, 0, height]) {
		for (const dx of [-width, 0, width]) {
			if (x1 + dx < 0 || x0 + dx > width || y1 + dy < 0 || y0 + dy > height) continue;
			out += shape(dx, dy);
		}
	}
	return out;
}

interface FiberOptions {
	count: number;
	minLength: number;
	maxLength: number;
	color: string;
	minOpacity: number;
	maxOpacity: number;
	width: number;
	bend?: number;
}

/** Three opacity steps, so strokes can share one path per step instead of one each. */
const STEPS = 3;
const step = (rand: () => number, min: number, max: number) => {
	const i = Math.floor(rand() * STEPS);
	return { index: i, opacity: f((min + ((max - min) * i) / (STEPS - 1)) * 100) / 100 };
};

function fibers(rand: () => number, size: number, o: FiberOptions) {
	const buckets: string[] = Array.from({ length: STEPS }, () => "");
	const opacities: number[] = [];
	for (let i = 0; i < o.count; i += 1) {
		const x = rand() * size, y = rand() * size;
		const length = o.minLength + rand() * (o.maxLength - o.minLength);
		const angle = rand() * Math.PI;
		const dx = Math.cos(angle) * length, dy = Math.sin(angle) * length;
		const bend = (rand() - 0.5) * length * (o.bend ?? 0.5);
		const cx = x + dx / 2 - Math.sin(angle) * bend, cy = y + dy / 2 + Math.cos(angle) * bend;
		const { index, opacity } = step(rand, o.minOpacity, o.maxOpacity);
		opacities[index] = opacity;
		const bounds: [number, number, number, number] = [Math.min(x, x + dx, cx) - 1, Math.min(y, y + dy, cy) - 1, Math.max(x, x + dx, cx) + 1, Math.max(y, y + dy, cy) + 1];
		buckets[index] += wrapped(size, size, bounds, (ox, oy) => `M${f(x + ox)} ${f(y + oy)}Q${f(cx + ox)} ${f(cy + oy)} ${f(x + dx + ox)} ${f(y + dy + oy)}`);
	}
	const paths = buckets.map((d, i) => (d ? `<path stroke-opacity='${opacities[i]}' d='${d}'/>` : "")).join("");
	return `<g fill='none' stroke='${o.color}' stroke-width='${o.width}' stroke-linecap='round'>${paths}</g>`;
}

interface FleckOptions {
	count: number;
	minRadius: number;
	maxRadius: number;
	colors: string[];
	minOpacity: number;
	maxOpacity: number;
}

function flecks(rand: () => number, size: number, o: FleckOptions) {
	const buckets = new Map<string, string>();
	for (let i = 0; i < o.count; i += 1) {
		const x = rand() * size, y = rand() * size, r = o.minRadius + rand() * (o.maxRadius - o.minRadius);
		const color = o.colors[Math.floor(rand() * o.colors.length)];
		const { opacity } = step(rand, o.minOpacity, o.maxOpacity);
		const ry = f(r * (0.6 + rand() * 0.4));
		const key = `${color}|${opacity}`;
		buckets.set(key, (buckets.get(key) ?? "") + wrapped(size, size, [x - r - 1, y - r - 1, x + r + 1, y + r + 1], (ox, oy) =>
			`M${f(x + ox - r)} ${f(y + oy)}a${f(r)} ${ry} 0 1 0 ${f(2 * r)} 0a${f(r)} ${ry} 0 1 0 ${f(-2 * r)} 0Z`));
	}
	return [...buckets].map(([key, d]) => { const [color, opacity] = key.split("|"); return `<path fill='${color}' fill-opacity='${opacity}' d='${d}'/>`; }).join("");
}

/** Soft warm blotches, for aged or handmade stock. */
function blotches(rand: () => number, size: number, count: number, color: string, opacity: number, id: string) {
	let defs = "", out = "";
	for (let i = 0; i < count; i += 1) {
		const x = rand() * size, y = rand() * size, r = size * (0.14 + rand() * 0.2);
		const gid = `${id}${i}`;
		defs += `<radialGradient id='${gid}'><stop stop-color='${color}' stop-opacity='${f(opacity * (0.6 + rand() * 0.8) * 100) / 100}'/><stop offset='1' stop-color='${color}' stop-opacity='0'/></radialGradient>`;
		out += wrapped(size, size, [x - r, y - r, x + r, y + r], (ox, oy) => `<circle cx='${f(x + ox)}' cy='${f(y + oy)}' r='${f(r)}' fill='url(#${gid})'/>`);
	}
	return { defs, out };
}

const doc = (width: number, height: number, defs: string, body: string): TextureTile => ({
	svg: `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>${defs ? `<defs>${defs}</defs>` : ""}${body}</svg>`,
	width,
	height,
});

/** A texture tile in the given ink tone (a warm brown suits paper), or null for smooth paper. */
export function textureTile(id: TextureId, tone = "#8a7561"): TextureTile | null {
	switch (id) {
		case "smooth":
			return null;
		case "laid": {
			// Fine wire lines every few px, with a stronger chain line now and then.
			let lines = "";
			for (let y = 0; y < 12; y += 3) lines += `<path d='M0 ${y + 0.5}H76' stroke='${tone}' stroke-opacity='0.07' stroke-width='0.6'/>`;
			return doc(76, 12, "", `${lines}<path d='M0.5 0V12M38.5 0V12' stroke='${tone}' stroke-opacity='0.1' stroke-width='1'/><path d='M1.5 0V12M39.5 0V12' stroke='#fff' stroke-opacity='0.5' stroke-width='0.8'/>`);
		}
		case "linen": {
			const rand = mulberry32(21), size = 48;
			let threads = "";
			for (let i = 0; i < size; i += 2) {
				const a = f(0.045 + rand() * 0.07), b = f(0.045 + rand() * 0.07), w1 = f(0.5 + rand() * 0.5), w2 = f(0.5 + rand() * 0.5);
				threads += `<path d='M0 ${i + 0.5}H${size}' stroke='${tone}' stroke-opacity='${a}' stroke-width='${w1}'/><path d='M${i + 0.5} 0V${size}' stroke='${tone}' stroke-opacity='${b}' stroke-width='${w2}'/>`;
			}
			// slubs: short thicker bits in the threads
			for (let i = 0; i < 14; i += 1) {
				const x = f(rand() * size), y = f(Math.floor(rand() * 24) * 2 + 0.5), l = f(3 + rand() * 7);
				threads += rand() > 0.5
					? `<path d='M${x} ${y}h${l}' stroke='${tone}' stroke-opacity='0.14' stroke-width='1.1' stroke-linecap='round'/>`
					: `<path d='M${y} ${x}v${l}' stroke='${tone}' stroke-opacity='0.14' stroke-width='1.1' stroke-linecap='round'/>`;
			}
			return doc(size, size, "", threads);
		}
		case "cotton": {
			const rand = mulberry32(7), size = 128;
			const body = flecks(rand, size, { count: 130, minRadius: 0.35, maxRadius: 0.9, colors: [tone, "#fff"], minOpacity: 0.08, maxOpacity: 0.3 })
				+ fibers(rand, size, { count: 46, minLength: 3, maxLength: 9, color: tone, minOpacity: 0.07, maxOpacity: 0.16, width: 0.5 })
				+ fibers(rand, size, { count: 40, minLength: 3, maxLength: 10, color: "#fff", minOpacity: 0.3, maxOpacity: 0.6, width: 0.7 });
			return doc(size, size, "", body);
		}
		case "kraft": {
			const rand = mulberry32(13), size = 144;
			const body = fibers(rand, size, { count: 84, minLength: 8, maxLength: 26, color: "#7a5636", minOpacity: 0.12, maxOpacity: 0.26, width: 0.7 })
				+ fibers(rand, size, { count: 40, minLength: 8, maxLength: 22, color: "#fff4e0", minOpacity: 0.3, maxOpacity: 0.55, width: 0.8 })
				+ flecks(rand, size, { count: 46, minRadius: 0.5, maxRadius: 1.4, colors: ["#5e4128", "#8a6644"], minOpacity: 0.16, maxOpacity: 0.34 });
			return doc(size, size, "", body);
		}
		case "handmade": {
			const rand = mulberry32(5), size = 160;
			const mott = blotches(rand, size, 5, "#a58b6a", 0.1, "hm");
			const body = mott.out
				+ fibers(rand, size, { count: 52, minLength: 18, maxLength: 44, color: tone, minOpacity: 0.08, maxOpacity: 0.2, width: 0.6, bend: 0.9 })
				+ fibers(rand, size, { count: 44, minLength: 14, maxLength: 36, color: "#fff", minOpacity: 0.35, maxOpacity: 0.7, width: 0.8, bend: 0.9 })
				+ flecks(rand, size, { count: 24, minRadius: 0.5, maxRadius: 1.6, colors: [tone, "#6d5c48"], minOpacity: 0.14, maxOpacity: 0.3 });
			return doc(size, size, mott.defs, body);
		}
		case "parchment": {
			const rand = mulberry32(31), size = 192;
			const warm = blotches(rand, size, 7, "#a97a3d", 0.16, "pa");
			const dark = blotches(rand, size, 4, "#7a5326", 0.12, "pb");
			const body = warm.out + dark.out
				+ fibers(rand, size, { count: 26, minLength: 12, maxLength: 34, color: "#7a5a34", minOpacity: 0.06, maxOpacity: 0.14, width: 0.6, bend: 0.9 })
				+ flecks(rand, size, { count: 22, minRadius: 0.5, maxRadius: 1.5, colors: ["#6b4a26"], minOpacity: 0.12, maxOpacity: 0.28 });
			return doc(size, size, warm.defs + dark.defs, body);
		}
		case "crumpled": {
			// Soft creases: a dark line with a pale line just beside it, as light catches a folded edge.
			const rand = mulberry32(41), size = 200;
			const shade = blotches(rand, size, 6, "#6b5a48", 0.07, "cs");
			const light = blotches(rand, size, 6, "#ffffff", 0.22, "cl");
			let dark = "", pale = "";
			for (let i = 0; i < 15; i += 1) {
				let x = rand() * size, y = rand() * size, angle = rand() * Math.PI * 2;
				const points: Array<[number, number]> = [[x, y]];
				const steps = 3 + Math.floor(rand() * 3);
				for (let k = 0; k < steps; k += 1) { angle += (rand() - 0.5) * 1.1; x += Math.cos(angle) * (18 + rand() * 26); y += Math.sin(angle) * (18 + rand() * 26); points.push([x, y]); }
				const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
				const bounds: [number, number, number, number] = [Math.min(...xs) - 2, Math.min(...ys) - 2, Math.max(...xs) + 2, Math.max(...ys) + 2];
				dark += wrapped(size, size, bounds, (ox, oy) => `M${points.map(([px, py]) => `${f(px + ox)} ${f(py + oy)}`).join("L")}`);
				pale += wrapped(size, size, bounds, (ox, oy) => `M${points.map(([px, py]) => `${f(px + ox + 0.9)} ${f(py + oy + 0.9)}`).join("L")}`);
			}
			const body = shade.out + light.out
				+ `<g fill='none' stroke-linecap='round' stroke-linejoin='round'><path d='${dark}' stroke='${tone}' stroke-opacity='0.16' stroke-width='0.9'/><path d='${pale}' stroke='#fff' stroke-opacity='0.5' stroke-width='0.9'/></g>`;
			return doc(size, size, shade.defs + light.defs, body);
		}
		case "stained": {
			// Foxing: scattered brown spots with a faint halo, over soft yellowing.
			const rand = mulberry32(53), size = 192;
			const aged = blotches(rand, size, 5, "#b58a4a", 0.12, "sa");
			let defs = aged.defs, spots = "";
			for (let i = 0; i < 24; i += 1) {
				const x = rand() * size, y = rand() * size, r = 0.9 + rand() * rand() * 4, gid = `sp${i}`;
				const core = f((0.32 + rand() * 0.3) * 100) / 100;
				defs += `<radialGradient id='${gid}'><stop stop-color='#7a4a1e' stop-opacity='${core}'/><stop offset='0.5' stop-color='#8a5a2b' stop-opacity='${f(core * 0.7 * 100) / 100}'/><stop offset='1' stop-color='#9a6a3a' stop-opacity='0'/></radialGradient>`;
				spots += wrapped(size, size, [x - r * 1.7, y - r * 1.7, x + r * 1.7, y + r * 1.7], (ox, oy) => `<circle cx='${f(x + ox)}' cy='${f(y + oy)}' r='${f(r * 1.7)}' fill='url(#${gid})'/>`);
			}
			const body = aged.out + spots
				+ fibers(rand, size, { count: 16, minLength: 10, maxLength: 28, color: "#7a5a34", minOpacity: 0.05, maxOpacity: 0.12, width: 0.6, bend: 0.9 })
				+ flecks(rand, size, { count: 26, minRadius: 0.4, maxRadius: 1.1, colors: ["#6b4a26"], minOpacity: 0.14, maxOpacity: 0.3 });
			return doc(size, size, defs, body);
		}
		case "recycled": {
			const rand = mulberry32(17), size = 128;
			const body = flecks(rand, size, { count: 56, minRadius: 0.5, maxRadius: 1.8, colors: ["#6b5b4b", "#8a4a3a", "#3a4a6a", "#4c6a52"], minOpacity: 0.16, maxOpacity: 0.34 })
				+ fibers(rand, size, { count: 34, minLength: 5, maxLength: 16, color: tone, minOpacity: 0.1, maxOpacity: 0.22, width: 0.6 })
				+ fibers(rand, size, { count: 30, minLength: 6, maxLength: 18, color: "#fff", minOpacity: 0.3, maxOpacity: 0.6, width: 0.8 });
			return doc(size, size, "", body);
		}
	}
}
