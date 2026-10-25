import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/*
 * Every skeleton mirrors its real panel: same containers, padding and gaps,
 * and each text line is a box with the real line-height holding a thinner bar.
 * That keeps block heights identical, so nothing shifts when data arrives.
 */

function Line({ box, bar }: { box: string; bar: string }) {
	return (
		<div className={`flex items-center ${box}`}>
			<Skeleton className={`rounded-full ${bar}`} />
		</div>
	);
}

/** Mirrors PanelHeader; `actions` mirrors whatever the panel puts on the right. */
function PanelHeaderSkeleton({ actions, wrapDescription = false }: {
	actions?: ReactNode;
	/** The description runs to two lines on phones for the longer panel copy. */
	wrapDescription?: boolean;
}) {
	return (
		<div aria-hidden="true" className="panel-header flex flex-wrap items-end justify-between gap-x-5 gap-y-4">
			<div className="min-w-0 flex-1 basis-48">
				<Line box="h-[2.375rem] sm:h-[2.8125rem]" bar="h-7 w-52 sm:h-9 sm:w-64" />
				{wrapDescription ? (
					<div className="mt-2">
						<Line box="h-6" bar="h-3.5 w-72 max-w-full" />
						<Line box="h-6 sm:hidden" bar="h-3.5 w-40" />
					</div>
				) : (
					<Line box="mt-2 h-6" bar="h-3.5 w-72 max-w-full" />
				)}
			</div>
			{actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
		</div>
	);
}

/** Mobile-only period picker button that several panels show in their header. */
const periodActionSkeleton = <Skeleton key="period" className="size-12 rounded-2xl sm:hidden" />;

function primaryActionSkeleton(width: string) {
	return <Skeleton key="primary" className={`hidden h-11 rounded-2xl sm:block ${width}`} />;
}

/* ------------------------------------------------------------------ Notes */

function NoteCardSkeleton() {
	return (
		<div aria-hidden="true" className="app-card flex h-full flex-col p-5">
			<Line box="h-8" bar="h-3 w-28" />
			<div className="mt-1 flex h-[8.25rem] items-center justify-center">
				<Skeleton className="h-20 w-[7.5rem] rounded-xl" />
			</div>
			<Line box="mt-3 h-6" bar="h-4 w-3/5" />
			<div className="mt-auto flex items-center gap-2.5 border-t border-foreground/8 pt-4">
				<Skeleton className="size-8 shrink-0 rounded-full" />
				<div className="min-w-0 flex-1">
					<Line box="h-4" bar="h-3 w-20" />
					<Line box="h-4" bar="h-2.5 w-14" />
				</div>
				<Skeleton className="size-8 shrink-0 rounded-full" />
			</div>
		</div>
	);
}

export function NotesPanelSkeleton() {
	return (
		<div className="grid gap-4 sm:gap-5">
			<PanelHeaderSkeleton
				wrapDescription
				actions={[
					periodActionSkeleton,
					<Skeleton key="count" className="hidden h-11 w-24 rounded-full sm:block" />,
					<Skeleton key="new" className="hidden h-11 w-32 rounded-full sm:block" />,
				]}
			/>
			<div className="notes-grid notes-grid--four">
				{Array.from({ length: 8 }).map((_, index) => (
					<NoteCardSkeleton key={index} />
				))}
			</div>
		</div>
	);
}

/* ---------------------------------------------------------------- Finance */

function PieCardSkeleton() {
	return (
		<div className="app-card flex min-w-0 flex-col justify-between overflow-hidden p-4">
			<div className="mb-2 flex items-center justify-between gap-3">
				<div className="min-w-0">
					<Line box="h-5" bar="h-3.5 w-28" />
					<Line box="h-5" bar="h-3.5 w-24" />
				</div>
				<Line box="h-4" bar="h-3 w-10" />
			</div>
			<div className="flex w-full min-w-0 flex-col items-center justify-center gap-4 sm:flex-row">
				<Skeleton className="size-44 shrink-0 rounded-full sm:size-48" />
				<div className="w-full flex-1 space-y-1.5">
					{["w-3/4", "w-2/3"].map((width) => (
						<Line key={width} box="h-5" bar={`h-3 ${width}`} />
					))}
				</div>
			</div>
		</div>
	);
}

function LedgerSkeleton() {
	return (
		<div className="app-card p-4 sm:p-5">
			<div className="mb-5">
				<Line box="h-4" bar="h-3 w-16" />
				<div className="mt-2 flex items-center gap-3">
					<Line box="h-6" bar="h-5 w-36" />
					<Skeleton className="ml-auto size-10 shrink-0 rounded-full" />
				</div>
			</div>
			<Skeleton className="h-[8.0625rem] rounded-2xl" />
		</div>
	);
}

export function FinancePanelSkeleton() {
	return (
		<div className="grid gap-4 sm:gap-5">
			<PanelHeaderSkeleton actions={[periodActionSkeleton, primaryActionSkeleton("w-[9.25rem]")]} />
			<div className="app-card w-full min-w-0 p-4 sm:p-5">
				<div className="mb-5 flex min-w-0 flex-col items-stretch justify-between gap-4 sm:flex-row sm:flex-wrap sm:items-end">
					<div className="min-w-0">
						<Line box="h-4" bar="h-3 w-28" />
						<Line box="mt-1 h-[1.875rem] sm:mt-2 sm:h-[2.8125rem]" bar="h-6 w-48 sm:h-8 sm:w-64" />
						{/* Exchange-rate line wraps to two lines on phones. */}
						<div className="mt-2">
							<Line box="h-5" bar="h-3.5 w-72 max-w-full" />
							<Line box="h-5 sm:hidden" bar="h-3.5 w-32" />
						</div>
					</div>
					<div className="grid min-w-0 gap-2 sm:w-[10rem]">
						<Line box="h-5" bar="h-3.5 w-16" />
						<Skeleton className="h-12 w-full rounded-xl sm:h-11" />
					</div>
				</div>
				<div className="grid min-w-0 gap-4 sm:gap-6">
					<div className="app-card min-w-0 p-4">
						<div className="mb-4">
							<Line box="h-4" bar="h-3 w-28" />
							<Line box="mt-1 h-[1.875rem] sm:mt-2 sm:h-[2.34375rem]" bar="h-6 w-56 sm:h-7" />
						</div>
						<div className="pb-2">
							<Skeleton className="h-72 rounded-2xl" />
						</div>
					</div>
					<div className="grid min-w-0 gap-4 sm:gap-6 md:grid-cols-2">
						<PieCardSkeleton />
						<PieCardSkeleton />
					</div>
				</div>
			</div>
			<div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
				<LedgerSkeleton />
				<LedgerSkeleton />
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------- Mood */

function MoodCardSkeleton() {
	return (
		<div className="app-card p-4">
			<div className="flex items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					<Skeleton className="size-12 shrink-0 rounded-full" />
					<div className="min-w-0">
						<Line box="h-5" bar="h-3.5 w-28" />
						<Line box="h-4" bar="h-3 w-20" />
					</div>
				</div>
				<Skeleton className="size-9 rounded-full" />
			</div>
			<Line box="mt-3 h-5" bar="h-3.5 w-40" />
		</div>
	);
}

export function MoodPanelSkeleton() {
	return (
		<div className="grid gap-4 sm:gap-5">
			<PanelHeaderSkeleton actions={[periodActionSkeleton]} />
			<div className="app-card p-3 sm:p-5">
				<div className="flex items-start justify-between gap-4">
					<div>
						<Line box="h-[1.875rem]" bar="h-6 w-44" />
						<Line box="mt-1 h-4" bar="h-3 w-52" />
					</div>
					<Skeleton className="h-6 w-14 rounded-full" />
				</div>
				<div className="mt-4 grid grid-cols-7 gap-1 sm:gap-1.5 lg:gap-2.5">
					{Array.from({ length: 7 }).map((_, index) => (
						<div key={`weekday-${index}`} className="flex h-[1.4375rem] items-center justify-center">
							<Skeleton className="h-2.5 w-7 rounded-full" />
						</div>
					))}
					{Array.from({ length: 7 }).map((_, index) => (
						<Skeleton
							key={`day-${index}`}
							className="h-[4.7rem] rounded-2xl sm:min-h-[5.1rem] lg:min-h-[6rem]"
						/>
					))}
				</div>
			</div>
			<div className="grid gap-3 sm:grid-cols-2">
				<MoodCardSkeleton />
				<MoodCardSkeleton />
			</div>
			<div className="app-card p-3 sm:p-5">
				<div className="flex items-center gap-3">
					<Skeleton className="size-12 shrink-0 rounded-2xl" />
					<div className="min-w-0">
						<Line box="h-[1.875rem]" bar="h-6 w-52 max-w-full" />
						<Line box="h-5" bar="h-3.5 w-32" />
					</div>
				</div>
				<div className="mt-4 grid gap-4">
					<div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
						{Array.from({ length: 8 }).map((_, index) => (
							<Skeleton key={index} className="h-[4.8rem] rounded-2xl" />
						))}
					</div>
					<div className="grid gap-2">
						<Line box="h-5" bar="h-3.5 w-40" />
						<Skeleton className="h-[6.875rem] rounded-xl sm:h-24" />
					</div>
					<div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
						<Skeleton className="h-12 rounded-xl sm:h-11 sm:w-[8.5rem]" />
					</div>
				</div>
			</div>
		</div>
	);
}

/* ----------------------------------------------------------------- Memory */

function MemoryCardSkeleton() {
	return (
		<article className="app-card flex h-full flex-col overflow-visible">
			<Skeleton className="aspect-[16/9] shrink-0 rounded-none rounded-t-2xl sm:rounded-t-lg" />
			<div className="flex flex-1 flex-col gap-3 p-4">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0 flex-1">
						{/* The real chip is inline-flex, so its line box adds ~2px below it. */}
						<div className="h-[1.6875rem]">
							<Skeleton className="h-[1.5625rem] w-20 rounded-full" />
						</div>
						<Line box="mt-2 h-[1.875rem]" bar="h-6 w-3/4" />
						<Line box="mt-2 h-4" bar="h-3 w-24" />
					</div>
					<Skeleton className="size-9 shrink-0 rounded-full" />
				</div>
				<Skeleton className="mt-auto h-[7.125rem] rounded-2xl" />
				<Skeleton className="h-10 rounded-2xl" />
			</div>
		</article>
	);
}

export function MemoryPanelSkeleton() {
	return (
		<div className="grid gap-4 sm:gap-5">
			<PanelHeaderSkeleton actions={[primaryActionSkeleton("w-[9.375rem]")]} />
			<div className="relative">
				<Skeleton className="min-h-[22rem] rounded-2xl sm:min-h-[31rem]" />
			</div>
			<div className="notes-grid">
				{Array.from({ length: 4 }).map((_, index) => (
					<MemoryCardSkeleton key={index} />
				))}
			</div>
		</div>
	);
}

/* ----------------------------------------------------------------- Movies */

const movieSkeletonSections = ["Watching", "Wishlist", "Watched"];

function MoviePosterSkeleton({ active = false }: { active?: boolean }) {
	return (
		<div
			className={[
				"h-full overflow-hidden rounded-2xl transition-all duration-500",
				active ? "-translate-y-2 scale-100 opacity-100" : "translate-y-3 scale-[0.82] opacity-40",
			].join(" ")}
		>
			<Skeleton className="aspect-[2/3] rounded-2xl" />
		</div>
	);
}

function MovieSectionSkeleton({ section }: { section: string }) {
	return (
		<section className="grid min-w-0 content-start gap-3">
			<div className="app-card flex items-center justify-between px-4 py-3">
				<div className="flex min-w-0 items-center gap-3">
					<Skeleton className="size-9 shrink-0 rounded-full" />
					<Line box="h-6" bar="h-4 w-20" />
				</div>
				<Skeleton className="size-7 shrink-0 rounded-full" />
			</div>

			{/* Mobile carousel: centred poster with its neighbours peeking in. */}
			<div className="-mx-4 block overflow-hidden p-6 sm:hidden">
				<div className="flex items-stretch justify-center gap-3">
					<div className="w-[175px] shrink-0"><MoviePosterSkeleton /></div>
					<div className="w-[175px] shrink-0"><MoviePosterSkeleton active /></div>
					<div className="w-[175px] shrink-0"><MoviePosterSkeleton /></div>
				</div>
			</div>

			<div className="hidden gap-4 sm:grid md:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-7">
				{Array.from({ length: 5 }).map((_, index) => (
					<Skeleton
						key={`${section}-${index}`}
						className={`aspect-[2/3] rounded-2xl ${index > 0 ? "hidden md:block" : ""} ${index > 2 ? "md:hidden lg:block" : ""}`}
					/>
				))}
			</div>
		</section>
	);
}

export function MoviesPanelSkeleton() {
	return (
		<div className="grid gap-4 sm:gap-5">
			<PanelHeaderSkeleton actions={[primaryActionSkeleton("w-[8.5625rem]")]} />
			<div className="grid gap-6">
				{movieSkeletonSections.map((section) => (
					<MovieSectionSkeleton key={section} section={section} />
				))}
			</div>
		</div>
	);
}

/* --------------------------------------------------------------- Personal */

function ProfileStatBoxesSkeleton() {
	return (
		<div className="mt-6 hidden grid-cols-3 gap-3 lg:grid">
			{["w-14", "w-16", "w-16"].map((width, index) => (
				<div key={index} className="rounded-2xl border border-foreground/8 p-4">
					<Line box="h-4" bar={`h-3 ${width}`} />
					<Line box="mt-1 h-8" bar="h-5 w-12" />
				</div>
			))}
		</div>
	);
}

function ProfileCardSkeleton({ partner = false }: { partner?: boolean }) {
	return (
		<div className="app-card p-4 sm:p-5 lg:min-h-[18rem] lg:p-7">
			<div className="flex items-center gap-3 lg:items-start lg:gap-5">
				<Skeleton className="size-14 shrink-0 rounded-full lg:size-24" />
				<div className="min-w-0 flex-1">
					<Line box="h-[0.9375rem]" bar="h-2 w-12" />
					<Line
						box={partner ? "h-[1.875rem] lg:h-[2.8125rem]" : "h-[1.875rem] lg:h-[3.75rem]"}
						bar={partner ? "h-6 w-40 lg:h-8 lg:w-48" : "h-6 w-40 lg:h-10 lg:w-56"}
					/>
					<Line box={partner ? "h-4" : "h-4 lg:mt-2 lg:h-5"} bar="h-3 w-40 max-w-full" />
				</div>
			</div>
			<ProfileStatBoxesSkeleton />
			{partner ? (
				<Skeleton className="mt-4 h-[2.875rem] rounded-2xl lg:mt-6" />
			) : (
				<Skeleton className="mt-4 h-11 rounded-2xl lg:mt-6" />
			)}
		</div>
	);
}

function PreferenceRowSkeleton({ control }: { control: string }) {
	return (
		<div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
			<div className="flex min-w-0 items-center gap-3">
				<Skeleton className="size-10 shrink-0 rounded-full" />
				<div className="min-w-0">
					<Line box="h-5" bar="h-3.5 w-24" />
					<Line box="mt-0.5 h-5" bar="h-3 w-48 max-w-full" />
				</div>
			</div>
			<Skeleton className={`shrink-0 rounded-full ${control}`} />
		</div>
	);
}

export function PersonalPanelSkeleton() {
	return (
		<div className="grid gap-4 sm:gap-5">
			<PanelHeaderSkeleton wrapDescription />
			<div className="grid gap-4 md:grid-cols-2 lg:items-stretch">
				<ProfileCardSkeleton />
				<ProfileCardSkeleton partner />
			</div>
			<div className="grid gap-4">
				<div className="app-card p-4 sm:p-5 lg:p-7">
					<div className="flex items-start justify-between gap-4">
						<div className="min-w-0 flex-1">
							<Line box="h-[0.9375rem]" bar="h-2 w-20" />
							<Line box="mt-1 h-[1.875rem] lg:h-[3.75rem]" bar="h-6 w-56 max-w-full lg:h-10 lg:w-96" />
						</div>
						<Skeleton className="size-11 shrink-0 rounded-full" />
					</div>
					<div className="mt-5 grid grid-cols-2 gap-3">
						{["w-10", "w-12"].map((width) => (
							<div key={width} className="rounded-2xl border border-foreground/8 p-4">
								<Line box="h-4" bar={`h-3 ${width}`} />
								<Line box="mt-1 h-6" bar="h-4 w-24 max-w-full" />
							</div>
						))}
					</div>
				</div>
				<div className="app-card p-4 sm:p-5 lg:p-7">
					<Line box="h-[0.9375rem]" bar="h-2 w-24" />
					<Line box="mt-1 h-[1.875rem]" bar="h-6 w-40" />
					<div className="mt-5 divide-y divide-foreground/8">
						<PreferenceRowSkeleton control="h-[2.875rem] w-full sm:w-[19rem]" />
						<PreferenceRowSkeleton control="h-10 w-full sm:w-32" />
						<PreferenceRowSkeleton control="h-10 w-full sm:w-32" />
						<PreferenceRowSkeleton control="h-10 w-full sm:w-52" />
						<PreferenceRowSkeleton control="h-10 w-full sm:w-32" />
					</div>
				</div>
			</div>
		</div>
	);
}
