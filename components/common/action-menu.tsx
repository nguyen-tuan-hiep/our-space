"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Edit2, EllipsisVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ActionMenuProps {
	label: string;
	disabled?: boolean;
	editLabel?: string;
	deleteLabel?: string;
	sheetTitle?: string;
	sheetDescription?: string;
	triggerClassName?: string;
	contentClassName?: string;
	onEdit: () => void;
	onDelete: () => void;
}

export function ActionMenu({
	label,
	disabled = false,
	editLabel = "Edit",
	deleteLabel = "Delete",
	sheetTitle = "Actions",
	sheetDescription = "Choose what you want to do.",
	triggerClassName,
	contentClassName,
	onEdit,
	onDelete,
}: ActionMenuProps) {
	const menuId = useId();
	const canUsePortal = typeof document !== "undefined";
	const [desktopOpen, setDesktopOpen] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const [shouldRenderMobile, setShouldRenderMobile] = useState(false);
	const mobileClosing = shouldRenderMobile && !mobileOpen;

	useEffect(() => {
		const handleActionMenuOpen = (event: Event) => {
			if (!(event instanceof CustomEvent) || event.detail === menuId) return;
			setDesktopOpen(false);
			setMobileOpen(false);
		};

		window.addEventListener("action-menu-open", handleActionMenuOpen);
		return () =>
			window.removeEventListener("action-menu-open", handleActionMenuOpen);
	}, [menuId]);

	useEffect(() => {
		if (mobileOpen) {
			setShouldRenderMobile(true);
			window.dispatchEvent(
				new CustomEvent("action-menu-open", { detail: menuId }),
			);
			return;
		}

		if (!shouldRenderMobile) return;
		const timeoutId = window.setTimeout(() => setShouldRenderMobile(false), 260);
		return () => window.clearTimeout(timeoutId);
	}, [mobileOpen, shouldRenderMobile, menuId]);

	useEffect(() => {
		if (!mobileOpen) return;
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setMobileOpen(false);
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.body.style.overflow = originalOverflow;
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [mobileOpen]);

	const handleMobileEdit = () => {
		setMobileOpen(false);
		window.setTimeout(onEdit, 120);
	};

	const handleMobileDelete = () => {
		setMobileOpen(false);
		window.setTimeout(onDelete, 120);
	};

	const mobileSheet = shouldRenderMobile ? (
		<>
			<button
				type="button"
				aria-label="Close actions"
				className={[
					"fixed inset-0 z-[70] bg-bg/25 backdrop-blur-[2px] sm:hidden",
					mobileClosing
						? "native-dialog-backdrop-out"
						: "native-dialog-backdrop-in",
				].join(" ")}
				onClick={() => setMobileOpen(false)}
			/>
			<div
				role="dialog"
				aria-modal="true"
				aria-label={sheetTitle}
				className={[
					"mobile-sheet-motion fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-[80] overflow-hidden rounded-3xl border border-white/80 bg-paper shadow-[0_24px_70px_rgba(30,25,20,0.28)] sm:hidden",
					mobileClosing ? "native-sheet-out" : "native-sheet-in",
				].join(" ")}
			>
				<div className="mx-auto mt-2.5 h-1.5 w-11 rounded-full bg-neutral-300" />
				<div className="border-b border-neutral-900/10 px-5 py-4">
					<p className="font-serif text-xl leading-tight text-neutral-950">
						{sheetTitle}
					</p>
					<p className="mt-1 line-clamp-2 text-sm text-neutral-500">
						{sheetDescription}
					</p>
				</div>
				<div className="grid gap-2 p-3">
					<Button
						type="button"
						variant="ghost"
						className="h-12 justify-start rounded-2xl px-4 text-base font-semibold shadow-none transition hover:bg-neutral-100 hover:shadow-[0_10px_24px_rgba(23,23,23,0.08)] active:scale-[0.98]"
						onClick={handleMobileEdit}
					>
						<Edit2 size={18} />
						{editLabel}
					</Button>
					<Button
						type="button"
						variant="destructive"
						className="h-12 justify-start rounded-2xl px-4 text-base font-semibold shadow-none transition hover:shadow-[0_10px_24px_rgba(220,38,38,0.14)] active:scale-[0.98]"
						onClick={handleMobileDelete}
					>
						<Trash2 size={18} />
						{deleteLabel}
					</Button>
				</div>
			</div>
		</>
	) : null;

	return (
		<>
			<DropdownMenu
				open={desktopOpen}
				onOpenChange={(open) => {
					setDesktopOpen(open);
					if (open) {
						setMobileOpen(false);
						window.dispatchEvent(
							new CustomEvent("action-menu-open", { detail: menuId }),
						);
					}
				}}
			>
				<DropdownMenuTrigger
					render={
						<Button
							type="button"
							variant="ghost"
							size="icon-lg"
							aria-label={label}
							disabled={disabled}
							className={cn(
								"hidden rounded-full bg-bg text-neutral-600 hover:bg-neutral-950 hover:text-neutral-50 active:scale-[0.95] sm:inline-flex",
								triggerClassName,
							)}
						/>
					}
				>
					<EllipsisVertical size={18} />
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					sideOffset={8}
					className={cn(
						"w-72 rounded-3xl border border-neutral-900/10 bg-paper p-2 shadow-[0_24px_70px_rgba(30,25,20,0.22)] backdrop-blur-xl",
						contentClassName,
					)}
				>
					<div className="px-3 pb-2 pt-2">
						<p className="font-serif text-lg leading-tight text-neutral-950">
							{sheetTitle}
						</p>
						<p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">
							{sheetDescription}
						</p>
					</div>
					<DropdownMenuItem
						onClick={onEdit}
						className="group gap-3 rounded-2xl px-3 py-3 hover:bg-neutral-100"
					>
						<span className="grid size-9 place-items-center rounded-xl bg-bg text-neutral-700 transition group-hover:bg-neutral-950 group-hover:text-neutral-50">
							<Edit2 size={16} />
						</span>
						<span>
							<span className="block font-bold text-neutral-900">
								{editLabel}
							</span>
							<span className="block text-xs text-neutral-500">
								Update details
							</span>
						</span>
					</DropdownMenuItem>
					<DropdownMenuItem
						variant="destructive"
						onClick={onDelete}
						className="group mt-1 gap-3 rounded-2xl px-3 py-3 hover:bg-danger-bg"
					>
						<span className="grid size-9 place-items-center rounded-xl bg-danger-bg text-danger transition group-hover:bg-danger group-hover:text-white">
							<Trash2 size={16} />
						</span>
						<span>
							<span className="block font-bold text-danger">{deleteLabel}</span>
							<span className="block text-xs text-danger/70">
								Remove permanently
							</span>
						</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Button
				type="button"
				variant="ghost"
				size="icon-lg"
				aria-label={label}
				aria-expanded={mobileOpen ? "true" : undefined}
				aria-haspopup="dialog"
				disabled={disabled}
				className={cn(
					"inline-flex rounded-full bg-bg text-neutral-600 shadow-[0_6px_16px_rgba(23,23,23,0.08)] hover:bg-neutral-950 hover:text-neutral-50 hover:shadow-[0_12px_28px_rgba(23,23,23,0.16)] active:scale-[0.92] sm:hidden",
					triggerClassName,
				)}
				onClick={() => {
					setDesktopOpen(false);
					setMobileOpen(true);
				}}
			>
				<EllipsisVertical size={18} />
			</Button>

			{canUsePortal ? createPortal(mobileSheet, document.body) : mobileSheet}
		</>
	);
}
