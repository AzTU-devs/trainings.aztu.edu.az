import { request } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { Order, OrderCreateInput } from "./types";

export const paymentApi = {
  createOrder: (body: OrderCreateInput) =>
    request<Order>({
      url: endpoints.portal.orders,
      method: "POST",
      data: body,
    }),
};
