"use client";

import { NativeButton, NativeDialog } from "@/components/ui/native-controls";

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
	const handleClose = () => {
		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
		onClose();
	};

	return (
		<NativeDialog
			open={open}
			onClose={pending ? () => undefined : handleClose}
			maxWidth="sm"
			title={title}
			actions={
				<>
					<NativeButton
						type="button"
						variant="text"
						onClick={handleClose}
						disabled={pending}
					>
						Cancel
					</NativeButton>
					<NativeButton
						type="button"
						variant="danger"
						onClick={onConfirm}
						disabled={pending}
					>
						{pending ? "Deleting..." : confirmLabel}
					</NativeButton>
				</>
			}
		>
			<p className="text-sm leading-7 text-neutral-600">{description}</p>
		</NativeDialog>
	);
}
