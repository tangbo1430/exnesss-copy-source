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

export function sendEmailCode(email: string, scene: "register" | "reset") {
  return apiRequest<null>("/user/send-email-code", {
    method: "POST",
    body: JSON.stringify({ email, scene }),
  });
}

export function login(body: {
  email: string;
  password: string;
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
