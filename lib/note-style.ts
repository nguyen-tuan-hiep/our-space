/**
 * A note's decoration: the author's choices for the envelope, wax seal, paper,
 * ink and stickers. Stored as JSON on `notes.style`; every reader runs it
 * through `normalizeNoteStyle`, so unknown or missing ids fall back to the
 * default look (which is exactly how notes rendered before decoration existed).
 *
 * This module is shared by the server action and the client, so it carries
 * only ids, labels and colors: no React, no SVG art (see lib/note-style-css.ts
 * and lib/note-paper-art.ts).
 */

export const NOTE_STYLE_VERSION = 1 as const;
export const NOTE_STYLE_MAX_JSON = 4000;

export const ENVELOPE_COLORS = [
	{ id: "ivory", label: "Ivory", base: "#f3eee8", deep: "#d8d0c5" },
	{ id: "cream", label: "Cream", base: "#fff8ea", deep: "#e6d9bd" },
	{ id: "kraft", label: "Kraft", base: "#d9b991", deep: "#b8945f" },
	{ id: "blush", label: "Blush", base: "#fff1f3", deep: "#e8c8d0" },
	{ id: "rose", label: "Rose", base: "#fbe8ed", deep: "#dfb1bd" },
	{ id: "peach", label: "Peach", base: "#fff2ea", deep: "#e8c8b5" },
	{ id: "butter", label: "Butter", base: "#fff8dc", deep: "#e8d9a4" },
	{ id: "sage", label: "Sage", base: "#eff4eb", deep: "#becfba" },
	{ id: "mint", label: "Mint", base: "#eef8f1", deep: "#bddac9" },
	{ id: "sky", label: "Sky", base: "#eef5fc", deep: "#bfd4e9" },
	{ id: "periwinkle", label: "Periwinkle", base: "#f0f0fc", deep: "#c8c9e8" },
	{ id: "lilac", label: "Lilac", base: "#f3effc", deep: "#d5c6e8" },
	{ id: "lemon", label: "Lemon", base: "#fff8d6", deep: "#e6d58b" },
	{ id: "cloud", label: "Cloud", base: "#f2f3f7", deep: "#c9ccd8" },
	{ id: "midnight", label: "Midnight", base: "#3a4258", deep: "#232a3c" },
] as const;

export const ENVELOPE_FLAPS = [
	{ id: "classic", label: "Classic" },
	{ id: "square", label: "Square" },
	{ id: "heart", label: "Heart" },
	{ id: "scallop", label: "Scallop" },
	{ id: "wave", label: "Wave" },
	{ id: "crescent", label: "Crescent" },
] as const;

export const ENVELOPE_PATTERNS = [
	{ id: "none", label: "Plain" },
	{ id: "pinstripe", label: "Pinstripe" },
	{ id: "gingham", label: "Gingham" },
	{ id: "polka", label: "Polka dots" },
	{ id: "hearts", label: "Hearts" },
	{ id: "stars", label: "Sparkles" },
	{ id: "airmail", label: "Airmail" },
	{ id: "diagonal", label: "Harlequin" },
	{ id: "waves", label: "Shippo" },
	{ id: "lattice", label: "Trellis" },
	{ id: "botanical", label: "Sprigs" },
	{ id: "sunburst", label: "Crosses" },
	{ id: "rosebuds", label: "Rosebuds" },
	{ id: "bows", label: "Bows" },
	{ id: "moons", label: "Moon & stars" },
] as const;

/** What is printed on the lining inside the flap and behind the letter. */
export const ENVELOPE_LININGS = [
	{ id: "plain", label: "Plain" },
	{ id: "diamond", label: "Diamond" },
	{ id: "polka", label: "Dots" },
	{ id: "pinstripe", label: "Stripes" },
	{ id: "hearts", label: "Hearts" },
	{ id: "stars", label: "Sparkles" },
	{ id: "botanical", label: "Sprigs" },
	{ id: "bows", label: "Bows" },
] as const;

