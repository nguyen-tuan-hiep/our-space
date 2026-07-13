import { Skeleton } from "@/components/ui/skeleton";

const movieSkeletonSections = ["Watching", "Wishlist", "Watched"];

export function MoviesPanelSkeleton() {
	return (
		<div className="grid gap-6">
			{movieSkeletonSections.map((section) => (
				<section
					key={section}
					className="grid gap-3"
				>
					<div className="flex items-center justify-between rounded-2xl bg-neutral-950 px-4 py-3">
						<Skeleton className="h-5 w-24 rounded-full bg-white/20" />
						<Skeleton className="h-6 w-9 rounded-full bg-white/20" />
					</div>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
						{Array.from({ length: 5 }).map((_, index) => (
							<div
								key={index}
								className="app-card overflow-hidden p-0"
							>
								<Skeleton className="aspect-[2/3] rounded-none" />
							</div>
						))}
					</div>
				</section>
			))}
		</div>
	);
}
