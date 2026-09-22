import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EmptyState } from "@/components/common/EmptyState";
import { serverFetch } from "@/lib/api/server";
import { endpoints } from "@/lib/api/endpoints";
import { PAYMENTS_ENABLED } from "@/features/course/payments";
import { allPublishedCourses } from "@/features/course/catalog.server";
import { catalogueStats } from "@/features/course/catalog";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import type { Page } from "@/types/api";
import { AccountIntro } from "../_components/AccountIntro";
import { OrderList, type Order } from "../_components/OrderList";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return { title: t("nav.orders") };
}

export default async function OrdersPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  // GET /api/portal/orders/mine returns ApiResponse<PageResponse<OrderDto>>.
  // serverFetch's unwrap() strips only the ApiResponse envelope, so the page
  // itself has to read `.content` — typing this as `Order[]` is what made the
  // page throw "orders.map is not a function" on every render.
  let orders: Order[] = [];
  try {
    const page = await serverFetch<Page<Order>>(endpoints.portal.myOrders, {
      auth: true,
      cache: "no-store",
    });
    orders = page?.content ?? [];
  } catch {
    orders = [];
  }

  // "Everything is free, so enrolling creates no order" is the same claim the
  // hero, ticker, catalogue lead and FAQ make, so it has the same gate: no
  // payments and every published course free. The catalogue walk is read only
  // when that sentence could show (no orders, payments off) and is the cached
  // 60 s one the home page and expert directory share. If it fails, the
  // neutral line shows instead of an unverified claim.
  let allFree = false;
  if (orders.length === 0 && !PAYMENTS_ENABLED) {
    const all = await allPublishedCourses().catch(() => null);
    allFree = all ? catalogueStats(all.courses).allFree : false;
  }

  return (
    <div>
      <AccountIntro
        eyebrow={t("student.areaEyebrow")}
        title={t("nav.orders")}
        description={t("student.ordersSubtitle")}
      />
      <div className="mt-10 md:mt-14">
        {orders.length === 0 ? (
          <EmptyState
            compact
            plate={t("student.plateOrders")}
            headingLevel="h2"
            title={t("student.ordersEmpty")}
            description={t(allFree ? "student.ordersEmptyHint" : "student.ordersEmptyHintGeneral")}
            className="border-line-strong"
          />
        ) : (
          <OrderList orders={orders} locale={locale} />
        )}
      </div>
    </div>
  );
}
