"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LocaleLink } from "@/i18n/LocaleLink";
import { useT } from "@/i18n/client";
import type { Enrollment } from "../types";

export function EnrollmentCard({
  enrollment,
  courseSlug,
}: {
  enrollment: Enrollment;
  courseSlug?: string;
}) {
  const t = useT();
  const slug = courseSlug ?? enrollment.courseId;
  return (
    <LocaleLink
      href={`/learn/${slug}`}
      className="block transition-transform hover:-translate-y-0.5"
    >
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold leading-snug">{enrollment.courseTitle}</h3>
            <Badge
              variant={
                enrollment.status === "COMPLETED" ? "success" : "secondary"
              }
            >
              {enrollment.status.replace("_", " ")}
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${enrollment.progressPercent}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {t("student.progress", { percent: enrollment.progressPercent })}
            </div>
          </div>
        </CardContent>
      </Card>
    </LocaleLink>
  );
}
