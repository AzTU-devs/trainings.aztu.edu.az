import Link from "next/link";
import { getT } from "@/i18n/server";
import { localeHref } from "@/i18n/href";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";
import { buttonVariants } from "@/components/ui/button";
import { Kicker } from "@/components/editorial/Kicker";

const SUPPORT_EMAIL = "support@aztu.edu.az";

/**
 * The catalogue's honest dead-end handler: when the topic someone wants is
 * not here yet, they can apply to teach it or write to the platform team.
 */
export async function SuggestTopic({ locale, className }: { locale: Locale; className?: string }) {
  const t = await getT(locale);
  return (
    <section className={cn("wrap pb-24 lg:pb-32", className)} aria-labelledby="suggest-topic-h">
      <div className="g12 items-end gap-y-6 border-t border-line-strong pt-10 lg:pt-12">
        <div className="col-span-4 md:col-span-5 lg:col-span-7">
          <Kicker tone="gold">{t("courses.suggestKicker")}</Kicker>
          <h2 id="suggest-topic-h" className="t-display-m mt-3">
            {t("courses.suggestTitle")}
          </h2>
          <p className="t-body mt-3 max-w-[54ch]">{t("courses.suggestBody")}</p>
        </div>
        <div className="col-span-4 flex flex-wrap gap-3 md:col-span-3 lg:col-span-5 lg:col-start-8 lg:justify-end">
          <Link href={localeHref(locale, "/register/tutor")} className={buttonVariants()}>
            {t("courses.applyExpert")}
          </Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className={buttonVariants({ variant: "outline" })}>
            {t("courses.writeUs")}
          </a>
        </div>
      </div>
    </section>
  );
}
