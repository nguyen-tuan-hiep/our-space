import { useId, type ReactNode } from "react";
import { SEAL_MOTIFS } from "@/components/notes/seal-motifs";
import { DEFAULT_NOTE_STYLE, type NoteStyle, type SealMotifId, type WaxColorId } from "@/lib/note-style";
import { envelopeStyleVars, waxHex, waxPalette } from "@/lib/note-style-css";

/**
 * The pressed wax body: an uneven blob with a few soft drips where the wax
 * squeezed out under the stamp. Drawn in Figma (frame "Wax seal / redesign")
 * and exported as a path in the seal's 100x100 viewBox.
 */
const WAX_BODY =
	"M96.3 50C96.6 53.2 96.5 56.6 95.8 59.7C95.1 62.8 93.5 65.9 92 68.7C90.4 71.5 88.2 73.8 86.3 76.4C84.4 79 82.8 81.7 80.7 84C78.5 86.4 76.1 88.9 73.3 90.4C70.6 92 67.1 92.5 64 93.2C60.9 93.8 57.7 94.1 54.6 94.2C51.5 94.3 48.4 94.3 45.4 93.7C42.4 93.2 39.5 92 36.7 90.9C33.9 89.7 31.4 88.2 28.7 86.9C26 85.6 22.8 84.7 20.4 82.9C17.9 81.1 15.5 78.8 13.9 76.3C12.2 73.7 11.4 70.5 10.4 67.6C9.4 64.8 8.5 61.9 8 58.9C7.4 56 7.2 53 7 50C6.9 47 7.2 44.1 7.3 40.9C7.5 37.8 7.5 34.6 7.9 31.3C8.3 27.9 8.4 23.8 10 20.9C11.5 18 14.6 15.6 17.4 13.8C20.2 11.9 23.6 10.6 26.7 9.7C29.9 8.8 33.3 8.4 36.4 8.2C39.6 8.1 42.7 8.5 45.7 8.8C48.6 9.1 51.4 9.6 54.2 10C57 10.5 59.7 10.9 62.5 11.7C65.2 12.4 67.9 13.2 70.6 14.4C73.2 15.6 75.7 17 78.3 18.6C80.8 20.2 83.8 21.7 85.8 24C87.8 26.2 89 29.3 90.3 32.1C91.6 34.8 92.8 37.7 93.8 40.7C94.8 43.7 96 46.8 96.3 50Z";

/**
 * Wax seal: an uneven pressed body with a bevelled edge, a raised ring around
 * a recessed disc, a motif embossed in the middle and a soft gloss, all in
 * shades of one wax color. The bevels are blurred strokes clipped to their
 * shapes, so there are no per-instance raster effects beyond a few blurs.
 */
