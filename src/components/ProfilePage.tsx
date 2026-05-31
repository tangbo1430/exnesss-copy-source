import { FormEvent, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ModalPortal } from "./ModalPortal";
import { IdentityVerificationModal } from "./IdentityVerificationModal";
import { KycPostSubmitSteps } from "./KycPostSubmitSteps";
import { ProfileInfoForm, type ProfileFormValues } from "./ProfileInfoForm";
import { DEFAULT_PHONE_COUNTRY, PhoneCountrySelect } from "./PhoneCountrySelect";
import { VerificationStepsOverviewModal } from "./VerificationStepsOverviewModal";
import { usePA } from "../state/paStore";
import { refreshUserProfile } from "../utils/userProfile";
import * as authApi from "../api/auth";
import * as kycApi from "../api/kyc";
import { parsePhoneE164, type PhoneCountry } from "../data/phoneCountries";
import { maskPhoneDisplay } from "../utils/maskPhone";
import {
  buildFullPhone,
  maxLocalPhoneLength,
  phoneDigitsOnly,
  validatePhoneLocal,
} from "../utils/validatePhone";
import type { UserProfile } from "../types";
import {
  ChevronDown,
  ChevronUp,
  Info,
  Mail,
  MessageCircle,
  Smartphone,
  User,
  X,
} from "lucide-react";

const STORAGE_KEY = "exness-profile-verify-v1";
export const PROFILE_FLOW_KEY = "pa-profile-flow";

function continueLabelForContact(emailDone: boolean, phoneDone: boolean, profileDone: boolean) {
  if (!emailDone) return "立即开始";
  if (!phoneDone) return "立即开始";
  if (!profileDone) return "立即完成";
  return "立即完成";
}

type ModalView =
  | null
  | "overview"
  | "email"
  | "phone-input"
  | "phone-code"
  | "profile-wizard";

type SavedState = {
  step1Done: boolean;
  emailDone: boolean;
  phoneDone: boolean;
  firstName: string;
  lastName: string;
  /** API 不可用时的本地回显 */
  savedPhone?: string;
};

function mergeSavedFromProfile(
  profile: {
    emailVerified?: boolean;
    phoneVerified?: boolean;
    profileStep1Done?: boolean;
    profileFirstName?: string;
    profileLastName?: string;
  } | null,
  local: SavedState,
): SavedState {
  if (!profile) return local;
  return {
    step1Done: profile.profileStep1Done ?? local.step1Done,
    emailDone: profile.emailVerified ?? local.emailDone,
    phoneDone: profile.phoneVerified ?? local.phoneDone,
    firstName: profile.profileFirstName?.trim() || local.firstName,
    lastName: profile.profileLastName?.trim() || local.lastName,
    savedPhone: local.savedPhone,
  };
}

function readSaved(): SavedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SavedState;
  } catch {
    /* ignore */
  }
  return { step1Done: false, emailDone: false, phoneDone: false, firstName: "", lastName: "" };
}

