type Props = {
  code: string;
  size?: "sm" | "md";
};

/** 矩形国旗图（Windows 下 emoji 国旗常无法显示） */
export function CountryFlag({ code, size = "md" }: Props) {
  const iso = code.toLowerCase();
  const w = size === "sm" ? 20 : 24;
  const h = size === "sm" ? 14 : 18;

  return (
    <span className={`profile-country-flag profile-country-flag--${size}`} aria-hidden="true">
      <img
        src={`https://flagcdn.com/w40/${iso}.png`}
        srcSet={`https://flagcdn.com/w80/${iso}.png 2x`}
        width={w}
        height={h}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}
