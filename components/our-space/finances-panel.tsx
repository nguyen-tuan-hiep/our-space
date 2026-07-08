import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { ExpenseFeed } from "@/components/expenses/expense-feed";
import { FinanceCharts } from "@/components/expenses/finance-charts";
import type { FilterRange } from "@/lib/dashboard-utils";
import type { IndividualExpense, Profile } from "@/lib/types";
import { outlineButtonClass, primaryButtonClass } from "./shared-classes";

interface FinancesPanelProps {
	activePeriod: string;
	barExpenses: IndividualExpense[];
	coupleProfiles: [Profile, Profile];
	currentUserId: string;
	exchangeRateSource: string | null;
	exchangeRateUpdatedAt: string | null;
	exchangeRates: Record<string, number> | null;
	exchangeRatesBase: string | null;
	filterRange: FilterRange;
	financeError: string | null;
	financeLoaded: boolean;
	financeLoading: boolean;
	filteredExpenses: IndividualExpense[];
	myExpenses: IndividualExpense[];
	partnerDisplayName: string;
	partnerExpenses: IndividualExpense[];
	profileAvatar: string;
	partnerAvatar: string;
	timeZone: string;
	onEditExpense: (expense: IndividualExpense) => void;
	onLoadFinanceData: () => void;
	onLogExpense: () => void;
	periodControl?: ReactNode;
}

export function FinancesPanel({
	activePeriod,
	barExpenses,
	coupleProfiles,
	currentUserId,
	exchangeRateSource,
	exchangeRateUpdatedAt,
	exchangeRates,
	exchangeRatesBase,
	filterRange,
	financeError,
	financeLoaded,
	financeLoading,
	filteredExpenses,
	myExpenses,
	partnerDisplayName,
	partnerExpenses,
	profileAvatar,
	partnerAvatar,
	timeZone,
	onEditExpense,
	onLoadFinanceData,
	onLogExpense,
	periodControl,
}: FinancesPanelProps) {
	return (
		<div className="grid gap-4 sm:gap-5">
			<div className="flex items-center justify-between gap-4 sm:items-end">
				<div className="min-w-0">
					<h2 className="font-serif text-3xl leading-tight sm:mt-2 sm:text-5xl">
						Finance overview
					</h2>
				</div>
				<div className="sm:hidden">{periodControl}</div>
				<button
					type="button"
					className={`${primaryButtonClass} hidden sm:inline-flex sm:w-auto`}
					disabled={financeLoading && !financeLoaded}
					onClick={onLogExpense}
				>
					<Plus size={17} />
					Log expense
				</button>
			</div>
			{financeLoading && !financeLoaded ? (
				<div className="rounded-2xl border border-neutral-200 bg-paper p-6 text-neutral-500 shadow-md rounded-2xl">
					Loading finance data...
					<div className="mx-auto mt-4 h-1.5 w-44 items-center overflow-hidden rounded-full">
						<div className="pwa-loading-bar h-full w-1/2 rounded-full bg-neutral-900" />
					</div>
				</div>
			) : financeError ? (
				<div className="grid gap-4 border border-neutral-200 bg-paper p-6 text-neutral-600 shadow-2xl rounded-2xl">
					<p>{financeError}</p>
					<button
						type="button"
						className={`${outlineButtonClass} w-full sm:w-fit`}
						onClick={onLoadFinanceData}
					>
						Try again
					</button>
				</div>
			) : (
				<>
					<FinanceCharts
						expenses={filteredExpenses}
						barExpenses={barExpenses}
						profiles={coupleProfiles}
						exchangeRatesBase={exchangeRatesBase}
						exchangeRates={exchangeRates}
						exchangeRateUpdatedAt={exchangeRateUpdatedAt}
						exchangeRateSource={exchangeRateSource}
						timeZone={timeZone}
						filterRange={filterRange}
						selectedPeriod={activePeriod}
					/>
					<div className="grid gap-4 sm:gap-6 md:grid-cols-2">
						<ExpenseFeed
							title={`My ledger ${profileAvatar}`}
							expenses={myExpenses}
							currentUserId={currentUserId}
							readOnly={false}
							timeZone={timeZone}
							onEdit={onEditExpense}
						/>
						<ExpenseFeed
							title={`${partnerDisplayName}'s ledger ${partnerAvatar}`}
							expenses={partnerExpenses}
							currentUserId={currentUserId}
							readOnly
							timeZone={timeZone}
						/>
					</div>
				</>
			)}
		</div>
	);
}
