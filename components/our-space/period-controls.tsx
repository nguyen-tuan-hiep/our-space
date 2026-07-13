import { useEffect, useState, type RefObject } from "react";
import dynamic from "next/dynamic";
import {
	CalendarDays,
	CircleDollarSign,
	HeartPulse,
	MapPinned,
	NotebookPen,
	UserRound,
} from "lucide-react";
import type { FilterRange } from "@/lib/dashboard-utils";

export type SpaceSection =
	| "notes"
	| "finances"
	| "mood"
	| "memories"
	| "personal";
type PeriodPickerViewport = "mobile" | "tablet" | "desktop";

const PeriodPickerDialog = dynamic(
	() =>
		import("@/components/our-space/period-picker-dialog").then(
			(mod) => mod.PeriodPickerDialog,
		),
	{ ssr: false },
);

function spaceTabClass(active: boolean) {
	return [
		"relative inline-flex min-h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-bold transition duration-200 sm:px-6 active:scale-[0.96]",
		active
			? "material-tonal shadow-[0_8px_22px_rgba(103,80,164,0.18)]"
			: "text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-950 dark:hover:bg-neutral-100",
	].join(" ");
}

interface PeriodPickerButtonProps {
	activePeriod: string;
	calendarDays: Array<{
		date: Date;
		dateKey: string;
		inCurrentMonth: boolean;
	}>;
	calendarMonthTitle: string;
	filterRange: FilterRange;
	periodDescription: string;
	periodPickerViewport: PeriodPickerViewport;
	periodLabel: string;
	periodPickerOpen: boolean;
	periodPickerRef: RefObject<HTMLDivElement | null>;
	profileTimeZone: string;
	selectedPeriodDescription: string;
	todayKey: string;
	visibleYear: number;
	onFilterRangeChange: (range: FilterRange) => void;
	onMovePicker: (direction: "next" | "previous") => void;
	onSelectMonth: (monthIndex: number) => void;
	onSelectWeekFromDate: (date: Date) => void;
	onTogglePeriodPicker: () => void;
}

export function PeriodPickerButton({
	activePeriod,
	calendarDays,
	calendarMonthTitle,
	filterRange,
	periodDescription,
	periodPickerViewport,
	periodLabel,
	periodPickerOpen,
	periodPickerRef,
	profileTimeZone,
	selectedPeriodDescription,
	todayKey,
	visibleYear,
	onFilterRangeChange,
	onMovePicker,
	onSelectMonth,
	onSelectWeekFromDate,
	onTogglePeriodPicker,
}: PeriodPickerButtonProps) {
	const [viewportMatches, setViewportMatches] = useState(false);
	const [shouldRenderPicker, setShouldRenderPicker] =
		useState(periodPickerOpen);
	const closing = shouldRenderPicker && !periodPickerOpen;

	useEffect(() => {
		const query =
			periodPickerViewport === "mobile"
				? "(max-width: 639px)"
				: periodPickerViewport === "tablet"
					? "(min-width: 640px) and (max-width: 1023px)"
					: "(min-width: 1024px)";
		const mediaQuery = window.matchMedia(query);
		const updateMatch = () => setViewportMatches(mediaQuery.matches);

		updateMatch();
		mediaQuery.addEventListener("change", updateMatch);
		return () => mediaQuery.removeEventListener("change", updateMatch);
	}, [periodPickerViewport]);

	useEffect(() => {
		if (periodPickerOpen && viewportMatches) {
			setShouldRenderPicker(true);
			return;
		}

		if (!shouldRenderPicker) return;

		const timeoutId = window.setTimeout(() => {
			setShouldRenderPicker(false);
		}, 300);

		return () => window.clearTimeout(timeoutId);
	}, [periodPickerOpen, shouldRenderPicker, viewportMatches]);

	const handleClosePicker = () => {
		if (periodPickerOpen) onTogglePeriodPicker();
	};

	return (
		<div
			className="relative shrink-0"
			ref={periodPickerRef}
			onPointerDown={(event) => event.stopPropagation()}
		>
			<button
				type="button"
				aria-label={`Choose ${periodLabel.toLowerCase()} period: ${periodDescription}`}
				aria-haspopup="dialog"
				aria-expanded={periodPickerOpen ? "true" : undefined}
				onClick={onTogglePeriodPicker}
				className="grid size-12 place-items-center rounded-2xl bg-paper text-neutral-700 shadow-[0_3px_12px_rgba(29,27,32,0.12)] transition hover:bg-neutral-100 hover:text-mui active:scale-[0.96]"
			>
				<CalendarDays size={22} />
			</button>

			{shouldRenderPicker ? (
				<PeriodPickerDialog
					activePeriod={activePeriod}
					calendarDays={calendarDays}
					calendarMonthTitle={calendarMonthTitle}
					closing={closing}
					filterRange={filterRange}
					selectedPeriodDescription={selectedPeriodDescription}
					profileTimeZone={profileTimeZone}
					todayKey={todayKey}
					visibleYear={visibleYear}
					onFilterRangeChange={onFilterRangeChange}
					onClose={handleClosePicker}
					onMovePicker={onMovePicker}
					onSelectMonth={onSelectMonth}
					onSelectWeekFromDate={onSelectWeekFromDate}
				/>
			) : null}
		</div>
	);
}

