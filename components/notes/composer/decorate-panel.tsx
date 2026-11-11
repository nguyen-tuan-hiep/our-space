"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Shuffle } from "lucide-react";
import { NativeButton, NativeTabs } from "@/components/ui/native-controls";
import { NoteEnvelope, WaxSeal } from "@/components/notes/note-envelope";
import { SwatchGrid, TileGrid } from "@/components/notes/composer/pickers";
import { DetailControls } from "@/components/notes/composer/detail-controls";
import {
	DEFAULT_NOTE_STYLE,
	ENVELOPE_COLORS,
	ENVELOPE_FLAPS,
	ENVELOPE_PATTERNS,
	INK_COLORS,
	LETTER_FONTS,
	PAPER_EDGES,
	PAPER_PATTERNS,
	PAPER_TEMPLATES,
	PAPER_TINTS,
	SEAL_MOTIFS_META,
	STAMP_SIZES,
	WASHI_COLORS,
	WAX_COLORS,
	randomNoteStyle,
	type NoteStyle,
} from "@/lib/note-style";
import { envelopeColors, envelopePatternUri, paperTint } from "@/lib/note-style-css";
import { paperColors, paperPatternUri, paperStyleVars } from "@/lib/note-paper-art";

export type DecorateTab = "envelope" | "seal" | "paper" | "ink" | "details";

const TABS: Array<{ value: DecorateTab; label: string }> = [
	{ value: "envelope", label: "Envelope" },
	{ value: "seal", label: "Seal" },
	{ value: "paper", label: "Paper" },
	{ value: "ink", label: "Ink" },
	{ value: "details", label: "Details" },
];

/** Which half of the preview a tab decorates. */
export function previewFocusFor(tab: DecorateTab): "envelope" | "letter" {
	return tab === "envelope" || tab === "seal" ? "envelope" : "letter";
}

function PaperEdgeSample({ edge, stampSize, tint }: {
	edge: NoteStyle["paper"]["edge"];
	stampSize: NoteStyle["paper"]["stampSize"];
	tint: string;
}) {
	return (
		<span className="paper-edge-sample-shadow">
			<span className="letter-sheet paper-edge-sample" data-paper-edge={edge} data-stamp-size={stampSize}>
				<span className="letter-paper block h-full w-full" style={{ backgroundImage: "none", backgroundColor: tint }} />
			</span>
		</span>
	);
}

