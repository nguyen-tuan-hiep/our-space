import { useEffect, useState, type RefObject } from "react";
import dynamic from "next/dynamic";
import { useMediaQuery } from "@/components/common/use-hydrated";
import { useDragSelect } from "@/components/common/use-drag-select";
import {
  CalendarDays,
  CircleDollarSign,
  Clapperboard,
  HeartPulse,
  MapPinned,
  NotebookPen,
  Plus,
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

const spaceSections: Array<{
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

/**
 * The glass selection lens under a tab row: it sits on the selected tab and,
 * while a finger drags across the row, follows it 1:1.
 */
function SpaceTabLens({ selectedIndex, dragX }: { selectedIndex: number; dragX: number | null }) {
  return (
    <div
      aria-hidden="true"
      data-dragging={dragX === null ? undefined : ""}
      className="glass-selected tab-lens absolute inset-y-0 left-0 rounded-full border"
      style={{
        width: `calc(100% / ${spaceSections.length})`,
        transform: dragX === null ? `translateX(${selectedIndex * 100}%)` : `translateX(${dragX}px)`,
      }}
    />
  );
}

/** One tab: icon over label. While dragging, the tab under the lens reads as chosen. */
function SpaceTabButton({
  item,
  selected,
  highlighted,
  dragging,
  tabIndex,
  onSelect,
}: {
  item: (typeof spaceSections)[number];
  selected: boolean;
  highlighted: boolean;
  dragging: boolean;
  tabIndex?: number;
  onSelect: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      aria-current={selected ? "page" : undefined}
      tabIndex={tabIndex}
      className={[
        "relative z-10 flex min-w-0 select-none flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-bold tracking-[-0.01em] transition duration-200 [-webkit-touch-callout:none]",
        dragging ? "" : "active:scale-[0.96]",
        highlighted ? "text-foreground" : "text-subtle-foreground",
      ].join(" ")}
      onClick={onSelect}
    >
      {/* The chosen tab's icon does its own little move once (a page flip, a
          coin spin, a heartbeat…); not while dragging across the bar. */}
      <span
        key={selected ? "on" : "off"}
        className={selected && !dragging ? `tab-icon-pop tab-icon-pop--${item.value}` : "inline-flex"}
      >
        <Icon size={20} strokeWidth={highlighted ? 2.4 : 2} aria-hidden="true" />
      </span>
      <span className="leading-3">{item.label}</span>
    </button>
  );
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
  /** Overrides the calendar button's look, e.g. to match the tab bar beside it. */
  triggerClassName?: string;
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
  triggerClassName = "glass-surface size-12 rounded-2xl",
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
        className={`${triggerClassName} grid place-items-center text-muted-foreground transition hover:text-foreground active:scale-[0.96]`}
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
  const selectedIndex = Math.max(
    0,
    spaceSections.findIndex((item) => item.value === activeSection),
  );
  const { lensX: dragX, hoverIndex, trackProps } = useDragSelect(spaceSections.length, (index) =>
    onSelectSection(spaceSections[index].value),
  );

  return (
    <div className="sticky top-3 z-40 hidden items-center gap-3 sm:flex lg:hidden">
      <nav aria-label="Space sections" className="glass-navigation min-w-0 flex-1 rounded-full p-1">
        <div className="relative grid h-[3.125rem] touch-pan-y grid-cols-6" {...trackProps}>
          <SpaceTabLens selectedIndex={selectedIndex} dragX={dragX} />
          {spaceSections.map((item, index) => {
            const selected = activeSection === item.value;
            return (
              <SpaceTabButton
                key={item.value}
                item={item}
                selected={selected}
                highlighted={hoverIndex === null ? selected : hoverIndex === index}
                dragging={dragX !== null}
                onSelect={() => onSelectSection(item.value)}
              />
            );
          })}
        </div>
      </nav>

      {hidePeriodPicker ? null : (
        <PeriodPickerButton
          {...periodPickerProps}
          triggerClassName="glass-navigation size-[3.75rem] rounded-full"
        />
      )}
    </div>
  );
}

/**
 * Liquid-glass style tab bar minimizing: scrolling on into the content collapses
 * the bar to the selected tab, scrolling back up (or reaching the top) expands it.
 * Small jitters are ignored, and rubber-band overscroll is clamped out.
 */
function useMinimizeOnScroll() {
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    // Below desktop <main> scrolls (see .space-shell); the window is a fallback.
    const shell = document.querySelector<HTMLElement>(".space-shell");
    const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), Math.max(max, 0));
    const shellRange = () => (shell ? shell.scrollHeight - shell.clientHeight : 0);
    const windowRange = () => document.documentElement.scrollHeight - window.innerHeight;
    const read = () =>
      Math.max(
        shell ? clamp(shell.scrollTop, shellRange()) : 0,
        clamp(window.scrollY, windowRange()),
      );
    // Pages shorter than this barely scroll, so a swipe gesture drives the bar
    // instead; otherwise short lists could never reveal the (+) action.
    const SHORT_PAGE = 160;
    const isShortPage = () => Math.max(shellRange(), windowRange()) < SHORT_PAGE;

    let last = read();
    let travel = 0;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const y = read();
        const delta = y - last;
        last = y;
        if (isShortPage()) return;
        if (y < 48) {
          travel = 0;
          setMinimized(false);
          return;
        }
        if (delta === 0) return;
        // Restart the count whenever the direction flips.
        travel = Math.sign(delta) === Math.sign(travel) ? travel + delta : delta;
        if (travel > 12) setMinimized(true);
        else if (travel < -12) setMinimized(false);
      });
    };

    // Swipe/wheel on short pages: finger moving up (content would scroll down)
    // collapses the bar, moving down expands it.
    let gesture = 0;
    let touchY: number | null = null;
    const applyGesture = (delta: number) => {
      if (!isShortPage()) return;
      gesture = Math.sign(delta) === Math.sign(gesture) ? gesture + delta : delta;
      if (gesture > 12) setMinimized(true);
      else if (gesture < -12) setMinimized(false);
    };
    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? null;
      gesture = 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY;
      if (touchY === null || y === undefined) return;
      applyGesture(touchY - y);
      touchY = y;
    };
    const onWheel = (event: WheelEvent) => applyGesture(event.deltaY);

    const target: HTMLElement | Window = shell ?? window;
    shell?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    target.addEventListener("touchstart", onTouchStart as EventListener, { passive: true });
    target.addEventListener("touchmove", onTouchMove as EventListener, { passive: true });
    target.addEventListener("wheel", onWheel as EventListener, { passive: true });
    return () => {
      shell?.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
      target.removeEventListener("touchstart", onTouchStart as EventListener);
      target.removeEventListener("touchmove", onTouchMove as EventListener);
      target.removeEventListener("wheel", onWheel as EventListener);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [setMinimized]);

  return [minimized, setMinimized] as const;
}

