"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Edit2, ListFilter } from "lucide-react";
import { ActionMenu } from "@/components/common/action-menu";
import { useToast } from "@/components/feedback/toast";
import { NativeDialog, NativeSelect } from "@/components/ui/native-controls";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/common/animated-number";
import { useDialogPresence } from "@/components/common/use-dialog-presence";
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
	onDeleted?: (expenseId: string) => void;
	/** Whose ledger this is; shown as "Paid by" on receipts (expenses may lack `owner`). */
	ownerName?: string;
}

export function ExpenseFeed({
	title,
	expenses,
	currentUserId,
	readOnly,
	timeZone,
	onEdit,
	onDeleted,
	ownerName,
}: ExpenseFeedProps) {
	const toast = useToast();

	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [receipt, setReceipt] = useState<IndividualExpense | null>(null);
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

					<div className="relative ml-auto grid size-10 shrink-0 place-items-center rounded-full transition hover:bg-surface-hover">
						<div
							aria-hidden="true"
							className={`grid size-10 place-items-center rounded-full transition ${
								categoryFilter === "all"
									? "text-muted-foreground"
									: "bg-primary-subtle text-primary-ink"
							}`}
						>
							<ListFilter size={17} />
						</div>

						<NativeSelect
							hideLabel
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
					className="
						grid max-h-[30rem] gap-3 overflow-y-auto rounded-2xl pr-2
						whitespace-pre-wrap break-words leading-6 text-neutral-600
						sm:gap-5
						[scrollbar-color:rgb(var(--theme-primary-rgb)/0.65)_transparent]
						[scrollbar-width:thin]
						[&::-webkit-scrollbar]:w-2
						[&::-webkit-scrollbar-track]:bg-transparent
						[&::-webkit-scrollbar-thumb]:rounded-full
						[&::-webkit-scrollbar-thumb]:border-2
						[&::-webkit-scrollbar-thumb]:border-transparent
						[&::-webkit-scrollbar-thumb]:bg-primary/60
						[&::-webkit-scrollbar-thumb]:bg-clip-padding
						hover:[&::-webkit-scrollbar-thumb]:bg-primary/85
						dark:[&::-webkit-scrollbar-thumb]:bg-primary/70
						dark:hover:[&::-webkit-scrollbar-thumb]:bg-primary
					"
				>
					{filteredExpenses.length ? (
						filteredExpenses.map((expense) => {
							const canEdit = !readOnly && expense.owner_id === currentUserId;
							const isDeleting = pending && deletingId === expense.id;

							return (
								<div
									key={expense.id}
									role="button"
									tabIndex={0}
									aria-label={`View receipt for ${expense.title}`}
									aria-haspopup="dialog"
									// The whole row opens its receipt; the action menu inside keeps its own clicks.
									onClick={(event) => {
										if ((event.target as HTMLElement).closest("button, a, [role='menu']") !== null) return;
										setReceipt(expense);
									}}
									onKeyDown={(event) => {
										if (event.target !== event.currentTarget) return;
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											setReceipt(expense);
										}
									}}
									style={{ viewTransitionName: `expense-${expense.id}` }}
									className="cursor-pointer rounded-2xl border border-primary-border bg-primary-subtle p-4 shadow-[0_10px_28px_rgba(30,25,20,0.05)] transition hover:border-primary active:scale-[0.99]"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0 flex-1">
											<p className="font-semibold">{expense.title}</p>

											<p className="mt-1 text-sm text-muted-foreground">
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
											className="rounded-full px-2.5 py-1 text-xs font-bold text-[#1d1d1f]"
											style={{
												backgroundColor:
													expenseCategoryColors[expense.category],
											}}
										>
											{expense.category}
										</span>
									</div>

									{expense.notes ? (
										<div className="relative mt-2 max-w-xs border-l-[3px] border-border pl-3 text-sm text-muted-foreground">
											{expense.notes}
										</div>
									) : null}
								</div>
							);
						})
					) : (
						<p className="rounded-2xl border border-dashed border-primary-border bg-muted py-10 text-center text-muted-foreground">
							{expenses.length
								? "No transactions in this category. Choose another category to see more."
								: "No transactions yet. Log an expense or choose another period."}
						</p>
					)}
				</div>

				<div
					aria-hidden="true"
					className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-px border-t border-border transition-opacity duration-200 ${
						scrollGradient.top ? "opacity-100" : "opacity-0"
					}`}
				/>

				<div
					aria-hidden="true"
					className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px border-b border-border transition-opacity duration-200 ${
						scrollGradient.bottom ? "opacity-100" : "opacity-0"
					}`}
				/>
			</div>

			<ExpenseReceiptDialog
				expense={receipt}
				ownerName={ownerName}
				timeZone={timeZone}
				canEdit={Boolean(receipt && !readOnly && receipt.owner_id === currentUserId)}
				onClose={() => setReceipt(null)}
				onEdit={(expense) => {
					setReceipt(null);
					// Let the receipt slide away before the edit form opens.
					window.setTimeout(() => onEdit?.(expense), 260);
				}}
			/>

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
							onDeleted?.(expenseToDelete.id);
						}
					});
				}}
			/>
		</div>
	);
}

