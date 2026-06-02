import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EmptyState } from "@/components/common/EmptyState";
import { serverFetch } from "@/lib/api/server";
import { endpoints } from "@/lib/api/endpoints";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { formatPrice } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Orders" };

type Order = {
  id: string;
  status: string;
  totalAmount: string;
  currency: string;
  createdAt: string;
};

type Props = { params: Promise<{ lang: string }> };

export default async function OrdersPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = await getT(lang as Locale);

  let orders: Order[] = [];
  try {
    orders = await serverFetch<Order[]>(endpoints.portal.myOrders, {
      auth: true,
      cache: "no-store",
    });
  } catch {
    orders = [];
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t("nav.orders")}</h1>
      {orders.length === 0 ? (
        <EmptyState title="—" description={t("student.noEnrollments")} />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <div className="font-mono text-xs text-muted-foreground">
                    {o.id}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatPrice(o.totalAmount, o.currency)}
                  </div>
                  <Badge variant="secondary">{o.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
