"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Edit2, Trash2, EllipsisVertical, ListFilter } from "lucide-react";
import { useToast } from "@/components/toast";
import { NativeSelect } from "@/components/ui/native-controls";
import { deleteExpense } from "@/app/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
	expenseCategories,
	expenseCategoryColors,
	formatCurrency,
} from "@/lib/constants";
import { formatAppDateTime } from "@/lib/date-format";
import type { ExpenseCategory, IndividualExpense } from "@/lib/types";

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

	const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "all">(
		"all",
	);

	const [pending, startTransition] = useTransition();

	const [activeExpense, setActiveExpense] = useState<IndividualExpense | null>(
		null,
	);

	const [scrollGradient, setScrollGradient] = useState({
		top: false,
		bottom: false,
	});

	const menuOpen = Boolean(activeExpense);
	const menuRef = useRef<HTMLDivElement | null>(null);
	const scrollRef = useRef<HTMLDivElement | null>(null);

	const filteredExpenses =
		categoryFilter === "all"
			? expenses
			: expenses.filter((expense) => expense.category === categoryFilter);

	const updateScrollGradient = useCallback(() => {
		const element = scrollRef.current;
		if (!element) return;

		const maxScrollTop = element.scrollHeight - element.clientHeight;
		const hasOverflow = maxScrollTop > 2;

		const nextGradient = {
			top: hasOverflow && element.scrollTop > 2,
			bottom: hasOverflow && element.scrollTop < maxScrollTop - 2,
		};

		setScrollGradient((current) => {
			if (
				current.top === nextGradient.top &&
				current.bottom === nextGradient.bottom
			) {
				return current;
			}

			return nextGradient;
		});
	}, []);

	useEffect(() => {
		if (!menuOpen) return;

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;

			if (target instanceof Node && !menuRef.current?.contains(target)) {
				setActiveExpense(null);
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setActiveExpense(null);
			}
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [menuOpen]);

	useEffect(() => {
		const frame = window.requestAnimationFrame(updateScrollGradient);

		window.addEventListener("resize", updateScrollGradient);

		return () => {
			window.cancelAnimationFrame(frame);
			window.removeEventListener("resize", updateScrollGradient);
		};
	}, [
		updateScrollGradient,
		filteredExpenses.length,
		expenses.length,
		categoryFilter,
	]);

	const handleMenuOpen = (expense: IndividualExpense) => {
		setActiveExpense((current) =>
			current?.id === expense.id ? null : expense,
		);
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
		<div className="rounded-2xl border border-neutral-200 bg-paper p-4 shadow-md sm:p-5">
			<div className="mb-5">
				<p className="eyebrow">{readOnly ? "Read only" : "Personal"}</p>

				<div className="mt-2 flex items-center gap-3">
					<span className="min-w-0 font-serif text-xl leading-tight sm:text-2xl sm:leading-[1]">
						{title}
					</span>

					<div className="relative ml-auto grid size-10 shrink-0 place-items-center rounded-full transition hover:bg-mui/10 sm:size-9">
						<div
							aria-hidden="true"
							className={`grid size-10 place-items-center rounded-full transition sm:size-9 ${
								categoryFilter === "all"
									? "text-neutral-500"
									: "bg-mui/70 text-white"
							}`}
						>
							<ListFilter size={17} />
						</div>

						<NativeSelect
							label="Category"
							aria-label="Filter category"
							value={categoryFilter}
							onChange={(event) =>
								setCategoryFilter(
									event.target.value as ExpenseCategory | "all",
								)
							}
							containerClassName="absolute inset-0 opacity-0"
							className="size-9 min-h-9 cursor-pointer"
						>
							<option value="all">All categories</option>

							{expenseCategories.map((category) => (
								<option key={category} value={category}>
									{category}
								</option>
							))}
						</NativeSelect>
					</div>
				</div>
			</div>

			<div className="relative overflow-hidden rounded-2xl">
				<div
					ref={scrollRef}
					onScroll={updateScrollGradient}
					className="grid max-h-[30rem] gap-3 overflow-y-auto rounded-2xl sm:gap-5"
				>
					{filteredExpenses.length ? (
						filteredExpenses.map((expense) => {
							const canEdit = !readOnly && expense.owner_id === currentUserId;
							const isDeleting = pending && deletingId === expense.id;

							return (
								<div
									key={expense.id}
									className="rounded-2xl border border-dashed border-neutral-400 p-4"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0 flex-1">
											<p className="font-semibold">{expense.title}</p>

											<p className="mt-1 text-sm text-neutral-500">
												{formatAppDateTime(
													expense.transaction_date,
													timeZone,
												)}
											</p>
										</div>

										<div className="flex shrink-0 items-center gap-2">
											<p className="font-semibold">
												{formatCurrency(expense.amount, expense.currency)}
											</p>

											{canEdit ? (
												<div
													className="relative -mr-2"
													ref={
														activeExpense?.id === expense.id
															? menuRef
															: null
													}
												>
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
															activeExpense?.id === expense.id
																? "true"
																: undefined
														}
														aria-haspopup="menu"
														onClick={() => handleMenuOpen(expense)}
														disabled={isDeleting}
														className="grid size-9 place-items-center rounded-full text-neutral-500 transition hover:bg-mui/10 active:scale-[0.8] disabled:cursor-not-allowed disabled:opacity-50 sm:size-8"
													>
														<EllipsisVertical size={18} />
													</button>

													{activeExpense?.id === expense.id ? (
														<>
															<button
																type="button"
																aria-label="Close expense actions"
																className="fixed inset-0 z-[60] bg-black/5 backdrop-blur-[1px] sm:hidden"
																onClick={handleMenuClose}
															/>

															<div
																id="expense-menu"
																role="menu"
																aria-labelledby={`expense-menu-button-${expense.id}`}
																className="native-action-sheet-in fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+7.6rem)] z-[70] overflow-hidden rounded-2xl border border-white/80 bg-paper p-2 shadow-[0_18px_60px_rgba(30,25,20,0.24)] backdrop-blur-xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-9 sm:w-44 sm:border-neutral-200 sm:p-1 sm:shadow-lg sm:backdrop-blur-none"
															>
																<button
																	type="button"
																	role="menuitem"
																	onClick={handleEditClick}
																	className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-bold text-neutral-800 transition hover:bg-mui/10 active:scale-[0.8] sm:px-3 sm:py-2 sm:text-sm sm:font-medium"
																>
																	<Edit2 size={15} />
																	Edit
																</button>

																<button
																	type="button"
																	role="menuitem"
																	onClick={handleDeleteClick}
																	className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-bold text-danger transition hover:bg-danger-bg active:scale-[0.8] sm:mt-0 sm:px-3 sm:py-2 sm:text-sm sm:font-medium"
																>
																	<Trash2 size={15} />
																	Delete
																</button>
															</div>
														</>
													) : null}
												</div>
											) : null}
										</div>
									</div>

									<div className="my-2 flex flex-wrap items-center gap-2">
										<span
											className="rounded-full px-2.5 py-1 text-xs font-bold text-neutral-900"
											style={{
												backgroundColor:
													expenseCategoryColors[expense.category],
											}}
										>
											{expense.category}
										</span>
									</div>

									{expense.notes ? (
										<div className="max-w-xs text-sm text-neutral-500">
											{expense.notes}
										</div>
									) : null}
								</div>
							);
						})
					) : (
						<p className="rounded-2xl border border-dashed border-neutral-400 py-10 text-center text-neutral-500">
							{expenses.length
								? "No transactions in this category."
								: "No transactions yet."}
						</p>
					)}
				</div>

				<div
					aria-hidden="true"
					className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-6 rounded-t-2xl bg-gradient-to-b from-paper to-transparent transition-opacity duration-200 ${
						scrollGradient.top ? "opacity-100" : "opacity-0"
					}`}
				/>

				<div
					aria-hidden="true"
					className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 rounded-b-2xl bg-gradient-to-t from-paper to-transparent transition-opacity duration-200 ${
						scrollGradient.bottom ? "opacity-100" : "opacity-0"
					}`}
				/>
			</div>

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

						if (result.ok) {
							setExpenseToDelete(null);
						}
					});
				}}
			/>
		</div>
	);
}