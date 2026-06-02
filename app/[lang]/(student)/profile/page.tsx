import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { fullName } from "@/types/user";

export const metadata: Metadata = { title: "Profile" };

type Props = { params: Promise<{ lang: string }> };

export default async function ProfilePage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = await getT(lang as Locale);
  const user = await getSession();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t("student.profileTitle")}</h1>
      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <Field label={t("student.fullName")} value={fullName(user)} />
          <Field label={t("auth.email")} value={user.email} />
          <Field
            label={user.emailVerified ? t("student.verified") : t("student.notVerified")}
            value={user.emailVerified ? "✓" : "—"}
          />
          {user.locale ? (
            <Field label="Locale" value={user.locale} />
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
