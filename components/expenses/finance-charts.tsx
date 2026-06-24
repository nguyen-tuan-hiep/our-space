"use client";

import { useMemo, useState } from "react";
import Card from "@mui/material/Card";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import {
	Bar,
	BarChart,
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
import { formatCurrency, supportedCurrencies } from "@/lib/constants";
import { formatAppDate } from "@/lib/date-format";
import { NameWithAvatar } from "@/components/name-with-avatar";
import {
	buildFinanceBreakdowns,
	buildFinanceChartData,
} from "@/lib/finance-chart-utils";
import type { FilterRange } from "@/lib/dashboard-utils";
import type { CurrencyCode, IndividualExpense, Profile } from "@/lib/types";

const colors = [
	"#b76e79",
	"#3f6f78",
	"#71816d",
	"#11110f",
	"#c6a15b",
	"#876445",
	"#727272",
];

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

	return (
		<Card className="border border-neutral-200 bg-white p-5">
			<div className="mb-5 flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="eyebrow">Finance overview</p>
					<h2 className="mt-2 font-serif text-4xl">Shared currency view</h2>
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

			<div className="grid gap-6">
				<div className="border border-neutral-200 p-4">
					<div className="mb-4">
						<p className="eyebrow">
							{filterRange === "week" ? "Weekly bars" : "Monthly bars"}
						</p>
						<h3 className="mt-2 font-serif text-3xl">
							Both ledgers in {displayCurrency}
						</h3>
					</div>
					<div className="h-72">
						<ResponsiveContainer
							width="100%"
							height="100%"
						>
							<BarChart data={chartData}>
								<CartesianGrid
									stroke="#e8e3d8"
									vertical={false}
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
									<Bar
										key={profile.id}
										dataKey={profile.id}
										name={profile.display_name}
										radius={[4, 4, 0, 0]}
										fill={colors[index % colors.length]}
									/>
								))}
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>

				<div className="grid gap-6 xl:grid-cols-2">
						{perPerson.map((item, index) => (
							<div
								key={item.profile.id}
								className="border border-neutral-200 p-4"
							>
							<div className="mb-4 flex items-center justify-between gap-3">
								<div>
									<NameWithAvatar
										value={item.profile.avatar_url}
										label={item.profile.display_name}
										className="flex flex-nowrap items-center gap-2 whitespace-nowrap"
										nameClassName="text-sm font-semibold"
									/>
									<p className="text-sm text-neutral-500">
										{formatCurrency(item.total, displayCurrency)}
									</p>
								</div>
								<span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
									{displayCurrency}
								</span>
							</div>
							<div className="h-56">
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
											{item.categories.map((entry, colorIndex) => (
												<Cell
													key={entry.category}
													fill={colors[(colorIndex + index) % colors.length]}
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
