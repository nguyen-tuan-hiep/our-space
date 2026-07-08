"use client";

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
			<AlertDialogContent className="rounded-2xl bg-paper sm:max-w-md">
				<AlertDialogHeader>
					<AlertDialogTitle className="font-serif text-2xl">
						{title}
					</AlertDialogTitle>
					<AlertDialogDescription className="leading-7">
						{description}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel
						disabled={pending}
						onClick={onClose}
					>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={pending}
						onClick={onConfirm}
					>
						{pending ? "Deleting..." : confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
