import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import dynamic from "next/dynamic";
import { useMediaQuery } from "@/components/common/use-hydrated";
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
  const [minimized, setMinimized] = useMinimizeOnScroll();

  // Switching tabs always shows the full bar again.
  const [shownSection, setShownSection] = useState(activeSection);
  if (shownSection !== activeSection) {
    setShownSection(activeSection);
    setMinimized(false);
  }

  const ActiveIcon = items[selectedIndex].icon;

  // Press-and-drag across the bar (Apple's Liquid Glass tab bars): the selection
  // lens follows the finger and the section under it is chosen on release. A plain
  // tap still goes through each button's click; a drag only starts after a small
  // horizontal move, and vertical swipes keep scrolling the page (touch-action).
  const drag = useRef<{ id: number; startX: number; left: number; width: number; active: boolean } | null>(null);
  // Lens position (px from the track start) and the track width it was measured on.
  const [lens, setLens] = useState<{ x: number; width: number } | null>(null);
  const dragX = lens?.x ?? null;
  const columnWidth = (width: number) => width / items.length;
  const lensLeft = (clientX: number, track: { left: number; width: number }) => {
    const column = columnWidth(track.width);
    return Math.min(Math.max(clientX - track.left - column / 2, 0), track.width - column);
  };
  const dragIndex = (x: number, width: number) => Math.round(x / columnWidth(width));

  const onTrackPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (minimized || (event.pointerType === "mouse" && event.button !== 0)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    drag.current = { id: event.pointerId, startX: event.clientX, left: rect.left, width: rect.width, active: false };
  };
  const onTrackPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    if (!current.active) {
      if (Math.abs(event.clientX - current.startX) < 6) return;
      current.active = true;
      // Capturing makes the release land on the track, so no button click fires.
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // The pointer may already be gone; the drag still works without capture.
      }
    }
    setLens({ x: lensLeft(event.clientX, current), width: current.width });
  };
  const endTrackDrag = (event: ReactPointerEvent<HTMLDivElement>, commit: boolean) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    drag.current = null;
    if (!current.active) return;
    const index = dragIndex(lensLeft(event.clientX, current), current.width);
    setLens(null);
    if (commit) onSelectSection(items[index].value);
  };
  const hoverIndex = lens ? dragIndex(lens.x, lens.width) : null;

  return (
    <>
    {/* Blurs content scrolling beneath the floating bar, including the gap below it.
        A sibling, not a child: the nav's entrance transform would make a fixed child
        position against the nav instead of the screen. */}
    <div aria-hidden="true" className="bottom-nav-backdrop sm:hidden" />
    <nav
      aria-label="Space sections"
      data-minimized={minimized ? "" : undefined}
      className="mobile-tab-dock native-bottom-nav-in fixed inset-x-2 bottom-[var(--bottom-nav-offset)] z-[45] flex items-end justify-between sm:hidden"
    >
      {/* One glass pill with even padding. Collapsed, it shrinks to a circle the size
          of the (+) button showing only the current tab's icon; the full track stays
          at its expanded width underneath so nothing reflows while it animates. */}
      <div className="mobile-tab-bar glass-navigation relative overflow-hidden rounded-full">
        <div
          className="mobile-tab-track absolute inset-y-1 left-1 grid touch-pan-y grid-cols-6"
          onPointerDown={onTrackPointerDown}
          onPointerMove={onTrackPointerMove}
          onPointerUp={(event) => endTrackDrag(event, true)}
          onPointerCancel={(event) => endTrackDrag(event, false)}
        >
          <div
            aria-hidden="true"
            data-dragging={dragX === null ? undefined : ""}
            className="glass-selected mobile-bottom-tab-indicator absolute inset-y-0 left-0 rounded-full border"
            style={{
              width: "calc(100% / 6)",
              transform: dragX === null ? `translateX(${selectedIndex * 100}%)` : `translateX(${dragX}px)`,
            }}
          />
          {items.map((item) => {
            const Icon = item.icon;
            const selected = activeSection === item.value;
            // While dragging, the tab under the lens reads as the one about to be chosen.
            const highlighted = hoverIndex === null ? selected : hoverIndex === items.indexOf(item);

            return (
              <button
                key={item.value}
                type="button"
                aria-current={selected ? "page" : undefined}
                tabIndex={minimized ? -1 : undefined}
                className={[
                  "relative z-10 flex min-w-0 select-none flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-bold tracking-[-0.01em] transition duration-200 [-webkit-touch-callout:none]",
                  dragX === null ? "active:scale-[0.96]" : "",
                  highlighted ? "text-foreground" : "text-subtle-foreground",
                ].join(" ")}
                onClick={() => onSelectSection(item.value)}
              >
                <Icon size={20} strokeWidth={highlighted ? 2.4 : 2} aria-hidden="true" />
                <span className="leading-3">{item.label}</span>
              </button>
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
          <ActiveIcon size={20} strokeWidth={2.4} aria-hidden="true" />
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
          <Plus size={22} strokeWidth={2.2} aria-hidden="true" />
        </button>
      ) : null}
    </nav>
    </>
  );
}