export const WAX_COLORS = [
	{ id: "gold", label: "Gold", hex: "#c99d58" },
	{ id: "crimson", label: "Crimson", hex: "#b3303f" },
	{ id: "burgundy", label: "Burgundy", hex: "#7a2634" },
	{ id: "rose", label: "Rose", hex: "#d4718a" },
	{ id: "plum", label: "Plum", hex: "#6a3d7a" },
	{ id: "navy", label: "Navy", hex: "#2e3f6e" },
	{ id: "forest", label: "Forest", hex: "#2f5d46" },
	{ id: "black", label: "Black", hex: "#2b2a2e" },
] as const;

export const SEAL_MOTIFS_META = [
	{ id: "heart", label: "Heart" },
	{ id: "rose", label: "Rose" },
	{ id: "lotus", label: "Lotus" },
	{ id: "sakura", label: "Sakura" },
	{ id: "fleur", label: "Fleur-de-lis" },
	{ id: "laurel", label: "Laurel" },
	{ id: "moon", label: "Moon & stars" },
	{ id: "butterfly", label: "Butterfly" },
	{ id: "bow", label: "Bow" },
	{ id: "sun", label: "Sun" },
	{ id: "snowflake", label: "Snowflake" },
	{ id: "sparkle", label: "Sparkle" },
	{ id: "olive", label: "Olive branch" },
	{ id: "fern", label: "Fern" },
	{ id: "wheat", label: "Wheat" },
	{ id: "feather", label: "Feather" },
	{ id: "crown", label: "Crown" },
	{ id: "bee", label: "Bee" },
	{ id: "monogram", label: "Initials" },
] as const;

export const PAPER_TINTS = [
	{ id: "white", label: "White", hex: "#fffefd" },
	{ id: "cream", label: "Cream", hex: "#fff8ea" },
	{ id: "blush", label: "Blush", hex: "#fff1f3" },
	{ id: "peach", label: "Peach", hex: "#fff2ea" },
	{ id: "mint", label: "Mint", hex: "#eef8f1" },
	{ id: "sky", label: "Sky", hex: "#eef5fc" },
	{ id: "lavender", label: "Lavender", hex: "#f3effc" },
	{ id: "lemon", label: "Lemon", hex: "#fffbe3" },
	{ id: "sand", label: "Sand", hex: "#f6efe4" },
	{ id: "grey", label: "Grey", hex: "#f3f3f5" },
] as const;

export const PAPER_PATTERNS = [
	{ id: "plain", label: "Plain" },
	{ id: "lined", label: "Lined" },
	{ id: "dots", label: "Dots" },
	{ id: "grid", label: "Grid" },
	{ id: "hearts", label: "Hearts" },
	{ id: "stars", label: "Sparkles" },
	{ id: "confetti", label: "Confetti" },
	{ id: "stripes", label: "Candy stripe" },
	{ id: "floral", label: "Daisies" },
	{ id: "waves", label: "Shippo" },
	{ id: "botanical", label: "Sprigs" },
	{ id: "clouds", label: "Clouds" },
	{ id: "checker", label: "Checker" },
	{ id: "speckles", label: "Grain" },
] as const;

/**
 * Full-sheet artwork (2:3, cream paper, a few small illustrations in the
 * corners). Every template shares one text area, so switching templates never
 * moves the writing; the date and sign-off are centered to stay clear of the
 * corner art.
 */
