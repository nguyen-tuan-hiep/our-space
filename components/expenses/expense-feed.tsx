"use client";

import { useState, useTransition } from "react";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Edit2, Trash2, EllipsisVertical } from "lucide-react";
import { useSnackbar } from "notistack";
import { deleteExpense } from "@/app/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { expenseCategoryColors, formatCurrency } from "@/lib/constants";
import { formatAppDateTime } from "@/lib/date-format";
import type { IndividualExpense } from "@/lib/types";

interface ExpenseFeedProps {
	title: string;
	expenses: IndividualExpense[];
	currentUserId: string;
	readOnly: boolean;
	timeZone: string;
	onEdit?: (expense: IndividualExpense) => void;
}

export function ExpenseFeed({
	title,
	expenses,
	currentUserId,
	readOnly,
	timeZone,
	onEdit,
}: ExpenseFeedProps) {
	const { enqueueSnackbar } = useSnackbar();
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [expenseToDelete, setExpenseToDelete] =
		useState<IndividualExpense | null>(null);
	const [expanded, setExpanded] = useState(false);
	const [pending, startTransition] = useTransition();

	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [activeExpense, setActiveExpense] = useState<IndividualExpense | null>(
		null,
	);
	const menuOpen = Boolean(anchorEl);

	const visibleExpenses = expanded ? expenses : expenses.slice(0, 3);

	const handleMenuOpen = (
		event: React.MouseEvent<HTMLElement>,
		expense: IndividualExpense,
	) => {
		setAnchorEl(event.currentTarget);
		setActiveExpense(expense);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
		setActiveExpense(null);
	};

	const handleEditClick = () => {
		if (activeExpense && onEdit) {
			onEdit(activeExpense);
		}
		handleMenuClose();
	};

	const handleDeleteClick = () => {
		if (activeExpense) {
			setExpenseToDelete(activeExpense);
		}
		handleMenuClose();
	};

	return (
		<Card className="border border-neutral-200 bg-paper p-5 !shadow-lg">
			<div className="mb-5 flex items-center justify-between gap-4">
				<div>
					<p className="eyebrow">{readOnly ? "Read only" : "Personal"}</p>
					<div className="mt-2 flex items-center gap-1.5">
						<span className="font-serif text-2xl leading-1">
							{title}
						</span>
					</div>
				</div>
			</div>

			<div className="grid gap-5">
				{expenses.length ? (
					visibleExpenses.map((expense) => {
						const canEdit = !readOnly && expense.owner_id === currentUserId;
						const isDeleting = pending && deletingId === expense.id;

						return (
							<div
								key={expense.id}
								className="border border-neutral-400 p-4 rounded-lg border-dashed"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="flex-1 min-w-0">
										<p className="font-semibold">{expense.title}</p>
										<p className="mt-1 text-sm text-neutral-500">
											{formatAppDateTime(expense.transaction_date, timeZone)}
										</p>
									</div>

									<div className="flex items-center gap-2 shrink-0">
										<p className="font-semibold">
											{formatCurrency(expense.amount, expense.currency)}
										</p>

										{canEdit && (
											<IconButton
												aria-label="more"
												id={`expense-menu-button-${expense.id}`}
												aria-controls={
													menuOpen && activeExpense?.id === expense.id
														? "expense-menu"
														: undefined
												}
												aria-expanded={
													menuOpen && activeExpense?.id === expense.id
														? "true"
														: undefined
												}
												aria-haspopup="true"
												onClick={(e) => handleMenuOpen(e, expense)}
												size="small"
												disabled={isDeleting}
												className="-mr-2"
											>
												<EllipsisVertical
													size={18}
													className="text-neutral-500"
												/>
											</IconButton>
										)}
									</div>
								</div>

								<div className="my-2 flex flex-wrap items-center gap-2">
									<Chip
										size="small"
										label={expense.category}
										sx={{
											backgroundColor: expenseCategoryColors[expense.category],
											fontWeight: 700,
										}}
									/>
								</div>
								{expense.notes ? (
									<div className="text-sm text-neutral-500 max-w-xs">
										{expense.notes}
									</div>
								) : null}
							</div>
						);
					})
				) : (
					<p className="py-10 text-center text-neutral-500">
						No transactions yet.
					</p>
				)}
			</div>

			{!readOnly ? (
				<Menu
					id="expense-menu"
					anchorEl={anchorEl}
					open={menuOpen}
					onClose={handleMenuClose}
					anchorOrigin={{
						vertical: "bottom",
						horizontal: "right",
					}}
					transformOrigin={{
						vertical: "top",
						horizontal: "right",
					}}
				>
					<MenuItem onClick={handleEditClick}>
						<ListItemIcon>
							<Edit2 size={15} />
						</ListItemIcon>
						<ListItemText>Edit</ListItemText>
					</MenuItem>
					<MenuItem
						onClick={handleDeleteClick}
						className="text-danger"
					>
						<ListItemIcon>
							<Trash2
								size={15}
								className="text-danger"
							/>
						</ListItemIcon>
						<ListItemText>Delete</ListItemText>
					</MenuItem>
				</Menu>
			) : null}

			{expenses.length > 3 ? (
				<div className="mt-5">
					<Button
						fullWidth
						variant="outlined"
						onClick={() => setExpanded((value) => !value)}
					>
						{expanded
							? "Show recent transactions"
							: `Show all ${expenses.length} transactions`}
					</Button>
				</div>
			) : null}

			<ConfirmDialog
				open={Boolean(expenseToDelete)}
				title="Delete transaction?"
				description={
					expenseToDelete
						? `"${expenseToDelete.title}" will be permanently removed from your ledger.`
						: "This transaction will be permanently removed from your ledger."
				}
				confirmLabel="Delete transaction"
				pending={pending}
				onClose={() => setExpenseToDelete(null)}
				onConfirm={() => {
					if (!expenseToDelete) return;
					setDeletingId(expenseToDelete.id);
					startTransition(async () => {
						const result = await deleteExpense(expenseToDelete.id);
						enqueueSnackbar(result.message, {
							variant: result.ok ? "success" : "error",
						});
						setDeletingId(null);
						if (result.ok) setExpenseToDelete(null);
					});
				}}
			/>
		</Card>
	);
}
