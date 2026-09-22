import { getT } from "@/i18n/server";
import type { Locale } from "@/i18n/config";
import { Dept } from "@/components/editorial/Dept";
import { Reveal } from "@/components/motion";

/**
 * Home §05 "Necə işləyir": the section opener and three numbered steps. The
 * copy only states what is true today: the account is free and enrolment is
 * immediate for both formats (D3) — nothing waits for an approval.
 */
export async function Steps({ locale, number }: { locale: Locale; number: string }) {
  const t = await getT(locale);
  const steps = [1, 2, 3].map((n) => ({ n, title: t(`home.step${n}Title`), body: t(`home.step${n}Desc`) }));

  return (
    <section className="wrap section" aria-labelledby="home-how">
      <Dept as="span" number={number} label={t("home.howItWorks")} />
      <Reveal className="g12 mt-8 items-end gap-y-5 lg:mt-10">
        <h2 id="home-how" className="t-display-l col-span-4 md:col-span-8 lg:col-span-7">
          {t("home.howTitle")}
        </h2>
        <p className="t-body col-span-4 md:col-span-6 lg:col-span-4 lg:col-start-9">{t("home.howDek")}</p>
      </Reveal>
      <ol className="mt-10 grid grid-cols-1 border-t border-t-line-strong lg:mt-14 lg:grid-cols-3 lg:border-b lg:border-b-line">
        {steps.map((step, i) => (
          <li
            key={step.n}
            className="border-b border-line pt-[22px] pb-[26px] lg:border-b-0 lg:border-l lg:px-7 lg:pt-7 lg:pb-9 lg:first:border-l-0 lg:first:pl-0"
          >
            {/* The rules stay put; only the words rise in, one step after another. */}
            <Reveal delay={i * 0.08} className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-2 lg:block">
              <span
                aria-hidden="true"
                className="row-span-2 block font-display text-[clamp(3.5rem,2.4rem+4.6vw,7.5rem)] leading-[0.82] font-light tracking-[-0.05em] text-gold-ink [font-variation-settings:'SOFT'_30,'WONK'_0]"
              >
                {step.n}
              </span>
              <h3 className="t-title mt-1.5 lg:mt-5">{step.title}</h3>
              <p className="t-body mt-2 max-w-[36ch] lg:mt-3">{step.body}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
