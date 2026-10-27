import type { CSSProperties, ReactNode } from "react";

/*
 * Little hand-drawn illustrations in the letter's palette (ink outline, white
 * paper, pink and baby blue), shared by the empty states and the save
 * celebrations so both feel like the same sketchbook.
 */

const INK = "#4a3a3f";
const PINK = "#e89aae";
const ROSE = "#b5556f";
const BLUSH = "rgb(232 154 174 / 0.5)";
const line = { stroke: INK, strokeWidth: 2.5, strokeLinejoin: "round", strokeLinecap: "round" } as const;

/** A heart centred on (cx, cy), about 2s wide. */
function heart(cx: number, cy: number, s: number) {
	return `M${cx} ${cy + s * 0.9}C${cx - s * 1.1} ${cy + s * 0.2} ${cx - s * 0.9} ${cy - s * 0.8} ${cx} ${cy - s * 0.3}C${cx + s * 0.9} ${cy - s * 0.8} ${cx + s * 1.1} ${cy + s * 0.2} ${cx} ${cy + s * 0.9}Z`;
}

type DoodleProps = { className?: string };

/** An envelope sealed with a heart; `sleepy` gives it closed eyes and blushing cheeks. */
export function EnvelopeDoodle({ className, sleepy = false }: DoodleProps & { sleepy?: boolean }) {
	return (
		<svg viewBox="0 0 120 90" className={className} aria-hidden="true">
			<rect x="12" y="22" width="96" height="60" rx="8" fill="#fffefd" {...line} />
			<path d="M15 79L50 52M105 79L70 52" fill="none" {...line} strokeOpacity="0.35" />
			<path className="doodle-flap" d="M13 27Q13 22 18 22H102Q107 22 107 27L64 55Q60 58 56 55Z" fill="#fdf1f4" {...line} />
			<path d={heart(60, 50, 8)} fill={PINK} {...line} strokeWidth="2" />
			{sleepy ? (
				<>
					<path d="M38 68q4 4 8 0M74 68q4 4 8 0M56 74q4 3 8 0" fill="none" {...line} strokeWidth="2.2" />
					<circle cx="33" cy="73" r="4.5" fill={BLUSH} />
					<circle cx="87" cy="73" r="4.5" fill={BLUSH} />
				</>
			) : null}
		</svg>
	);
}

/** A pink piggy bank with a coin slot on its back. */
export function PiggyDoodle({ className }: DoodleProps) {
	return (
		<svg viewBox="0 0 130 100" className={className} aria-hidden="true">
			<path d="M22 54c-9-1-11-10-5-12c5-2 7 6 0 8" fill="none" {...line} />
			<rect x="38" y="70" width="13" height="18" rx="5" fill="#f2b3c3" {...line} />
			<rect x="79" y="70" width="13" height="18" rx="5" fill="#f2b3c3" {...line} />
			<ellipse cx="65" cy="55" rx="44" ry="32" fill="#f9cdd8" {...line} />
			<path d="M78 29L91 13L96 35Z" fill="#f2b3c3" {...line} />
			<rect x="52" y="25" width="22" height="4.5" rx="2.25" fill={INK} />
			<ellipse cx="104" cy="60" rx="11" ry="9" fill="#f2b3c3" {...line} />
			<ellipse cx="100.5" cy="60" rx="1.6" ry="2.6" fill={INK} />
			<ellipse cx="107.5" cy="60" rx="1.6" ry="2.6" fill={INK} />
			<circle cx="87" cy="45" r="3" fill={INK} />
			<circle cx="83" cy="58" r="5" fill={BLUSH} />
		</svg>
	);
}

/** A striped popcorn bucket with a smiling face, heaped with puffs. */
export function PopcornDoodle({ className, id = "popcorn" }: DoodleProps & { id?: string }) {
	const clip = `${id}-bucket`;
	const bucket = "M18 54H92L82 111Q81 116 76 116H34Q29 116 28 111Z";
	return (
		<svg viewBox="0 0 110 120" className={className} aria-hidden="true">
			{[[34, 40, 13], [53, 30, 14], [73, 34, 13], [85, 47, 11], [24, 51, 10], [60, 46, 12], [43, 48, 11]].map(([cx, cy, r]) => (
				<circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#fff8e6" {...line} />
			))}
			<clipPath id={clip}><path d={bucket} /></clipPath>
			<path d={bucket} fill="#fffefd" />
			<g clipPath={`url(#${clip})`} fill="#f6b5c4">
				<rect x="30" y="54" width="11" height="64" />
				<rect x="50" y="54" width="11" height="64" />
				<rect x="70" y="54" width="11" height="64" />
			</g>
			<path d={bucket} fill="none" {...line} />
			<rect x="14" y="49" width="82" height="10" rx="4" fill={PINK} {...line} />
			<circle cx="47" cy="83" r="2.6" fill={INK} />
			<circle cx="63" cy="83" r="2.6" fill={INK} />
			<path d="M51 89q4 4 8 0" fill="none" {...line} strokeWidth="2.2" />
		</svg>
	);
}

