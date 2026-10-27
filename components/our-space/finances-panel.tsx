import { PanelHeader } from "@/components/common/panel-header";
import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { ExpenseFeed } from "@/components/expenses/expense-feed";
import { FinanceCharts } from "@/components/expenses/finance-charts";
import { Button } from "@/components/ui/button";
import { FinancePanelSkeleton } from "@/components/our-space/tab-skeletons";
import type { FilterRange } from "@/lib/dashboard-utils";
import type { IndividualExpense, Profile } from "@/lib/types";

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
	onExpenseDeleted: (expenseId: string) => void;
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
	onExpenseDeleted,
	onLoadFinanceData,
	onLogExpense,
	periodControl,
}: FinancesPanelProps) {
	if (financeLoading && !financeLoaded) {
		return <FinancePanelSkeleton />;
	}

	return (
		<div className="grid gap-4 sm:gap-5">
			<PanelHeader title="Finance overview" description="Manage your shared expenses side by side.">
				<div className="sm:hidden">{periodControl}</div>
				<Button
					type="button"
					size="lg"
					className="primary-action hidden h-11 rounded-2xl px-5 font-bold sm:inline-flex sm:w-auto"
					disabled={financeLoading && !financeLoaded}
					onClick={onLogExpense}
				>
					<Plus size={17} />
					Log expense
				</Button>
			</PanelHeader>
			{financeError ? (
				<div role="alert" className="soft-panel grid gap-4 p-6 text-muted-foreground">
					<p>{financeError}</p>
					<Button
						type="button"
						variant="outline"
						size="lg"
						className="h-11 rounded-2xl px-5 font-bold sm:w-fit"
						onClick={onLoadFinanceData}
					>
						Try again
					</Button>
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
					<div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
						<ExpenseFeed
							title={`My ledger ${profileAvatar}`}
							ownerName={coupleProfiles.find((item) => item.id === currentUserId)?.display_name}
							expenses={myExpenses}
							currentUserId={currentUserId}
							readOnly={false}
							timeZone={timeZone}
							onEdit={onEditExpense}
							onDeleted={onExpenseDeleted}
						/>
						<ExpenseFeed
							title={`${partnerDisplayName}'s ledger ${partnerAvatar}`}
							ownerName={partnerDisplayName}
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
