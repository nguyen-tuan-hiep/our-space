"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Edit2, ListFilter, StickyNote, Trash2 } from "lucide-react";
import { useToast } from "@/components/feedback/toast";
import { NativeDialog, NativeSelect } from "@/components/ui/native-controls";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/common/animated-number";
import { useDialogPresence } from "@/components/common/use-dialog-presence";
import { useDragSelect } from "@/components/common/use-drag-select";
import { deleteExpense } from "@/app/actions";
import { CardTitle } from "@/components/common/card-title";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import {
	convertCurrency,
	expenseCategories,
	expenseCategoryColors,
	formatCurrency,
} from "@/lib/constants";
import type { FilterRange } from "@/lib/dashboard-utils";
import type { CurrencyCode, ExpenseCategory, IndividualExpense } from "@/lib/types";
import { EmptyDoodle } from "@/components/common/doodles";

const ledgerViews = ["both", "you", "partner"] as const;
type LedgerView = (typeof ledgerViews)[number];

interface LedgerPerson {
	id: string;
	name: string;
	avatar: string;
}

interface ExpenseFeedProps {
	/** Everything in the shown period, both people; the ledger filters it by view. */
	expenses: IndividualExpense[];
	currentUserId: string;
	you: LedgerPerson;
	partner: LedgerPerson;
	/** Totals and shares are summed in this currency (the viewer's own). */
	referenceCurrency: CurrencyCode;
	exchangeRates: Record<string, number> | null;
	exchangeRatesBase: string | null;
	filterRange: FilterRange;
	timeZone: string;
	onEdit?: (expense: IndividualExpense) => void;
	onDeleted?: (expenseId: string) => void;
}

/** "🍔 Food & Drinks" -> { emoji: "🍔", name: "Food & Drinks" }; plain names get a generic icon. */
function splitCategory(category: ExpenseCategory) {
	const [first = "", ...rest] = category.split(" ");
	if (/\p{Extended_Pictographic}/u.test(first) && rest.length) {
		return { emoji: first, name: rest.join(" ") };
	}
	return { emoji: "🧾", name: category };
}

function dayKeyOf(value: string, timeZone: string) {
	return new Intl.DateTimeFormat("en-CA", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		timeZone,
	}).format(new Date(value));
}

function formatDayHeading(dayKey: string, todayKey: string, yesterdayKey: string) {
	if (dayKey === todayKey) return "Today";
	if (dayKey === yesterdayKey) return "Yesterday";
	return new Intl.DateTimeFormat("en-SG", {
		weekday: "short",
		day: "2-digit",
		month: "short",
		timeZone: "UTC",
	}).format(new Date(`${dayKey}T12:00:00.000Z`));
}

function formatShortTime(value: string, timeZone: string) {
	return new Intl.DateTimeFormat("en-SG", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZone,
	}).format(new Date(value));
}

function formatFullDateTime(value: string, timeZone: string) {
	return new Intl.DateTimeFormat("en-SG", {
		weekday: "long",
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		timeZone,
	}).format(new Date(value));
}

function ordinal(value: number) {
	const mod100 = value % 100;
	if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
	return `${value}${{ 1: "st", 2: "nd", 3: "rd" }[value % 10] ?? "th"}`;
}

