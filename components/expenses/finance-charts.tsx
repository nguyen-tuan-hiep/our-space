"use client";

import { useMemo, useState } from "react";
import Card from "@mui/material/Card";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	expenseCategoryColors,
	ledgerSeriesColors,
	formatCurrency,
	supportedCurrencies,
} from "@/lib/constants";
import { themeColors } from "@/lib/theme-colors";
import { formatAppDate } from "@/lib/date-format";
import { AvatarIcon } from "@/components/avatar-icon";
import {
	buildFinanceBreakdowns,
	buildFinanceChartData,
} from "@/lib/finance-chart-utils";
import type { FilterRange } from "@/lib/dashboard-utils";
import type { CurrencyCode, IndividualExpense, Profile } from "@/lib/types";

function tooltipFormatter(
	value: number,
	_name: string,
	item: { payload?: { currency?: CurrencyCode } },
) {
	return formatCurrency(value, item.payload?.currency ?? "SGD");
}

function axisTickFormatter(currency: CurrencyCode) {
	return (value: number | string) => formatCurrency(Number(value), currency);
}

interface FinanceChartsProps {
	expenses: IndividualExpense[];
	barExpenses: IndividualExpense[];
	profiles: [Profile, Profile];
	exchangeRateSgdToVnd: number | null;
	exchangeRateUpdatedAt: string | null;
	exchangeRateSource: string | null;
	timeZone: string;
	filterRange: FilterRange;
	selectedPeriod: string;
}

