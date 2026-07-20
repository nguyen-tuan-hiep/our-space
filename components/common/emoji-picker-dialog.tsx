"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmojiStyle, type EmojiClickData } from "emoji-picker-react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
	ssr: false,
});

interface EmojiPickerDialogProps {
	open: boolean;
	title: string;
	clearLabel?: string;
	onClose: () => void;
	onClear?: () => void;
	onSelect: (emoji: string) => void;
}

export function EmojiPickerDialog({
	open,
	title,
	clearLabel = "Clear",
	onClose,
	onClear,
	onSelect,
}: EmojiPickerDialogProps) {
	const [shouldRender, setShouldRender] = useState(open);
	const [mounted, setMounted] = useState(false);
	const closing = shouldRender && !open;

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (open) {
			setShouldRender(true);
			return;
		}

		if (!shouldRender) return;
		const timeoutId = window.setTimeout(() => setShouldRender(false), 240);
		return () => window.clearTimeout(timeoutId);
	}, [open, shouldRender]);

	useEffect(() => {
		if (!open) return;

		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.body.style.overflow = originalOverflow;
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [onClose, open]);

	if (!mounted || !shouldRender) return null;

	return createPortal(
		<>
			<button
				type="button"
				aria-label="Close emoji picker"
				className={[
					"fixed inset-0 z-[90] bg-neutral-950/35 dark:bg-neutral-950/60 backdrop-blur-sm",
					closing ? "native-dialog-backdrop-out" : "native-dialog-backdrop-in",
				].join(" ")}
				onClick={onClose}
			/>
			<div
				role="dialog"
				aria-modal="true"
				aria-label={title}
				className={[
					"emoji-picker-dialog fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-[100] overflow-hidden rounded-3xl border border-neutral-900/10 bg-surface shadow-[0_24px_70px_rgba(30,25,20,0.28)] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(26rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2",
					closing ? "native-sheet-out" : "native-sheet-in",
				].join(" ")}
			>
				<div className="flex items-center justify-between border-b border-neutral-900/10 px-4 py-3">
					<p className="font-serif text-2xl leading-tight text-neutral-950">
						{title}
					</p>
					<Button
						type="button"
						variant="ghost"
						size="icon-lg"
						className="rounded-full"
						onClick={onClose}
					>
						<X size={18} />
					</Button>
				</div>
				<div className="p-2">
					<EmojiPicker
						width="100%"
						height={600}
						emojiStyle={EmojiStyle.NATIVE}
						previewConfig={{ showPreview: false }}
						onEmojiClick={(emojiData: EmojiClickData) => {
							onSelect(emojiData.emoji);
							onClose();
						}}
					/>
					{onClear ? (
						<Button
							type="button"
							variant="ghost"
							className="mt-2 h-10 w-full rounded-2xl font-bold"
							onClick={() => {
								onClear();
								onClose();
							}}
						>
							{clearLabel}
						</Button>
					) : null}
				</div>
			</div>
		</>,
		document.body,
	);
}
