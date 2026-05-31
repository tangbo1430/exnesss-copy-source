import { coerceLanguage, type Language } from "../i18n";
import type { Route } from "../types";

export type AuthTab = "login" | "register";

type TitleSet = {
  app: string;
  login: string;
  register: string;
  loading: string;
};

const titles: Record<Language, TitleSet> = {
  English: {
    app: "Exness Personal Area",
    login: "Exness Sign In",
    register: "Exness Registration - Create an Exness Account",
    loading: "Exness Personal Area",
  },
  "简体中文": {
    app: "Exness 个人专区",
    login: "Exness登录",
    register: "Exness注册 - 创建Exness账户",
    loading: "Exness 个人专区",
  },
  "Tiếng Việt": {
    app: "Exness Khu vực cá nhân",
    login: "Exness Đăng nhập",
    register: "Exness Đăng ký - Tạo tài khoản Exness",
    loading: "Exness Khu vực cá nhân",
  },
  "Bahasa Indonesia": {
    app: "Exness Area Personal",
    login: "Exness Masuk",
    register: "Exness Pendaftaran - Buat akun Exness",
    loading: "Exness Area Personal",
  },
  Español: {
    app: "Exness Área personal",
    login: "Exness Iniciar sesión",
    register: "Exness Registro - Crear una cuenta Exness",
    loading: "Exness Área personal",
  },
};

function titleSet(language: string): TitleSet {
  return titles[coerceLanguage(language)];
}

export function applyLoadingDocumentTitle(language = "English") {
  document.title = titleSet(language).loading;
}

export function applyAuthDocumentTitle(tab: AuthTab, language: string) {
  const set = titleSet(language);
  document.title = tab === "login" ? set.login : set.register;
}

/** 登录后各页面统一使用 Personal Area 标签文案（与仿站一致） */
export function applyAppDocumentTitle(_route: Route | null, language: string) {
  document.title = titleSet(language).app;
}