export function FinanceCharts({
	expenses,
	barExpenses,
	profiles,
	exchangeRateSgdToVnd,
	exchangeRateUpdatedAt,
	exchangeRateSource,
	timeZone,
	filterRange,
	selectedPeriod,
}: FinanceChartsProps) {
	const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>("SGD");
	const isSmallDevice = useMediaQuery("(max-width: 640px)");

	const needsExchangeRate = [...expenses, ...barExpenses].some(
		(expense) => expense.currency !== displayCurrency,
	);

	const rateLabel = exchangeRateSgdToVnd
		? `1 SGD = ${formatCurrency(exchangeRateSgdToVnd, "VND")}`
		: "Exchange rate unavailable";

	const chartData = useMemo(
		() =>
			buildFinanceChartData({
				expenses: barExpenses,
				profiles,
				range: filterRange,
				selectedPeriod,
				displayCurrency,
				exchangeRateSgdToVnd,
				timeZone,
			}),
		[
			displayCurrency,
			exchangeRateSgdToVnd,
			barExpenses,
			filterRange,
			profiles,
			selectedPeriod,
			timeZone,
		],
	);

	const perPerson = useMemo(
		() =>
			buildFinanceBreakdowns({
				expenses,
				profiles,
				displayCurrency,
				exchangeRateSgdToVnd,
			}),
		[displayCurrency, exchangeRateSgdToVnd, expenses, profiles],
	);

	const areaChartMinWidth = useMemo(() => {
		const yAxisSpace = displayCurrency === "VND" ? 120 : 90;
		const pointSpace = isSmallDevice
			? 74
			: displayCurrency === "VND"
				? 110
				: 95;

		return Math.max(360, chartData.length * pointSpace + yAxisSpace);
	}, [chartData.length, displayCurrency, isSmallDevice]);

	return (
		<Card className="w-full min-w-0 border border-neutral-200 bg-paper p-5 !shadow-lg">
			<div className="mb-5 flex min-w-0 flex-wrap items-end justify-between gap-4">
				<div className="min-w-0">
					<p className="eyebrow">Finance overview</p>
					<h2 className="mt-2 font-serif text-4xl">
						{filterRange === "week" ? "Weekly ledgers" : "Monthly ledgers"}
					</h2>
					<p className="mt-2 text-sm text-neutral-500">
						{rateLabel}
						{exchangeRateUpdatedAt
							? ` - updated ${formatAppDate(exchangeRateUpdatedAt, timeZone)}`
							: ""}
						{exchangeRateSource ? ` - ${exchangeRateSource}` : ""}
					</p>
				</div>

				<div className="flex flex-wrap gap-3">
					<FormControl
						size="small"
						className="w-44"
					>
						<InputLabel id="display-currency-label">
							Display currency
						</InputLabel>

						<Select
							labelId="display-currency-label"
							id="display-currency"
							name="display_currency"
							value={displayCurrency}
							label="Display currency"
							onChange={(event) =>
								setDisplayCurrency(event.target.value as CurrencyCode)
							}
						>
							{supportedCurrencies.map((currency) => (
								<MenuItem
									key={currency}
									value={currency}
								>
									{currency}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</div>
			</div>

			{needsExchangeRate && !exchangeRateSgdToVnd ? (
				<div className="mb-5 border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
					Live exchange rate is not available yet, so mixed-currency charts
					cannot be converted. Refresh later or check the server network/API
					setting.
				</div>
			) : null}

			<div className="grid min-w-0 gap-6">
				<div className="min-w-0 border border-neutral-400 p-4 rounded-lg border-dashed">
					<div className="mb-4">
						<p className="eyebrow">
							{filterRange === "week" ? "Weekly ledgers" : "Monthly ledgers"}
						</p>
						<h3 className="mt-2 font-serif text-3xl">
							Both ledgers in {displayCurrency}
						</h3>
					</div>

					<div className="w-full max-w-full overflow-x-auto overflow-y-hidden pb-2">
						<div
							className="h-72"
							style={{
								width: `max(100%, ${areaChartMinWidth}px)`,
							}}
						>
							<ResponsiveContainer
								width="100%"
								height="100%"
							>
								<AreaChart data={chartData}>
									<CartesianGrid
										stroke={themeColors.chartGrid}
										strokeDasharray="4 4"
									/>
									<XAxis
										dataKey="label"
										tickLine={false}
										axisLine={false}
										fontSize={11}
									/>
									<YAxis
										tickLine={false}
										axisLine={false}
										fontSize={11}
										width={displayCurrency === "VND" ? 95 : 70}
										tickFormatter={axisTickFormatter(displayCurrency)}
									/>
									<Tooltip formatter={tooltipFormatter} />
									<Legend />
									{profiles.map((profile, index) => (
										<Area
											key={profile.id}
											dataKey={profile.id}
											name={profile.display_name}
											type="monotone"
											stroke={
												ledgerSeriesColors[index % ledgerSeriesColors.length]
											}
											fill={
												ledgerSeriesColors[index % ledgerSeriesColors.length]
											}
											fillOpacity={0.18}
											strokeWidth={2}
										/>
									))}
								</AreaChart>
							</ResponsiveContainer>
						</div>
					</div>
				</div>

				<div className="grid min-w-0 gap-6 xl:grid-cols-2">
					{perPerson.map((item) => (
						<div
							key={item.profile.id}
							className="min-w-0 overflow-hidden border border-neutral-400 p-4 rounded-lg border-dashed"
						>
							<div className="mb-4 flex items-center justify-between gap-3">
								<div className="min-w-0">
									<div className="flex items-center gap-1.5 whitespace-nowrap">
										<span className="text-sm font-semibold">
											{item.profile.display_name}
										</span>
										<AvatarIcon
											value={item.profile.avatar_url}
											label={item.profile.display_name}
											className="grid size-4 shrink-0 place-items-center rounded-full text-[10px] leading-none"
										/>
									</div>
									<p className="text-sm text-neutral-500">
										{formatCurrency(item.total, displayCurrency)}
									</p>
								</div>

								<span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
									{displayCurrency}
								</span>
							</div>

							<div className="h-56 w-full min-w-0">
								<ResponsiveContainer
									width="100%"
									height="100%"
								>
									<PieChart>
										<Pie
											data={item.categories}
											dataKey="value"
											nameKey="category"
											innerRadius={48}
											outerRadius={82}
											paddingAngle={2}
										>
											{item.categories.map((entry) => (
												<Cell
													key={entry.category}
													fill={expenseCategoryColors[entry.category]}
												/>
											))}
										</Pie>
										<Tooltip formatter={tooltipFormatter} />
									</PieChart>
								</ResponsiveContainer>
							</div>
						</div>
					))}
				</div>
			</div>
		</Card>
	);
}
