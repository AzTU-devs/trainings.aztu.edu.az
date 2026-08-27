"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useT, useLocale } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import { formatPrice } from "@/lib/utils/format";
import { useCreateOrder } from "../hooks";
import type { Course } from "@/features/course/types";
import type { ApiError } from "@/types/api";

export function CheckoutClient({ course }: { course: Course }) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const create = useCreateOrder();

  const submit = () => {
    create.mutate(
      {
        items: [{ itemType: "COURSE", courseId: course.id }],
        currency: course.currency,
      },
      {
        onSuccess: () => {
          router.replace(localeHref(locale, `/checkout/success?slug=${course.slug}`));
        },
        onError: (err) => {
          const e = err as unknown as ApiError;
          toast.error(e.message ?? t("checkout.orderError"));
        },
      },
    );
  };

  const isOffline = course.courseType === "OFFLINE";

  return (
    <div className="container-fluid grid gap-8 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardContent className="space-y-5 p-8">
          <h2 className="font-display text-2xl leading-tight">{t("checkout.title")}</h2>

          <div className="flex gap-4 rounded-2xl border border-border bg-background p-4">
            <div
              className="size-20 shrink-0 rounded-xl bg-gradient-to-br from-navy-500 to-navy-800"
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="font-semibold leading-snug">{course.title}</div>
              <div className="text-xs text-muted-foreground">
                {t("checkout.by")}: {course.tutorDisplayName}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant={isOffline ? "secondary" : "default"}>
                  {isOffline ? t("common.offline") : t("common.online")}
                </Badge>
                <Badge variant="outline">{course.level}</Badge>
              </div>
            </div>
            <div className="text-right text-lg font-semibold">
              {formatPrice(course.price, course.currency)}
            </div>
          </div>

          {isOffline ? (
            <p className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              {t("courseDetail.requestEnrollment")} — seats are confirmed after tutor approval.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="self-start lg:sticky lg:top-24">
        <CardContent className="space-y-4 p-6">
          <div className="font-semibold">{t("checkout.summary")}</div>
          <Row label={course.title} value={formatPrice(course.price, course.currency)} />
          <div className="border-t border-border pt-3">
            <Row
              label={t("checkout.total")}
              value={formatPrice(course.price, course.currency)}
              bold
            />
          </div>
          <Button
            className="w-full"
            size="lg"
            loading={create.isPending}
            onClick={submit}
          >
            {isOffline ? t("checkout.request") : t("checkout.pay")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className={bold ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
