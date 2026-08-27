import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResendVerificationButton } from "@/features/auth/components/ResendVerificationButton";
import { getSession } from "@/lib/auth/session";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { fullName } from "@/types/user";

export const metadata: Metadata = { title: "Profile" };

type Props = { params: Promise<{ lang: string }> };

export default async function ProfilePage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);
  const user = await getSession();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl leading-tight">
          {t("student.profileTitle")}
        </h1>
        <Link href={localeHref(locale, "/settings")}>
          <Button variant="outline" size="sm">
            <Pencil className="size-4" /> {t("student.editProfile")}
          </Button>
        </Link>
      </div>
      {!user.emailVerified ? <ResendVerificationButton /> : null}

      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <Field label={t("student.fullName")} value={fullName(user)} />
          <Field label={t("auth.email")} value={user.email} />
          {user.phone ? <Field label={t("auth.phone")} value={user.phone} /> : null}
          <Field
            label={user.emailVerified ? t("student.verified") : t("student.notVerified")}
            value={user.emailVerified ? "✓" : "—"}
          />
          {user.locale ? (
            <Field label={t("student.locale")} value={user.locale} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
