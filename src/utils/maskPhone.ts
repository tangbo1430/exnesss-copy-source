/** 前端展示用手机号掩码（与后端 paformat.MaskPhone 规则接近） */
export function maskPhoneDisplay(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  const digits: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < trimmed.length; i++) {
    const c = trimmed.charCodeAt(i);
    if (c >= 48 && c <= 57) {
      digits.push(c - 48);
      indices.push(i);
    }
  }
  if (digits.length <= 4) return trimmed;
  const maskFrom = digits.length - 4;
  const start = indices[maskFrom];
  let out = "";
  for (let i = 0; i < trimmed.length; i++) {
    const c = trimmed.charAt(i);
    if (c >= "0" && c <= "9" && i < start) {
      out += "*";
    } else {
      out += c;
    }
  }
  return out;
}