export function MobileSpaceTabs({
  activeSection,
  action,
  onSelectSection,
}: {
  activeSection: SpaceSection;
  /** The section's create action: a round (+) shown beside the collapsed bar. */
  action?: { label: string; onClick: () => void };
  onSelectSection: (section: SpaceSection) => void;
}) {
  const items = spaceSections;
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.value === activeSection),
  );
  const [minimized, setMinimized] = useMinimizeOnScroll();

  // Switching tabs always shows the full bar again.
  const [shownSection, setShownSection] = useState(activeSection);
  if (shownSection !== activeSection) {
    setShownSection(activeSection);
    setMinimized(false);
  }

  const ActiveIcon = items[selectedIndex].icon;

  // Press-and-drag across the bar picks a section on release, like Liquid Glass tabs.
  const { lensX: dragX, hoverIndex, trackProps } = useDragSelect(
    items.length,
    (index) => onSelectSection(items[index].value),
    minimized,
  );

  return (
    <>
    {/* Blurs content scrolling beneath the floating bar, including the gap below it.
        A sibling, not a child: the nav's entrance transform would make a fixed child
        position against the nav instead of the screen. */}
    <div aria-hidden="true" className="bottom-nav-backdrop sm:hidden" />
    <nav
      aria-label="Space sections"
      data-minimized={minimized ? "" : undefined}
      className="mobile-tab-dock native-bottom-nav-in fixed inset-x-[var(--dock-inset-x)] bottom-[var(--bottom-nav-offset)] z-[45] flex items-end justify-between sm:hidden"
    >
      {/* One glass pill with even padding. Collapsed, it shrinks to a circle the size
          of the (+) button showing only the current tab's icon; the full track stays
          at its expanded width underneath so nothing reflows while it animates. */}
      <div className="mobile-tab-bar glass-navigation relative overflow-hidden rounded-full">
        <div
          className="mobile-tab-track absolute inset-y-1 left-1 grid touch-pan-y grid-cols-6"
          {...trackProps}
        >
          <SpaceTabLens selectedIndex={selectedIndex} dragX={dragX} />
          {items.map((item, index) => {
            const selected = activeSection === item.value;
            return (
              <SpaceTabButton
                key={item.value}
                item={item}
                selected={selected}
                highlighted={hoverIndex === null ? selected : hoverIndex === index}
                dragging={dragX !== null}
                tabIndex={minimized ? -1 : undefined}
                onSelect={() => onSelectSection(item.value)}
              />
            );
          })}
        </div>
        <button
          type="button"
          tabIndex={minimized ? undefined : -1}
          aria-hidden={minimized ? undefined : true}
          aria-label={`${items[selectedIndex].label}, show all sections`}
          className="mobile-tab-collapsed absolute inset-0 grid place-items-center text-foreground"
          onClick={() => setMinimized(false)}
        >
          <span
            key={minimized ? "min" : "full"}
            className={minimized ? `tab-icon-pop tab-icon-pop--${items[selectedIndex].value}` : "inline-flex"}
          >
            <ActiveIcon size={23} strokeWidth={2.3} aria-hidden="true" />
          </span>
        </button>
      </div>
      {/* Only while collapsed: the expanded bar keeps the full width for its tabs. */}
      {action && minimized ? (
        <button
          key={activeSection}
          type="button"
          aria-label={action.label}
          onClick={action.onClick}
          className="mobile-tab-action glass-navigation grid shrink-0 place-items-center rounded-full text-foreground transition active:scale-[0.92]"
        >
          <Plus size={25} strokeWidth={2.2} aria-hidden="true" />
        </button>
      ) : null}
    </nav>
    </>
  );
}