export const PAPER_TEMPLATES = [
	{ id: "none", label: "Simple paper", image: "", group: "none" },
	{ id: "christmas-santa", label: "Santa", image: "/letter-templates/christmas-santa.webp", group: "events" },
	{ id: "christmas-tree", label: "Christmas tree", image: "/letter-templates/christmas-tree.webp", group: "events" },
	{ id: "winter-snowman", label: "Snowman", image: "/letter-templates/winter-snowman.webp", group: "events" },
	{ id: "tet", label: "Tết", image: "/letter-templates/tet.webp", group: "events" },
	{ id: "spring-sakura", label: "Sakura", image: "/letter-templates/spring-sakura.webp", group: "events" },
	{ id: "summer-seaside", label: "Seaside", image: "/letter-templates/summer-seaside.webp", group: "events" },
	{ id: "autumn-fox", label: "Autumn fox", image: "/letter-templates/autumn-fox.webp", group: "events" },
	{ id: "halloween", label: "Halloween", image: "/letter-templates/halloween.webp", group: "events" },
	{ id: "birthday-party", label: "Birthday", image: "/letter-templates/birthday-party.webp", group: "events" },
	{ id: "love", label: "Love", image: "/letter-templates/love.webp", group: "events" },
	{ id: "anniversary", label: "Lovebirds", image: "/letter-templates/anniversary.webp", group: "events" },
	{ id: "ribbon", label: "Ribbon", image: "/letter-templates/ribbon.webp", group: "events" },
	{ id: "twinkle", label: "Twinkle", image: "/letter-templates/twinkle.webp", group: "events" },
	{ id: "botanical", label: "Botanical", image: "/letter-templates/botanical.webp", group: "events" },
	{ id: "cat-nap", label: "Cat nap", image: "/letter-templates/cat-nap.webp", group: "events" },
	{ id: "graduation", label: "Graduation", image: "/letter-templates/graduation.webp", group: "events" },
	{ id: "zodiac-rat", label: "Tý · Rat", image: "/letter-templates/zodiac-rat.webp", group: "zodiac" },
	{ id: "zodiac-buffalo", label: "Sửu · Buffalo", image: "/letter-templates/zodiac-buffalo.webp", group: "zodiac" },
	{ id: "zodiac-tiger", label: "Dần · Tiger", image: "/letter-templates/zodiac-tiger.webp", group: "zodiac" },
	{ id: "zodiac-cat", label: "Mão · Cat", image: "/letter-templates/zodiac-cat.webp", group: "zodiac" },
	{ id: "zodiac-dragon", label: "Thìn · Dragon", image: "/letter-templates/zodiac-dragon.webp", group: "zodiac" },
	{ id: "zodiac-snake", label: "Tỵ · Snake", image: "/letter-templates/zodiac-snake.webp", group: "zodiac" },
	{ id: "zodiac-horse", label: "Ngọ · Horse", image: "/letter-templates/zodiac-horse.webp", group: "zodiac" },
	{ id: "zodiac-goat", label: "Mùi · Goat", image: "/letter-templates/zodiac-goat.webp", group: "zodiac" },
	{ id: "zodiac-monkey", label: "Thân · Monkey", image: "/letter-templates/zodiac-monkey.webp", group: "zodiac" },
	{ id: "zodiac-rooster", label: "Dậu · Rooster", image: "/letter-templates/zodiac-rooster.webp", group: "zodiac" },
	{ id: "zodiac-dog", label: "Tuất · Dog", image: "/letter-templates/zodiac-dog.webp", group: "zodiac" },
	{ id: "zodiac-pig", label: "Hợi · Pig", image: "/letter-templates/zodiac-pig.webp", group: "zodiac" },
] as const;

/** Text inset on a template sheet (top, right, bottom, left, % of the sheet's width). */
export const TEMPLATE_TEXT_INSET = "9% 9% 15% 9%";

export const PAPER_TEXTURES = [
	{ id: "smooth", label: "Smooth" },
	{ id: "laid", label: "Laid" },
	{ id: "linen", label: "Linen" },
	{ id: "cotton", label: "Cotton" },
	{ id: "kraft", label: "Kraft" },
	{ id: "handmade", label: "Handmade" },
	{ id: "parchment", label: "Parchment" },
	{ id: "recycled", label: "Recycled" },
	{ id: "crumpled", label: "Crumpled" },
	{ id: "stained", label: "Stained" },
] as const;

