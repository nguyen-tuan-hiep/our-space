"use client";

import { flushSync } from "react-dom";

type TransitionDocument = Document & {
	startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

function canTransition() {
	const doc = document as TransitionDocument;
	return (
		typeof doc.startViewTransition === "function" &&
		!window.matchMedia("(prefers-reduced-motion: reduce)").matches
	);
}

function start(update: () => void, kind: "list" | "root") {
	const root = document.documentElement;
	root.dataset.viewTransition = kind;
	const transition = (document as TransitionDocument).startViewTransition!(() => flushSync(update));
	transition.finished.finally(() => {
		if (root.dataset.viewTransition === kind) delete root.dataset.viewTransition;
	});
}

/**
 * Animates a list change (add, remove, move between sections) with the View
 * Transitions API: items carrying a `view-transition-name` pop in, shrink out or
 * glide to their new place (styles in globals.css). Without support, or with
 * reduced motion, the update simply applies.
 *
 * Changes made from a closing dialog wait for its exit animation first, so the
 * snapshot never freezes the sheet half-way down.
 */
export function runListTransition(update: () => void) {
	if (!canTransition()) {
		update();
		return;
	}
	if (document.querySelector('[role="dialog"], [role="alertdialog"]')) {
		window.setTimeout(() => start(update, "list"), 280);
		return;
	}
	start(update, "list");
}

/** Cross-fades the whole page, e.g. when switching light/dark appearance. */
export function runPageTransition(update: () => void) {
	if (!canTransition()) {
		update();
		return;
	}
	start(update, "root");
}