/** Tabs of pickers that edit one NoteStyle; a Shuffle and a Reset sit above them. */
export function DecoratePanel({ style, onChange, onTabChange }: {
	style: NoteStyle;
	onChange: (style: NoteStyle) => void;
	onTabChange?: (tab: DecorateTab) => void;
}) {
	const [tab, setTab] = useState<DecorateTab>("envelope");
	const selectTab = (next: DecorateTab) => {
		setTab(next);
		onTabChange?.(next);
	};
	const patch = <G extends Exclude<keyof NoteStyle, "v" | "stickers">>(group: G, values: Partial<NoteStyle[G]>) =>
		onChange({ ...style, [group]: { ...style[group], ...values } });

	const colors = useMemo(() => paperColors(style), [style]);
	const paperVars = useMemo(() => paperStyleVars(style), [style]);
	const envelope = envelopeColors(style);
	const tint = paperTint(style);

	return (
		<div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
			<div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
				<NativeTabs value={tab} options={TABS} onChange={selectTab} className="max-w-full overflow-x-auto [scrollbar-width:none]" />
				<div className="flex gap-2">
					<NativeButton type="button" variant="outlined" className="min-h-10 px-3.5 text-xs sm:min-h-10" onClick={() => onChange(randomNoteStyle())}>
						<Shuffle size={14} aria-hidden="true" />
						Shuffle
					</NativeButton>
					<NativeButton type="button" variant="text" className="min-h-10 px-3.5 text-xs sm:min-h-10" onClick={() => onChange(DEFAULT_NOTE_STYLE)}>
						<RotateCcw size={14} aria-hidden="true" />
						Reset
					</NativeButton>
				</div>
			</div>

			{tab === "envelope" ? (
				<div role="tabpanel" className="grid gap-5">
					<SwatchGrid
						label="Envelope color"
						options={ENVELOPE_COLORS.map((color) => ({ id: color.id, label: color.label, swatch: `linear-gradient(180deg, ${color.base}, ${color.deep})` }))}
						value={style.envelope.color}
						onChange={(color) => patch("envelope", { color })}
					/>
					<TileGrid
						label="Flap shape"
						options={ENVELOPE_FLAPS.map((flap) => ({
							id: flap.id,
							label: flap.label,
							preview: <NoteEnvelope className="w-[min(6.5rem,90%)]" style={{ ...style, envelope: { ...style.envelope, flap: flap.id, pattern: "none" } }} letter={false} />,
						}))}
						value={style.envelope.flap}
						onChange={(flap) => patch("envelope", { flap })}
						columns="grid-cols-3"
						previewClassName="!h-24"
					/>
					<TileGrid
						label="Envelope print"
						options={ENVELOPE_PATTERNS.map((pattern) => ({
							id: pattern.id,
							label: pattern.label,
							preview: null,
						previewStyle: { background: `${envelopePatternUri(pattern.id, pattern.id === "hearts" ? "#a62452" : envelope.deep, style.envelope.color !== "midnight")}, ${envelope.base}` },
						}))}
						value={style.envelope.pattern}
						onChange={(pattern) => patch("envelope", { pattern })}
						columns="grid-cols-4 sm:grid-cols-5"
						previewClassName="!h-20"
					/>
				</div>
			) : null}

			{tab === "seal" ? (
				<div role="tabpanel" className="grid gap-5">
					<SwatchGrid
						label="Wax"
						options={WAX_COLORS.map((wax) => ({ id: wax.id, label: wax.label, swatch: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${wax.hex} 70%, white), ${wax.hex} 60%, color-mix(in srgb, ${wax.hex} 70%, black))` }))}
						value={style.seal.color}
						onChange={(color) => patch("seal", { color })}
					/>
					<TileGrid
						label="Stamp"
						options={SEAL_MOTIFS_META.map((motif) => ({
							id: motif.id,
							label: motif.label,
							preview: <WaxSeal color={style.seal.color} motif={motif.id} className="size-12 drop-shadow-[0_2px_2px_rgb(60_40_10/0.3)]" />,
						}))}
						value={style.seal.motif}
						onChange={(motif) => patch("seal", { motif })}
						columns="grid-cols-4"
						previewClassName="border-transparent"
					/>
				</div>
			) : null}

			{tab === "paper" ? (
				<div role="tabpanel" className="grid gap-5">
					<TileGrid
						label="Template"
						hint={style.paper.template === "none" ? undefined : "Artwork sits in the corners"}
						options={PAPER_TEMPLATES.map((template) => ({
							id: template.id,
							label: template.label,
							preview: template.image ? null : <span className="block h-24 w-16 rounded bg-white shadow-md" />,
							previewStyle: { background: template.image ? `url(${template.image}) center / contain no-repeat, #ddd9d0` : "#ddd9d0" },
						}))}
						value={style.paper.template}
						onChange={(template) => onChange({ ...style, paper: { ...style.paper, template, edge: template === "none" ? "flat" : "stamp", stampSize: "fine", pattern: "plain" }, stickers: [] })}
						columns="grid-cols-3 sm:grid-cols-4"
						previewClassName="!h-32"
					/>
					{style.paper.template !== "none" ? (
						<p className="rounded-2xl border border-primary-border bg-primary-subtle p-4 text-sm text-muted-foreground">Templates are printed on cream paper. Choose Simple paper to pick its color, pattern, edge and washi tape.</p>
					) : (
					<>
					<SwatchGrid
						label="Paper color"
						options={PAPER_TINTS.map((paper) => ({ id: paper.id, label: paper.label, swatch: paper.hex }))}
						value={style.paper.tint}
						onChange={(tintId) => patch("paper", { tint: tintId })}
					/>
					<TileGrid
						label="Pattern"
						options={PAPER_PATTERNS.map((pattern) => ({
							id: pattern.id,
							label: pattern.label,
							preview: null,
							previewStyle: { background: `${paperPatternUri(pattern.id, colors)}, ${tint}` },
						}))}
						value={style.paper.pattern}
						onChange={(pattern) => patch("paper", { pattern })}
						columns="grid-cols-4 sm:grid-cols-5"
					/>
					<div className="letter-vars contents" style={paperVars}>
						<TileGrid
							label="Edge"
							options={PAPER_EDGES.map((edge) => ({
								id: edge.id,
								label: edge.label,
								preview: <PaperEdgeSample edge={edge.id} stampSize={style.paper.stampSize} tint={tint} />,
							}))}
							value={style.paper.edge}
							onChange={(edge) => patch("paper", { edge })}
							columns="grid-cols-3"
							previewClassName="paper-edge-swatch !h-28"
						/>
					</div>
					{style.paper.edge === "stamp" ? (
						<TileGrid
							label="Stamp perforation"
							options={STAMP_SIZES.map((size) => ({
								id: size.id,
								label: size.label,
								preview: <PaperEdgeSample edge="stamp" stampSize={size.id} tint={tint} />,
							}))}
							value={style.paper.stampSize}
							onChange={(stampSize) => patch("paper", { stampSize })}
							columns="grid-cols-3"
							previewClassName="paper-edge-swatch !h-28"
						/>
					) : null}
					<SwatchGrid
						label="Washi tape"
						options={WASHI_COLORS.map((washi) => ({
							id: washi.id,
							label: washi.label,
							swatch: `repeating-linear-gradient(90deg, rgb(255 255 255 / 0.4) 0 4px, transparent 4px 8px), repeating-linear-gradient(0deg, rgb(255 255 255 / 0.4) 0 4px, transparent 4px 8px), rgb(${washi.rgb} / 0.85)`,
						}))}
						value={style.paper.washi}
						onChange={(washi) => patch("paper", { washi })}
					/>
					</>
					)}
				</div>
			) : null}

			{tab === "ink" ? (
				<div role="tabpanel" className="grid gap-5">
					<SwatchGrid
						label="Ink"
						options={INK_COLORS.map((ink) => ({ id: ink.id, label: ink.label, swatch: ink.ink, dot: ink.accent }))}
						value={style.ink.color}
						onChange={(color) => patch("ink", { color })}
					/>
					<TileGrid
						label="Handwriting"
						options={LETTER_FONTS.map((font) => ({
							id: font.id,
							label: font.label,
							preview: (
								<span className="px-1 leading-none" style={{ fontFamily: font.family, color: colors.ink, fontSize: font.handwritten ? "1.5rem" : "1.2rem" }}>
									Yêu em
								</span>
							),
							previewStyle: { background: tint },
						}))}
						value={style.ink.font}
						onChange={(font) => patch("ink", { font })}
						columns="grid-cols-3 sm:grid-cols-5"
					/>
				</div>
			) : null}

			{tab === "details" ? (
				<DetailControls style={style} onChange={(values) => patch("details", values)} />
			) : null}
		</div>
	);
}
