import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { CheckCircle2, GraduationCap, Sparkles, Users, BookOpen, Globe } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
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
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-violet-700 to-fuchsia-700 text-white lg:flex">
        <div
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0, transparent 40%), radial-gradient(circle at 80% 60%, white 0, transparent 40%)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden
        />
        <div
          className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-fuchsia-400/30 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-violet-300/30 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 flex w-full flex-col justify-between p-12">
          {/* Top */}
          <div className="space-y-12">
            <Link
              href={localeHref(locale, "/")}
              className="inline-flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/20 backdrop-blur"
            >
              <Image
                src="/aztu-logo-mark.png"
                alt="AZTU"
                width={36}
                height={36}
                className="size-9 rounded bg-white/95 p-1 object-contain"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/70">
                  Azerbaijan Technical University
                </span>
                <span className="text-base font-semibold">
                  edu.platform
                </span>
              </div>
            </Link>

            <div className="space-y-4 max-w-md">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs ring-1 ring-white/20">
                <Sparkles className="size-3" />
                {t("auth.marketingHeadline")}
              </span>
              <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight">
                {t("auth.marketingHeadline")}
              </h2>
              <p className="max-w-md text-white/80">{t("auth.marketingSub")}</p>
            </div>

            {/* Feature list */}
            <ul className="space-y-3 text-sm">
              {[
                "Free starter courses with verified tutors",
                "Online video lessons + offline cohort enrollment",
                "Progress tracking that saves automatically",
                "Certificates on course completion",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-white/95" />
                  <span className="text-white/90">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats + testimonial */}
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <Stat icon={<Users className="size-4" />} value="12K+" label="Learners" />
              <Stat icon={<BookOpen className="size-4" />} value="320+" label="Courses" />
              <Stat icon={<GraduationCap className="size-4" />} value="80+" label="Tutors" />
            </div>
            <figure className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
              <blockquote className="text-sm leading-relaxed">
                &ldquo;The mix of online videos and offline classes was perfect
                for my schedule. I finished my first course in two weeks.&rdquo;
              </blockquote>
              <figcaption className="mt-3 flex items-center gap-3 text-xs">
                <span
                  aria-hidden
                  className="grid size-9 place-items-center rounded-full bg-white/20 font-semibold ring-1 ring-white/30"
                >
                  AM
                </span>
                <span>
                  <span className="font-semibold">Aysel M.</span>
                  <span className="block text-white/70">UX Designer</span>
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
    <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
      <div className="mb-1 text-white/80">{icon}</div>
      <div className="text-xl font-bold leading-none">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-white/60">
        {label}
      </div>
    </div>
  );
}