interface PeriodControlsProps extends PeriodPickerButtonProps {
	activeSection: SpaceSection;
	hidePeriodPicker?: boolean;
	onSelectSection: (section: SpaceSection) => void;
}

export function PeriodControls({
	activeSection,
	hidePeriodPicker = false,
	onSelectSection,
	...periodPickerProps
}: PeriodControlsProps) {
	return (
		<div className="sticky top-3 z-40 hidden rounded-[1.75rem] border border-neutral-900/10 bg-paper/88 p-2 shadow-[0_12px_36px_rgba(29,27,32,0.08)] backdrop-blur-xl sm:block lg:hidden">
			<div className="flex flex-col gap-3 sm:flex-row md:items-center md:gap-6">
				<div
					role="tablist"
					aria-label="Space section"
					className="grid min-w-0 flex-1 grid-cols-4 rounded-[1.35rem] bg-bg/85 p-1"
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
							className={
								activeSection === "notes" ? "text-mui" : "text-neutral-500"
							}
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
					<button
						type="button"
						role="tab"
						aria-selected={activeSection === "mood"}
						className={spaceTabClass(activeSection === "mood")}
						onClick={() => onSelectSection("mood")}
					>
						<HeartPulse
							size={18}
							className={
								activeSection === "mood" ? "text-mui" : "text-neutral-500"
							}
						/>
						Mood
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={activeSection === "memories"}
						className={spaceTabClass(activeSection === "memories")}
						onClick={() => onSelectSection("memories")}
					>
						<MapPinned
							size={18}
							className={
								activeSection === "memories" ? "text-mui" : "text-neutral-500"
							}
						/>
						Memory
					</button>
				</div>

				{hidePeriodPicker ? null : (
					<div className="ml-0 md:ml-auto">
						<PeriodPickerButton {...periodPickerProps} />
					</div>
				)}
			</div>
		</div>
	);
}

export function MobileSpaceTabs({
	activeSection,
	onSelectSection,
}: {
	activeSection: SpaceSection;
	onSelectSection: (section: SpaceSection) => void;
}) {
	const items: Array<{
		value: SpaceSection;
		label: string;
		icon: typeof NotebookPen;
	}> = [
		{ value: "notes", label: "Notes", icon: NotebookPen },
		{ value: "finances", label: "Finance", icon: CircleDollarSign },
		{ value: "mood", label: "Mood", icon: HeartPulse },
		{ value: "memories", label: "Memory", icon: MapPinned },
		{ value: "personal", label: "Personal", icon: UserRound },
	];
	const selectedIndex = Math.max(
		0,
		items.findIndex((item) => item.value === activeSection),
	);

	return (
		<nav
			aria-label="Space sections"
			className="native-bottom-nav-in fixed inset-x-0 bottom-0 z-[50] sm:hidden"
		>
			<div className="relative rounded-t-[1.8rem] border-t border-mui/10 bg-paper/92 px-2 pb-[clamp(0.5rem,env(safe-area-inset-bottom),1rem)] shadow-[0_-10px_34px_rgba(29,27,32,0.14)] backdrop-blur-xl">
				<div className="relative grid grid-cols-5 py-2">
					<div
						aria-hidden="true"
						className="mobile-bottom-tab-indicator absolute inset-y-1.5 left-0 rounded-2xl bg-mui/14 shadow-[0_8px_20px_rgba(103,80,164,0.18)]"
						style={{
							width: "calc(100% / 5)",
							transform: `translateX(${selectedIndex * 100}%)`,
						}}
					/>
					{items.map((item) => {
						const Icon = item.icon;
						const selected = activeSection === item.value;

						return (
							<button
								key={item.value}
								type="button"
								role="tab"
								aria-selected={selected}
								className={[
									"relative z-10 flex min-h-[3rem] flex-col items-center justify-center gap-0.5 rounded-2xl text-[10.5px] font-extrabold transition duration-200 active:scale-[0.8]",
									selected ? "text-neutral-950" : "text-neutral-500",
								].join(" ")}
								onClick={() => onSelectSection(item.value)}
							>
								<span
									className={[
										"grid size-7 place-items-center rounded-full transition duration-200",
										selected
											? "mobile-tab-icon-selected bg-white/16"
											: "bg-transparent",
									].join(" ")}
								>
									<Icon
										size={19}
										strokeWidth={selected ? 2.7 : 2.35}
										className={
											selected ? "text-neutral-950" : "text-neutral-500"
										}
									/>
								</span>
								<span>{item.label}</span>
							</button>
						);
					})}
				</div>
			</div>
		</nav>
	);
}
