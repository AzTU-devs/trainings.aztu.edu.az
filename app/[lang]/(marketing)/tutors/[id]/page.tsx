import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

export const metadata: Metadata = { title: "Tutor profile" };

type Props = { params: Promise<{ lang: string; id: string }> };

// NOTE: Backend currently exposes /api/portal/tutor/me (self) and admin endpoints only.
// There is no public GET /api/public/tutors/{id} yet, so this page is a placeholder
// until that endpoint ships.
export default async function PublicTutorPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  return (
    <div className="container-fluid max-w-3xl space-y-6 py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: localeHref(locale, "/") },
          { label: "Courses", href: localeHref(locale, "/courses") },
          { label: "Tutor" },
        ]}
      />
      <Card>
        <CardContent className="space-y-4 p-10 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
            <Construction className="size-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Public tutor profiles are coming soon
          </h1>
          <p className="text-sm text-muted-foreground">
            We&apos;re working on a richer tutor page. Until then you can browse
            courses to find what each tutor offers.
          </p>
          <Link href={localeHref(locale, "/courses")} className="inline-block">
            <Button variant="outline">
              <ArrowLeft className="size-4" /> Back to courses
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
