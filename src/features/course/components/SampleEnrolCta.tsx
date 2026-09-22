"use client";

import { ArrowRight, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks";
import { useLocale, useT } from "@/i18n/client";
import { localeHref } from "@/i18n/href";

/**
 * The enrol button on a sample course (see src/features/showcase). There is no
 * course behind it to join, so a signed-in visitor is told so instead of
 * getting an error from the API; signing in works as on a real course.
 */
export function SampleEnrolCta({ slug, compact }: { slug: string; compact?: boolean }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { status } = useAuth();
  const cls = compact ? "btn btn-primary btn-block" : "btn btn-primary btn-lg btn-block";

  if (status !== "authenticated") {
    return (
      <button
        type="button"
        className={cls}
        onClick={() =>
          router.push(
            `${localeHref(locale, "/login")}?next=${encodeURIComponent(localeHref(locale, `/courses/${slug}`))}`,
          )
        }
      >
        <LogIn className="i" aria-hidden />
        {t("courseDetail.signInToEnroll")}
      </button>
    );
  }
  return (
    <button type="button" className={cls} onClick={() => toast.info(t("course2.sampleNotice"))}>
      {t("courseDetail.enrollFree")}
      <ArrowRight className="i i-arrow" aria-hidden />
    </button>
  );
}
