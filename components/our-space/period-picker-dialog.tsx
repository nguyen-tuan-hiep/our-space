import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FilterRange } from "@/lib/dashboard-utils";
import { getPeriodKey } from "@/lib/dashboard-utils";
import { monthLabels, weekdayLabels } from "./period-utils";

function periodTabClass(active: boolean) {
  return [
    "relative inline-flex min-h-11 flex-1 items-center justify-center px-4 text-sm font-bold transition",
    active
      ? "text-primary after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
      : "text-muted-foreground hover:bg-transparent hover:text-primary",
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
      ? "bg-primary text-primary-foreground shadow-inner"
      : inCurrentMonth
        ? "text-foreground hover:bg-surface-hover hover:text-foreground"
        : "text-subtle-foreground/45 hover:bg-surface-hover hover:text-subtle-foreground",
    today ? "ring-1 ring-ring" : "",
  ].join(" ");
}

interface PeriodPickerDialogProps {
  activePeriod: string;
  calendarDays: Array<{
    date: Date;
    dateKey: string;
    inCurrentMonth: boolean;
  }>;
  calendarMonthTitle: string;
  closing?: boolean;
  filterRange: FilterRange;
  selectedPeriodDescription: string;
  profileTimeZone: string;
  todayKey: string;
  visibleYear: number;
  onFilterRangeChange: (range: FilterRange) => void;
  onClose: () => void;
  onMovePicker: (direction: "next" | "previous") => void;
  onSelectMonth: (monthIndex: number) => void;
  onSelectWeekFromDate: (date: Date) => void;
}

export function PeriodPickerDialog({
  activePeriod,
  calendarDays,
  calendarMonthTitle,
  closing = false,
  filterRange,
  selectedPeriodDescription,
  profileTimeZone,
  todayKey,
  visibleYear,
  onFilterRangeChange,
  onClose,
  onMovePicker,
  onSelectMonth,
  onSelectWeekFromDate,
}: PeriodPickerDialogProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Close period picker"
        className={[
          "fixed inset-0 z-[55] bg-neutral-950/35 backdrop-blur-sm dark:bg-neutral-950/60",
          closing ? "native-dialog-backdrop-out" : "native-dialog-backdrop-in",
        ].join(" ")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose period"
        className={[
          "mobile-sheet-motion fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-[60] max-h-[calc(100svh-7rem)] overflow-y-auto rounded-2xl border border-border bg-surface-elevated p-4 text-foreground shadow-2xl backdrop-blur will-change-transform sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-14 sm:w-[min(23rem,calc(100vw-2rem))]",
          closing ? "native-sheet-out" : "native-sheet-in",
        ].join(" ")}
      >
        <div
          role="radiogroup"
          aria-label="Period range"
          className="grid grid-cols-2 border-border bg-transparent p-0"
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
            aria-label={
              filterRange === "week" ? "Previous month" : "Previous year"
            }
            className="grid size-10 place-items-center rounded-full text-muted-foreground transition hover:bg-surface-hover hover:text-foreground"
            onClick={() => onMovePicker("previous")}
          >
            <ChevronLeft size={24} />
          </button>
          <div className="min-w-0 text-center">
            <p className="mt-1 truncate font-serif text-2xl font-bold text-foreground">
              {filterRange === "week" ? calendarMonthTitle : visibleYear}
            </p>
          </div>
          <button
            type="button"
            aria-label={filterRange === "week" ? "Next month" : "Next year"}
            className="grid size-10 place-items-center rounded-full text-muted-foreground transition hover:bg-surface-hover hover:text-foreground"
            onClick={() => onMovePicker("next")}
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {filterRange === "week" ? (
          <div className="mt-4">
            <div className="grid grid-cols-7 text-center text-xs font-bold uppercase tracking-[0.12em] text-subtle-foreground">
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
              const today = new Date(`${todayKey}T00:00:00.000Z`);
              const currentMonth =
                today.getUTCFullYear() === visibleYear &&
                today.getUTCMonth() === index;
              return (
                <button
                  type="button"
                  key={label}
                  className={[
                    "rounded-2xl px-3 py-3 text-sm font-bold transition",
                    selected
                      ? "bg-primary text-primary-foreground shadow-inner"
                      : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                    currentMonth ? "ring-1 ring-ring" : "",
                  ].join(" ")}
                  onClick={() => onSelectMonth(index)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        <p className="mt-4 rounded-2xl bg-surface-selected px-4 py-3 text-center text-xs font-semibold text-accent-foreground/75">
          Selected:{" "}
          <span className="text-accent-foreground">
            {selectedPeriodDescription}
          </span>
        </p>
      </div>
    </>
  );
}
