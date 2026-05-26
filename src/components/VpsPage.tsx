import type { ReactNode } from "react";
import { AlertCircle, Clock3, Laptop, Rocket, Scale, Smartphone } from "lucide-react";
import { usePA } from "../state/paStore";

const helpCenterHref = "https://get.exness.help/hc/zh-cn";

function formatUsd(amount: number) {
  return `${amount.toLocaleString("en-US")} USD`;
}

function VpsProgressBar({
  value,
  max,
  labels,
  markers = [],
}: {
  value: number;
  max: number;
  labels: { text: string; position: number }[];
  markers?: number[];
}) {
  const fillPercent = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div className="vps-progress">
      <div className="vps-progress-track" aria-hidden>
        <span className="vps-progress-fill" style={{ width: `${fillPercent}%` }} />
        {markers.map((marker) => (
          <span
            key={marker}
            className="vps-progress-marker"
            style={{ left: `${max > 0 ? (marker / max) * 100 : 0}%` }}
          />
        ))}
      </div>
      <div className="vps-progress-labels">
        {labels.map((label) => (
          <span key={label.text} className="vps-progress-label" style={{ left: `${label.position}%` }}>
            {label.text}
          </span>
        ))}
      </div>
    </div>
  );
}

function VpsFeature({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="vps-feature">
      <div className="vps-feature-icon" aria-hidden>
        {icon}
      </div>
      <h3 className="vps-feature-title">{title}</h3>
      <p className="vps-feature-text">{description}</p>
    </article>
  );
}

export function VpsPage() {
  const { totalBalance } = usePA();
  const balance = Math.max(0, totalBalance);
  const tradingVolume = 0;

  return (
    <div className="vps-page" data-no-i18n>
      <header className="vps-header">
        <h1 className="vps-title">虚拟专用服务器</h1>
        <p className="vps-subtitle">
          虚拟专用服务器允许您以快速和可靠的执行方式运行自动交易策略。
          <a className="vps-inline-link" href={helpCenterHref} rel="noopener noreferrer" target="_blank">
            了解详情
          </a>
        </p>
      </header>

      <section className="vps-eligibility-card">
        <div className="vps-eligibility-alert">
          <AlertCircle size={20} strokeWidth={2} className="vps-eligibility-alert-icon" aria-hidden />
          <div className="vps-eligibility-alert-body">
            <p className="vps-eligibility-alert-title">您暂时未满足免费VPS的资格要求</p>
            <p className="vps-eligibility-alert-text">如欲获得免费VPS资格，您需要满足以下条件之一:</p>
          </div>
        </div>

        <div className="vps-condition">
          <p className="vps-condition-text">
            ① 您全部交易账户的余额需至少达到2,000 USD美元，才能立即获得免费VPS资格。如果您的余额在500-1,999
            USD美元之间，并满足以下交易量要求，您仍可以获得免费VPS资格。
          </p>
          <p className="vps-condition-metric">
            所需余额: <strong>2,000 USD</strong>
          </p>
          <VpsProgressBar
            value={balance}
            max={2000}
            labels={[
              { text: formatUsd(0), position: 0 },
              { text: formatUsd(2000), position: 100 },
            ]}
          />
        </div>

        <div className="vps-or-divider" aria-hidden>
          <span>或</span>
        </div>

        <div className="vps-condition">
          <p className="vps-condition-text">
            ② 如果您的账户余额在500-1,999 USD 美元之间，您在30天之内的总交易量需至少达到1,500,000 USD
            美元（以任何货币或资产换算）。
          </p>
          <div className="vps-condition-metrics">
            <p className="vps-condition-metric">
              所需余额: <strong>500 USD</strong>
            </p>
            <p className="vps-condition-metric">
              所需交易量: <strong>1,500,000 USD</strong>
            </p>
          </div>
          <div className="vps-progress-row">
            <VpsProgressBar
              value={balance}
              max={2000}
              markers={[500]}
              labels={[
                { text: formatUsd(0), position: 0 },
                { text: formatUsd(500), position: 25 },
                { text: formatUsd(2000), position: 100 },
              ]}
            />
            <VpsProgressBar
              value={tradingVolume}
              max={1500000}
              labels={[
                { text: formatUsd(0), position: 0 },
                { text: formatUsd(1500000), position: 100 },
              ]}
            />
          </div>
        </div>

        <a className="vps-more-link" href={helpCenterHref} rel="noopener noreferrer" target="_blank">
          更多VPS要求
        </a>
      </section>

      <section className="vps-features">
        <VpsFeature
          icon={<Rocket size={32} strokeWidth={1.5} />}
          title="速度"
          description="VPS服务器与Exness交易服务器相邻，可确保快速和可靠的执行。"
        />
        <VpsFeature
          icon={<Scale size={32} strokeWidth={1.5} />}
          title="稳定性"
          description='在VPS上运行"智能交易 (EA)"，可以确保EA执行顺畅无阻，而不受网络连接质量的影响。'
        />
        <VpsFeature
          icon={
            <span className="vps-feature-clock-icon">
              <Clock3 size={32} strokeWidth={1.5} />
              <span>24</span>
            </span>
          }
          title="24小时交易"
          description="即使计算机已关闭，您依然可以使用智能交易 (EA) 在金融市场上交易。"
        />
        <VpsFeature
          icon={
            <span className="vps-feature-devices-icon">
              <Laptop size={28} strokeWidth={1.5} />
              <Smartphone size={20} strokeWidth={1.5} />
            </span>
          }
          title="移动性与兼容性"
          description="随时随地登录账户，并在金融市场上交易。VPS适用于任何操作系统。"
        />
      </section>
    </div>
  );
}
