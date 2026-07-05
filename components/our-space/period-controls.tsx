import type { RefObject } from "react";
import {
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	NotebookPen,
	CircleDollarSign,
} from "lucide-react";
import type { FilterRange } from "@/lib/dashboard-utils";
import { getPeriodKey } from "@/lib/dashboard-utils";
import { monthLabels, weekdayLabels } from "./period-utils";

type SpaceSection = "notes" | "finances";

function spaceTabClass(active: boolean) {
	return [
		"relative inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition sm:min-w-44 sm:px-6",
		active
			? "bg-paper text-neutral-950 shadow-[0_10px_24px_rgba(30,25,20,0.16)]"
			: "text-neutral-500 hover:text-neutral-800",
	].join(" ");
}

function periodTabClass(active: boolean) {
	return [
		"relative inline-flex min-h-10 flex-1 items-center justify-center px-4 text-sm font-bold transition",
		active
			? "text-mui after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-mui"
			: "text-neutral-900 hover:text-mui",
	].join(" ");
}

function calendarDayClass({
	inCurrentMonth,
	selected,
	today,
}: {
	inCurrentMonth: boolean;
	selected: boolean;
	today: boolean;
}) {
	return [
		"grid aspect-square place-items-center rounded-full text-sm font-semibold transition",
		selected
			? "bg-mui/10 text-mui shadow-inner"
			: inCurrentMonth
				? "text-neutral-900 hover:bg-mui/10"
				: "text-neutral-300 hover:bg-neutral-50",
		today && !selected ? "ring-1 ring-mui/40" : "",
	].join(" ");
}

interface PeriodControlsProps {
	activeSection: SpaceSection;
	activePeriod: string;
	calendarDays: Array<{
		date: Date;
		dateKey: string;
		inCurrentMonth: boolean;
	}>;
	calendarMonthTitle: string;
	filterRange: FilterRange;
	periodDescription: string;
	periodLabel: string;
	periodPickerOpen: boolean;
	periodPickerRef: RefObject<HTMLDivElement | null>;
	profileTimeZone: string;
	todayKey: string;
	visibleYear: number;
	onFilterRangeChange: (range: FilterRange) => void;
	onMovePicker: (direction: "next" | "previous") => void;
	onSelectMonth: (monthIndex: number) => void;
	onSelectSection: (section: SpaceSection) => void;
	onSelectWeekFromDate: (date: Date) => void;
	onTogglePeriodPicker: () => void;
}

