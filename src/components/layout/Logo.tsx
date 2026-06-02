import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export function Logo({
  className,
  showText = true,
  variant = "auto",
}: {
  className?: string;
  showText?: boolean;
  variant?: "auto" | "light" | "dark" | "mark";
}) {
  // mark = small square icon (for compact placements)
  if (variant === "mark") {
    return (
      <span className={cn("inline-flex items-center", className)}>
        <Image
          src="/aztu-logo-mark.png"
          alt="AZTU"
          width={40}
          height={40}
          className="size-9 object-contain"
          priority
        />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/aztu-logo-mark.png"
        alt="AZTU"
        width={40}
        height={40}
        className="size-9 object-contain"
        priority
      />
      {showText ? (
        <span className="flex flex-col leading-none">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            AZTU
          </span>
          <span className="text-sm font-semibold tracking-tight">
            edu<span className="text-primary">.</span>platform
          </span>
        </span>
      ) : null}
    </span>
  );
}