export const PAPER_EDGES = [
	{ id: "flat", label: "Clean cut" },
	{ id: "rounded", label: "Rounded" },
	{ id: "deckle", label: "Deckle" },
	{ id: "torn", label: "Torn" },
	{ id: "scallop", label: "Scallop" },
	{ id: "zigzag", label: "Zigzag" },
	{ id: "wave", label: "Wave" },
	{ id: "stamp", label: "Stamp" },
	{ id: "ticket", label: "Ticket" },
	{ id: "snip", label: "Snipped" },
] as const;

export const STAMP_SIZES = [
	{ id: "fine", label: "Fine" },
	{ id: "classic", label: "Classic" },
	{ id: "bold", label: "Bold" },
] as const;

/** rgb triples, used as `rgb(var(--washi) / alpha)`. */
export const WASHI_COLORS = [
	{ id: "none", label: "None", rgb: "0 0 0" },
	{ id: "sky", label: "Sky", rgb: "146 194 232" },
	{ id: "pink", label: "Pink", rgb: "240 170 190" },
	{ id: "lilac", label: "Lilac", rgb: "190 170 230" },
	{ id: "mint", label: "Mint", rgb: "150 210 180" },
	{ id: "butter", label: "Butter", rgb: "245 215 130" },
	{ id: "kraft", label: "Kraft", rgb: "210 180 140" },
] as const;

export const INK_COLORS = [
	{ id: "plum", label: "Plum", ink: "#4a3a3f", accent: "#b5556f" },
	{ id: "midnight", label: "Midnight", ink: "#1f2a44", accent: "#3f5fa3" },
	{ id: "forest", label: "Forest", ink: "#2f4a3a", accent: "#4f7d5f" },
	{ id: "wine", label: "Wine", ink: "#6b2d3c", accent: "#b84a62" },
	{ id: "espresso", label: "Espresso", ink: "#4a2f22", accent: "#a86a3a" },
	{ id: "slate", label: "Slate", ink: "#3b4252", accent: "#6b7a99" },
	{ id: "ocean", label: "Ocean", ink: "#1f4e6e", accent: "#3a86b5" },
	{ id: "charcoal", label: "Charcoal", ink: "#2b2b2e", accent: "#7a6a8a" },
] as const;

export const LETTER_FONTS = [
	{ id: "classic", label: "Classic", family: 'ui-serif, "New York", Georgia, serif', handwritten: false },
	{ id: "book", label: "Book", family: "var(--font-lora), Georgia, serif", handwritten: false },
	{ id: "script", label: "Script", family: 'var(--font-script), "Snell Roundhand", cursive', handwritten: true },
	{ id: "casual", label: "Casual", family: "var(--font-mali), cursive", handwritten: true },
	{ id: "marker", label: "Marker", family: "var(--font-patrick), cursive", handwritten: true },
] as const;

export const DATE_STYLES = [
	{ id: "classic", label: "Classic" },
	{ id: "minimal", label: "Minimal" },
	{ id: "postmark", label: "Postmark" },
	{ id: "handwritten", label: "Handwritten" },
	{ id: "hidden", label: "Hide date" },
] as const;

export const SIGNOFFS = [
	{ id: "with-love", label: "With love," },
	{ id: "always", label: "Always yours," },
	{ id: "forever", label: "Forever," },
	{ id: "sincerely", label: "Sincerely," },
	{ id: "none", label: "No closing" },
] as const;

export const STICKERS_META = [
	{ id: "sparkles", label: "Sparkles" },
	{ id: "hearts", label: "Hearts" },
	{ id: "bow", label: "Bow" },
	{ id: "flower", label: "Flower" },
	{ id: "butterfly", label: "Butterfly" },
	{ id: "rainbow", label: "Rainbow" },
	{ id: "stars", label: "Stars" },
	{ id: "moon", label: "Moon" },
	{ id: "coffee", label: "Coffee" },
	{ id: "plane", label: "Paper plane" },
	{ id: "cherries", label: "Cherries" },
	{ id: "xoxo", label: "xoxo" },
	{ id: "sun", label: "Sunshine" },
	{ id: "tulip", label: "Tulip" },
	{ id: "dove", label: "Dove" },
	{ id: "key", label: "Little key" },
] as const;

