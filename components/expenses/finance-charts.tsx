"use client";

import { useEffect, useMemo, useState } from "react";
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
import { NativeSelect } from "@/components/ui/native-controls";
import {
	expenseCategoryColors,
	ledgerSeriesColors,
	formatCurrency,
	getSupportedCurrencyCodes,
} from "@/lib/constants";
import { formatAppDate } from "@/lib/date-format";
import {
	buildFinanceBreakdowns,
	buildFinanceChartData,
} from "@/lib/finance-chart-utils";
import type { FilterRange } from "@/lib/dashboard-utils";
import type {
	CurrencyCode,
	ExpenseCategory,
	IndividualExpense,
	Profile,
} from "@/lib/types";

function tooltipFormatter(
	value: number,
	_name: string,
	item: { payload?: { currency?: CurrencyCode } },
) {
	return item.payload?.currency
		? formatCurrency(value, item.payload.currency)
		: value.toLocaleString("en-US");
}

function axisTickFormatter(currency: CurrencyCode) {
	return (value: number | string) => formatCurrency(Number(value), currency);
}

function getAxisWidth(currency: CurrencyCode, values: number[]) {
	const maxValue = Math.max(0, ...values.map((value) => Math.abs(value)));
	const samples = [0, maxValue, maxValue * 1.1].map((value) =>
		formatCurrency(value, currency),
	);
	const longestLabel = Math.max(...samples.map((sample) => sample.length));

	return Math.min(140, Math.max(70, longestLabel * 8));
}

function useSmallDevice() {
	const [isSmallDevice, setIsSmallDevice] = useState(false);

	useEffect(() => {
		const query = window.matchMedia("(max-width: 640px)");
		const update = () => setIsSmallDevice(query.matches);
		update();
		query.addEventListener("change", update);
		return () => query.removeEventListener("change", update);
	}, []);

	return isSmallDevice;
}

type PieLabelProps = {
	cx?: number;
	cy?: number;
	midAngle?: number;
	innerRadius?: number;
	outerRadius?: number;
	percent?: number;
};

type CategoryBreakdown = {
	category: ExpenseCategory;
	value: number;
	currency: CurrencyCode;
};

const renderCustomizedLabel = ({
	cx,
	cy,
	midAngle,
	innerRadius,
	outerRadius,
	percent,
}: PieLabelProps) => {
	if (
		cx === undefined ||
		cy === undefined ||
		midAngle === undefined ||
		innerRadius === undefined ||
		outerRadius === undefined ||
		percent === undefined ||
		percent < 0.05
	) {
		return null;
	}

	const RADIAN = Math.PI / 180;
	const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
	const x = cx + radius * Math.cos(-midAngle * RADIAN);
	const y = cy + radius * Math.sin(-midAngle * RADIAN);

	return (
		<text
			x={x}
			y={y}
			fill="var(--theme-foreground)"
			textAnchor="middle"
			dominantBaseline="central"
			className="text-[10px] font-bold"
		>
			{`${(percent * 100).toFixed(0)}%`}
		</text>
	);
};

