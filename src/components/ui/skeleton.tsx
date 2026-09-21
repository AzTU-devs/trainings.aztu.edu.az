import { cn } from "@/lib/utils/cn";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-muted motion-reduce:animate-none dark:bg-white/[0.06]",
        className,
      )}
      {...props}
    />
  );
}
