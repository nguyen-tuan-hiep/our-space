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
			<AlertDialogContent className="mx-4 max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-neutral-900/10 bg-paper p-0 text-neutral-950 shadow-[0_24px_70px_rgba(30,25,20,0.24)] sm:max-w-md">
				<div className="grid gap-4 px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
					<AlertDialogHeader className="place-items-start gap-2 text-left">
						<div className="flex items-center gap-3">
							<span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-danger-bg text-danger">
								<Trash2 size={21} />
							</span>
							<AlertDialogTitle className="font-serif text-3xl leading-tight text-neutral-950">
								{title}
							</AlertDialogTitle>
						</div>
						<AlertDialogDescription className="text-sm leading-7 text-neutral-600">
							{description}
						</AlertDialogDescription>
					</AlertDialogHeader>
				</div>
				<AlertDialogFooter className="m-0 mt-3 flex flex-col-reverse gap-2 rounded-none border-t border-neutral-900/10 bg-bg/70 p-4 sm:flex-row sm:justify-end sm:p-5">
					<AlertDialogCancel
						disabled={pending}
						onClick={onClose}
						className="h-11 rounded-2xl px-5 font-bold"
					>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={pending}
						onClick={onConfirm}
						className="h-11 rounded-2xl border-transparent bg-transparent px-5 font-bold text-danger hover:bg-danger-bg"
					>
						{pending ? "Deleting..." : confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
