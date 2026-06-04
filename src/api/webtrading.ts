import type { ApiEnvelope } from "./client";
import { getAccessToken } from "./client";

type WebtradingAccount = {
  id: string;
  name: string;
  leverage: number;
};

async function webtradingRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let resp: Response;
  try {
    resp = await fetch(`/api/webtrading${path}`, { ...init, headers, credentials: "include" });
  } catch {
    throw new Error("无法连接后端，请确认 simu-stock-server 已启动");
  }

  const raw = await resp.text();
  let json: ApiEnvelope<T>;
  try {
    json = JSON.parse(raw) as ApiEnvelope<T>;
  } catch {
    throw new Error(resp.ok ? "后端响应格式错误" : `请求失败 (${resp.status})`);
  }

  if (json.code !== 1) {
    throw new Error(json.msg ?? `API error ${json.code}`);
  }
  return json.data;
}

export function patchAccount(accountId: string, body: { name?: string; leverage?: number }) {
  const params = new URLSearchParams({ accountId });
  return webtradingRequest<WebtradingAccount>(`/account?${params}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/** PA 展示 "1:200" → 后端 leverage 200 */
export function parseLeverageRatio(value: string): number {
  const match = /^1:(\d+)$/i.exec(value.trim());
  if (!match) {
    throw new Error("Invalid leverage");
  }
  return Number.parseInt(match[1], 10);
}

export function formatLeverageRatio(leverage: number): string {
  return `1:${leverage}`;
}
