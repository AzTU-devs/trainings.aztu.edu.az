"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateProfileSchema, type UpdateProfileInput } from "../schemas";
import { useUpdateProfile } from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/common/FormError";
import { useT } from "@/i18n/client";
import { locales, localeNames, isLocale } from "@/i18n/config";
import type { User } from "@/types/user";
import type { ApiError } from "@/types/api";

export function ProfileSettingsForm({ user }: { user: User }) {
  const t = useT();
  const router = useRouter();
  const update = useUpdateProfile();

  const initialLocale = isLocale(user.locale ?? "") ? (user.locale as "en" | "az") : "en";

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? "",
      locale: initialLocale,
    },
  });

  const onSubmit = (values: UpdateProfileInput) =>
    update.mutate(values, {
      onSuccess: (updated) => {
        toast.success(t("settings.saved"));
        // Keep the rendered locale in sync if the user changed it.
        if (isLocale(updated.locale ?? "") && updated.locale !== initialLocale) {
          document.cookie = `NEXT_LOCALE=${updated.locale}; path=/; max-age=31536000; samesite=lax`;
          router.refresh();
        }
      },
      onError: (error) => {
        const err = error as unknown as ApiError;
        if (err.errors) {
          for (const fe of err.errors) {
            form.setError(fe.field as keyof UpdateProfileInput, {
              message: fe.message,
            });
          }
        }
        toast.error(err.message ?? t("settings.saveError"));
      },
    });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">{t("auth.firstName")}</Label>
          <Input id="firstName" autoComplete="given-name" {...form.register("firstName")} />
          <FormError message={form.formState.errors.firstName?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">{t("auth.lastName")}</Label>
          <Input id="lastName" autoComplete="family-name" {...form.register("lastName")} />
          <FormError message={form.formState.errors.lastName?.message} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input id="email" type="email" value={user.email} disabled readOnly />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">{t("auth.phone")}</Label>
          <Input id="phone" type="tel" autoComplete="tel" {...form.register("phone")} />
          <FormError message={form.formState.errors.phone?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="locale">{t("student.locale")}</Label>
          <select
            id="locale"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...form.register("locale")}
          >
            {locales.map((l) => (
              <option key={l} value={l}>
                {localeNames[l]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">{t("settings.localeHint")}</p>
        </div>
      </div>

      <Button type="submit" loading={update.isPending}>
        {update.isPending ? t("common.saving") : t("common.save")}
      </Button>
    </form>
  );
}
