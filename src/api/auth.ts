import { apiRequest, setTokens } from "./client";

export type CaptchaData = {
  captchaId: string;
  imageBase64: string;
};

export type AuthTokenData = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  email?: string;
  maskedEmail?: string;
};

export type ProfileData = {
  userId: number;
  email: string;
  maskedEmail: string;
  emailVerified?: boolean;
  phone?: string;
  maskedPhone?: string;
  phoneVerified?: boolean;
  profileStep1Done?: boolean;
  profileFirstName?: string;
  profileLastName?: string;
  kycStatus: number;
  verificationComplete: boolean;
};

export function verifyPhone(body: { countryCode: string; phoneNumber: string }) {
  return apiRequest<{ phone: string; maskedPhone: string }>("/user/phone", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function fetchCaptcha() {
  return apiRequest<CaptchaData>("/user/captcha");
}

export function sendEmailCode(email: string, scene: "register" | "login" | "reset") {
  return apiRequest<null>("/user/send-email-code", {
    method: "POST",
    body: JSON.stringify({ email, scene }),
  });
}

export function login(body: {
  email: string;
  password: string;
  emailCode: string;
  captchaId: string;
  captchaCode: string;
}) {
  return apiRequest<AuthTokenData>("/user/login", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((data) => {
    setTokens(data.accessToken, data.refreshToken);
    return data;
  });
}

export function register(body: {
  email: string;
  password: string;
  emailCode: string;
  captchaId: string;
  captchaCode: string;
  country?: string;
}) {
  return apiRequest<AuthTokenData>("/user/register", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((data) => {
    setTokens(data.accessToken, data.refreshToken);
    return data;
  });
}

export function logout() {
  return apiRequest<null>("/user/logout", { method: "POST" });
}

/** 用 refresh_token Cookie 换新 access token，并同步 sessionStorage */
export function refreshToken() {
  return apiRequest<AuthTokenData>("/user/refresh-token", {
    method: "POST",
    body: JSON.stringify({}),
  }).then((data) => {
    setTokens(data.accessToken, data.refreshToken);
    return data;
  });
}

/**
 * 启动恢复登录态：优先 profile（Cookie 或 sessionStorage），失败则用 refresh Cookie。
 * 跨子域从终端跳回 PA 时 sessionStorage 为空，但 refresh Cookie 仍可能有效。
 */
export async function restoreSession(): Promise<boolean> {
  try {
    await fetchProfile();
    return true;
  } catch {
    /* access 缺失或过期 */
  }
  try {
    await refreshToken();
    await fetchProfile();
    return true;
  } catch {
    return false;
  }
}

export function fetchProfile() {
  return apiRequest<ProfileData>("/user/profile");
}

export function verifyContactEmail() {
  return apiRequest<null>("/user/verify-contact-email", { method: "POST" });
}

export function completeProfileStep1(body: { firstName: string; lastName: string }) {
  return apiRequest<null>("/user/profile-step1", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function resetPassword(body: {
  email: string;
  emailCode: string;
  newPassword: string;
}) {
  return apiRequest<null>("/user/reset-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
