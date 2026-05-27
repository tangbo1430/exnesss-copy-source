import { CircleCheck, ClipboardList, LockKeyhole, Mail, Smartphone } from "lucide-react";
import { ModalPortal } from "./ModalPortal";

type Props = {
  email: string;
  emailDone: boolean;
  phoneDone: boolean;
  onClose: () => void;
  onContinue: () => void;
  continueLabel?: string;
  profileDone?: boolean;
  title?: string;
};

export function VerificationStepsOverviewModal({
  email,
  emailDone,
  phoneDone,
  onClose,
  onContinue,
  continueLabel = "立即完成",
  profileDone = false,
  title = "验证您的联系信息",
}: Props) {

  return (
    <ModalPortal>
    <div className="profile-modal-backdrop" onClick={onClose} role="presentation">
      <div className="profile-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="profile-modal-header">
          <h3>{title}</h3>
          <p>只需不到5分钟的时间</p>
        </div>
        <ul className="profile-overview-list">
          <li className={emailDone ? "is-done" : undefined}>
            <Mail size={20} />
            <div>
              <strong>确认电子邮件地址</strong>
              <span>{email}</span>
            </div>
            {emailDone ? <CircleCheck size={22} className="profile-check-icon" /> : null}
          </li>
          <li className={phoneDone ? "is-done" : undefined}>
            <Smartphone size={20} />
            <div>
              <strong>确认手机号码</strong>
              <span>让您的账户更安全</span>
            </div>
            {phoneDone ? <CircleCheck size={22} className="profile-check-icon" /> : null}
          </li>
          <li className={profileDone ? "is-done" : undefined}>
            <ClipboardList size={20} />
            <div>
              <strong>添加个人资料信息</strong>
              <span>获取更定制化的体验</span>
            </div>
            {profileDone ? <CircleCheck size={22} className="profile-check-icon" /> : null}
          </li>
        </ul>
        <div className="profile-modal-footer">
          <p className="profile-modal-secure">
            <LockKeyhole size={14} />
            为了保障安全，我们将对所有数据进行加密
          </p>
          <div className="profile-modal-actions">
            <button type="button" className="profile-btn-secondary" onClick={onClose}>
              稍后再完成
            </button>
            <button type="button" className="profile-btn-primary" onClick={onContinue}>
              {continueLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
