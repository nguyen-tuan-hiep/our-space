import type { RefObject } from "react";
import dynamic from "next/dynamic";
import { CalendarDays, NotebookPen, CircleDollarSign } from "lucide-react";
import type { FilterRange } from "@/lib/dashboard-utils";

type SpaceSection = "notes" | "finances";

const PeriodPickerDialog = dynamic(
	() =>
		import("@/components/our-space/period-picker-dialog").then(
			(mod) => mod.PeriodPickerDialog,
		),
	{ ssr: false },
);

function spaceTabClass(active: boolean) {
	return [
		"relative inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition sm:min-w-44 sm:px-6",
		active
			? "bg-paper text-neutral-950 shadow-[0_10px_24px_rgba(30,25,20,0.16)]"
			: "text-neutral-500 hover:text-neutral-800",
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
						<PeriodPickerDialog
							activePeriod={activePeriod}
							calendarDays={calendarDays}
							calendarMonthTitle={calendarMonthTitle}
							filterRange={filterRange}
							periodDescription={periodDescription}
							profileTimeZone={profileTimeZone}
							todayKey={todayKey}
							visibleYear={visibleYear}
							onFilterRangeChange={onFilterRangeChange}
							onMovePicker={onMovePicker}
							onSelectMonth={onSelectMonth}
							onSelectWeekFromDate={onSelectWeekFromDate}
						/>
					) : null}
				</div>
			</div>
		</div>
	);
}
