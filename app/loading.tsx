import { Skeleton } from "@/components/ui/skeleton";

function NoteCardSkeleton() {
  return (
    <div className="app-card grid h-[20rem] gap-4 p-5">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-3 w-1/2 rounded-full" />
        <Skeleton className="h-7 w-full rounded-xl" />
      </div>
      <Skeleton className="min-h-1 flex-1 rounded-2xl" />
    </div>
  );
}

export default function Loading() {
  return (
    <main className="min-h-svh overflow-x-clip bg-bg mobile-native-shell lg:pl-72">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-neutral-900/10 bg-paper/95 p-4 lg:flex">
        <Skeleton className="h-16 rounded-3xl" />
        <div className="mt-6 grid gap-2">
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
        </div>
        <Skeleton className="mt-6 h-40 rounded-3xl" />
        <div className="mt-auto pt-6">
          <Skeleton className="h-36 rounded-3xl" />
        </div>
      </aside>

      <div className="lg:hidden">
        <Skeleton className="h-[36svh] rounded-b-[2rem]" />
      </div>

      <section className="container-page pb-[calc(env(safe-area-inset-bottom)+8.5rem)] pt-4 sm:py-8 lg:max-w-none lg:px-8 lg:py-8 xl:px-10">
        <div className="hidden items-start justify-between gap-6 lg:flex">
          <div className="space-y-3">
            <Skeleton className="h-4 w-56 rounded-full" />
            <Skeleton className="h-12 w-80 rounded-2xl" />
          </div>
          <Skeleton className="size-12 rounded-2xl" />
        </div>

        <Skeleton className="mt-0 h-28 rounded-2xl lg:mt-6" />

        <div className="mt-4 hidden rounded-[1.75rem] border border-neutral-900/10 bg-paper/88 p-2 sm:block lg:hidden">
          <div className="grid grid-cols-4 gap-1">
            <Skeleton className="h-12 rounded-2xl" />
            <Skeleton className="h-12 rounded-2xl" />
            <Skeleton className="h-12 rounded-2xl" />
            <Skeleton className="h-12 rounded-2xl" />
          </div>
        </div>

        <div className="mobile-tab-panel-in mt-4 sm:material-section sm:mt-5 sm:p-5 lg:mt-6 lg:p-6">
          <div className="flex items-center justify-between gap-4 sm:items-end">
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-10 w-52 rounded-2xl sm:h-14" />
              <Skeleton className="h-4 w-64 max-w-full rounded-full" />
            </div>
            <Skeleton className="size-12 rounded-2xl sm:h-11 sm:w-32" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <NoteCardSkeleton />
            <NoteCardSkeleton />
            <NoteCardSkeleton />
            <NoteCardSkeleton />
          </div>
        </div>
      </section>
    </main>
  );
}
