"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/common/FormError";
import { useT } from "@/i18n/client";
import { reviewSchema, type ReviewInput } from "../schemas";
import { useCreateReview } from "../hooks";
import { StarsInput } from "./Stars";
import type { ApiError } from "@/types/api";

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
          toast.error(e.message ?? t("review.submitError"));
        },
      },
    );
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5 rounded-2xl border border-border/80 bg-background/50 p-5 sm:p-6"
    >
      <div className="flex items-start gap-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100">
          <PenLine aria-hidden className="size-[18px]" />
        </span>
        <div className="space-y-1 pt-0.5">
          <h3 className="font-display text-lg leading-snug">{t("review.writeYours")}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("review.shareYourThoughts")}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t("review.rating")}</Label>
        <div className="-ml-1.5">
          <StarsInput
            value={rating}
            onChange={(v) => form.setValue("rating", v, { shouldValidate: true })}
          />
        </div>
        <FormError message={form.formState.errors.rating?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="review-title">{t("review.titleLabel")}</Label>
        <Input
          id="review-title"
          placeholder={t("review.titlePlaceholder")}
          maxLength={160}
          {...form.register("title")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="review-body">{t("review.body")}</Label>
        <textarea
          id="review-body"
          rows={4}
          maxLength={5000}
          placeholder={t("review.bodyPlaceholder")}
          className="flex w-full resize-y rounded-2xl border border-input bg-card px-4 py-3 text-sm leading-relaxed transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15"
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
