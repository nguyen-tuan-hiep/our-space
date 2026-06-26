"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

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
		<Dialog
			open={open}
			onClose={pending ? undefined : handleClose}
			fullWidth
			maxWidth="xs"
		>
			<DialogTitle className="font-serif text-3xl">{title}</DialogTitle>
			<DialogContent>
				<p className="text-sm leading-7 text-neutral-600">{description}</p>
			</DialogContent>
			<DialogActions sx={{ p: 3, pt: 0 }}>
				<Button
					onClick={handleClose}
					disabled={pending}
				>
					Cancel
				</Button>
				<Button
					variant="contained"
					color="error"
					onClick={onConfirm}
					disabled={pending}
				>
					{pending ? "Deleting..." : confirmLabel}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
