"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/field";
import { FormError } from "@/components/common/FormError";
import { useT } from "@/i18n/client";
import { reviewSchema, type ReviewInput } from "../schemas";
import { useCreateReview } from "../hooks";
import { StarsInput } from "./Stars";
import type { ApiError } from "@/types/api";

/** The review refusals a participant can understand (codes from the API's review endpoint). */
const REVIEW_ERROR_KEY = new Map<string, string>([
  ["ALREADY_REVIEWED", "review.submitErrorDuplicate"],
  ["NOT_ENROLLED", "review.submitErrorNotEnrolled"],
  ["VALIDATION_FAILED", "review.submitErrorInvalid"],
]);

/**
 * A signed-in participant's review: stars (required), a title and a body.
 * Same fields, validation and payload as before; only the look changed to the
 * editorial card (a hairline card on paper, the Fraunces heading).
 */
export function ReviewForm({ courseId }: { courseId: string }) {
  const t = useT();
  const create = useCreateReview(courseId);

  const form = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, title: "", body: "" },
  });

  const rating = useWatch({ control: form.control, name: "rating" });

  const onSubmit = (values: ReviewInput) => {
    create.mutate(
      {
        rating: values.rating,
        title: values.title || undefined,
        body: values.body || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("review.submitted"));
          form.reset({ rating: 0, title: "", body: "" });
        },
        onError: (err) => {
          const e = err as unknown as ApiError;
          // The API's `message` is English and written for developers, so it
          // is never shown: known refusals get a translated line, anything
          // else the generic one.
          toast.error(t((e.code && REVIEW_ERROR_KEY.get(e.code)) || "review.submitError"));
        },
      },
    );
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-6 rounded-card border border-line bg-card p-6 sm:p-7"
    >
      <div>
        <h3 className="t-title">{t("review.writeYours")}</h3>
        <p className="t-meta mt-1.5">{t("review.shareYourThoughts")}</p>
      </div>
      <div className="grid gap-2">
        <Label>{t("review.rating")}</Label>
        <div className="-ml-2.5">
          <StarsInput
            value={rating}
            onChange={(v) => form.setValue("rating", v, { shouldValidate: true })}
          />
        </div>
        <FormError message={form.formState.errors.rating?.message} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="review-title">
          <Optional label={t("review.titleLabel")} optional={t("review.optional")} />
        </Label>
        <Input
          id="review-title"
          placeholder={t("review.titlePlaceholder")}
          maxLength={160}
          {...form.register("title")}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="review-body">
          <Optional label={t("review.body")} optional={t("review.optional")} />
        </Label>
        <Textarea
          id="review-body"
          rows={4}
          maxLength={5000}
          placeholder={t("review.bodyPlaceholder")}
          {...form.register("body")}
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          className="w-full sm:w-auto"
          loading={create.isPending}
          disabled={rating === 0}
        >
          {t("review.submit")}
        </Button>
      </div>
    </form>
  );
}

/**
 * A label for a field the review can go without, marked as the auth forms
 * mark theirs: the name, then a quiet "(istəyə bağlı)" in the same line.
 * Only the stars are required.
 */
function Optional({ label, optional }: { label: string; optional: string }) {
  return (
    <>
      {label} <span className="text-sm font-normal text-ink-3">({optional})</span>
    </>
  );
}
