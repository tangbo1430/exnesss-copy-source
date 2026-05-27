const TOKEN_KEY = "pa_access_token";
const REFRESH_KEY = "pa_refresh_token";

export type ApiEnvelope<T> = {
  code: number;
  data: T;
  msg: string;
};

export function getAccessToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
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
    resp = await fetch(`/api/v1${path}`, { ...init, headers });
  } catch {
    throw new Error("无法连接后端，请确认 simu-stock-server 已启动");
  }

  const raw = await resp.text();
  let json: ApiEnvelope<T>;
  try {
    json = JSON.parse(raw) as ApiEnvelope<T>;
  } catch {
    throw new Error(resp.ok ? "后端响应格式错误" : `请求失败 (${resp.status})，请确认 Vite 代理与后端服务正常`);
  }

  if (json.code !== 1) {
    const hints: Record<number, string> = {
      40007: "登录尝试次数过多，请 30 分钟后再试",
      41001: "请先完成身份验证并通过审核",
      41002: "已有身份验证申请正在审核中",
      41003: "证件图片无效，请上传 JPG 或 PNG",
      41004: "身份证正反面不能为同一张图片",
      40011: "手机号码格式无效",
    };
    throw new Error(hints[json.code] ?? json.msg ?? `API error ${json.code}`);
  }
  return json.data;
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** 压缩证件/凭证图为 jpeg base64，避免手机原图过大导致上传慢或后端拒绝。 */
export async function compressImageFile(file: File, maxEdge = 1200, quality = 0.75): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  return compressDataUrl(dataUrl, maxEdge, quality);
}

function compressDataUrl(dataUrl: string, maxEdge: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const longest = Math.max(img.width, img.height);
      const scale = longest > maxEdge ? maxEdge / longest : 1;
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("无法处理图片"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("图片格式无效，请使用 JPG 或 PNG"));
    img.src = dataUrl;
  });
}
