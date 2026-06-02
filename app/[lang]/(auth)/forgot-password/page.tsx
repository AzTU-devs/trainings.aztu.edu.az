import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your EduPlatform password.",
};

type Props = { params: Promise<{ lang: string }> };

export default async function ForgotPasswordPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  return (
    <div className="space-y-8">
      <header className="space-y-3 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <KeyRound className="size-5" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("auth.forgotTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("auth.forgotSubtitle")}</p>
        </div>
      </header>

      <form className="space-y-4" aria-disabled>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="pl-10"
              disabled
            />
          </div>
        </div>
        <Button type="button" className="w-full" disabled>
          Send reset link
        </Button>
      </form>

      <p className="rounded-md border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        {t("auth.forgotPlaceholder")}
      </p>

      <p className="text-center text-sm">
        <Link
          href={localeHref(locale, "/login")}
          className="text-primary font-medium hover:underline"
        >
          {t("auth.backToLogin")}
        </Link>
      </p>
    </div>
  );
}