export const STICKER_SLOTS = [
	{ id: "bl", label: "Bottom left" },
	{ id: "tl", label: "Top left" },
	{ id: "br", label: "Bottom right" },
	{ id: "tr", label: "Top right" },
] as const;

export const MAX_STICKERS = STICKER_SLOTS.length;

export type EnvelopeColorId = (typeof ENVELOPE_COLORS)[number]["id"];
export type EnvelopeFlapId = (typeof ENVELOPE_FLAPS)[number]["id"];
export type EnvelopeLiningId = (typeof ENVELOPE_LININGS)[number]["id"];
export type EnvelopePatternId = (typeof ENVELOPE_PATTERNS)[number]["id"];
export type WaxColorId = (typeof WAX_COLORS)[number]["id"];
export type SealMotifId = (typeof SEAL_MOTIFS_META)[number]["id"];
export type PaperTintId = (typeof PAPER_TINTS)[number]["id"];
export type PaperPatternId = (typeof PAPER_PATTERNS)[number]["id"];
export type PaperTemplateId = (typeof PAPER_TEMPLATES)[number]["id"];
export type PaperTextureId = (typeof PAPER_TEXTURES)[number]["id"];
export type PaperEdgeId = (typeof PAPER_EDGES)[number]["id"];
export type StampSizeId = (typeof STAMP_SIZES)[number]["id"];
export type WashiColorId = (typeof WASHI_COLORS)[number]["id"];
export type InkColorId = (typeof INK_COLORS)[number]["id"];
export type LetterFontId = (typeof LETTER_FONTS)[number]["id"];
export type DateStyleId = (typeof DATE_STYLES)[number]["id"];
export type SignoffId = (typeof SIGNOFFS)[number]["id"];
export type StickerId = (typeof STICKERS_META)[number]["id"];
export type StickerSlotId = (typeof STICKER_SLOTS)[number]["id"];

export interface NoteSticker {
	id: StickerId;
	slot: StickerSlotId;
}

export interface NoteStyle {
	v: typeof NOTE_STYLE_VERSION;
	envelope: { color: EnvelopeColorId; pattern: EnvelopePatternId; flap: EnvelopeFlapId; texture: PaperTextureId; lining: EnvelopeLiningId };
	seal: { color: WaxColorId; motif: SealMotifId; text: string };
	paper: { tint: PaperTintId; pattern: PaperPatternId; template: PaperTemplateId; texture: PaperTextureId; edge: PaperEdgeId; stampSize: StampSizeId; washi: WashiColorId };
	ink: { color: InkColorId; font: LetterFontId };
	details: {
		titleFont: LetterFontId;
		dateStyle: DateStyleId;
		signatureFont: LetterFontId;
		signatureText: string;
		closingText: string;
	};
	/** At most one sticker per slot. */
	stickers: NoteSticker[];
}

/** Exactly the look notes had before decoration existed. */
export const DEFAULT_NOTE_STYLE: NoteStyle = {
	v: NOTE_STYLE_VERSION,
	envelope: { color: "ivory", pattern: "none", flap: "classic", texture: "smooth", lining: "diamond" },
	seal: { color: "gold", motif: "heart", text: "" },
	paper: { tint: "white", pattern: "plain", template: "none", texture: "smooth", edge: "flat", stampSize: "classic", washi: "sky" },
	ink: { color: "plum", font: "classic" },
	details: { titleFont: "classic", dateStyle: "classic", signatureFont: "script", signatureText: "", closingText: "With love," },
	stickers: [],
};

type Catalog = ReadonlyArray<{ readonly id: string }>;

function pick<L extends Catalog>(list: L, value: unknown, fallback: L[number]["id"]): L[number]["id"] {
	return typeof value === "string" && list.some((entry) => entry.id === value)
		? (value as L[number]["id"])
		: fallback;
}

function record(value: unknown): Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