interface FinanceChartsProps {
	expenses: IndividualExpense[];
	barExpenses: IndividualExpense[];
	profiles: [Profile, Profile];
	exchangeRatesBase: string | null;
	exchangeRates: Record<string, number> | null;
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
	exchangeRatesBase,
	exchangeRates,
	exchangeRateUpdatedAt,
	exchangeRateSource,
	timeZone,
	filterRange,
	selectedPeriod,
}: FinanceChartsProps) {
	const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>(
		profiles[0]?.currency ?? "USD",
	);
	const isSmallDevice = useSmallDevice();
	const supportedCurrencies = useMemo(() => getSupportedCurrencyCodes(), []);
	const profileCurrencyOptions = useMemo(() => {
		return Array.from(
			profiles.reduce<Map<string, string[]>>((map, profile) => {
				const names = map.get(profile.currency) ?? [];
				names.push(profile.display_name);
				map.set(profile.currency, names);
				return map;
			}, new Map()),
		).map(([currency, names]) => ({
			currency,
			label: `${currency} - ${names.join(" & ")}`,
		}));
	}, [profiles]);
	const otherCurrencyOptions = useMemo(() => {
		const profileCurrencies = new Set(
			profileCurrencyOptions.map((option) => option.currency),
		);

		return Array.from(
			new Set([
				...expenses.map((expense) => expense.currency),
				...barExpenses.map((expense) => expense.currency),
				...supportedCurrencies,
			]),
		).filter((currency) => !profileCurrencies.has(currency));
	}, [barExpenses, expenses, profileCurrencyOptions, supportedCurrencies]);

	const needsExchangeRate = [...expenses, ...barExpenses].some(
		(expense) => expense.currency !== displayCurrency,
	);

	const rateLabel = exchangeRates
		? "Exchange rates available"
		: "Exchange rate unavailable";

	const chartData = useMemo(
		() =>
			buildFinanceChartData({
				expenses: barExpenses,
				profiles,
				range: filterRange,
				selectedPeriod,
				displayCurrency,
				exchangeRates,
				exchangeRatesBase,
				timeZone,
			}),
		[
			displayCurrency,
			exchangeRates,
			exchangeRatesBase,
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
				exchangeRates,
				exchangeRatesBase,
			}),
		[displayCurrency, exchangeRates, exchangeRatesBase, expenses, profiles],
	);

	const chartValueTotals = useMemo(
		() =>
			chartData.map((row) =>
				profiles.reduce((sum, profile) => {
					const value = row[profile.id];
					return sum + (typeof value === "number" ? value : 0);
				}, 0),
			),
		[chartData, profiles],
	);
	const yAxisWidth = useMemo(
		() => getAxisWidth(displayCurrency, chartValueTotals),
		[chartValueTotals, displayCurrency],
	);
	const areaChartMinWidth = useMemo(() => {
		const pointSpace = isSmallDevice ? 74 : Math.max(95, yAxisWidth + 25);

		return Math.max(360, chartData.length * pointSpace + yAxisWidth);
	}, [chartData.length, isSmallDevice, yAxisWidth]);

	return (
		<div className="app-card content-fade-in w-full min-w-0 p-4 sm:p-5">
			<div className="mb-5 flex min-w-0 flex-col items-stretch justify-between gap-4 sm:flex-row sm:flex-wrap sm:items-end">
				<div className="min-w-0">
					<p className="eyebrow">Finance overview</p>
					<h2 className="mt-1 font-serif text-2xl leading-tight sm:mt-2 sm:text-4xl">
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

				<div className="flex flex-wrap gap-3 sm:w-auto">
					<NativeSelect
						label="Currency"
						id="display-currency"
						name="display_currency"
						value={displayCurrency}
						onChange={(event) =>
							setDisplayCurrency(event.target.value as CurrencyCode)
						}
						className="min-h-11"
					>
						{profileCurrencyOptions.map((option) => (
							<option
								key={option.currency}
								value={option.currency}
							>
								{option.label}
							</option>
						))}
						{otherCurrencyOptions.map((currency) => (
							<option
								key={currency}
								value={currency}
							>
								{currency}
							</option>
						))}
					</NativeSelect>
				</div>
			</div>

			{needsExchangeRate && !exchangeRates ? (
				<div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
					Live exchange rate is not available yet, so mixed-currency charts
					cannot be converted. Refresh later or check the server network/API
					setting.
				</div>
			) : null}

			<div className="grid min-w-0 gap-4 sm:gap-6">
				<div className="app-card min-w-0 p-4">
					<div className="mb-4">
						<p className="eyebrow">
							{filterRange === "week" ? "Weekly ledgers" : "Monthly ledgers"}
						</p>
						<h3 className="mt-1 font-serif text-2xl leading-tight sm:mt-2 sm:text-3xl">
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
										stroke="var(--theme-border)"
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
										width={yAxisWidth}
										tickFormatter={axisTickFormatter(displayCurrency)}
									/>
									<Tooltip formatter={tooltipFormatter} />
									<Legend />
									{profiles.map((profile, index) => (
										<Area
											key={profile.id}
											dataKey={profile.id}
											name={`${profile.display_name} ${profile.avatar_url ?? "🙂"}`}
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

				<div className="grid min-w-0 gap-4 sm:gap-6 md:grid-cols-2">
					{perPerson.map((item) => (
						<div
							key={item.profile.id}
							className="app-card flex min-w-0 flex-col justify-between overflow-hidden p-4"
						>
							<div className="mb-2 flex items-center justify-between gap-3">
								<div className="min-w-0">
									<div className="flex items-center gap-1.5 whitespace-nowrap">
										<span className="text-sm font-semibold">
											{item.profile.display_name}{" "}
											{item.profile.avatar_url ?? "🙂"}
										</span>
									</div>
									<p className="text-sm text-neutral-500">
										Total: {formatCurrency(item.total, displayCurrency)}
									</p>
								</div>

								<span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
									{displayCurrency}
								</span>
							</div>

							{/* 💡 Chia đôi layout: Biểu đồ 1 bên, Legend chi tiết 1 bên */}
							<div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full min-w-0">
								<div className="h-44 w-44 shrink-0 sm:h-48 sm:w-48">
									<ResponsiveContainer
										width="100%"
										height="100%"
									>
										<PieChart>
											<Pie
												data={item.categories}
												dataKey="value"
												nameKey="category"
												innerRadius={40}
												outerRadius={75}
												paddingAngle={2}
												labelLine={false}
												label={renderCustomizedLabel} // 💡 Gắn phần trăm vào tâm lát cắt
											>
												{item.categories.map((entry) => (
													<Cell
														key={entry.category}
														fill={
															expenseCategoryColors[
																entry.category as keyof typeof expenseCategoryColors
															] ?? "var(--theme-muted-foreground)"
														}
													/>
												))}
											</Pie>
											<Tooltip formatter={tooltipFormatter} />
										</PieChart>
									</ResponsiveContainer>
								</div>

								<div className="flex-1 w-full space-y-1.5 overflow-y-auto max-h-48 text-xs">
									{item.categories.length === 0 ? (
										<p className="text-neutral-400 dark:text-white0 text-center py-4">
											No data available
										</p>
									) : (
										(item.categories as CategoryBreakdown[]).map((cat) => (
											<div
												key={cat.category}
												className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-1 dark:border-neutral-700"
											>
												<div className="flex items-center gap-2 min-w-0">
													<span
														className="w-2.5 h-2.5 rounded-full shrink-0"
														style={{
															backgroundColor:
																expenseCategoryColors[
																	cat.category as keyof typeof expenseCategoryColors
																] ?? "var(--theme-muted-foreground)",
														}}
													/>
													<span className="truncate font-medium text-neutral-700 dark:text-neutral-800 capitalize">
														{cat.category}
													</span>
												</div>
												<span className="font-semibold text-neutral-900 dark:text-white shrink-0">
													{formatCurrency(cat.value, displayCurrency)}
												</span>
											</div>
										))
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