/** A pastel instant camera with a rainbow stripe, like the one in the memory details. */
export function CameraDoodle({ className }: DoodleProps) {
	return (
		<svg viewBox="0 0 130 96" className={className} aria-hidden="true">
			<rect x="92" y="10" width="17" height="12" rx="4" fill="#e2768f" {...line} />
			<rect x="8" y="18" width="114" height="70" rx="16" fill="#f9dbe3" {...line} />
			{["#f5a3b5", "#f7c58f", "#f6e39a", "#a8dcb5", "#92c2e8"].map((color, index) => (
				<rect key={color} x={59 + index * 2.4} y="19.5" width="2.4" height="58" fill={color} />
			))}
			<circle cx="65" cy="51" r="22" fill={INK} />
			<circle cx="65" cy="51" r="16" fill="#fffefd" />
			<circle cx="65" cy="51" r="12" fill="#5b7fa8" />
			<circle cx="60" cy="46" r="3.2" fill="#fff" />
			<rect x="18" y="28" width="16" height="11" rx="3" fill="#8db4d6" {...line} strokeWidth="2" />
			<rect x="95" y="28" width="18" height="11" rx="3" fill="#fff" {...line} strokeWidth="2" />
			<path d={heart(22, 70, 4)} fill={PINK} />
			<rect x="22" y="78" width="86" height="4" rx="2" fill={INK} />
		</svg>
	);
}

/** A map pin with a heart in its window. */
export function PinDoodle({ className }: DoodleProps) {
	return (
		<svg viewBox="0 0 80 100" className={className} aria-hidden="true">
			<path d="M40 92C30 78 12 62 12 40A28 28 0 0 1 68 40C68 62 50 78 40 92Z" fill={PINK} {...line} />
			<circle cx="40" cy="40" r="15" fill="#fffefd" {...line} strokeWidth="2" />
			<path d={heart(40, 40, 6.5)} fill={ROSE} />
		</svg>
	);
}

/** A gold coin with a heart stamped on it. */
export function CoinDoodle({ className }: DoodleProps) {
	return (
		<svg viewBox="0 0 40 40" className={className} aria-hidden="true">
			<circle cx="20" cy="20" r="16" fill="#f6d27a" {...line} />
			<circle cx="20" cy="20" r="11" fill="none" stroke="#c99a35" strokeWidth="1.6" />
			<path d={heart(20, 20, 5)} fill="#c99a35" />
		</svg>
	);
}

const emptyArt: Record<"notes" | "finance" | "movies" | "memory", ReactNode> = {
	notes: <EnvelopeDoodle sleepy className="h-full w-full" />,
	finance: <PiggyDoodle className="h-full w-full" />,
	movies: <PopcornDoodle id="empty-popcorn" className="h-full w-full" />,
	memory: <CameraDoodle className="h-full w-full" />,
};

/**
 * Empty-state illustration: the doodle bobs gently over a soft shadow that
 * shrinks as it rises. The sleepy envelope also breathes out little "z"s.
 */
export function EmptyDoodle({ kind, size = "md" }: { kind: keyof typeof emptyArt; size?: "sm" | "md" }) {
	return (
		<span aria-hidden="true" className={`empty-doodle empty-doodle--${size}`}>
			<span className="empty-doodle-art">{emptyArt[kind]}</span>
			<span className="empty-doodle-shadow" />
			{kind === "notes" ? (
				<>
					<span className="empty-doodle-z" style={{ "--z": 0 } as CSSProperties}>z</span>
					<span className="empty-doodle-z" style={{ "--z": 1 } as CSSProperties}>z</span>
					<span className="empty-doodle-z" style={{ "--z": 2 } as CSSProperties}>z</span>
				</>
			) : null}
		</span>
	);
}
