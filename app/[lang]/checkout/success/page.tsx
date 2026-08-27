import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

export const metadata: Metadata = { title: "Order placed" };

type SP = Promise<{ slug?: string }>;
type Props = { params: Promise<{ lang: string }>; searchParams: SP };

export default async function CheckoutSuccess({ params, searchParams }: Props) {
  const [{ lang }, sp] = await Promise.all([params, searchParams]);
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  return (
    <div className="container-fluid mx-auto max-w-xl">
      <Card>
        <CardContent className="space-y-6 p-10 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
            <CheckCircle2 className="size-7" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl leading-tight">
              {t("checkout.successTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("checkout.successHint")}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {sp.slug ? (
              <Link href={localeHref(locale, `/learn/${sp.slug}`)}>
                <Button>{t("checkout.goLearning")}</Button>
              </Link>
            ) : null}
            <Link href={localeHref(locale, "/orders")}>
              <Button variant="outline">{t("checkout.viewOrders")}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
