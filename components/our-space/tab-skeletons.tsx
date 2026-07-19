import { Skeleton } from "@/components/ui/skeleton";

function NoteCardSkeleton() {
	return (
		<div className="app-card content-fade-in grid h-[20rem] gap-4 p-5">
			<div className="space-y-3">
				<Skeleton className="h-3 w-28 rounded-full" />
				<Skeleton className="h-7 w-3/4 rounded-xl" />
			</div>
			<Skeleton className="min-h-0 flex-1 rounded-2xl" />
		</div>
	);
}

function PanelHeaderSkeleton({
	action = false,
	actionMobile = true,
	description = false,
}: {
	action?: boolean;
	actionMobile?: boolean;
	description?: boolean;
}) {
	return (
		<div className="flex items-center justify-between gap-4 sm:items-end">
			<div className="min-w-0 space-y-2">
				<Skeleton className="h-9 w-52 rounded-2xl sm:h-12 sm:w-72" />
				{description ? (
					<Skeleton className="h-4 w-64 max-w-full rounded-full" />
				) : null}
			</div>
			{action ? (
				<Skeleton
					className={[
						"rounded-2xl sm:h-11 sm:w-36",
						actionMobile ? "size-12" : "hidden sm:block",
					].join(" ")}
				/>
			) : null}
		</div>
	);
}

export function NotesPanelSkeleton() {
	return (
		<div className="grid gap-4 sm:gap-5">
			<PanelHeaderSkeleton
				description
				action
			/>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{Array.from({ length: 6 }).map((_, index) => (
					<NoteCardSkeleton key={index} />
				))}
			</div>
		</div>
	);
}

function LedgerSkeleton() {
	return (
		<div className="app-card p-4 sm:p-5">
			<div className="mb-5 space-y-3">
				<Skeleton className="h-3 w-24 rounded-full" />
				<div className="flex items-center gap-3">
					<Skeleton className="h-8 w-44 rounded-2xl" />
					<Skeleton className="ml-auto size-10 rounded-full sm:size-9" />
				</div>
			</div>
			<div className="grid gap-3 sm:gap-5">
				{Array.from({ length: 3 }).map((_, index) => (
					<div
						key={index}
						className="rounded-2xl border border-neutral-900/10 bg-bg/70 p-4"
					>
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0 flex-1 space-y-2">
								<Skeleton className="h-5 w-4/5 rounded-full" />
								<Skeleton className="h-4 w-36 rounded-full" />
							</div>
							<Skeleton className="h-5 w-20 rounded-full" />
						</div>
						<Skeleton className="mt-3 h-7 w-24 rounded-full" />
						<Skeleton className="mt-3 h-4 w-3/5 rounded-full" />
					</div>
				))}
			</div>
		</div>
	);
}

