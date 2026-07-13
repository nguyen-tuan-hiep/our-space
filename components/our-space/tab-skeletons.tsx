import { Skeleton } from "@/components/ui/skeleton";

function PanelHeaderSkeleton({
	action = false,
	description = false,
}: {
	action?: boolean;
	description?: boolean;
}) {
	return (
		<div className="flex items-center justify-between gap-4 sm:items-end">
			<div className="min-w-0 space-y-2">
				<Skeleton className="h-9 w-52 rounded-2xl sm:h-12 sm:w-72" />
				{description ? (
					<Skeleton className="hidden h-4 w-64 rounded-full sm:block" />
				) : null}
			</div>
			{action ? (
				<Skeleton className="size-12 rounded-2xl sm:h-11 sm:w-36" />
			) : null}
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
			<PanelHeaderSkeleton action />
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
		<article className="app-card overflow-hidden">
			{withImage ? <Skeleton className="aspect-[16/10] rounded-t-2xl" /> : null}
			<div className="grid gap-3 p-4">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0 flex-1 space-y-2">
						<Skeleton className="h-3 w-20 rounded-full" />
						{/* <Skeleton className="h-8 w-full rounded-2xl" /> */}
						<Skeleton className="h-8 w-3/4 rounded-2xl" />
					</div>
					<Skeleton className="size-10 rounded-full" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-32 rounded-full" />
					{/* <Skeleton className="h-4 w-full rounded-full" /> */}
					<Skeleton className="h-4 w-4/5 rounded-full" />
				</div>
				<Skeleton className="h-10 w-full rounded-2xl sm:w-36" />
			</div>
		</article>
	);
}

export function MemoryPanelSkeleton() {
	return (
		<div className="grid gap-4 sm:gap-5">
			<PanelHeaderSkeleton description action />
			<div className="app-card overflow-hidden">
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
			<PanelHeaderSkeleton action={false} />
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
