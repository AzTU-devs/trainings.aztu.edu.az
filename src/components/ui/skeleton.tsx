import { cn } from "@/lib/utils/cn";

/** A quiet placeholder block: paper-2, a slow pulse that stops under reduced motion. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-poster bg-paper-2 motion-reduce:animate-none", className)}
      {...props}
    />
  );
}
