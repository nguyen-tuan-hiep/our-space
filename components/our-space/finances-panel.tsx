import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import type { FilterRange } from "@/lib/dashboard-utils";
import type { IndividualExpense, Profile } from "@/lib/types";
import { outlineButtonClass, primaryButtonClass } from "./shared-classes";

const FinanceCharts = dynamic(
	() =>
		import("@/components/expenses/finance-charts").then(
			(mod) => mod.FinanceCharts,
		),
	{ ssr: false },
);

const ExpenseFeed = dynamic(
	() =>
		import("@/components/expenses/expense-feed").then((mod) => mod.ExpenseFeed),
	{ ssr: false },
);

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
}: FinancesPanelProps) {
	return (
		<div className="grid gap-5">
			<div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h2 className="mt-2 font-serif text-4xl sm:text-5xl">
						Finance overview
					</h2>
				</div>
				<button
					type="button"
					className={`${primaryButtonClass} w-full sm:w-auto`}
					disabled={financeLoading && !financeLoaded}
					onClick={onLogExpense}
				>
					<Plus size={17} />
					Log expense
				</button>
			</div>
			{financeLoading && !financeLoaded ? (
				<div className="rounded-lg border border-neutral-200 bg-paper p-6 text-neutral-500">
					Loading finance data...
					<div className="mx-auto mt-4 h-1.5 w-44 items-center overflow-hidden rounded-full">
						<div className="pwa-loading-bar h-full w-1/2 rounded-full bg-neutral-900" />
					</div>
				</div>
			) : financeError ? (
				<div className="grid gap-4 border border-neutral-200 bg-paper p-6 text-neutral-600">
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
					<div className="grid gap-6 md:grid-cols-2">
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
