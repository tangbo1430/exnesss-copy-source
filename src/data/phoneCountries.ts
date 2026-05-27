export type PhoneCountry = {
  /** ISO 3166-1 alpha-2，用于国旗图 */
  code: string;
  name: string;
  dial: string;
};

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "CN", name: "中国", dial: "+86" },
  { code: "TW", name: "台湾", dial: "+886" },
  { code: "HK", name: "香港", dial: "+852" },
  { code: "MO", name: "澳门", dial: "+853" },
  { code: "US", name: "美国", dial: "+1" },
  { code: "GB", name: "英国", dial: "+44" },
  { code: "JP", name: "日本", dial: "+81" },
  { code: "KR", name: "韩国", dial: "+82" },
  { code: "SG", name: "新加坡", dial: "+65" },
  { code: "MY", name: "马来西亚", dial: "+60" },
  { code: "TH", name: "泰国", dial: "+66" },
  { code: "VN", name: "越南", dial: "+84" },
  { code: "IN", name: "印度", dial: "+91" },
  { code: "ID", name: "印度尼西亚", dial: "+62" },
  { code: "PH", name: "菲律宾", dial: "+63" },
  { code: "AU", name: "澳大利亚", dial: "+61" },
  { code: "NZ", name: "新西兰", dial: "+64" },
  { code: "DE", name: "德国", dial: "+49" },
  { code: "FR", name: "法国", dial: "+33" },
  { code: "IT", name: "意大利", dial: "+39" },
  { code: "ES", name: "西班牙", dial: "+34" },
  { code: "NL", name: "荷兰", dial: "+31" },
  { code: "CH", name: "瑞士", dial: "+41" },
  { code: "RU", name: "俄罗斯", dial: "+7" },
  { code: "AE", name: "阿拉伯联合酋长国", dial: "+971" },
  { code: "SA", name: "沙特阿拉伯", dial: "+966" },
  { code: "TR", name: "土耳其", dial: "+90" },
  { code: "BR", name: "巴西", dial: "+55" },
  { code: "MX", name: "墨西哥", dial: "+52" },
  { code: "AR", name: "阿根廷", dial: "+54" },
  { code: "AW", name: "阿鲁巴", dial: "+297" },
  { code: "AL", name: "阿尔巴尼亚", dial: "+355" },
  { code: "DZ", name: "阿尔及利亚", dial: "+213" },
  { code: "AF", name: "阿富汗", dial: "+93" },
  { code: "OM", name: "阿曼", dial: "+968" },
  { code: "AZ", name: "阿塞拜疆", dial: "+994" },
  { code: "ET", name: "埃塞俄比亚", dial: "+251" },
];

export const DEFAULT_PHONE_COUNTRY = PHONE_COUNTRIES[0];

export function findCountryByDial(dial: string): PhoneCountry | undefined {
  return PHONE_COUNTRIES.find((c) => c.dial === dial);
}

export function parsePhoneE164(phone: string): { country: PhoneCountry; local: string } | null {
  const normalized = phone.trim();
  if (!normalized.startsWith("+")) return null;
  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const country of sorted) {
    if (normalized.startsWith(country.dial)) {
      return { country, local: normalized.slice(country.dial.length) };
    }
  }
  return null;
}