/**
 * Coerce anything (a stored row, a form payload, `{}`) into a valid style.
 * Unknown ids become the default for that field; stickers are deduped by
 * slot and capped at one per slot.
 */
export function normalizeNoteStyle(input: unknown): NoteStyle {
	const raw = record(input);
	const envelope = record(raw.envelope);
	const seal = record(raw.seal);
	const paper = record(raw.paper);
	const ink = record(raw.ink);
	const details = record(raw.details);
	const d = DEFAULT_NOTE_STYLE;

	const stickers: NoteSticker[] = [];
	const takenSlots = new Set<string>();
	const takenIds = new Set<string>();
	if (Array.isArray(raw.stickers)) {
		for (const item of raw.stickers) {
			const entry = record(item);
			if (typeof entry.id !== "string" || !STICKERS_META.some((s) => s.id === entry.id)) continue;
			if (typeof entry.slot !== "string" || !STICKER_SLOTS.some((s) => s.id === entry.slot)) continue;
			if (takenSlots.has(entry.slot) || takenIds.has(entry.id)) continue;
			takenSlots.add(entry.slot);
			takenIds.add(entry.id);
			stickers.push({ id: entry.id as StickerId, slot: entry.slot as StickerSlotId });
			if (stickers.length >= MAX_STICKERS) break;
		}
	} else if (raw.stickers === undefined) {
		stickers.push(...d.stickers);
	}

	return {
		v: NOTE_STYLE_VERSION,
		envelope: {
			color: pick(ENVELOPE_COLORS, envelope.color, d.envelope.color),
			pattern: pick(ENVELOPE_PATTERNS, envelope.pattern, d.envelope.pattern),
			flap: pick(ENVELOPE_FLAPS, envelope.flap, d.envelope.flap),
			texture: pick(PAPER_TEXTURES, envelope.texture, d.envelope.texture),
			lining: pick(ENVELOPE_LININGS, envelope.lining, d.envelope.lining),
		},
		seal: {
			color: pick(WAX_COLORS, seal.color, d.seal.color),
			motif: pick(SEAL_MOTIFS_META, seal.motif, d.seal.motif),
			text: typeof seal.text === "string" ? seal.text.replace(/\s+/g, "").slice(0, 2).toUpperCase() : "",
		},
		paper: {
			tint: pick(PAPER_TINTS, paper.tint, d.paper.tint),
			pattern: pick(PAPER_PATTERNS, paper.pattern, d.paper.pattern),
			template: pick(PAPER_TEMPLATES, paper.template, d.paper.template),
			texture: pick(PAPER_TEXTURES, paper.texture, d.paper.texture),
			edge: pick(PAPER_EDGES, paper.edge, d.paper.edge),
			stampSize: pick(STAMP_SIZES, paper.stampSize, d.paper.stampSize),
			washi: pick(WASHI_COLORS, paper.washi, d.paper.washi),
		},
		ink: {
			color: pick(INK_COLORS, ink.color, d.ink.color),
			font: pick(LETTER_FONTS, ink.font, d.ink.font),
		},
		details: {
			titleFont: pick(LETTER_FONTS, details.titleFont, d.details.titleFont),
			dateStyle: pick(DATE_STYLES, details.dateStyle, d.details.dateStyle),
			signatureFont: pick(LETTER_FONTS, details.signatureFont, d.details.signatureFont),
			signatureText: typeof details.signatureText === "string" ? details.signatureText.trim().slice(0, 40) : "",
			closingText: typeof details.closingText === "string"
				? details.closingText.trim().slice(0, 80)
				: details.signoff === "none" ? "" : SIGNOFFS.find((entry) => entry.id === details.signoff)?.label ?? d.details.closingText,
		},
		stickers,
	};
}

/** Parse the composer's hidden `style` field; anything odd becomes the default. */
export function parseNoteStyle(json: string | null | undefined): NoteStyle {
	if (!json || json.length > NOTE_STYLE_MAX_JSON) return normalizeNoteStyle({});
	try {
		return normalizeNoteStyle(JSON.parse(json));
	} catch {
		return normalizeNoteStyle({});
	}
}