export function PeriodControls({
	activeSection,
	activePeriod,
	calendarDays,
	calendarMonthTitle,
	filterRange,
	periodDescription,
	periodLabel,
	periodPickerOpen,
	periodPickerRef,
	profileTimeZone,
	todayKey,
	visibleYear,
	onFilterRangeChange,
	onMovePicker,
	onSelectMonth,
	onSelectSection,
	onSelectWeekFromDate,
	onTogglePeriodPicker,
}: PeriodControlsProps) {
	return (
		<div className="relative z-50 -mx-5 px-5 pt-2 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
			<div className="flex items-center gap-3 sm:justify-between sm:gap-4 md:gap-6">
				<div
					role="tablist"
					aria-label="Space section"
					className="grid min-w-0 flex-1 grid-cols-2 rounded-full bg-mui/10 p-1 shadow-inner sm:max-w-md sm:flex-none"
				>
					<button
						type="button"
						role="tab"
						aria-selected={activeSection === "notes"}
						className={spaceTabClass(activeSection === "notes")}
						onClick={() => onSelectSection("notes")}
					>
						<NotebookPen
							size={18}
							className={activeSection === "notes" ? "text-mui" : "text-neutral-500"}
						/>
						Notes
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={activeSection === "finances"}
						className={spaceTabClass(activeSection === "finances")}
						onClick={() => onSelectSection("finances")}
					>
						<CircleDollarSign
							size={18}
							className={
								activeSection === "finances" ? "text-mui" : "text-neutral-500"
							}
						/>
						Finances
					</button>
				</div>

				<div className="relative ml-auto shrink-0" ref={periodPickerRef}>
					<button
						type="button"
						aria-label={`Choose ${periodLabel.toLowerCase()} period: ${periodDescription}`}
						aria-haspopup="dialog"
						aria-expanded={periodPickerOpen ? "true" : undefined}
						onClick={onTogglePeriodPicker}
						className="grid size-11 place-items-center rounded-full bg-paper text-neutral-700 shadow-sm transition hover:bg-mui/10 hover:text-mui"
					>
						<CalendarDays size={22} />
					</button>

					{periodPickerOpen ? (
						<div
							role="dialog"
							aria-label="Choose period"
							className="absolute right-0 top-14 z-[60] w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-[2rem] border border-neutral-200 bg-paper p-4 text-neutral-900 shadow-2xl backdrop-blur"
						>
							{/* <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-neutral-300" /> */}

							<div
								role="radiogroup"
								aria-label="Period range"
								className="grid grid-cols-2 border-b border-neutral-200"
							>
								<button
									type="button"
									role="radio"
									aria-checked={filterRange === "week"}
									className={periodTabClass(filterRange === "week")}
									onClick={() => onFilterRangeChange("week")}
								>
									Week
								</button>
								<button
									type="button"
									role="radio"
									aria-checked={filterRange === "month"}
									className={periodTabClass(filterRange === "month")}
									onClick={() => onFilterRangeChange("month")}
								>
									Month
								</button>
							</div>

							<div className="mt-4 flex items-center justify-between gap-3">
								<button
									type="button"
									aria-label={filterRange === "week" ? "Previous month" : "Previous year"}
									className="grid size-10 place-items-center rounded-full text-neutral-600 transition hover:bg-mui/10"
									onClick={() => onMovePicker("previous")}
								>
									<ChevronLeft size={24} />
								</button>
								<div className="min-w-0 text-center">
									{/* <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-400">
										{periodLabel}
									</p> */}
									<p className="mt-1 truncate font-serif text-2xl font-bold text-neutral-950">
										{filterRange === "week" ? calendarMonthTitle : visibleYear}
									</p>
								</div>
								<button
									type="button"
									aria-label={filterRange === "week" ? "Next month" : "Next year"}
									className="grid size-10 place-items-center rounded-full text-neutral-600 transition hover:bg-mui/10"
									onClick={() => onMovePicker("next")}
								>
									<ChevronRight size={24} />
								</button>
							</div>

							{filterRange === "week" ? (
								<div className="mt-4">
									<div className="grid grid-cols-7 text-center text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">
										{weekdayLabels.map((label, index) => (
											<span key={`${label}-${index}`}>{label}</span>
										))}
									</div>
									<div className="mt-2 grid grid-cols-7 gap-1">
										{calendarDays.map(({ date, dateKey, inCurrentMonth }) => {
											const weekKey = getPeriodKey(date, profileTimeZone, "week");
											const selected = weekKey === activePeriod;
											return (
												<button
													type="button"
													key={dateKey}
													className={calendarDayClass({
														inCurrentMonth,
														selected,
														today: dateKey === todayKey,
													})}
													onClick={() => onSelectWeekFromDate(date)}
												>
													{date.getUTCDate()}
												</button>
											);
										})}
									</div>
								</div>
							) : (
								<div className="mt-4 grid grid-cols-3 gap-2">
									{monthLabels.map((label, index) => {
										const monthDate = new Date(Date.UTC(visibleYear, index, 1));
										const monthKey = getPeriodKey(
											monthDate,
											profileTimeZone,
											"month",
										);
										const selected = monthKey === activePeriod;
										return (
											<button
												type="button"
												key={label}
												className={[
													"rounded-2xl px-3 py-3 text-sm font-bold transition",
													selected
														? "bg-mui/10 text-mui shadow-inner"
														: "text-neutral-700 hover:bg-mui/10",
												].join(" ")}
												onClick={() => onSelectMonth(index)}
											>
												{label}
											</button>
										);
									})}
								</div>
							)}

							<p className="mt-4 rounded-2xl bg-mui/10 px-4 py-3 text-center text-xs font-semibold text-neutral-500">
								Selected: <span className="text-neutral-900">{periodDescription}</span>
							</p>
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}
