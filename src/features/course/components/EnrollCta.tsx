"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { request } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { useAuth } from "@/features/auth/hooks";
import { useT, useLocale } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import { formatPrice } from "@/lib/utils/format";
import type { ApiError } from "@/types/api";
import type { Course } from "../types";

export function EnrollCta({ course }: { course: Course }) {
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
      <div className="space-y-2">
        <Button className="w-full" size="lg" disabled>
          {t("courseDetail.paidUnavailable")} ·{" "}
          {formatPrice(course.price, course.currency)}
        </Button>
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          {t("courseDetail.paidUnavailableHint")}
        </p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <Button
        className="w-full"
        size="lg"
        onClick={() =>
          router.push(
            localeHref(locale, "/login") +
              `?next=${encodeURIComponent(localeHref(locale, `/courses/${course.slug}`))}`,
          )
        }
      >
        {t("courseDetail.signInToEnroll")}
      </Button>
    );
  }

  return (
    <Button
      className="w-full"
      size="lg"
      loading={enrollFree.isPending}
      onClick={() => enrollFree.mutate()}
    >
      {t("courseDetail.enrollFree")}
    </Button>
  );
}
