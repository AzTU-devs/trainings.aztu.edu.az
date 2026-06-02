"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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

  const rating = form.watch("rating");

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
      className="space-y-4 rounded-2xl border border-border bg-card p-6"
    >
      <div className="space-y-1">
        <h3 className="font-semibold">{t("review.writeYours")}</h3>
        <p className="text-sm text-muted-foreground">{t("review.shareYourThoughts")}</p>
      </div>
      <div className="space-y-1.5">
        <Label>{t("review.rating")}</Label>
        <StarsInput value={rating} onChange={(v) => form.setValue("rating", v, { shouldValidate: true })} />
        <FormError message={form.formState.errors.rating?.message} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="review-title">{t("review.title")}</Label>
        <Input
          id="review-title"
          placeholder={t("review.titlePlaceholder")}
          maxLength={160}
          {...form.register("title")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="review-body">{t("review.body")}</Label>
        <textarea
          id="review-body"
          rows={4}
          maxLength={5000}
          placeholder={t("review.bodyPlaceholder")}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...form.register("body")}
        />
      </div>
      <Button type="submit" loading={create.isPending} disabled={rating === 0}>
        {t("review.submit")}
      </Button>
    </form>
  );
}
