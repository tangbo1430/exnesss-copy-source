import type { Order } from "../types";
import { apiRequest } from "./client";

/** PA 订单历史：GET /api/v1/user/order-history */
export function fetchOrderHistory(accountId: "all" | string = "all") {
  const params = new URLSearchParams({ accountId });
  return apiRequest<Order[]>(`/user/order-history?${params}`);
}
