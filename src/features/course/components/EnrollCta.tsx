"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { request } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { useAuth } from "@/features/auth/hooks";
import { useT, useLocale } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import { formatPrice } from "@/lib/utils/format";
import type { ApiError } from "@/types/api";
import type { Course } from "../types";

export function EnrollCta({ course, compact }: { course: Course; compact?: boolean }) {
  const router = useRouter();
  const { status } = useAuth();
  const t = useT();
  const locale = useLocale();

  const hasLessons = course.modules.some((m) => m.lessons.length > 0);

  const enrollFree = useMutation({
    mutationFn: () =>
      request({
        url: endpoints.portal.enrollFree(course.id),
        method: "POST",
      }),
    onSuccess: () => {
      toast.success(t("courseDetail.enrolled"));
      // Only open the player when there is something to play. A course published
      // before its lessons exist is normal, and sending the student to /learn just
      // to be bounced back reads as the enrolment having failed. Staying put shows
      // them the success toast against the course they just joined; refresh() picks
      // up the server-rendered state now that they are enrolled.
      if (hasLessons) {
        router.push(localeHref(locale, `/learn/${course.slug}`));
      } else {
        router.refresh();
      }
    },
    onError: (err) => {
      const e = err as unknown as ApiError;
      // This button does not know whether the participant has already joined, so
      // a second click is routine rather than a failure: take them to the course
      // they are in instead of showing the API's English conflict message.
      if (e.code === "ALREADY_ENROLLED") {
        toast.info(t("courseDetail.alreadyEnrolled"));
        if (hasLessons) router.push(localeHref(locale, `/learn/${course.slug}`));
        return;
      }
      toast.error(e.message ?? t("courseDetail.enrollError"));
    },
  });

  // No payment provider exists, so the API refuses every order and the catalogue
  // serves free courses only — a paid course is reachable by direct link alone.
  // Say that plainly rather than sending the visitor to a checkout that cannot
  // charge them; signing in first would not change the answer, so this comes
  // before the sign-in prompt. Restoring the paid call to action is described in
  // ../payments.ts.
  if (!course.free) {
    return (
      <div className="space-y-3">
        {/* Wraps instead of overflowing: the label and price are long for a
            sidebar-width pill. */}
        <Button
          className="h-auto min-h-12 w-full whitespace-normal py-3 text-center leading-snug"
          size="lg"
          disabled
        >
          {t("courseDetail.paidUnavailable")} ·{" "}
          {formatPrice(course.price, course.currency, locale)}
        </Button>
        <p className="rounded-2xl bg-muted/70 px-4 py-3 text-center text-xs leading-relaxed text-muted-foreground">
          {t("courseDetail.paidUnavailableHint")}
        </p>
      </div>
    );
  }

  // The design's primary pill; `compact` drops to the default height for the
  // phone action bar.
  const cls = compact ? "btn btn-primary btn-block" : "btn btn-primary btn-lg btn-block";

  if (status !== "authenticated") {
    return (
      <button
        type="button"
        className={cls}
        onClick={() =>
          router.push(
            localeHref(locale, "/login") +
              `?next=${encodeURIComponent(localeHref(locale, `/courses/${course.slug}`))}`,
          )
        }
      >
        <LogIn className="i" aria-hidden />
        {t("courseDetail.signInToEnroll")}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={cls}
      disabled={enrollFree.isPending}
      aria-busy={enrollFree.isPending || undefined}
      onClick={() => enrollFree.mutate()}
    >
      {enrollFree.isPending ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : null}
      {t("courseDetail.enrollFree")}
      <ArrowRight className="i i-arrow" aria-hidden />
    </button>
  );
}
