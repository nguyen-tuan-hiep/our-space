"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ListFilter } from "lucide-react";
import { ActionMenu } from "@/components/common/action-menu";
import { useToast } from "@/components/feedback/toast";
import { NativeSelect } from "@/components/ui/native-controls";
import { deleteExpense } from "@/app/actions";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
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

	const [scrollGradient, setScrollGradient] = useState({
		top: false,
		bottom: false,
	});

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

	return (
		<div className="app-card content-fade-in p-4 sm:p-5">
			<div className="mb-5">
				<p className="eyebrow">{readOnly ? "Read only" : "Personal"}</p>

				<div className="mt-2 flex items-center gap-3">
					<span className="min-w-0 font-serif text-xl leading-tight sm:text-2xl sm:leading-[1]">
						{title}
					</span>

					<div className="relative ml-auto grid size-10 shrink-0 place-items-center rounded-full transition hover:bg-mui/10">
						<div
							aria-hidden="true"
							className={`grid size-10 place-items-center rounded-full transition ${
								categoryFilter === "all"
									? "text-neutral-500"
									: "bg-black/10 text-black dark:bg-white/10 dark:text-white"
							}`}
						>
							<ListFilter size={17} />
						</div>

						<NativeSelect
							label="Category"
							aria-label="Filter category"
							value={categoryFilter}
							onChange={(event) =>
								setCategoryFilter(event.target.value as ExpenseCategory | "all")
							}
							containerClassName="absolute inset-0 opacity-0"
							className="size-9 min-h-9 cursor-pointer"
						>
							<option value="all">All categories</option>

							{expenseCategories.map((category) => (
								<option
									key={category}
									value={category}
								>
									{category}
								</option>
							))}
						</NativeSelect>
					</div>
				</div>
			</div>

			<div className="relative overflow-hidden">
				<div
					ref={scrollRef}
					onScroll={updateScrollGradient}
					className="grid max-h-[30rem] gap-3 overflow-y-auto rounded-2xl sm:gap-5

					overflow-y-auto pr-2 leading-6 text-neutral-600
												whitespace-pre-wrap break-words
												[&::-webkit-scrollbar]:w-1.5
												[&::-webkit-scrollbar-track]:bg-transparent
												[&::-webkit-scrollbar-thumb]:rounded-full
												[&::-webkit-scrollbar-thumb]:bg-neutral-200
												hover:[&::-webkit-scrollbar-thumb]:bg-neutral-300
												dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700"
				>
					{filteredExpenses.length ? (
						filteredExpenses.map((expense) => {
							const canEdit = !readOnly && expense.owner_id === currentUserId;
							const isDeleting = pending && deletingId === expense.id;

							return (
								<div
									key={expense.id}
									className="rounded-2xl border border-neutral-300 bg-bg/70 p-4 shadow-[0_10px_28px_rgba(30,25,20,0.05)] transition hover:border-neutral-400 hover:bg-paper"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0 flex-1">
											<p className="font-semibold">{expense.title}</p>

											<p className="mt-1 text-sm text-neutral-500">
												{formatAppDateTime(expense.transaction_date, timeZone)}
											</p>
										</div>

										<div className="flex shrink-0 items-center gap-2">
											<p className="font-semibold">
												{formatCurrency(expense.amount, expense.currency)}
											</p>

											{canEdit ? (
												<div className="relative">
													<ActionMenu
														label={`Open actions for ${expense.title}`}
														disabled={isDeleting}
														sheetTitle="Transaction actions"
														sheetDescription={expense.title}
														deleteLabel="Delete"
														onEdit={() => onEdit?.(expense)}
														onDelete={() => setExpenseToDelete(expense)}
													/>
												</div>
											) : null}
										</div>
									</div>

									<div className="my-2 flex flex-wrap items-center gap-2">
										<span
											className="rounded-full px-2.5 py-1 text-xs font-bold text-black"
											style={{
												backgroundColor:
													expenseCategoryColors[expense.category],
											}}
										>
											{expense.category}
										</span>
									</div>

									{expense.notes ? (
										<div className="relative mt-2 border-l-[3px] border-neutral-200 pl-3 dark:border-neutral-800 max-w-xs text-sm text-neutral-500">
											{expense.notes}
										</div>
									) : null}
								</div>
							);
						})
					) : (
						<p className="rounded-2xl border border-dashed border-neutral-300 bg-white/35 py-10 text-center text-neutral-500">
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
