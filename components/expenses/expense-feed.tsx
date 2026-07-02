"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Edit2, Trash2, EllipsisVertical } from "lucide-react";
import { useToast } from "@/components/toast";
import { NativeButton } from "@/components/ui/native-controls";
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
	const toast = useToast();
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [expenseToDelete, setExpenseToDelete] =
		useState<IndividualExpense | null>(null);
	const [expanded, setExpanded] = useState(false);
	const [pending, startTransition] = useTransition();

	const [activeExpense, setActiveExpense] = useState<IndividualExpense | null>(
		null,
	);
	const menuOpen = Boolean(activeExpense);
	const menuRef = useRef<HTMLDivElement | null>(null);

	const visibleExpenses = expanded ? expenses : expenses.slice(0, 3);

	useEffect(() => {
		if (!menuOpen) return;

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (target instanceof Node && !menuRef.current?.contains(target)) {
				setActiveExpense(null);
			}
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setActiveExpense(null);
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [menuOpen]);

	const handleMenuOpen = (expense: IndividualExpense) => {
		setActiveExpense((current) => (current?.id === expense.id ? null : expense));
	};

	const handleMenuClose = () => {
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
		<div className="rounded-lg border border-neutral-200 bg-paper p-5">
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
											<div className="relative -mr-2" ref={activeExpense?.id === expense.id ? menuRef : null}>
												<button
													type="button"
													aria-label="more"
													id={`expense-menu-button-${expense.id}`}
													aria-controls={
														activeExpense?.id === expense.id
															? "expense-menu"
															: undefined
													}
													aria-expanded={
														activeExpense?.id === expense.id ? "true" : undefined
													}
													aria-haspopup="menu"
													onClick={() => handleMenuOpen(expense)}
													disabled={isDeleting}
													className="grid size-8 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
												>
													<EllipsisVertical size={18} />
												</button>
												{activeExpense?.id === expense.id ? (
													<div
														id="expense-menu"
														role="menu"
														aria-labelledby={`expense-menu-button-${expense.id}`}
														className="absolute right-0 top-9 z-20 w-36 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
													>
														<button
															type="button"
															role="menuitem"
															onClick={handleEditClick}
															className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 transition hover:bg-neutral-100"
														>
															<Edit2 size={15} />
															Edit
														</button>
														<button
															type="button"
															role="menuitem"
															onClick={handleDeleteClick}
															className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger transition hover:bg-danger-bg"
														>
															<Trash2 size={15} />
															Delete
														</button>
													</div>
												) : null}
											</div>
										)}
									</div>
								</div>

								<div className="my-2 flex flex-wrap items-center gap-2">
									<span
										className="rounded-full px-2.5 py-1 text-xs font-bold text-neutral-900"
										style={{
											backgroundColor: expenseCategoryColors[expense.category],
										}}
									>
										{expense.category}
									</span>
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

			{expenses.length > 3 ? (
				<div className="mt-5">
					<NativeButton
						type="button"
						variant="outlined"
						className="w-full"
						onClick={() => setExpanded((value) => !value)}
					>
						{expanded
							? "Show recent transactions"
							: `Show all ${expenses.length} transactions`}
					</NativeButton>
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
						toast(result.message, {
							variant: result.ok ? "success" : "error",
						});
						setDeletingId(null);
						if (result.ok) setExpenseToDelete(null);
					});
				}}
			/>
		</div>
	);
}