function writeSaved(state: SavedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function SixDigitCode({
  onComplete,
  autoFocus = true,
}: {
  onComplete: () => void;
  autoFocus?: boolean;
}) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
    setDigits(["", "", "", "", "", ""]);
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const triggerComplete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    window.setTimeout(onComplete, 120);
  };

  const update = (index: number, value: string) => {
    const d = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = d;
      if (next.every((c) => c.length === 1)) {
        triggerComplete();
      }
      return next;
    });
    if (d && index < 5) refs.current[index + 1]?.focus();
  };

  const onKeyDown = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const onPaste = (event: React.ClipboardEvent) => {
    const text = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    event.preventDefault();
    const arr = text.split("").concat(Array(6).fill("")).slice(0, 6);
    setDigits(arr);
    refs.current[Math.min(text.length, 5)]?.focus();
    if (text.length >= 6) triggerComplete();
  };

  return (
    <div className="profile-code-row" onPaste={onPaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className={`profile-code-box${i === 0 && !digit ? " is-focused" : ""}${digit ? " has-value" : ""}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => update(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e.key)}
        />
      ))}
    </div>
  );
}

function CountdownResend() {
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [seconds]);

  return (
    <p className="profile-code-timer">
      {seconds > 0 ? (
        <>
          <span>{pad2(Math.floor(seconds / 60))}:{pad2(seconds % 60)}</span>
          后 获取新验证码
        </>
      ) : (
        <button type="button" className="profile-link-btn" onClick={() => setSeconds(60)}>
          获取新验证码
        </button>
      )}
    </p>
  );
}

function ModalOverlay({
  children,
  onClose,
  wide,
}: {
  children: ReactNode;
  onClose?: () => void;
  wide?: boolean;
}) {
  return (
    <ModalPortal>
      <div className="profile-modal-backdrop" onClick={onClose} role="presentation">
        <div
          className={`profile-modal${wide ? " profile-modal--wide" : ""}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    </ModalPortal>
  );
}

export function ProfilePage({ toast }: { toast?: (msg: string) => void }) {
  const { state, dispatch } = usePA();
  const kycStatus = state.userProfile?.kycStatus ?? 0;
  const kycRejectReason = state.userProfile?.kycRejectReason ?? "";
  const maskedEmail = state.userProfile?.maskedEmail ?? "—";

  const [saved, setSaved] = useState<SavedState>(readSaved);
  const [expandedStep, setExpandedStep] = useState<1 | 2 | 3>(saved.step1Done ? 2 : 1);
  const [modal, setModal] = useState<ModalView>(null);
  const [identityOpen, setIdentityOpen] = useState(false);
  const [kycFullName, setKycFullName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountry>(DEFAULT_PHONE_COUNTRY);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pendingFullPhone, setPendingFullPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [resumeToIdentity, setResumeToIdentity] = useState(false);
  const flowBootstrapped = useRef(false);
  const phoneSubmitLock = useRef(false);
  const [localMaskedPhone, setLocalMaskedPhone] = useState("");
  const [profileWizardStep, setProfileWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const maskedPhone =
    state.userProfile?.maskedPhone ||
    localMaskedPhone ||
    (saved.savedPhone ? maskPhoneDisplay(saved.savedPhone) : "");

  const [profileForm, setProfileForm] = useState<ProfileFormValues>({
    firstName: saved.firstName || "33",
    lastName: saved.lastName || "33",
    birthDay: "18",
    birthMonth: "5",
    birthYear: "2006",
    birthCountry: "中国",
    gender: "女",
    address: "",
  });

  const persist = useCallback((next: SavedState) => {
    setSaved(next);
    writeSaved(next);
  }, []);

  const applyStoredPhone = useCallback((phone: string, masked?: string) => {
    if (!phone.trim()) return;
    const parsed = parsePhoneE164(phone);
    if (parsed) {
      setPhoneCountry(parsed.country);
      setPhoneNumber(parsed.local);
      setPendingFullPhone(phone);
    }
    setLocalMaskedPhone(masked ?? maskPhoneDisplay(phone));
  }, []);

  useEffect(() => {
    if (!state.userProfile) return;
    setSaved((prev) => {
      const next = mergeSavedFromProfile(state.userProfile, prev);
      writeSaved(next);
      return next;
    });
  }, [state.userProfile]);

  useEffect(() => {
    const phone = state.userProfile?.phone;
    if (phone) {
      applyStoredPhone(phone, state.userProfile?.maskedPhone);
    }
  }, [applyStoredPhone, state.userProfile?.maskedPhone, state.userProfile?.phone]);

  useEffect(() => {
    void (async () => {
      try {
        await refreshUserProfile(dispatch);
        const profile = await authApi.fetchProfile();
        const merged = mergeSavedFromProfile(profile, readSaved());
        persist(merged);
        if (profile.phone) {
          applyStoredPhone(profile.phone, profile.maskedPhone);
        } else if (merged.savedPhone) {
          applyStoredPhone(merged.savedPhone);
        }
        if (profile.profileFirstName || profile.profileLastName) {
          setProfileForm((prev) => ({
            ...prev,
            firstName: profile.profileFirstName || prev.firstName,
            lastName: profile.profileLastName || prev.lastName,
          }));
        }
      } catch {
        /* ignore */
      }
      void kycApi.fetchKycStatus().then((data) => {
        if (data.fullName) setKycFullName(data.fullName);
      }).catch(() => undefined);
    })();
  }, [dispatch, persist, applyStoredPhone]);

  const emailDone = Boolean(state.userProfile?.emailVerified ?? saved.emailDone);
  const phoneDone = Boolean(state.userProfile?.phoneVerified ?? saved.phoneDone);
  const step1Done = Boolean(state.userProfile?.profileStep1Done ?? saved.step1Done);

  function continueContactFlow() {
    if (!emailDone) {
      setModal("email");
      return;
    }
    if (!phoneDone) {
      setModal("phone-input");
      return;
    }
    if (!step1Done) {
      setProfileWizardStep(1);
      setModal("profile-wizard");
      return;
    }
    if (resumeToIdentity) {
      setResumeToIdentity(false);
      setModal(null);
      setIdentityOpen(true);
      return;
    }
    setModal(null);
  }

  function advanceProfileWizard() {
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast?.("请填写姓名");
      return;
    }
    setProfileWizardStep(2);
  }

  const identityVerified = kycStatus === 2;
  const identityPending = kycStatus === 1;
  const identityRejected = kycStatus === 3;

  let completedCount = 0;
  if (step1Done) completedCount += 1;
  if (identityVerified) completedCount += 1;

  const statusLabel =
    completedCount >= 2 ? "部分验证" : completedCount === 1 ? "部分验证" : "未验证";
  const statusClass = completedCount === 0 ? "is-unverified" : "is-partial";

  const depositLimitLabel = identityVerified ? "10,000 美元" : "0 美元";
  const depositHint = identityVerified
    ? "身份验证已通过，入金限额已提升"
    : "验证您的账户，解锁限额";

  const displayName = kycFullName || (saved.firstName && saved.lastName ? `${saved.firstName} ${saved.lastName}` : "");

  /** 步骤1：先展示概览，再按进度进入邮箱 / 手机 / 个人资料 */
  const openStep1Flow = () => {
    if (step1Done) return;
    setModal("overview");
  };

  const openIdentityVerifyFlow = () => {
    if (identityPending) return;
    if (!emailDone || !phoneDone || !step1Done) {
      setResumeToIdentity(true);
      setExpandedStep(1);
      openStep1Flow();
      toast?.("请先完成邮箱、手机验证及个人资料");
      return;
    }
    setModal(null);
    setIdentityOpen(true);
  };

  const finishStep1 = () => {
    void (async () => {
      const first = profileForm.firstName.trim() || "33";
      const last = profileForm.lastName.trim() || "33";
      try {
        await authApi.completeProfileStep1({ firstName: first, lastName: last });
        await refreshUserProfile(dispatch);
      } catch (err) {
        toast?.(err instanceof Error ? err.message : "个人资料保存失败");
        return;
      }
      persist({
        step1Done: true,
        emailDone: true,
        phoneDone: true,
        firstName: first,
        lastName: last,
      });
      setExpandedStep(2);
      if (resumeToIdentity) {
        setResumeToIdentity(false);
        setIdentityOpen(true);
        return;
      }
      setModal(null);
      toast?.("个人资料步骤已完成，可进行身份验证");
    })();
  };

  const patchUserProfilePhone = useCallback(
    (fullPhone: string, masked: string) => {
      const base: UserProfile = state.userProfile ?? {
        email: "",
        maskedEmail: maskedEmail === "—" ? "" : maskedEmail,
        emailVerified: false,
        phone: "",
        maskedPhone: "",
        phoneVerified: false,
        profileStep1Done: false,
        profileFirstName: "",
        profileLastName: "",
        kycStatus: 0,
        kycRejectReason: "",
      };
      dispatch({
        type: "SET_USER_PROFILE",
        profile: {
          ...base,
          phone: fullPhone,
          maskedPhone: masked,
          phoneVerified: true,
        },
      });
      setLocalMaskedPhone(masked);
    },
    [dispatch, maskedEmail, state.userProfile],
  );

  const finishPhoneVerification = useCallback(async () => {
    if (phoneSubmitLock.current) return;
    const digits = phoneDigitsOnly(phoneNumber);
    const formatErr = validatePhoneLocal(phoneCountry.dial, digits);
    if (formatErr) {
      toast?.(formatErr);
      return;
    }
    const fullPhone = pendingFullPhone || buildFullPhone(phoneCountry.dial, digits);

    phoneSubmitLock.current = true;
    setSavingPhone(true);
    try {
      const res = await authApi.verifyPhone({
        countryCode: phoneCountry.dial,
        phoneNumber: digits,
      });
      const savedPhone = res.phone || fullPhone;
      const masked = res.maskedPhone || maskPhoneDisplay(savedPhone);
      setSaved((s) => {
        const next = { ...s, phoneDone: true, savedPhone };
        writeSaved(next);
        return next;
      });
      patchUserProfilePhone(savedPhone, masked);
      applyStoredPhone(savedPhone, masked);
      await refreshUserProfile(dispatch);
      toast?.("手机号码已验证并保存");
      setModal("overview");
    } catch (err) {
      toast?.(err instanceof Error ? err.message : "手机号保存失败，请稍后重试");
    } finally {
      setSavingPhone(false);
      phoneSubmitLock.current = false;
    }
  }, [
    applyStoredPhone,
    dispatch,
    patchUserProfilePhone,
    pendingFullPhone,
    phoneCountry.dial,
    phoneNumber,
    toast,
  ]);

  function proceedToPhoneCode() {
    const digits = phoneDigitsOnly(phoneNumber);
    const formatErr = validatePhoneLocal(phoneCountry.dial, digits);
    if (formatErr) {
      toast?.(formatErr);
      return;
    }
    setPendingFullPhone(buildFullPhone(phoneCountry.dial, digits));
    setModal("phone-code");
  }

  useEffect(() => {
    if (flowBootstrapped.current) return;
    flowBootstrapped.current = true;
    const flow = sessionStorage.getItem(PROFILE_FLOW_KEY);
    if (!flow) return;
    sessionStorage.removeItem(PROFILE_FLOW_KEY);
    if (flow === "identity") {
      window.setTimeout(() => openIdentityVerifyFlow(), 0);
    } else if (flow === "step1") {
      window.setTimeout(() => openStep1Flow(), 0);
    }
  });

  const toggleStep = (step: 1 | 2 | 3) => {
    setExpandedStep((cur) => (cur === step ? cur : step));
  };

  return (
    <div className="profile-exness-page">
      <h1 className="profile-exness-title">个人资料</h1>

      <section className="profile-exness-section">
        <h2 className="profile-exness-subtitle">账户</h2>
        <div className="profile-summary-cards">
          <div className="profile-summary-card">
            <div className="profile-summary-icon" aria-hidden="true">
              <User size={22} strokeWidth={1.5} />
            </div>
            <div className="profile-summary-body">
              <span className="profile-summary-label">状态</span>
              <strong className={`profile-summary-value ${statusClass}`}>{statusLabel}</strong>
              <span className="profile-summary-hint">已完成 {completedCount}/3 步</span>
            </div>
          </div>
          <div className="profile-summary-card">
            <div className="profile-summary-body profile-summary-body--solo">
              <span className="profile-summary-label">入金限额</span>
              <strong className="profile-summary-value">{depositLimitLabel}</strong>
              <span className="profile-summary-hint">{depositHint}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="profile-exness-section">
        <h2 className="profile-exness-subtitle">验证步骤</h2>
        <div className="profile-steps-panel">
          {/* Step 1 */}
          <div className={`profile-step${expandedStep === 1 ? " is-expanded" : ""}${step1Done ? " is-done" : ""}`}>
            <button type="button" className="profile-step-head" onClick={() => toggleStep(1)}>
              <span className={`profile-step-num${step1Done ? "" : expandedStep === 1 ? " is-active" : ""}`}>1</span>
              <span className="profile-step-title">
                {step1Done ? "个人信息" : "确认电子邮箱和手机号码。添加个人资料"}
              </span>
              {step1Done ? (
                <span className="profile-step-verified">已验证</span>
              ) : (
                <span className="profile-step-chevron" aria-hidden="true">
                  {expandedStep === 1 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              )}
            </button>
            {step1Done ? (
              <div className="profile-step-done-body">
                <p className="profile-step-contact">
                  {maskedEmail}
                  {phoneDone && maskedPhone ? `, ${maskedPhone}` : ""}
                </p>
              </div>
            ) : expandedStep === 1 ? (
              <div className="profile-step-body">
                <p className="profile-step-muted">待确认个人资料</p>
                <p className="profile-step-detail">
                  {maskedEmail} · 手机号码 · 添加个人资料信息
                </p>
                <p className="profile-step-features-title">功能和限制</p>
                <ul className="profile-step-features">
                  <li>出金</li>
                </ul>
                <button type="button" className="profile-btn-primary" onClick={openStep1Flow}>
                  立即完成
                </button>
              </div>
            ) : null}
          </div>

          <div className="profile-step-divider" />

          {/* Step 2 */}
          <div className={`profile-step${expandedStep === 2 ? " is-expanded" : ""}${!step1Done ? " is-locked" : ""}${identityVerified ? " is-done" : ""}`}>
            <button
              type="button"
              className="profile-step-head"
              onClick={() => step1Done && toggleStep(2)}
              disabled={!step1Done}
            >
              <span className={`profile-step-num${identityVerified ? "" : expandedStep === 2 && step1Done ? " is-active-blue" : ""}`}>2</span>
              <span className="profile-step-title">身份验证</span>
              {identityVerified ? (
                <span className="profile-step-verified">已验证</span>
              ) : step1Done ? (
                <span className="profile-step-chevron" aria-hidden="true">
                  {expandedStep === 2 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              ) : null}
            </button>
            {identityVerified && step1Done ? (
              <div className="profile-step-done-body">
                {displayName ? <p className="profile-step-contact">{displayName}</p> : null}
              </div>
            ) : expandedStep === 2 && step1Done ? (
              <div className="profile-step-body">
                <p className="profile-step-muted">请提供可验证您姓名的文件</p>
                {displayName ? <p className="profile-step-detail">{displayName}</p> : null}
                {identityPending ? (
                  <p className="profile-step-detail profile-step-detail--warn">审核中，请等待后台处理</p>
                ) : null}
                {identityRejected && kycRejectReason ? (
                  <p className="profile-step-detail profile-step-detail--warn">未通过：{kycRejectReason}</p>
                ) : null}
                <p className="profile-step-features-title">功能和限制</p>
                <ul className="profile-step-features">
                  <li>入金金额上限为10,000美元</li>
                  <li>全球和本地支付方式</li>
                  <li>银行卡和加密数字货币支付</li>
                  <li>交易</li>
                </ul>
                <button
                  type="button"
                  className="profile-btn-primary"
                  disabled={identityPending}
                  onClick={openIdentityVerifyFlow}
                >
                  {identityPending ? "审核中" : identityRejected ? "重新提交" : "立即验证"}
                </button>
              </div>
            ) : !step1Done ? (
              <div className="profile-step-body profile-step-body--collapsed">
                <p className="profile-step-muted">请提供由政府颁发的文件</p>
                <p className="profile-step-detail">添加个人资料信息</p>
                <p className="profile-step-features-title">功能和限制</p>
                <ul className="profile-step-features">
                  <li>入金金额上限为 10,000 美元</li>
                  <li>全球和本地支付方式</li>
                  <li>银行卡和加密数字货币支付</li>
                  <li>交易</li>
                </ul>
                <button type="button" className="profile-btn-outline" disabled>
                  立即验证
                </button>
              </div>
            ) : null}
          </div>

          <div className="profile-step-divider" />

          {/* Step 3 */}
          <div className={`profile-step${expandedStep === 3 ? " is-expanded" : ""}${!step1Done ? " is-locked" : ""}`}>
            <button
              type="button"
              className="profile-step-head"
              onClick={() => step1Done && toggleStep(3)}
              disabled={!step1Done}
            >
              <span className="profile-step-num">3</span>
              <span className="profile-step-title profile-step-title--muted">居住地址验证</span>
              {step1Done ? (
                <span className="profile-step-chevron" aria-hidden="true">
                  {expandedStep === 3 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              ) : null}
            </button>
            {expandedStep === 3 && step1Done ? (
              <div className="profile-step-body">
                <p className="profile-step-muted">您需要提供您的地址证明</p>
                <p className="profile-step-detail">添加个人资料信息</p>
                <p className="profile-step-features-title">功能和限制</p>
                <ul className="profile-step-features">
                  <li>无入金金额限制</li>
                </ul>
                <button type="button" className="profile-btn-outline" disabled>
                  立即验证
                </button>
              </div>
            ) : !step1Done ? (
              <div className="profile-step-body profile-step-body--collapsed">
                <p className="profile-step-muted">您需要提供您的地址证明</p>
                <p className="profile-step-detail">添加个人资料信息</p>
                <p className="profile-step-features-title">功能和限制</p>
                <ul className="profile-step-features">
                  <li>无入金金额限制</li>
                </ul>
                <button type="button" className="profile-btn-outline" disabled>
                  立即验证
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Modals — 步骤1：邮箱/手机本地验证，无后端交互 */}
      {modal === "overview" && (
        <VerificationStepsOverviewModal
          email={maskedEmail}
          emailDone={emailDone}
          phoneDone={phoneDone}
          profileDone={step1Done}
          onClose={() => setModal(null)}
          onContinue={continueContactFlow}
          continueLabel={continueLabelForContact(emailDone, phoneDone, step1Done)}
        />
      )}

      {modal === "email" && (
        <ModalOverlay>
          <div className="profile-modal-header profile-modal-header--compact">
            <h3>确认您的电子邮箱</h3>
            <p>我们已向您的登录邮箱发送验证码（无需重新填写邮箱）</p>
          </div>
          <div className="profile-verify-block">
            <div className="profile-at-icon">@</div>
            <div>
              <p>输入我们发送的验证码:</p>
              <strong>{maskedEmail !== "—" ? maskedEmail : state.userProfile?.email ?? "—"}</strong>
            </div>
          </div>
          <SixDigitCode
            key="email-code"
            onComplete={() => {
              void (async () => {
                try {
                  await authApi.verifyContactEmail();
                  await refreshUserProfile(dispatch);
                } catch (err) {
                  toast?.(err instanceof Error ? err.message : "邮箱验证失败");
                  return;
                }
                persist({ ...readSaved(), emailDone: true });
                toast?.("邮箱已验证");
                setModal("overview");
              })();
            }}
          />
          <CountdownResend />
          <button type="button" className="profile-link-btn profile-link-btn--left">
            没有收到验证码
          </button>
          <button
            type="button"
            className="profile-btn-secondary profile-btn-back"
            onClick={() => setModal(null)}
          >
            稍后再完成
          </button>
        </ModalOverlay>
      )}

      {modal === "phone-input" && (
        <ModalOverlay>
          <div className="profile-modal-header profile-modal-header--compact">
            <h3>输入您的手机号码</h3>
            <p>我们会把验证码发送至此号码</p>
          </div>
          <div className="profile-info-box">
            <Info size={18} />
            <p>
              请使用归属地为当前居住国家/地区的手机号码。您稍后需要验证您的地址
            </p>
          </div>
          <label className="profile-field-label">手机号码</label>
          {state.userProfile?.phone ? (
            <p className="profile-field-hint">已保存的手机号已自动填充，可修改后重新验证</p>
          ) : null}
          <div className="profile-phone-input">
            <PhoneCountrySelect value={phoneCountry} onChange={setPhoneCountry} />
            <input
              type="tel"
              inputMode="numeric"
              value={phoneNumber}
              maxLength={maxLocalPhoneLength(phoneCountry.dial)}
              onChange={(e) => {
                const digits = phoneDigitsOnly(e.target.value);
                setPhoneNumber(digits.slice(0, maxLocalPhoneLength(phoneCountry.dial)));
              }}
              placeholder={phoneCountry.dial === "+86" ? "例如 13800138000" : ""}
              autoFocus
            />
          </div>
          <button
            type="button"
            className="profile-btn-primary profile-btn-primary--full"
            onClick={proceedToPhoneCode}
          >
            继续
          </button>
        </ModalOverlay>
      )}

      {modal === "phone-code" && (
        <ModalOverlay>
          <div className="profile-modal-header profile-modal-header--compact">
            <h3>确认手机号码</h3>
          </div>
          <div className="profile-verify-block">
            <MessageCircle size={20} />
            <div>
              <p>请输入短信验证码或发送至您消息应用程序的验证码：</p>
              <strong>{pendingFullPhone}</strong>
            </div>
          </div>
          <SixDigitCode
            key={`phone-code-${pendingFullPhone}`}
            onComplete={() => void finishPhoneVerification()}
          />
          {savingPhone ? <p className="profile-code-timer">保存中...</p> : null}
          <button
            type="button"
            className="profile-btn-primary profile-btn-primary--full"
            style={{ marginTop: 12 }}
            disabled={savingPhone}
            onClick={() => void finishPhoneVerification()}
          >
            确认验证码
          </button>
          <div className="profile-info-box profile-info-box--sms">
            <p>
              借助已验证的帐户获取验证码：Exness。只有一个6位验证码。无链接或文件。
            </p>
          </div>
          <CountdownResend />
          <button type="button" className="profile-link-btn profile-link-btn--left">
            没有收到验证码
          </button>
          <button type="button" className="profile-btn-secondary profile-btn-back" onClick={() => setModal("phone-input")}>
            返回
          </button>
        </ModalOverlay>
      )}

      {modal === "profile-wizard" && (
        <ModalOverlay
          wide
          onClose={() => {
            setModal(null);
            setProfileWizardStep(1);
          }}
        >
          <button
            type="button"
            className="profile-modal-close"
            aria-label="关闭"
            onClick={() => {
              setModal(null);
              setProfileWizardStep(1);
            }}
          >
            <X size={20} />
          </button>
          {profileWizardStep === 1 ? (
            <ProfileInfoForm
              values={profileForm}
              onChange={(patch) => setProfileForm((prev) => ({ ...prev, ...patch }))}
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                advanceProfileWizard();
              }}
              onLater={() => {
                setModal(null);
                setProfileWizardStep(1);
              }}
              submitLabel="继续"
              stepLabel="1/5"
            />
          ) : (
            <KycPostSubmitSteps
              key={profileWizardStep}
              initialIndex={profileWizardStep - 2}
              onBackToProfile={() => setProfileWizardStep(1)}
              onFinish={() => {
                finishStep1();
                setProfileWizardStep(1);
              }}
            />
          )}
        </ModalOverlay>
      )}

      <IdentityVerificationModal
        open={identityOpen}
        onClose={() => setIdentityOpen(false)}
        initialNames={{
          firstName: saved.firstName || profileForm.firstName,
          lastName: saved.lastName || profileForm.lastName,
        }}
        residenceCountry={profileForm.birthCountry}
        toast={(msg) => toast?.(msg)}
        onSubmitted={() => {
          void kycApi.fetchKycStatus().then((data) => {
            if (data.fullName) setKycFullName(data.fullName);
          });
        }}
      />
    </div>
  );
}
