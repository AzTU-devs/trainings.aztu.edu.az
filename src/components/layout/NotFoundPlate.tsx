import { cn } from "@/lib/utils/cn";

/**
 * The 404's picture: a navy "brand" plate from the cover family (inset frame,
 * mono header) whose figure is the number itself, a giant italic Fraunces
 * "404" cropped by the bottom edge like the portrait initials, the zero in the
 * poster's gold second ink. Universal (no hooks), so the bilingual root 404
 * uses it too. Decorative: the page says "page not found" in text.
 *
 * The frame is square beside the text (4:5 in the narrower tablet column) and
 * 16:10 on phones, where it follows the text instead of pushing it down.
 */
export function NotFoundPlate({ label, className }: { label: string; className?: string }) {
  return (
    <div
      data-cat="brand"
      aria-hidden="true"
      className={cn("cover cover-plate [--ratio:16/10] md:[--ratio:4/5] lg:[--ratio:1/1]", className)}
    >
      <div className="cover-labels">
        <span>AzTU EduPlatform</span>
        <span>{label}</span>
      </div>
      <span className="absolute -bottom-[0.2em] left-[4cqi] font-display text-[62cqi] leading-none font-[360] tracking-[-0.06em] whitespace-nowrap italic [font-variant-numeric:lining-nums] [font-variation-settings:'SOFT'_100,'WONK'_1] max-md:text-[46cqi]">
        4<span className="text-(--cv-ac)">0</span>4
      </span>
    </div>
  );
}
