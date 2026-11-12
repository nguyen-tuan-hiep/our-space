/**
 * Plays the reader's opening on the real letter sheet, as a letter folded in
 * half: the folded sheet (the lower half of the page) starts tucked in the
 * envelope's letter slot, rises out once the flap is open, settles at full
 * size, and then its upper half, folded forward over the lower half with its
 * back showing, swings up and back about the fold, like opening a folded page.
 *
 * `paper` is the outer `.letter-sheet` (shadow, tape, edge mask) holding the
 * page. Only the lower half of the page is shown while folded; a clone of the
 * upper half hinges open on the fold line, and is removed once it is flat, when
 * the real page takes over unclipped. The fold itself stays square-cornered.
 *
 * The offsets match the envelope's CSS timeline in globals.css: flap open by
 * ~900ms, letter rises 820–1380ms, envelope drops away 1380–1800ms.
 */
const DURATION_MS = 3000;
const UNFOLD_AT_MS = 1900;
const at = (ms: number) => ms / DURATION_MS;

export function playLetterIntro(paper: HTMLElement, envelope: HTMLElement) {
	const page = paper.querySelector<HTMLElement>(":scope > .letter-page-paper, :scope > .letter-paper");
	// offset* values are layout positions, so the dialog's own entry transform
	// (scale/translate while it fades in) doesn't skew the measurements.
	const sheet = { x: paper.offsetLeft, y: paper.offsetTop, w: paper.offsetWidth, h: paper.offsetHeight };
	const slot = { x: envelope.offsetLeft, y: envelope.offsetTop, w: envelope.offsetWidth, h: envelope.offsetHeight };
	const half = sheet.h / 2;

	// Same slot as `.envelope-letter`: 7% inset on top and sides, 10% at the bottom.
	const scale = (slot.w * 0.86) / sheet.w;
	const dx = slot.x + slot.w * 0.07 - sheet.x;
	// The fold line (half way down the sheet) sits at the top of the slot.
	const dy = slot.y + slot.h * 0.07 - sheet.y - half * scale;
	const rise = slot.h * 0.58;
	const tuckedBottom = Math.max(0, half - (slot.h * 0.83) / scale);
	// Cut edges (torn, stamp, ...) are masks with square corners; the rest round off.
	const full = page ? parseFloat(getComputedStyle(page).borderTopLeftRadius) || 0 : 0;
	const tuckedRadius = full ? 8 / scale : 0;
	const foldedClip = (bottom: number, radius: number) => `inset(50% 0px ${bottom}px 0px round 0px 0px ${radius}px ${radius}px)`;
	// The upper half flipped over the lower one: its far edge (the sheet's top) is the folded sheet's bottom.
	const flapClip = (cut: number, radius: number) => `inset(${cut}px 0px 50% 0px round ${radius}px ${radius}px 0px 0px)`;

	// The page is hidden above the fold; the upper half is a hinged flap, drawn as
	// a front (the page's upper half) and a back (blank paper), that starts
	// folded forward over the lower half and swings up to lie flat.
	let top: HTMLElement | null = null;
	let flap: HTMLElement | null = null;
	if (page) {
		const paperColor = getComputedStyle(page).backgroundColor;
		const hinge = document.createElement("div");
		hinge.className = "letter-hinge";
		hinge.setAttribute("aria-hidden", "true");
		hinge.setAttribute("inert", "");
		Object.assign(hinge.style, { position: "absolute", inset: "0", pointerEvents: "none", zIndex: "2", transformStyle: "preserve-3d", transformOrigin: "50% 50%" });

		const front = page.cloneNode(true) as HTMLElement;
		Object.assign(front.style, {
			position: "absolute", inset: "0", margin: "0", width: "100%", height: "100%",
			clipPath: flapClip(0, full), backfaceVisibility: "hidden",
		});
		front.classList.add("letter-hinge-front");

		const back = document.createElement("div");
		Object.assign(back.style, {
			position: "absolute", inset: "0", backfaceVisibility: "hidden", transform: "rotateY(180deg)",
			clipPath: flapClip(tuckedBottom, tuckedRadius),
			backgroundColor: paperColor && paperColor !== "rgba(0, 0, 0, 0)" ? paperColor : "#fffefd",
			backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0.07), rgba(0,0,0,0) 40%)",
		});

		back.className = "letter-hinge-back";
		hinge.append(front, back);
		flap = back;
		paper.appendChild(hinge);
		top = hinge;
		page.style.clipPath = foldedClip(tuckedBottom, tuckedRadius);
	}

	// The sheet's box shadow and tape belong to the whole page, not the folded
	// half. Cut-edge sheets already cast a drop-shadow of what is drawn; the rest
	// get the same kind of shadow so the folded sheet has an edge from the start.
	paper.dataset.folding = "";
	const shadow = paper.style.filter, boxShadow = paper.style.boxShadow;
	if (getComputedStyle(paper).filter === "none") {
		paper.style.filter = "drop-shadow(0 0 0.6px rgb(60 45 40 / 0.4)) drop-shadow(0 1px 2px rgb(0 0 0 / 0.14)) drop-shadow(0 10px 18px rgb(0 0 0 / 0.14))";
		paper.style.boxShadow = "none";
	}

	// Between the envelope's back and pocket while inside it; in front of the
	// fading envelope once it starts settling.
	const tucked = { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, zIndex: "1" };
	const risen = { transform: `translate(${dx}px, ${dy - rise}px) scale(${scale})`, zIndex: "1" };
	const settled = { transform: "translate(0px, 0px) scale(1)", zIndex: "5" };

	const animations: Animation[] = [
		paper.animate(
			[
				{ ...tucked, offset: 0 },
				{ ...tucked, offset: at(820), easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
				{ ...risen, offset: at(1380) },
				{ ...risen, offset: at(1500) },
				{ ...risen, zIndex: "5", offset: at(1501), easing: "cubic-bezier(0.3, 0, 0, 1)" },
				{ ...settled, offset: at(UNFOLD_AT_MS) },
				{ ...settled, offset: 1 },
			],
			{ duration: DURATION_MS },
		),
	];
	if (page) {
		animations.push(
			page.animate(
				[
					{ clipPath: foldedClip(tuckedBottom, tuckedRadius), offset: 0 },
					{ clipPath: foldedClip(tuckedBottom, tuckedRadius), offset: at(1500) },
					{ clipPath: foldedClip(0, full), offset: at(UNFOLD_AT_MS) },
					{ clipPath: foldedClip(0, full), offset: 1 },
				],
				{ duration: DURATION_MS },
			),
		);
	}
	if (flap) {
		animations.push(
			flap.animate(
				[
					{ clipPath: flapClip(tuckedBottom, tuckedRadius), offset: 0 },
					{ clipPath: flapClip(tuckedBottom, tuckedRadius), offset: at(1500) },
					{ clipPath: flapClip(0, full), offset: at(UNFOLD_AT_MS) },
					{ clipPath: flapClip(0, full), offset: 1 },
				],
				{ duration: DURATION_MS },
			),
		);
	}
	if (top) {
		animations.push(
			top.animate(
				[
					{ transform: "perspective(1400px) rotateX(-180deg)" },
					{ transform: "perspective(1400px) rotateX(0deg)" },
				],
				{ duration: DURATION_MS - UNFOLD_AT_MS, delay: UNFOLD_AT_MS, easing: "cubic-bezier(0.3, 0, 0.2, 1)", fill: "both" },
			),
		);
	}

	let done = false;
	const cleanup = () => {
		if (done) return;
		done = true;
		top?.remove();
		page?.style.removeProperty("clip-path");
		paper.style.filter = shadow;
		paper.style.boxShadow = boxShadow;
		delete paper.dataset.folding;
	};

	// Resolves only when the intro plays through; a cancelled intro rejects so callers don't treat it as done.
	const finished = Promise.all(animations.map((animation) => animation.finished)).then(
		() => cleanup(),
		(error) => { cleanup(); throw error; },
	);
	return {
		finished,
		cancel() {
			for (const animation of animations) animation.cancel();
			cleanup();
		},
	};
}