export function ExpenseFeed({
	expenses,
	currentUserId,
	you,
	partner,
	referenceCurrency,
	exchangeRates,
	exchangeRatesBase,
	filterRange,
	timeZone,
	onEdit,
	onDeleted,
}: ExpenseFeedProps) {
	const toast = useToast();

	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [receipt, setReceipt] = useState<IndividualExpense | null>(null);
	const [expenseToDelete, setExpenseToDelete] =
		useState<IndividualExpense | null>(null);

	const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "all">(
		"all",
	);
	const [view, setView] = useState<LedgerView>("both");
	const changeView = (next: LedgerView) => {
		if (next !== view) setView(next);
	};
	const viewDrag = useDragSelect(ledgerViews.length, (index) => changeView(ledgerViews[index]));

	const [pending, startTransition] = useTransition();

	const [scrollGradient, setScrollGradient] = useState({
		top: false,
		bottom: false,
	});

	const scrollRef = useRef<HTMLDivElement | null>(null);

	const peopleById = useMemo(
		() => new Map([[you.id, you], [partner.id, partner]]),
		[you, partner],
	);

	const inView = useMemo(
		() =>
			expenses
				.filter((expense) =>
					view === "both"
						? true
						: expense.owner_id === (view === "you" ? you.id : partner.id),
				)
				.sort(
					(a, b) =>
						new Date(b.transaction_date).getTime() -
						new Date(a.transaction_date).getTime(),
				),
		[expenses, partner.id, view, you.id],
	);
	const filteredExpenses =
		categoryFilter === "all"
			? inView
			: inView.filter((expense) => expense.category === categoryFilter);

	const toReference = useCallback(
		(expense: IndividualExpense) =>
			convertCurrency(
				Number(expense.amount),
				expense.currency,
				referenceCurrency,
				exchangeRates,
				exchangeRatesBase ?? "USD",
			),
		[exchangeRates, exchangeRatesBase, referenceCurrency],
	);

	// Consecutive days with their subtotal, newest first.
	const days = useMemo(() => {
		const groups: Array<{ key: string; total: number; items: IndividualExpense[] }> = [];
		for (const expense of filteredExpenses) {
			const key = dayKeyOf(expense.transaction_date, timeZone);
			let group = groups[groups.length - 1];
			if (!group || group.key !== key) {
				group = { key, total: 0, items: [] };
				groups.push(group);
			}
			group.items.push(expense);
			group.total += toReference(expense) ?? 0;
		}
		return groups;
	}, [filteredExpenses, timeZone, toReference]);

	// Day headings say Today/Yesterday relative to when the ledger opened.
	const [openedAt] = useState(() => Date.now());
	const todayKey = dayKeyOf(new Date(openedAt).toISOString(), timeZone);
	const yesterdayKey = dayKeyOf(new Date(openedAt - 24 * 60 * 60 * 1000).toISOString(), timeZone);

	// What the receipt says about this expense relative to the whole period.
	const receiptContext = useMemo(() => {
		if (!receipt) return null;
		const periodTotal = expenses.reduce((sum, item) => sum + (toReference(item) ?? 0), 0);
		const own = toReference(receipt);
		const sameCategory = expenses
			.filter((item) => item.category === receipt.category)
			.sort(
				(a, b) =>
					new Date(a.transaction_date).getTime() -
					new Date(b.transaction_date).getTime(),
			);
		return {
			share: own !== null && periodTotal > 0 ? Math.round((own / periodTotal) * 100) : null,
			rank: sameCategory.findIndex((item) => item.id === receipt.id) + 1,
			sameCategoryCount: sameCategory.length,
		};
	}, [expenses, receipt, toReference]);

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
	}, [updateScrollGradient, filteredExpenses.length, categoryFilter, view]);

	const periodWord = filterRange === "week" ? "week" : "month";
	const viewLabels: Record<LedgerView, string> = {
		both: "Both",
		you: you.name,
		partner: partner.name,
	};
	const receiptOwnerName = receipt ? peopleById.get(receipt.owner_id)?.name : undefined;
	const receiptCanManage = Boolean(receipt && receipt.owner_id === currentUserId);

	return (
		<section className="content-fade-in grid min-w-0 gap-3">
			<CardTitle eyebrow="Ledger">
				{view === "both" ? "Together" : view === "you" ? `${you.name} ${you.avatar}` : `${partner.name} ${partner.avatar}`}
			</CardTitle>

			<div className="app-card min-w-0 p-4 sm:p-5">
				<div className="mb-4 flex items-center gap-2">
					<div className="glass-chip min-w-0 flex-1 rounded-full p-1 sm:max-w-sm">
						<div className="relative grid touch-pan-y grid-cols-3" {...viewDrag.trackProps}>
							<span
								aria-hidden="true"
								data-dragging={viewDrag.lensX === null ? undefined : ""}
								className="glass-selected tab-lens absolute inset-y-0 left-0 rounded-full border"
								style={{
									width: `calc(100% / ${ledgerViews.length})`,
									transform:
										viewDrag.lensX === null
											? `translateX(${ledgerViews.indexOf(view) * 100}%)`
											: `translateX(${viewDrag.lensX}px)`,
								}}
							/>
							{ledgerViews.map((item, index) => {
								const active = view === item;
								const highlighted = viewDrag.hoverIndex === null ? active : viewDrag.hoverIndex === index;

								return (
									<button
										key={item}
										type="button"
										aria-pressed={active}
										onClick={() => changeView(item)}
										className={[
											"relative z-10 min-w-0 select-none truncate rounded-full px-2 py-1.5 text-xs font-bold transition [-webkit-touch-callout:none]",
											highlighted ? "text-foreground" : "text-muted-foreground hover:text-foreground",
										].join(" ")}
									>
										{viewLabels[item]}
									</button>
								);
							})}
						</div>
					</div>

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

				<div className="relative overflow-hidden">
					<div
						ref={scrollRef}
						onScroll={updateScrollGradient}
						className="
							max-h-[34rem] overflow-y-auto rounded-2xl pr-2
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
						<div className="grid grid-cols-1 gap-4">
							{days.length ? (
								days.map((day) => (
									<section key={day.key} className="grid grid-cols-1 gap-2">
										<div className="flex items-baseline justify-between gap-3 px-1">
											<h3 className="text-xs font-extrabold uppercase tracking-[0.08em] text-subtle-foreground">
												{formatDayHeading(day.key, todayKey, yesterdayKey)}
											</h3>
											<p className="text-xs font-semibold tabular-nums text-muted-foreground">
												{formatCurrency(day.total, referenceCurrency)}
											</p>
										</div>

										{day.items.map((expense) => {
											const isDeleting = pending && deletingId === expense.id;
											const category = splitCategory(expense.category);
											const owner = peopleById.get(expense.owner_id);

											return (
												<div
													key={expense.id}
													role="button"
													tabIndex={0}
													aria-label={`View receipt for ${expense.title}`}
													aria-haspopup="dialog"
													aria-busy={isDeleting || undefined}
													onClick={() => setReceipt(expense)}
													onKeyDown={(event) => {
														if (event.target !== event.currentTarget) return;
														if (event.key === "Enter" || event.key === " ") {
															event.preventDefault();
															setReceipt(expense);
														}
													}}
													style={{ viewTransitionName: `expense-${expense.id}` }}
													className="flex cursor-pointer items-center gap-3 rounded-2xl border border-primary-border bg-primary-subtle px-3 py-2.5 transition hover:border-primary active:scale-[0.99]"
												>
													<span
														aria-hidden="true"
														className="grid size-10 shrink-0 place-items-center rounded-full text-lg"
														style={{ backgroundColor: expenseCategoryColors[expense.category] }}
													>
														{category.emoji}
													</span>

													<div className="min-w-0 flex-1">
														<p className="truncate font-semibold leading-5">{expense.title}</p>
														<p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
															<span className="tabular-nums">
																{formatShortTime(expense.transaction_date, timeZone)}
															</span>
															{expense.notes ? (
																<StickyNote size={12} aria-label="Has a note" />
															) : null}
														</p>
													</div>

													<div className="flex shrink-0 items-center gap-2">
														<p className="font-semibold tabular-nums">
															{formatCurrency(expense.amount, expense.currency)}
														</p>
														{view === "both" && owner ? (
															<span
																title={owner.name}
																className="grid size-6 place-items-center rounded-full bg-surface text-xs shadow-sm"
															>
																{owner.avatar}
															</span>
														) : null}
													</div>
												</div>
											);
										})}
									</section>
								))
							) : (
								<div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-primary-border bg-muted px-4 py-8 text-center text-muted-foreground">
									<EmptyDoodle kind="finance" />
									<p>
										{inView.length
											? "No transactions in this category. Choose another category to see more."
											: "No transactions yet. Log an expense or choose another period."}
									</p>
								</div>
							)}
						</div>
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
					ownerName={receiptOwnerName}
					timeZone={timeZone}
					periodWord={periodWord}
					share={receiptContext?.share ?? null}
					rank={receiptContext?.rank ?? 0}
					sameCategoryCount={receiptContext?.sameCategoryCount ?? 0}
					canManage={receiptCanManage}
					onClose={() => setReceipt(null)}
					onEdit={(expense) => {
						setReceipt(null);
						// Let the receipt slide away before the edit form opens.
						window.setTimeout(() => onEdit?.(expense), 260);
					}}
					onDelete={(expense) => {
						setReceipt(null);
						window.setTimeout(() => setExpenseToDelete(expense), 260);
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
		</section>
	);
}

/**
 * A transaction shown as a paper receipt: it feeds out of a printer slot line
 * by line, and the total counts up once its line has printed. The ledger row
 * already shows title, time and amount; the receipt adds the full date, the
 * note, where the expense sits in the period, and the edit/delete actions.
 */
function ExpenseReceiptDialog({
	expense: selected,
	ownerName,
	timeZone,
	periodWord,
	share,
	rank,
	sameCategoryCount,
	canManage,
	onClose,
	onEdit,
	onDelete,
}: {
	expense: IndividualExpense | null;
	ownerName?: string;
	timeZone: string;
	periodWord: string;
	share: number | null;
	rank: number;
	sameCategoryCount: number;
	canManage: boolean;
	onClose: () => void;
	onEdit: (expense: IndividualExpense) => void;
	onDelete: (expense: IndividualExpense) => void;
}) {
	const { content: expense, open } = useDialogPresence(selected);
	if (!expense) return null;

	const category = splitCategory(expense.category);
	const lines: Array<[string, string]> = [
		["Item", expense.title],
		["Category", `${category.emoji} ${category.name}`],
		["Paid by", expense.owner?.display_name ?? ownerName ?? "—"],
	];
	if (share !== null) lines.push([`Share of ${periodWord}`, share < 1 ? "<1%" : `${share}%`]);
	if (rank > 0) lines.push(["Same category", `${ordinal(rank)} of ${sameCategoryCount}`]);

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
						{formatFullDateTime(expense.transaction_date, timeZone)}
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
				</div>
				</div>
				{canManage ? (
					<div className="receipt-actions mt-6 grid grid-cols-2 gap-3">
						<Button
							type="button"
							variant="outline"
							className="h-11 rounded-2xl"
							onClick={() => onEdit(expense)}
						>
							<Edit2 size={16} />
							Edit
						</Button>
						<Button
							type="button"
							variant="outline"
							className="h-11 rounded-2xl text-red-600 hover:text-red-600 dark:text-red-400"
							onClick={() => onDelete(expense)}
						>
							<Trash2 size={16} />
							Delete
						</Button>
					</div>
				) : null}
			</div>
		</NativeDialog>
	);
}
