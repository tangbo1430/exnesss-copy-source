import type { FormEvent, ReactNode } from "react";
import { LockKeyhole } from "lucide-react";

export type ProfileFormValues = {
  firstName: string;
  lastName: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  birthCountry: string;
  gender: "女" | "男" | "其他";
  address: string;
};

const MONTHS = [
  "一月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月",
];

type Props = {
  values: ProfileFormValues;
  onChange: (patch: Partial<ProfileFormValues>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onLater?: () => void;
  submitLabel?: string;
  stepLabel?: string;
  children?: ReactNode;
};

export function ProfileInfoForm({
  values,
  onChange,
  onSubmit,
  onLater,
  submitLabel = "继续",
  stepLabel = "1/5",
  children,
}: Props) {
  const set = (patch: Partial<ProfileFormValues>) => onChange(patch);

  return (
    <form className="profile-form" onSubmit={onSubmit}>
      <h3 className="profile-form-title">
        {stepLabel} 添加个人资料信息
      </h3>

      <label className="profile-field-label">名</label>
      <input
        className="profile-field"
        value={values.firstName}
        onChange={(e) => set({ firstName: e.target.value })}
      />
      <span className="profile-field-hint">您身份证上所示的名字</span>

      <label className="profile-field-label">姓</label>
      <input
        className="profile-field"
        value={values.lastName}
        onChange={(e) => set({ lastName: e.target.value })}
      />
      <span className="profile-field-hint">您身份证上所示的姓氏</span>

      <label className="profile-field-label">出生日期</label>
      <div className="profile-dob-row">
        <select value={values.birthDay} onChange={(e) => set({ birthDay: e.target.value })}>
          <option value="">天</option>
          {Array.from({ length: 31 }, (_, i) => (
            <option key={i + 1} value={String(i + 1)}>
              {i + 1}
            </option>
          ))}
        </select>
        <select value={values.birthMonth} onChange={(e) => set({ birthMonth: e.target.value })}>
          <option value="">月</option>
          {MONTHS.map((label, i) => (
            <option key={label} value={String(i + 1)}>
              {label}
            </option>
          ))}
        </select>
        <select value={values.birthYear} onChange={(e) => set({ birthYear: e.target.value })}>
          <option value="">年份</option>
          {Array.from({ length: 80 }, (_, i) => {
            const y = 2026 - i;
            return (
              <option key={y} value={String(y)}>
                {y}
              </option>
            );
          })}
        </select>
      </div>

      <label className="profile-field-label">出生国家</label>
      <select
        className="profile-field"
        value={values.birthCountry}
        onChange={(e) => set({ birthCountry: e.target.value })}
      >
        <option>中国</option>
        <option>台湾</option>
        <option>香港</option>
        <option>美国</option>
      </select>

      <label className="profile-field-label">您的性别</label>
      <div className="profile-gender-row">
        {(["女", "男", "其他"] as const).map((g) => (
          <label key={g} className="profile-gender-opt">
            <input
              type="radio"
              name="gender"
              checked={values.gender === g}
              onChange={() => set({ gender: g })}
            />
            {g}
          </label>
        ))}
      </div>

      <label className="profile-field-label">您的居住地址</label>
      <input
        className="profile-field"
        placeholder="城市、街道、房子(公寓)"
        value={values.address}
        onChange={(e) => set({ address: e.target.value })}
      />
      <span className="profile-field-hint">您稍后需要验证地址</span>

      {children}

      <div className="profile-form-footer">
        <p className="profile-modal-secure">
          <LockKeyhole size={14} />
          为了保障安全，我们将对所有数据进行加密
        </p>
        <div className="profile-modal-actions">
          {onLater ? (
            <button type="button" className="profile-btn-secondary" onClick={onLater}>
              稍后再完成
            </button>
          ) : null}
          <button type="submit" className="profile-btn-primary">
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
