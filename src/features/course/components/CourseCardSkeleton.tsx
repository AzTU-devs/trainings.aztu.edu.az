import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder with the exact shape of `CourseCard`, so nothing jumps on load. */
export function CourseCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex h-full flex-col rounded-3xl border border-border/80 bg-card p-2 elev-1"
    >
      <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
      <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
        <div className="flex gap-1.5">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="mt-3.5 h-4 w-11/12 rounded-full" />
        <Skeleton className="mt-2 h-4 w-2/3 rounded-full" />
        <Skeleton className="mt-3.5 h-3 w-full rounded-full" />
        <Skeleton className="mt-2 h-3 w-4/5 rounded-full" />
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-3 border-t border-border/80 pt-3.5">
            <div className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-3 w-24 rounded-full" />
            </div>
            <Skeleton className="h-3 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