export function isDefaultNoteStyle(style: NoteStyle) {
	return JSON.stringify(style) === JSON.stringify(DEFAULT_NOTE_STYLE);
}

export function noteSignoff(style: NoteStyle) {
	return style.details.closingText.trim() || null;
}

function sample<L extends Catalog>(list: L, rng: () => number): L[number]["id"] {
	return list[Math.floor(rng() * list.length)].id;
}

/** A fresh random combination for the Shuffle button. */
export function randomNoteStyle(rng: () => number = Math.random): NoteStyle {
	const template = sample(PAPER_TEMPLATES, rng);
	return normalizeNoteStyle({
		envelope: { color: sample(ENVELOPE_COLORS, rng), pattern: sample(ENVELOPE_PATTERNS, rng), flap: sample(ENVELOPE_FLAPS, rng), texture: sample(PAPER_TEXTURES, rng), lining: sample(ENVELOPE_LININGS, rng) },
		seal: { color: sample(WAX_COLORS, rng), motif: sample(SEAL_MOTIFS_META.filter((entry) => entry.id !== "monogram"), rng), text: "" },
		paper: {
			tint: sample(PAPER_TINTS, rng),
			pattern: sample(PAPER_PATTERNS, rng),
			template,
			texture: sample(PAPER_TEXTURES, rng),
			edge: sample(PAPER_EDGES, rng),
			stampSize: sample(STAMP_SIZES, rng),
			washi: sample(WASHI_COLORS, rng),
		},
		ink: { color: sample(INK_COLORS, rng), font: sample(LETTER_FONTS, rng) },
		details: {
			titleFont: sample(LETTER_FONTS, rng),
			dateStyle: sample(DATE_STYLES, rng),
			signatureFont: sample(LETTER_FONTS, rng),
			signatureText: "",
			closingText: DEFAULT_NOTE_STYLE.details.closingText,
		},
		stickers: [],
	});
}

/** Human summary for screen readers and the composer's preview caption. */
export function describeNoteStyle(style: NoteStyle) {
	const label = (list: ReadonlyArray<{ readonly id: string; readonly label: string }>, id: string) =>
		list.find((entry) => entry.id === id)?.label ?? id;
	const parts = [
		`${label(ENVELOPE_COLORS, style.envelope.color)} ${label(ENVELOPE_FLAPS, style.envelope.flap).toLowerCase()} envelope${style.envelope.pattern === "none" ? "" : `, ${label(ENVELOPE_PATTERNS, style.envelope.pattern).toLowerCase()}`}${style.envelope.texture === "smooth" ? "" : `, ${label(PAPER_TEXTURES, style.envelope.texture).toLowerCase()} texture`}`,
		`${label(WAX_COLORS, style.seal.color).toLowerCase()} ${label(SEAL_MOTIFS_META, style.seal.motif).toLowerCase()} seal`,
		`${label(PAPER_TINTS, style.paper.tint).toLowerCase()} ${label(PAPER_EDGES, style.paper.edge).toLowerCase()} paper${style.paper.template !== "none" ? `, ${label(PAPER_TEMPLATES, style.paper.template).toLowerCase()} template` : style.paper.pattern === "plain" ? "" : `, ${label(PAPER_PATTERNS, style.paper.pattern).toLowerCase()}`}`,
		`${label(INK_COLORS, style.ink.color).toLowerCase()} ink in ${label(LETTER_FONTS, style.ink.font)}`,
		`${label(LETTER_FONTS, style.details.titleFont)} title, ${label(DATE_STYLES, style.details.dateStyle).toLowerCase()} date, ${label(LETTER_FONTS, style.details.signatureFont).toLowerCase()} signature`,
		style.stickers.length ? `${style.stickers.length} legacy sticker${style.stickers.length === 1 ? "" : "s"}` : "",
	];
	return parts.filter(Boolean).join(", ");
}
