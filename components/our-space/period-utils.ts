const weekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];
const monthLabels = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

export { monthLabels, weekdayLabels };

export function getUtcMonthStart(date: Date) {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function addUtcMonths(date: Date, amount: number) {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
}

export function getUtcDateKey(date: Date) {
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
		2,
		"0",
	)}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function getCalendarDays(month: Date) {
	const monthStart = getUtcMonthStart(month);
	const mondayOffset = (monthStart.getUTCDay() + 6) % 7;
	const gridStart = new Date(
		Date.UTC(
			monthStart.getUTCFullYear(),
			monthStart.getUTCMonth(),
			1 - mondayOffset,
		),
	);

	return Array.from({ length: 42 }, (_, index) => {
		const date = new Date(gridStart.getTime() + index * 86400000);
		return {
			date,
			dateKey: getUtcDateKey(date),
			inCurrentMonth: date.getUTCMonth() === monthStart.getUTCMonth(),
		};
	});
}
