import { fetchOrderHistory } from "../api/orderHistory";
import type { Account, Order } from "../types";

/** 拉取 PA 订单历史；后端已聚合 Real/Demo 并按时间降序。 */
export async function syncOrderHistory(accounts: Account[]): Promise<Order[]> {
  if (accounts.length === 0) {
    return [];
  }
  return fetchOrderHistory("all");
}
