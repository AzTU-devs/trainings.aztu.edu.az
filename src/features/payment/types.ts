export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export type OrderItemType = "COURSE" | "ROOM_USAGE_FEE";

export type OrderItem = {
  id: string;
  itemType: OrderItemType;
  courseId?: string | null;
  roomBookingId?: string | null;
  description: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  currency: string;
};

export type Order = {
  id: string;
  userId: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  currency: string;
  placedAt: string;
  paidAt?: string | null;
  items: OrderItem[];
};

export type OrderCreateInput = {
  items: { itemType: OrderItemType; courseId?: string; roomBookingId?: string }[];
  currency?: string;
};
