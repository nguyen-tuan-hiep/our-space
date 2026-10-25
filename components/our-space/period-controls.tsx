import { useEffect, useState, type RefObject } from "react";
import dynamic from "next/dynamic";
import { useMediaQuery } from "@/components/common/use-hydrated";
import {
  CalendarDays,
  CircleDollarSign,
  Clapperboard,
  HeartPulse,
  MapPinned,
  NotebookPen,
  UserRound,
} from "lucide-react";
import type { FilterRange } from "@/lib/dashboard-utils";

export type SpaceSection =
  "notes" | "finances" | "mood" | "memories" | "movies" | "personal";
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
    "relative inline-flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl px-2 text-sm font-semibold transition duration-200 sm:px-3 active:scale-[0.96]",
    active
      ? "glass-selected"
      : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
  ].join(" ");
}

function spaceTabIconClass(active: boolean) {
  return `hidden min-[900px]:block shrink-0 ${active ? "text-current" : "text-subtle-foreground"}`;
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
  const viewportMatches = useMediaQuery(
    periodPickerViewport === "mobile"
      ? "(max-width: 639px)"
      : periodPickerViewport === "tablet"
        ? "(min-width: 640px) and (max-width: 1023px)"
        : "(min-width: 1024px)",
  );
  const [shouldRenderPicker, setShouldRenderPicker] =
    useState(periodPickerOpen);
  const closing = shouldRenderPicker && !periodPickerOpen;

  // Mount the picker as soon as it opens; unmount only after its exit transition.
  const pickerVisible = periodPickerOpen && viewportMatches;
  if (pickerVisible && !shouldRenderPicker) setShouldRenderPicker(true);

  useEffect(() => {
    if (pickerVisible || !shouldRenderPicker) return;

    const timeoutId = window.setTimeout(() => {
      setShouldRenderPicker(false);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [pickerVisible, shouldRenderPicker]);

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
        className="glass-surface grid size-12 place-items-center rounded-2xl text-muted-foreground transition hover:text-foreground active:scale-[0.96]"
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
    <div className="glass-navigation sticky top-3 z-40 hidden rounded-[1.75rem] p-2 sm:block lg:hidden">
      <div className="flex flex-col gap-3 sm:flex-row md:items-center md:gap-6">
        <div
          aria-label="Space sections"
          className="glass-chip grid min-w-0 flex-1 grid-cols-6 rounded-[1.35rem] p-1"
        >
          <button
            type="button"
            aria-current={activeSection === "notes" ? "page" : undefined}
            className={spaceTabClass(activeSection === "notes")}
            onClick={() => onSelectSection("notes")}
          >
            <NotebookPen
              size={18}
              className={spaceTabIconClass(activeSection === "notes")}
            />
            Notes
          </button>
          <button
            type="button"
            aria-current={activeSection === "finances" ? "page" : undefined}
            className={spaceTabClass(activeSection === "finances")}
            onClick={() => onSelectSection("finances")}
          >
            <CircleDollarSign
              size={18}
              className={spaceTabIconClass(activeSection === "finances")}
            />
            Finances
          </button>
          <button
            type="button"
            aria-current={activeSection === "mood" ? "page" : undefined}
            className={spaceTabClass(activeSection === "mood")}
            onClick={() => onSelectSection("mood")}
          >
            <HeartPulse
              size={18}
              className={spaceTabIconClass(activeSection === "mood")}
            />
            Mood
          </button>
          <button
            type="button"
            aria-current={activeSection === "memories" ? "page" : undefined}
            className={spaceTabClass(activeSection === "memories")}
            onClick={() => onSelectSection("memories")}
          >
            <MapPinned
              size={18}
              className={spaceTabIconClass(activeSection === "memories")}
            />
            Memory
          </button>
          <button
            type="button"
            aria-current={activeSection === "movies" ? "page" : undefined}
            className={spaceTabClass(activeSection === "movies")}
            onClick={() => onSelectSection("movies")}
          >
            <Clapperboard
              size={18}
              className={spaceTabIconClass(activeSection === "movies")}
            />
            Movies
          </button>
          <button
            type="button"
            aria-current={activeSection === "personal" ? "page" : undefined}
            className={spaceTabClass(activeSection === "personal")}
            onClick={() => onSelectSection("personal")}
          >
            <UserRound
              size={18}
              className={spaceTabIconClass(activeSection === "personal")}
            />
            Personal
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
    { value: "movies", label: "Movies", icon: Clapperboard },
    { value: "personal", label: "Personal", icon: UserRound },
  ];
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.value === activeSection),
  );

  return (
    <nav
      aria-label="Space sections"
      className="native-bottom-nav-in fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-[45] sm:hidden"
    >
      <div className="glass-navigation relative rounded-[1.75rem] px-2 pb-2">
        <div className="relative grid grid-cols-6 py-2">
          <div
            aria-hidden="true"
            className="glass-selected mobile-bottom-tab-indicator absolute inset-y-1.5 left-0 rounded-2xl border"
            style={{
              width: "calc(100% / 6)",
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
                aria-current={selected ? "page" : undefined}
                className={[
                  "relative z-10 flex min-h-[3rem] flex-col items-center justify-center gap-0.5 rounded-2xl text-[10.5px] font-extrabold transition duration-200 active:scale-[0.97]",
                  selected
                    ? "text-foreground"
                    : "text-subtle-foreground",
                ].join(" ")}
                onClick={() => onSelectSection(item.value)}
              >
                <span
                  className={[
                    "grid size-7 place-items-center rounded-full transition duration-200 bg-transparent",
                  ].join(" ")}
                >
                  <Icon
                    size={19}
                    strokeWidth={selected ? 2.7 : 2.35}
                    className="text-current"
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
