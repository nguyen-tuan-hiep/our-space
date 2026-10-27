"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useMediaQuery } from "@/components/common/use-hydrated";
import { CoinDoodle, EnvelopeDoodle, PiggyDoodle, PinDoodle, PopcornDoodle } from "@/components/common/doodles";

export type SaveKind = "note" | "expense" | "movie" | "memory";

const EVENT = "space:saved";

/** Play the little "saved!" scene for something just created. */
export function celebrateSave(kind: SaveKind) {
	window.dispatchEvent(new CustomEvent<SaveKind>(EVENT, { detail: kind }));
}

// Popcorn kernels: where each one flies (px) and how far it spins.
const KERNELS = [
	{ dx: -46, dy: -78, rot: -160 },
	{ dx: -18, dy: -104, rot: 120 },
	{ dx: 12, dy: -92, rot: -90 },
	{ dx: 40, dy: -84, rot: 200 },
	{ dx: -60, dy: -46, rot: 80 },
	{ dx: 58, dy: -52, rot: -140 },
];

/**
 * Mounted once: shows a short, non-interactive scene near the bottom of the
 * screen whenever something is created. A note's envelope flies off, a coin
 * drops into the piggy bank, popcorn pops, or a pin drops onto the map. Each
 * scene removes itself when its last animation ("save-scene-out") ends.
 */
export function SaveCelebration() {
	const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
	const [scene, setScene] = useState<{ kind: SaveKind; id: number } | null>(null);

	useEffect(() => {
		const onSaved = (event: Event) => {
			const kind = (event as CustomEvent<SaveKind>).detail;
			setScene({ kind, id: Date.now() });
		};
		window.addEventListener(EVENT, onSaved);
		return () => window.removeEventListener(EVENT, onSaved);
	}, []);

	if (!scene || reducedMotion) return null;

	return (
		<div
			key={scene.id}
			aria-hidden="true"
			className={`save-scene save-scene--${scene.kind}`}
			onAnimationEnd={(event) => {
				if (event.animationName === "save-scene-out") setScene(null);
			}}
		>
			{scene.kind === "note" ? (
				<>
					<EnvelopeDoodle className="save-scene-art" />
					<span className="save-scene-trail" style={{ "--t": 0 } as CSSProperties}>♥</span>
					<span className="save-scene-trail" style={{ "--t": 1 } as CSSProperties}>♥</span>
					<span className="save-scene-trail" style={{ "--t": 2 } as CSSProperties}>♥</span>
				</>
			) : null}
			{scene.kind === "expense" ? (
				<>
					<CoinDoodle className="save-scene-coin" />
					<PiggyDoodle className="save-scene-art" />
					<span className="save-scene-plus">+</span>
				</>
			) : null}
			{scene.kind === "movie" ? (
				<>
					{KERNELS.map((kernel, index) => (
						<span
							key={index}
							className="save-scene-kernel"
							style={{ "--dx": `${kernel.dx}px`, "--dy": `${kernel.dy}px`, "--rot": `${kernel.rot}deg`, "--k": index } as CSSProperties}
						/>
					))}
					<PopcornDoodle id="save-popcorn" className="save-scene-art" />
				</>
			) : null}
			{scene.kind === "memory" ? (
				<>
					<span className="save-scene-ripple" />
					<PinDoodle className="save-scene-art" />
				</>
			) : null}
		</div>
	);
}