export function FinancePanelSkeleton() {
	return (
		<div className="grid gap-4 sm:gap-5">
			<PanelHeaderSkeleton
				description
				action
			/>
			<div className="app-card w-full min-w-0 p-4 sm:p-5">
				<div className="mb-5 flex min-w-0 flex-col items-stretch justify-between gap-4 sm:flex-row sm:flex-wrap sm:items-end">
					<div className="min-w-0 space-y-2">
						<Skeleton className="h-3 w-32 rounded-full" />
						<Skeleton className="h-9 w-56 rounded-2xl sm:h-10 sm:w-72" />
						<Skeleton className="h-4 w-64 max-w-full rounded-full" />
					</div>
					<Skeleton className="h-12 w-full rounded-2xl sm:w-56" />
				</div>
				<div className="grid min-w-0 gap-4 sm:gap-6">
					<div className="rounded-2xl border border-dashed border-neutral-400 p-4">
						<div className="mb-4 space-y-2">
							<Skeleton className="h-3 w-28 rounded-full" />
							<Skeleton className="h-8 w-48 rounded-2xl" />
						</div>
						<Skeleton className="h-72 rounded-2xl" />
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						<Skeleton className="h-64 rounded-2xl" />
						<Skeleton className="h-64 rounded-2xl" />
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

function MoodCardSkeleton() {
	return (
		<div className="app-card p-4">
			<div className="flex items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					<Skeleton className="size-11 shrink-0 rounded-full" />
					<div className="min-w-0 space-y-2">
						<Skeleton className="h-4 w-32 rounded-full" />
						<Skeleton className="h-3 w-28 rounded-full" />
					</div>
				</div>
				<Skeleton className="size-10 rounded-full" />
			</div>
			<Skeleton className="mt-4 h-4 w-24 rounded-full" />
			<Skeleton className="mt-3 h-16 rounded-2xl" />
		</div>
	);
}

export function MoodPanelSkeleton() {
	return (
		<div className="grid gap-4 sm:gap-5">
			<PanelHeaderSkeleton description />
			<div className="app-card p-3 sm:p-5">
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-2">
						<Skeleton className="h-8 w-44 rounded-2xl" />
						<Skeleton className="h-3 w-52 rounded-full" />
					</div>
					<Skeleton className="h-7 w-20 rounded-full" />
				</div>
				<div className="mt-4 grid grid-cols-7 gap-1 sm:gap-1.5 lg:gap-2.5">
					{Array.from({ length: 7 }).map((_, index) => (
						<Skeleton
							key={`weekday-${index}`}
							className="mx-auto h-3 w-7 rounded-full"
						/>
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
					<div className="min-w-0 space-y-2">
						<Skeleton className="h-8 w-56 max-w-full rounded-2xl" />
						<Skeleton className="h-4 w-36 rounded-full" />
					</div>
				</div>
				<div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
					{Array.from({ length: 8 }).map((_, index) => (
						<Skeleton
							key={index}
							className="min-h-[4.8rem] rounded-2xl"
						/>
					))}
				</div>
				<Skeleton className="mt-4 h-28 rounded-2xl" />
				<div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
					<Skeleton className="h-11 rounded-2xl sm:w-36" />
					<Skeleton className="h-11 rounded-2xl sm:w-32" />
				</div>
			</div>
		</div>
	);
}

function MemoryCardSkeleton({ withImage = true }: { withImage?: boolean }) {
	return (
		<article className="app-card app-card-interactive flex h-full flex-col overflow-visible">
			{withImage ? (
				<Skeleton className="aspect-[16/9] shrink-0 rounded-t-2xl sm:rounded-t-lg" />
			) : null}
			<div className="flex flex-1 flex-col gap-3 p-4">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0 flex-1">
						<Skeleton className="h-6 w-24 rounded-full" />
						<Skeleton className="mt-2 h-8 w-3/4 rounded-2xl" />
					</div>
					<Skeleton className="size-10 rounded-full" />
				</div>

				<div className="flex flex-col gap-1">
					<Skeleton className="h-4 w-32 rounded-full" />
					<div className="mt-2 border-l-[3px] border-neutral-200 pl-3 dark:border-neutral-800">
						<div className="space-y-2 pr-3">
							<Skeleton className="h-4 w-full rounded-full" />
							<Skeleton className="h-4 w-11/12 rounded-full" />
						</div>
					</div>
				</div>

				<Skeleton className="mt-auto h-10 w-full rounded-2xl" />
			</div>
		</article>
	);
}

export function MemoryPanelSkeleton() {
	return (
		<div className="grid gap-4 sm:gap-5">
			<PanelHeaderSkeleton
				description
				action
				actionMobile={false}
			/>
			<div className="relative overflow-hidden rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.2)]">
				<Skeleton className="min-h-[22rem] rounded-2xl sm:min-h-[31rem]" />
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<MemoryCardSkeleton />
				<MemoryCardSkeleton />
				<MemoryCardSkeleton />
				<MemoryCardSkeleton />
			</div>
		</div>
	);
}

const movieSkeletonSections = ["Watching", "Wishlist", "Watched"];

function MoviePosterSkeleton({
	active = false,
}: {
	active?: boolean;
}) {
	return (
		<div
			className={[
				"app-card h-full overflow-hidden p-0 rounded-2xl transition-all duration-500",
				active
					? "-translate-y-2 scale-100 opacity-100 shadow-[10px_10px_30px_-10px_rgba(0,0,0,0.5)] ring-1 ring-black/5"
					: "translate-y-3 scale-[0.82] opacity-40",
			].join(" ")}
		>
			<Skeleton className="aspect-[2/3] rounded-none" />
		</div>
	);
}

function MovieSectionSkeleton({ section }: { section: string }) {
	return (
		<section className="grid min-w-0 content-start gap-3">
			<div className="flex items-center justify-between rounded-2xl bg-neutral-950 px-4 py-3">
				<Skeleton className="h-5 w-24 rounded-full bg-white/20" />
				<Skeleton className="h-6 w-9 rounded-full bg-white/20" />
			</div>

			<div className="block overflow-hidden p-6 sm:hidden -mx-4">
				<div className="flex items-stretch justify-center gap-3">
					<div className="w-[175px] shrink-0">
						<MoviePosterSkeleton />
					</div>
					<div className="w-[175px] shrink-0">
						<MoviePosterSkeleton active />
					</div>
					<div className="w-[175px] shrink-0">
						<MoviePosterSkeleton />
					</div>
				</div>
				<div className="mt-3 flex justify-center gap-1.5">
					<Skeleton className="size-1.5 rounded-full bg-neutral-950/30" />
					<Skeleton className="h-1.5 w-4 rounded-full bg-neutral-950/70" />
					<Skeleton className="size-1.5 rounded-full bg-neutral-950/30" />
				</div>
			</div>

			<div className="hidden grid-cols-3 gap-4 sm:grid lg:grid-cols-4 2xl:grid-cols-5">
				{Array.from({ length: 5 }).map((_, index) => (
					<div
						key={`${section}-${index}`}
						className="app-card overflow-hidden rounded-2xl p-0"
					>
						<Skeleton className="aspect-[2/3] rounded-none" />
					</div>
				))}
			</div>
		</section>
	);
}

export function MoviesPanelSkeleton() {
	return (
		<div className="grid gap-4 sm:gap-5">
			<PanelHeaderSkeleton
				description
				action
				actionMobile={false}
			/>
			<div className="grid gap-6">
				{movieSkeletonSections.map((section) => (
					<MovieSectionSkeleton
						key={section}
						section={section}
					/>
				))}
			</div>
		</div>
	);
}

function ProfileCardSkeleton({ large = false }: { large?: boolean }) {
	return (
		<div
			className={[
				"app-card p-4 sm:p-5 lg:p-7",
				large ? "lg:col-span-7 lg:min-h-[18rem]" : "lg:col-span-5",
			].join(" ")}
		>
			<div className="flex items-center gap-3 lg:items-start lg:gap-5">
				<Skeleton
					className={[
						"size-14 rounded-full",
						large ? "lg:size-24" : "lg:size-20",
					].join(" ")}
				/>
				<div className="min-w-0 flex-1 space-y-2">
					<Skeleton className="h-3 w-20 rounded-full" />
					<Skeleton className="h-8 w-4/5 rounded-2xl lg:h-12" />
					<Skeleton className="h-4 w-2/3 rounded-full" />
				</div>
			</div>
			{large ? (
				<div className="mt-6 hidden grid-cols-3 gap-3 lg:grid">
					<Skeleton className="h-24 rounded-2xl" />
					<Skeleton className="h-24 rounded-2xl" />
					<Skeleton className="h-24 rounded-2xl" />
				</div>
			) : (
				<Skeleton className="mt-4 h-16 rounded-2xl lg:mt-8" />
			)}
			{large ? <Skeleton className="mt-4 h-11 rounded-2xl sm:w-36 lg:mt-6" /> : null}
		</div>
	);
}

export function PersonalPanelSkeleton() {
	return (
		<div className="grid gap-4 sm:gap-5">
			<PanelHeaderSkeleton
				description
				action={false}
			/>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12 lg:items-stretch">
				<ProfileCardSkeleton large />
				<ProfileCardSkeleton />
			</div>
			<div className="app-card p-4 sm:p-5 lg:p-7">
				<div className="flex items-start justify-between gap-4 lg:items-center">
					<div className="space-y-2">
						<Skeleton className="h-3 w-28 rounded-full" />
						<Skeleton className="h-9 w-64 rounded-2xl lg:h-12 lg:w-80" />
						<Skeleton className="h-4 w-44 rounded-full" />
						<Skeleton className="h-4 w-36 rounded-full" />
					</div>
					<Skeleton className="size-11 rounded-full" />
				</div>
				<div className="mt-4 grid grid-cols-2 gap-3 lg:max-w-md">
					<Skeleton className="h-11 rounded-2xl" />
					<Skeleton className="h-11 rounded-2xl" />
				</div>
			</div>
			<div className="app-card grid gap-3 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center lg:p-7">
				<Skeleton className="h-3 w-24 rounded-full" />
				<div className="grid gap-3 sm:flex sm:flex-wrap">
					<Skeleton className="h-12 rounded-2xl sm:w-72" />
					<Skeleton className="h-12 rounded-2xl sm:w-48" />
					<Skeleton className="h-12 rounded-2xl sm:w-32" />
				</div>
			</div>
		</div>
	);
}
