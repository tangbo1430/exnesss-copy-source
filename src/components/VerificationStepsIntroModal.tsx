import { X } from "lucide-react";
import { ModalPortal } from "./ModalPortal";

type StepSpec = {
  id: number;
  title: string;
  features: string[];
};

const STEPS: StepSpec[] = [
  {
    id: 1,
    title: "确认邮箱和手机号码",
    features: ["出金"],
  },
  {
    id: 2,
    title: "验证身份",
    features: ["入金金额上限为10,000美元", "全球和本地支付方式", "银行卡和加密数字货币支付", "交易"],
  },
  {
    id: 3,
    title: "验证居住地址",
    features: ["无入金金额限制"],
  },
];

type Props = {
  activeStep: 1 | 2 | 3;
  onClose: () => void;
  onVerify: () => void;
};

export function VerificationStepsIntroModal({ activeStep, onClose, onVerify }: Props) {
  return (
    <ModalPortal>
      <div className="profile-modal-backdrop" onClick={onClose} role="presentation">
        <div
          className="profile-modal verification-intro-modal"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="verification-intro-title"
        >
          <div className="verification-intro-head">
            <div>
              <h3 id="verification-intro-title">验证步骤</h3>
              <p>这大概需要花费10分钟时间</p>
            </div>
            <button type="button" className="profile-modal-close" aria-label="关闭" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <ol className="verification-intro-steps">
            {STEPS.map((step, index) => {
              const isActive = step.id === activeStep;
              const isLast = index === STEPS.length - 1;
              return (
                <li key={step.id} className={`verification-intro-step${isActive ? " is-active" : ""}`}>
                  <div className="verification-intro-step-track">
                    <span className="verification-intro-step-num">{step.id}</span>
                    {!isLast ? <span className="verification-intro-step-line" aria-hidden /> : null}
                  </div>
                  <div className="verification-intro-step-body">
                    <strong>{step.title}</strong>
                    <p className="verification-intro-features-label">功能和限制</p>
                    <ul>
                      {step.features.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="profile-modal-actions verification-intro-actions">
            <button type="button" className="profile-btn-secondary" onClick={onClose}>
              稍后再完成
            </button>
            <button type="button" className="profile-btn-primary" onClick={onVerify}>
              验证
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export function resolveVerificationIntroActiveStep(input: {
  profileStep1Done: boolean;
  kycStatus: number;
}): 1 | 2 | 3 {
  if (!input.profileStep1Done) return 1;
  if (input.kycStatus !== 2) return 2;
  return 3;
}
