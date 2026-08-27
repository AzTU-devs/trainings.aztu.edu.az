import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { CheckCircle2, GraduationCap, Users, BookOpen, Globe } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { AztuMark } from "@/components/layout/AztuMark";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

type Props = {
  children: ReactNode;
  params: Promise<{ lang: string }>;
};

export default async function AuthLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* LEFT — brand panel */}
      <aside className="surface-deep relative hidden overflow-hidden lg:flex">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 grid-lines opacity-60" />
          <div className="aurora -left-32 -bottom-40 size-[30rem] bg-[radial-gradient(circle,#1a5ba5_0%,transparent_65%)]" />
          <div
            className="aurora -right-24 -top-32 size-[26rem] bg-[radial-gradient(circle,#c8a951_0%,transparent_65%)] opacity-20"
            style={{ animationDelay: "-8s" }}
          />
        </div>

        <div className="relative z-10 flex w-full flex-col justify-between p-12">
          {/* Top */}
          <div className="space-y-12">
            <Link
              href={localeHref(locale, "/")}
              className="inline-flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/20 backdrop-blur"
            >
              <AztuMark tone="onDeep" className="size-9" />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-300">
                  Azerbaijan Technical University
                </span>
                <span className="font-display text-base">EduPlatform</span>
              </div>
            </Link>

            <div className="space-y-4 max-w-md">
              <div className="flex items-center gap-3">
                <span aria-hidden className="h-px w-8 bg-gradient-to-r from-gold-400 to-gold-400/0" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-300">
                  {t("home.university")}
                </span>
              </div>
              <h2 className="font-display text-balance text-[2.5rem] leading-[1.1] text-white">
                {t("auth.marketingHeadline")}
              </h2>
              <p className="max-w-md leading-relaxed text-white/65">{t("auth.marketingSub")}</p>
            </div>

            {/* Feature list */}
            <ul className="space-y-3 text-sm">
              {[
                t("auth.marketingPerk1"),
                t("auth.marketingPerk2"),
                t("auth.marketingPerk3"),
                t("auth.marketingPerk4"),
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-gold-400" />
                  <span className="text-white/75">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats + testimonial */}
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <Stat icon={<Users className="size-4" />} value="12K+" label={t("home.statLearners")} />
              <Stat icon={<BookOpen className="size-4" />} value="320+" label={t("home.statCourses")} />
              <Stat icon={<GraduationCap className="size-4" />} value="80+" label={t("home.statTutors")} />
            </div>
            <figure className="panel-onDeep rounded-2xl p-5">
              <blockquote className="text-sm leading-relaxed">
                &ldquo;{t("auth.marketingQuote")}&rdquo;
              </blockquote>
              <figcaption className="mt-3 flex items-center gap-3 text-xs">
                <span
                  aria-hidden
                  className="grid size-9 place-items-center rounded-full bg-white/20 font-semibold ring-1 ring-white/30"
                >
                  AM
                </span>
                <span>
                  <span className="font-semibold">{t("auth.marketingQuoteName")}</span>
                  <span className="block text-white/70">{t("auth.marketingQuoteRole")}</span>
                </span>
              </figcaption>
            </figure>
            <div className="flex items-center justify-between text-xs text-white/60">
              <span className="inline-flex items-center gap-1.5">
                <Globe className="size-3" /> aztu.edu.az
              </span>
              <span>© {new Date().getFullYear()} AZTU</span>
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT — form panel */}
      <main className="relative flex min-h-screen items-center justify-center bg-background p-6 sm:p-10">
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <LocaleSwitcher />
        </div>

        <div className="lg:hidden absolute left-4 top-4">
          <Link href={localeHref(locale, "/")}>
            <Logo />
          </Link>
        </div>

        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="panel-onDeep rounded-xl p-3.5">
      <div className="mb-1.5 text-gold-300">{icon}</div>
      <div className="font-display text-xl leading-none text-white">{value}</div>
      <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
        {label}
      </div>
    </div>
  );
}
