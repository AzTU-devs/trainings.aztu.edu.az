import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** A quiet aside with a gold left rule (sparse-catalogue notes, hints). */
export function Note({
  children,
  className,
  role,
}: {
  children: ReactNode;
  className?: string;
  role?: "alert" | "status" | "note";
}) {
  return (
    <div role={role} className={cn("note t-body", className)}>
      {children}
    </div>
  );
}
