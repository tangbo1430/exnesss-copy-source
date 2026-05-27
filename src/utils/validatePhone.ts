/** 仅保留数字 */
export function phoneDigitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function buildFullPhone(dial: string, localDigits: string): string {
  return `${dial}${phoneDigitsOnly(localDigits)}`;
}

/**
 * 按区号校验本地号码；通过返回 null，失败返回错误文案。
 */
export function validatePhoneLocal(dial: string, localDigits: string): string | null {
  const d = phoneDigitsOnly(localDigits);
  if (!d) return "请输入手机号码";

  switch (dial) {
    case "+86":
      if (!/^1[3-9]\d{9}$/.test(d)) {
        return "请输入有效的中国大陆手机号（11位，以1开头）";
      }
      break;
    case "+1":
      if (!/^[2-9]\d{9}$/.test(d)) {
        return "请输入有效的美国/加拿大手机号（10位）";
      }
      break;
    case "+852":
      if (!/^[5-9]\d{7}$/.test(d)) {
        return "请输入有效的香港手机号（8位）";
      }
      break;
    case "+886":
      if (!/^9\d{8}$/.test(d)) {
        return "请输入有效的台湾手机号（9位，以9开头）";
      }
      break;
    case "+853":
      if (!/^6\d{7}$/.test(d)) {
        return "请输入有效的澳门手机号（8位，以6开头）";
      }
      break;
    default:
      if (d.length < 6 || d.length > 15) {
        return "手机号码应为6-15位数字";
      }
      if (!/^\d+$/.test(d)) {
        return "手机号码只能包含数字";
      }
  }
  return null;
}

/** 输入框最大本地位数（便于限制输入长度） */
export function maxLocalPhoneLength(dial: string): number {
  switch (dial) {
    case "+86":
      return 11;
    case "+1":
      return 10;
    case "+852":
    case "+853":
      return 8;
    case "+886":
      return 9;
    default:
      return 15;
  }
}