/**
 * A transaction shown as a paper receipt: it feeds out of a printer slot line
 * by line, and the total counts up once its line has printed.
 */
function ExpenseReceiptDialog({ expense: selected, ownerName, timeZone, canEdit, onClose, onEdit }: {
	expense: IndividualExpense | null;
	ownerName?: string;
	timeZone: string;
	canEdit: boolean;
	onClose: () => void;
	onEdit: (expense: IndividualExpense) => void;
}) {
	const { content: expense, open } = useDialogPresence(selected);
	if (!expense) return null;

	const lines: Array<[string, string]> = [
		["Item", expense.title],
		["Category", expense.category],
		["Paid by", expense.owner?.display_name ?? ownerName ?? "—"],
		["Currency", expense.currency],
	];

	return (
		<NativeDialog
			open={open}
			onClose={onClose}
			title={`Receipt for ${expense.title}`}
			maxWidth="xs"
			showTitle={false}
			closeLabel="Close receipt"
			contentClassName="!p-0"
		>
			<div key={expense.id} className="px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-7 sm:px-8 sm:pb-8">
				<div aria-hidden="true" className="receipt-slot" />
				{/* The shadow lives on a wrapper: the receipt's zig-zag mask would clip it. */}
				<div className="receipt-shadow">
				<div className="receipt">
					<p className="receipt-line receipt-head" style={{ "--line": 0 } as React.CSSProperties}>Our Space ♥</p>
					<p className="receipt-line receipt-sub" style={{ "--line": 1 } as React.CSSProperties}>
						{formatAppDateTime(expense.transaction_date, timeZone)}
					</p>
					<hr className="receipt-rule receipt-line" style={{ "--line": 2 } as React.CSSProperties} />
					{lines.map(([label, value], index) => (
						<p key={label} className="receipt-line receipt-row" style={{ "--line": index + 3 } as React.CSSProperties}>
							<span>{label}</span>
							<span className="receipt-value">{value}</span>
						</p>
					))}
					{expense.notes ? (
						<p className="receipt-line receipt-note" style={{ "--line": lines.length + 3 } as React.CSSProperties}>
							“{expense.notes}”
						</p>
					) : null}
					<hr className="receipt-rule receipt-line" style={{ "--line": lines.length + 4 } as React.CSSProperties} />
					<p className="receipt-line receipt-total" style={{ "--line": lines.length + 5 } as React.CSSProperties}>
						<span>Total</span>
						<AnimatedNumber
							fromZero
							delay={1100}
							value={expense.amount}
							format={(value) => formatCurrency(value, expense.currency)}
						/>
					</p>
					<p className="receipt-line receipt-thanks" style={{ "--line": lines.length + 6 } as React.CSSProperties}>
						Thank you, love
					</p>
				</div>
				</div>
				{canEdit ? (
					<Button
						type="button"
						variant="outline"
						className="receipt-actions mt-6 h-11 w-full rounded-2xl"
						onClick={() => onEdit(expense)}
					>
						<Edit2 size={16} />
						Edit transaction
					</Button>
				) : null}
			</div>
		</NativeDialog>
	);
}

