"use client";

import dynamic from "next/dynamic";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme/theme-provider";
import { EmojiStyle, Theme, type EmojiClickData } from "emoji-picker-react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface EmojiPickerDialogProps {
	open: boolean;
	title: string;
	clearLabel?: string;
	onClose: () => void;
	onClear?: () => void;
	onSelect: (emoji: string) => void;
}

/** Shares the dialog tree with its editor so Escape closes only the picker. */
export function EmojiPickerDialog({ open, title, clearLabel = "Clear", onClose, onClear, onSelect }: EmojiPickerDialogProps) {
	const { theme } = useTheme();
	return (
		<Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
			<Dialog.Portal>
				<Dialog.Backdrop className="glass-scrim app-dialog-overlay fixed inset-0 z-[90] bg-black/35 backdrop-blur-sm dark:bg-black/60" />
				<Dialog.Popup className="glass-dialog app-dialog mobile-sheet emoji-picker-dialog fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-[100] flex max-h-[calc(100svh-env(safe-area-inset-top)-2rem)] flex-col overflow-hidden rounded-3xl border border-border bg-surface-elevated text-foreground shadow-2xl outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(26rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2">
					<div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
						<Dialog.Title className="font-serif text-2xl leading-tight">{title}</Dialog.Title>
						<Dialog.Close render={<Button variant="ghost" className="size-11 shrink-0 rounded-full" />} aria-label="Close emoji picker"><X size={18} aria-hidden="true" /></Dialog.Close>
					</div>
					<div className="min-h-0 overflow-y-auto overscroll-contain p-2">
						<EmojiPicker
							width="100%"
							height={440}
							theme={theme === "dark" ? Theme.DARK : theme === "light" ? Theme.LIGHT : Theme.AUTO}
							emojiStyle={EmojiStyle.NATIVE}
							previewConfig={{ showPreview: false }}
							onEmojiClick={(data: EmojiClickData) => { onSelect(data.emoji); onClose(); }}
						/>
						{onClear ? <Button type="button" variant="ghost" className="mt-2 h-11 w-full rounded-2xl" onClick={() => { onClear(); onClose(); }}>{clearLabel}</Button> : null}
					</div>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
