"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ChevronDown, Lock } from "lucide-react";
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t("auth.firstName")}</Label>
          <Input id="firstName" autoComplete="given-name" {...form.register("firstName")} />
          <FormError message={form.formState.errors.firstName?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{t("auth.lastName")}</Label>
          <Input id="lastName" autoComplete="family-name" {...form.register("lastName")} />
          <FormError message={form.formState.errors.lastName?.message} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            value={user.email}
            disabled
            readOnly
            aria-describedby="email-hint"
            className="bg-muted/60 pr-11 disabled:opacity-80"
          />
          <Lock
            aria-hidden
            className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
        </div>
        <p id="email-hint" className="text-xs text-muted-foreground">
          {t("settings.emailLocked")}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">{t("auth.phone")}</Label>
          <Input id="phone" type="tel" autoComplete="tel" {...form.register("phone")} />
          <FormError message={form.formState.errors.phone?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="locale">{t("student.locale")}</Label>
          {/* A native select for the platform picker on phones, drawn to
              match the Input primitive: same height, radius and focus ring. */}
          <div className="relative">
            <select
              id="locale"
              aria-describedby="locale-hint"
              className="flex h-12 w-full cursor-pointer appearance-none rounded-2xl border border-input bg-card pl-4 pr-11 text-sm transition-[border-color,box-shadow] focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15"
              {...form.register("locale")}
            >
              {locales.map((l) => (
                <option key={l} value={l}>
                  {localeNames[l]}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
          </div>
          <p id="locale-hint" className="text-xs text-muted-foreground">
            {t("settings.localeHint")}
          </p>
        </div>
      </div>

      <div className="flex justify-end border-t border-border/80 pt-6">
        <Button type="submit" loading={update.isPending} className="w-full sm:w-auto">
          {update.isPending ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </form>
  );
}
