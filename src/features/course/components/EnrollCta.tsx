"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { request } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { useAuth } from "@/features/auth/hooks";
import { useT, useLocale } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { ApiError } from "@/types/api";

/**
 * What the call to action needs to know about the course. Plain data, so the
 * page can render the button in several places (title, enrol card, running
 * head, phone bar) without serialising the whole course — modules and all —
 * into each client boundary.
 */
export type EnrollTarget = {
  id: string;
  slug: string;
  free: boolean;
  price: string | number;
  currency: string;
  /** Whether any module has a lesson: decides between opening the player and staying put. */
  hasLessons: boolean;
};

/** The enrolment refusals a participant can understand (codes from the API's enrol endpoint). */
const ENROLL_ERROR_KEY = new Map<string, string>([
  ["COURSE_FULL", "courseDetail.enrollErrorFull"],
  ["ENROLLMENT_REVOKED", "courseDetail.enrollErrorRevoked"],
  ["COURSE_NOT_PUBLISHED", "courseDetail.enrollErrorClosed"],
  ["PAYMENT_REQUIRED", "courseDetail.enrollErrorPaid"],
]);

/**
 * The enrolment behaviour, unchanged from the single-button version: the
 * free-enrol mutation, where it leads, and the signed-out detour through
 * login with `?next=` back to this course.
 */
export function useEnrollAction(target: EnrollTarget) {
  const router = useRouter();
  const { status } = useAuth();
  const t = useT();
  const locale = useLocale();

  const { hasLessons } = target;

  const enrollFree = useMutation({
    mutationFn: () =>
      request({
        url: endpoints.portal.enrollFree(target.id),
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
        router.push(localeHref(locale, `/learn/${target.slug}`));
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
        if (hasLessons) router.push(localeHref(locale, `/learn/${target.slug}`));
        return;
      }
      // The API's `message` is English and written for developers, so it is
      // never shown: a refusal the participant can act on gets its own
      // translated line, anything else the generic one.
      toast.error(t((e.code && ENROLL_ERROR_KEY.get(e.code)) || "courseDetail.enrollError"));
    },
  });

  const signIn = () =>
    router.push(
      localeHref(locale, "/login") +
        `?next=${encodeURIComponent(localeHref(locale, `/courses/${target.slug}`))}`,
    );

  return {
    /** Anything but a confirmed session (idle, loading, signed out) gets the sign-in path, as before. */
    signedIn: status === "authenticated",
    pending: enrollFree.isPending,
    enroll: () => enrollFree.mutate(),
    signIn,
  };
}

/**
 * The course's call to action. The page renders it in up to four places; each
 * one runs the same logic through `useEnrollAction`.
 *
 * - `labelStyle="short"` is for the phone bar ("Daxil olun və qoşulun"; for a
 *   paid course "Ödəniş əlçatan deyil", its price being printed beside it).
 * - `hint={false}` drops the paid-course explanation in the compact spots (the
 *   running head, the phone bar, the title); the enrol card always shows it.
 */
export function EnrollCta({
  target,
  size = "lg",
  block = false,
  labelStyle = "full",
  arrow = false,
  hint = true,
  className,
}: {
  target: EnrollTarget;
  size?: "sm" | "default" | "lg";
  block?: boolean;
  labelStyle?: "full" | "short";
  arrow?: boolean;
  hint?: boolean;
  className?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const action = useEnrollAction(target);

  // No payment provider exists, so the API refuses every order and the catalogue
  // serves free courses only — a paid course is reachable by direct link alone.
  // Say that plainly rather than sending the visitor to a checkout that cannot
  // charge them; signing in first would not change the answer, so this comes
  // before the sign-in prompt. Restoring the paid call to action is described in
  // ../payments.ts.
  if (!target.free) {
    // Wraps instead of overflowing: the label and price are long for a
    // sidebar-width pill. The phone bar uses the short label (its price is
    // printed beside it), so it fits on one line at 390px.
    const button = (
      <Button
        className={cn(
          "h-auto min-h-12 whitespace-normal py-3 text-center leading-snug",
          block && "w-full",
          !hint && className,
        )}
        size={size}
        disabled
      >
        {labelStyle === "short" ? (
          t("courseDetail.paidUnavailableShort")
        ) : (
          <>
            {t("courseDetail.paidUnavailable")} ·{" "}
            {formatPrice(target.price, target.currency, locale)}
          </>
        )}
      </Button>
    );
    if (!hint) return button;
    return (
      <div className={cn(block && "w-full", className)}>
        {button}
        <p className="t-meta mt-3 rounded-card bg-paper-2 px-4 py-3 text-center">
          {t("courseDetail.paidUnavailableHint")}
        </p>
      </div>
    );
  }

  const go = arrow ? <ArrowRight data-go aria-hidden="true" strokeWidth={1.75} /> : null;

  if (!action.signedIn) {
    return (
      <Button
        className={cn(block && "w-full", className)}
        size={size}
        onClick={action.signIn}
      >
        {labelStyle === "short"
          ? t("courseDetail.signInToEnrollShort")
          : t("courseDetail.signInToEnroll")}
        {go}
      </Button>
    );
  }

  return (
    <Button
      className={cn(block && "w-full", className)}
      size={size}
      loading={action.pending}
      onClick={action.enroll}
    >
      {t("courseDetail.enrollFree")}
      {go}
    </Button>
  );
}
