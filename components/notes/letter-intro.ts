/**
 * Plays the reader's opening on the real letter sheet: it starts tucked inside
 * the envelope (scaled to the envelope's letter slot and clipped to its height),
 * rises out once the flap is open, then unfolds into the full reading page.
 *
 * The offsets match the envelope's CSS timeline in globals.css: flap open by
 * ~900ms, letter rises 820–1380ms, envelope drops away 1380–1800ms.
 */
const DURATION_MS = 2100;
const at = (ms: number) => ms / DURATION_MS;

export function playLetterIntro(paper: HTMLElement, envelope: HTMLElement) {
	// offset* values are layout positions, so the dialog's own entry transform
	// (scale/translate while it fades in) doesn't skew the measurements.
	const sheet = { x: paper.offsetLeft, y: paper.offsetTop, w: paper.offsetWidth, h: paper.offsetHeight };
	const slot = { x: envelope.offsetLeft, y: envelope.offsetTop, w: envelope.offsetWidth, h: envelope.offsetHeight };

	// Same slot as `.envelope-letter`: 7% inset on top and sides, 10% at the bottom.
	const scale = (slot.w * 0.86) / sheet.w;
	const dx = slot.x + slot.w * 0.07 - sheet.x;
	const dy = slot.y + slot.h * 0.07 - sheet.y;
	const rise = slot.h * 0.58;
	const tuckedClip = `inset(0px 0px ${Math.max(0, sheet.h - (slot.h * 0.83) / scale)}px 0px round ${8 / scale}px)`;

	// Between the envelope's back and pocket while inside it; in front of the
	// fading envelope once it starts unfolding.
	const tucked = { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, clipPath: tuckedClip, zIndex: "1" };
	const risen = { transform: `translate(${dx}px, ${dy - rise}px) scale(${scale})`, clipPath: tuckedClip, zIndex: "1" };
	const unfolded = { transform: "translate(0px, 0px) scale(1)", clipPath: "inset(0px 0px 0px 0px round 16px)", zIndex: "5" };

	return paper.animate(
		[
			{ ...tucked, offset: 0 },
			{ ...tucked, offset: at(820), easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
			{ ...risen, offset: at(1380) },
			{ ...risen, offset: at(1500) },
			{ ...risen, zIndex: "5", offset: at(1501), easing: "cubic-bezier(0.3, 0, 0, 1)" },
			{ ...unfolded, offset: 1 },
		],
		{ duration: DURATION_MS },
	);
}
