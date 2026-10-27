import { useId, type ReactNode } from "react";

/**
 * Gold wax seal: an uneven pressed blob, a raised rim around a recessed disc,
 * and a looped hand-drawn heart embossed in the middle.
 */
export function WaxSeal() {
	// Per-instance ids so gradients still resolve when another seal is hidden.
	const id = useId().replace(/:/g, "");
	const wax = `wax-${id}`;
	const rim = `rim-${id}`;
	const disc = `disc-${id}`;
	const heart = `heart-${id}`;

	return (
		<svg viewBox="0 0 100 100" className="envelope-seal-svg" aria-hidden="true">
			<defs>
				<radialGradient id={wax} cx="38%" cy="30%" r="75%">
					<stop offset="0" stopColor="#e6c784" />
					<stop offset="0.38" stopColor="#c99d58" />
					<stop offset="0.75" stopColor="#ad823f" />
					<stop offset="1" stopColor="#8a642d" />
				</radialGradient>
				<linearGradient id={rim} x1="0" y1="0" x2="0.35" y2="1">
					<stop offset="0" stopColor="#f2d99b" />
					<stop offset="0.5" stopColor="#c59850" />
					<stop offset="1" stopColor="#80592a" />
				</linearGradient>
				<radialGradient id={disc} cx="42%" cy="36%" r="70%">
					<stop offset="0" stopColor="#c9a05b" />
					<stop offset="1" stopColor="#a47a3a" />
				</radialGradient>
				<linearGradient id={heart} x1="0" y1="0" x2="0.4" y2="1">
					<stop offset="0" stopColor="#f3dca0" />
					<stop offset="1" stopColor="#c0914a" />
				</linearGradient>
			</defs>
			{/* Pressed wax spreading unevenly past the stamp. */}
			<path
				d="M50 4C70 3 88 14 94 32C99 47 97 66 88 80C79 93 62 98 46 96C28 95 12 85 6 68C1 52 4 33 14 20C23 9 36 4 50 4Z"
				fill={`url(#${wax})`}
				stroke="#6f4e1f"
				strokeOpacity="0.35"
				strokeWidth="1"
			/>
			{/* Raised rim, then the recessed stamped disc inside it. */}
			<circle cx="50" cy="50" r="37" fill="none" stroke={`url(#${rim})`} strokeWidth="5.5" />
			<circle cx="50" cy="50" r="34" fill={`url(#${disc})`} />
			<circle cx="50" cy="50" r="34" fill="none" stroke="#5c3d12" strokeOpacity="0.35" strokeWidth="1" />
			{/* Looped heart: shadow, body, then a fine highlight for the embossed edge. */}
			<g fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(50 55) scale(1.2) translate(-50 -57)">
				<path
					d="M48 78C44 74 30 62 29 49C28 39 35 32 42 33C49 34 52 41 52 47C52 52 48 53 47 50C46 46 50 40 56 37C63 33 71 37 71 45C71 55 60 66 49 76C46 79 45 83 48 84C51 85 53 81 50 78"
					stroke="#5e4217"
					strokeOpacity="0.55"
					strokeWidth="3.8"
					transform="translate(0.7 0.9)"
				/>
				<path
					d="M48 78C44 74 30 62 29 49C28 39 35 32 42 33C49 34 52 41 52 47C52 52 48 53 47 50C46 46 50 40 56 37C63 33 71 37 71 45C71 55 60 66 49 76C46 79 45 83 48 84C51 85 53 81 50 78"
					stroke={`url(#${heart})`}
					strokeWidth="3.2"
				/>
				<path
					d="M48 78C44 74 30 62 29 49C28 39 35 32 42 33C49 34 52 41 52 47C52 52 48 53 47 50C46 46 50 40 56 37C63 33 71 37 71 45C71 55 60 66 49 76C46 79 45 83 48 84C51 85 53 81 50 78"
					stroke="#fff4d2"
					strokeOpacity="0.55"
					strokeWidth="0.8"
					transform="translate(-0.5 -0.6)"
				/>
			</g>
		</svg>
	);
}

/**
 * An ivory paper envelope drawn in layers: lined inside, letter, front pocket
 * with diagonal creases, a deep rounded flap, and a gold wax seal at its tip.
 * `open` shows it already opened (flap up, letter peeking out, seal set down
 * on the front); `opening`
 * plays the reader's sequence.
 */
export function NoteEnvelope({ letter, open = false, opening = false, className = "" }: {
	/** Content of the sheet inside; `false` leaves the slot empty (the reader animates its own sheet). */
	letter?: ReactNode | false;
	open?: boolean;
	opening?: boolean;
	className?: string;
}) {
	return (
		<div
			aria-hidden="true"
			className={`envelope ${open ? "envelope--open" : ""} ${opening ? "envelope--opening" : ""} ${className}`}
		>
			<div className="envelope-back" />
			{letter === false ? null : <div className="envelope-letter">{letter}</div>}
			<div className="envelope-pocket" />
			<div className="envelope-flap" />
			<div className="envelope-seal"><WaxSeal /></div>
		</div>
	);
}
