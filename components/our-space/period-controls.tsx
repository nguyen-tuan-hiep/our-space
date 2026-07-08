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

export type SpaceSection = "notes" | "finances" | "mood" | "memories" | "personal";

const PeriodPickerDialog = dynamic(
	() =>
		import("@/components/our-space/period-picker-dialog").then(
			(mod) => mod.PeriodPickerDialog,
		),
	{ ssr: false },
);

function spaceTabClass(active: boolean) {
	return [
		"relative inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-bold transition sm:px-6 active:scale-[0.8]",
		active
			? "bg-paper text-mui shadow-[0_10px_24px_rgba(30,25,20,0.16)]"
			: "text-neutral-500 hover:text-neutral-800",
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
	periodLabel: string;
	periodPickerOpen: boolean;
	periodPickerRef: RefObject<HTMLDivElement | null>;
	profileTimeZone: string;
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
	periodLabel,
	periodPickerOpen,
	periodPickerRef,
	profileTimeZone,
	todayKey,
	visibleYear,
	onFilterRangeChange,
	onMovePicker,
	onSelectMonth,
	onSelectWeekFromDate,
	onTogglePeriodPicker,
}: PeriodPickerButtonProps) {
	const [shouldRenderPicker, setShouldRenderPicker] =
		useState(periodPickerOpen);
	const closing = shouldRenderPicker && !periodPickerOpen;

	useEffect(() => {
		if (periodPickerOpen) {
			setShouldRenderPicker(true);
			return;
		}

		if (!shouldRenderPicker) return;

		const timeoutId = window.setTimeout(() => {
			setShouldRenderPicker(false);
		}, 300);

		return () => window.clearTimeout(timeoutId);
	}, [periodPickerOpen, shouldRenderPicker]);

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
				className="grid size-11 place-items-center rounded-full bg-paper text-neutral-700 shadow-md ring-1 ring-neutral-200/70 transition active:scale-[0.8] hover:bg-mui/10 hover:text-mui sm:ring-0"
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
	);
}

interface PeriodControlsProps extends PeriodPickerButtonProps {
	activeSection: SpaceSection;
	onSelectSection: (section: SpaceSection) => void;
}

export function PeriodControls({
	activeSection,
	onSelectSection,
	...periodPickerProps
}: PeriodControlsProps) {
	return (
		<div className="relative top-auto z-50 -mx-8 hidden bg-transparent px-8 pb-0 pt-1 backdrop-blur sm:block lg:-mx-12 lg:px-12">
			<div className="flex items-center justify-between gap-4 md:gap-6">
				<div
					role="tablist"
					aria-label="Space section"
					className="grid min-w-0 max-w-4xl flex-none grid-cols-4 rounded-2xl bg-mui/10 p-1 shadow-inner"
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
								activeSection === "memories"
									? "text-mui"
									: "text-neutral-500"
							}
						/>
						Memory
					</button>
				</div>

				<div className="ml-auto">
					<PeriodPickerButton {...periodPickerProps} />
				</div>
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
			className="native-bottom-nav-in fixed inset-x-0 bottom-0 z-40 sm:hidden"
		>
			<div className="relative border-t border-white/80 bg-white/50 px-2 pb-[clamp(0.5rem,env(safe-area-inset-bottom),1rem)] shadow-[0_-6px_32px_rgba(30,25,20,0.15)] backdrop-blur-md rounded-t-[1.8rem] box-content">
				<div className="relative grid grid-cols-5 py-2">
					<div
						aria-hidden="true"
						className="mobile-bottom-tab-indicator absolute inset-y-1.5 left-0 rounded-2xl bg-mui/20 shadow-[0_8px_20px_rgba(30,25,20,0.12)]"
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
									"relative z-10 flex min-h-[3rem] flex-col items-center justify-center gap-0.5 rounded-2xl text-[10.5px] font-extrabold tracking-[-0.01em] transition duration-200 active:scale-[0.8]",
									selected ? "text-neutral-950" : "text-neutral-500",
								].join(" ")}
								onClick={() => onSelectSection(item.value)}
							>
								<span
									className={[
										"grid size-7 place-items-center rounded-full transition duration-200",
										selected ? "bg-white/16" : "bg-transparent",
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
