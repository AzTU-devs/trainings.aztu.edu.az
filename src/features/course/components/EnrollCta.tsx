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

  const enrollFree = useMutation({
    mutationFn: () =>
      request({
        url: endpoints.portal.enrollFree(course.id),
        method: "POST",
      }),
    onSuccess: () => {
      toast.success(t("courseDetail.enrolled"));
      router.push(localeHref(locale, `/learn/${course.slug}`));
    },
    onError: (err) => {
      const e = err as unknown as ApiError;
      toast.error(e.message ?? t("courseDetail.enrollError"));
    },
  });

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

  if (course.free) {
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

  if (course.courseType === "OFFLINE") {
    return (
      <Button
        className="w-full"
        size="lg"
        onClick={() => router.push(localeHref(locale, `/checkout/${course.slug}`))}
      >
        {t("courseDetail.requestEnrollment")} ·{" "}
        {formatPrice(course.price, course.currency)}
      </Button>
    );
  }

  return (
    <Button
      className="w-full"
      size="lg"
      onClick={() => router.push(localeHref(locale, `/checkout/${course.slug}`))}
    >
      {t("courseDetail.buyNow")} · {formatPrice(course.price, course.currency)}
    </Button>
  );
}
