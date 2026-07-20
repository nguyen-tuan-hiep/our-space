"use client";

import { Trash2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	description: string;
	confirmLabel?: string;
	pending?: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel = "Delete",
	pending = false,
	onClose,
	onConfirm,
}: ConfirmDialogProps) {
	const handleOpenChange = (nextOpen: boolean) => {
		if (pending || nextOpen) return;
		onClose();
	};

	return (
		<AlertDialog
			open={open}
			onOpenChange={handleOpenChange}
		>
			<AlertDialogContent className="mx-4 max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-neutral-900/10 bg-secondaryLight p-0 text-neutral-950 shadow-[0_24px_70px_rgba(30,25,20,0.24)] dark:border-white/10 dark:bg-secondaryDark dark:text-white sm:max-w-md">
				<div className="grid gap-4 px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
					<AlertDialogHeader className="place-items-start gap-2 text-left">
						<div className="flex items-center gap-3">
							<span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-danger-bg text-danger dark:bg-danger/20 dark:text-danger">
								<Trash2 size={21} />
							</span>
							<AlertDialogTitle className="font-serif text-3xl leading-tight text-neutral-950 dark:text-white">
								{title}
							</AlertDialogTitle>
						</div>
						<AlertDialogDescription className="text-sm leading-7 text-neutral-600 dark:text-neutral-800">
							{description}
						</AlertDialogDescription>
					</AlertDialogHeader>
				</div>
				<AlertDialogFooter className="m-0 mt-3 flex flex-col-reverse gap-2 rounded-none border-t border-neutral-900/10 bg-primaryLight dark:bg-primaryDark/70 p-4 sm:flex-row sm:justify-end sm:p-5">
					<AlertDialogCancel
						disabled={pending}
						onClick={onClose}
						className="h-11 rounded-2xl px-5 font-bold dark:!border-neutral-500/50 dark:!bg-secondaryDark dark:!text-white dark:hover:!bg-hoverDark dark:hover:!text-white"
					>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={pending}
						onClick={onConfirm}
						className="h-11 rounded-2xl border-transparent bg-transparent px-5 font-bold text-danger hover:bg-danger-bg dark:!text-danger dark:hover:!bg-danger dark:hover:!text-white"
					>
						{pending ? "Deleting..." : confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