export function WaxSeal({ color = "gold", motif = "heart", text = "", className = "envelope-seal-svg" }: {
	color?: WaxColorId;
	motif?: SealMotifId;
	text?: string;
	className?: string;
}) {
	// Per-instance ids so gradients still resolve when another seal is hidden.
	const id = useId().replace(/:/g, "");
	const wax = `wax-${id}`;
	const rim = `rim-${id}`;
	const disc = `disc-${id}`;
	const emboss = `emboss-${id}`;
	const bodyClip = `body-${id}`;
	const discClip = `discclip-${id}`;
	const soft = `soft-${id}`;
	const fine = `fine-${id}`;
	const gloss = `gloss-${id}`;
	const tone = waxPalette(waxHex({ ...DEFAULT_NOTE_STYLE, seal: { color, motif, text } }));
	const parts = SEAL_MOTIFS[motif];
	const initials = (text || "M").slice(0, 2);
	const discUs = `discus-${id}`;
	const blur = (name: string, deviation: number) => (
		<filter id={name} filterUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120">
			<feGaussianBlur stdDeviation={deviation} />
		</filter>
	);

	return (
		<svg viewBox="0 0 100 100" className={className} aria-hidden="true">
			<defs>
				<radialGradient id={wax} cx="0.38" cy="0.3" r="0.75">
					<stop offset="0" stopColor={tone.light} />
					<stop offset="0.38" stopColor={tone.mid} />
					<stop offset="0.75" stopColor={tone.dark} />
					<stop offset="1" stopColor={tone.deep} />
				</radialGradient>
				<linearGradient id={rim} x1="0.35" y1="0" x2="0.65" y2="0.94">
					<stop offset="0" stopColor={tone.rimLight} />
					<stop offset="0.5" stopColor={tone.mid} />
					<stop offset="1" stopColor={tone.rimDark} />
				</linearGradient>
				<radialGradient id={disc} cx="0.42" cy="0.36" r="0.7">
					<stop offset="0" stopColor={tone.discLight} />
					<stop offset="1" stopColor={tone.discDark} />
				</radialGradient>
				{/* The disc's own gradient in user space, so shapes drawn over a motif hide what is under them without a seam. */}
				<radialGradient id={discUs} gradientUnits="userSpaceOnUse" cx="44.6" cy="40.6" r="46.9">
					<stop offset="0" stopColor={tone.discLight} />
					<stop offset="1" stopColor={tone.discDark} />
				</radialGradient>
				<linearGradient id={emboss} gradientUnits="userSpaceOnUse" x1="40" y1="25" x2="60" y2="75">
					<stop offset="0" stopColor={tone.motifLight} />
					<stop offset="1" stopColor={tone.motifDark} />
				</linearGradient>
				<clipPath id={bodyClip}><path d={WAX_BODY} /></clipPath>
				<clipPath id={discClip}><circle cx="50" cy="50" r="33.5" /></clipPath>
				{blur(soft, 1.7)}
				{blur(fine, 0.9)}
				{blur(gloss, 1.8)}
			</defs>
			{/* Pressed wax with squeezed-out drips, then its bevel: light inside the
			    top-left edge, shade inside the bottom-right. */}
			<path d={WAX_BODY} fill={`url(#${wax})`} stroke={tone.edge} strokeOpacity="0.35" strokeWidth="0.75" />
			<g clipPath={`url(#${bodyClip})`} fill="none" filter={`url(#${soft})`}>
				<path d={WAX_BODY} transform="translate(2 3)" stroke="#fff" strokeOpacity="0.45" strokeWidth="5" />
				<path d={WAX_BODY} transform="translate(-2 -3)" stroke={tone.deep} strokeOpacity="0.55" strokeWidth="6" />
			</g>
			{/* Raised ring, then the recessed disc inside it. */}
			<circle cx="50" cy="50" r="36" fill="none" stroke={tone.deep} strokeOpacity="0.35" strokeWidth="5.5" transform="translate(0.25 0.75)" filter={`url(#${fine})`} />
			<circle cx="50" cy="50" r="36" fill="none" stroke={`url(#${rim})`} strokeWidth="5.5" />
			<circle cx="50" cy="50" r="33.5" fill={`url(#${disc})`} stroke={tone.shadowInk} strokeOpacity="0.35" strokeWidth="0.4" />
			<g clipPath={`url(#${discClip})`} fill="none" filter={`url(#${fine})`}>
				<circle cx="50" cy="50" r="33.5" transform="translate(1 1.5)" stroke={tone.deep} strokeOpacity="0.6" strokeWidth="4" />
				<circle cx="50" cy="50" r="33.5" transform="translate(-0.75 -1)" stroke="#fff" strokeOpacity="0.28" strokeWidth="3" />
			</g>
			{/* Motif pressed into the disc, drawn part by part so a shape hides the lines
			    under it. Raised lines and shapes carry a shadow and a highlight copy;
			    engraved grooves are a dark cut over a pale lower edge. */}
			<g clipPath={`url(#${discClip})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
				{parts.map((part, index) => {
					if (part.kind === "groove") {
						const w = part.w ?? 0.8;
						return (
							<g key={index}>
								<path d={part.d} transform="translate(0.5 0.6)" stroke="#fff" strokeOpacity="0.45" strokeWidth={w} />
								<path d={part.d} stroke={tone.shadowInk} strokeOpacity="0.75" strokeWidth={w} />
							</g>
						);
					}
					const width = part.kind === "line" ? part.w : 1.5;
					const stroked = part.kind === "line" || part.kind === "outline";
					return (
						<g key={index}>
							{part.kind === "outline" ? <path d={part.d} fill={`url(#${discUs})`} /> : null}
							{part.kind === "fill" ? <path d={part.d} transform="translate(0.9 1.1)" fill={tone.shadowInk} opacity="0.5" /> : <path d={part.d} transform="translate(0.8 1)" stroke={tone.shadowInk} strokeWidth={width + 0.5} opacity="0.5" />}
							{part.kind === "fill" ? <path d={part.d} transform="translate(-0.6 -0.7)" fill={tone.highlight} opacity="0.55" /> : <path d={part.d} transform="translate(-0.5 -0.6)" stroke={tone.highlight} strokeWidth={width + 0.3} opacity="0.5" />}
							{part.kind === "fill" ? <path d={part.d} fill={`url(#${emboss})`} /> : null}
							{stroked ? <path d={part.d} stroke={`url(#${emboss})`} strokeWidth={width} /> : null}
						</g>
					);
				})}
				{motif === "monogram" ? (
					<g textAnchor="middle" fontFamily="var(--font-script), 'Snell Roundhand', cursive" fontWeight="700" fontSize={initials.length > 1 ? 34 : 50}>
						<text x="50.9" y="65.1" fill={tone.shadowInk} opacity="0.5">{initials}</text>
						<text x="49.4" y="63.3" fill={tone.highlight} opacity="0.55">{initials}</text>
						<text x="50" y="64.2" fill={`url(#${emboss})`}>{initials}</text>
					</g>
				) : null}
			</g>
			{/* Gloss where the wax catches the light. */}
			<ellipse cx="33" cy="24.5" rx="7.5" ry="3" fill="#fff" fillOpacity="0.38" transform="rotate(35 33 24.5)" filter={`url(#${gloss})`} />
		</svg>
	);
}

/**
 * A paper envelope drawn in layers: lined inside, letter, front pocket with
 * diagonal creases, a deep rounded flap, and a wax seal at its tip, colored
 * and printed from the note's `style`. `open` shows it already opened (flap
 * up, letter peeking out, seal set down on the front); `opening` plays the
 * reader's sequence.
 */
export function NoteEnvelope({ letter, open = false, opening = false, className = "", style = DEFAULT_NOTE_STYLE }: {
	/** Content of the sheet inside; `false` leaves the slot empty (the reader animates its own sheet). */
	letter?: ReactNode | false;
	open?: boolean;
	opening?: boolean;
	className?: string;
	style?: NoteStyle;
}) {
	return (
		<div
			aria-hidden="true"
			data-envelope-flap={style.envelope.flap}
			className={`envelope ${open ? "envelope--open" : ""} ${opening ? "envelope--opening" : ""} ${className}`}
			style={envelopeStyleVars(style)}
		>
			<div className="envelope-back" />
			{letter === false ? null : <div className="envelope-letter">{letter}</div>}
			<div className="envelope-pocket" />
			<div className="envelope-flap" />
			<div className="envelope-seal"><WaxSeal color={style.seal.color} motif={style.seal.motif} text={style.seal.text} /></div>
		</div>
	);
}
