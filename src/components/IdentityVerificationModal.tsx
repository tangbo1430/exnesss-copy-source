import { FormEvent, useEffect, useState } from "react";
import { Alert } from "@mui/material";
import { FileText, Info, Pencil, Smartphone, X } from "lucide-react";
import * as kycApi from "../api/kyc";
import { kycIdentityLocked } from "../utils/kycSync";
import { refreshUserProfile } from "../utils/userProfile";
import { usePA } from "../state/paStore";
import { ModalPortal } from "./ModalPortal";
import { CountryFlag } from "./CountryFlag";
import { ProfileIdUploadFields } from "./ProfileIdUploadFields";

type Toast = (message: string) => void;

export type IdentityProfileNames = {
  firstName: string;
  lastName: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  toast: Toast;
  onSubmitted?: () => void;
  initialNames?: IdentityProfileNames;
  residenceCountry?: string;
};

type Phase = "intro" | "doc-type" | "upload";

type DocType = "passport" | "driver" | "id_card" | "residence";

const DOC_OPTIONS: { id: DocType; label: string }[] = [
  { id: "passport", label: "护照" },
  { id: "driver", label: "驾照" },
  { id: "id_card", label: "身份证" },
  { id: "residence", label: "居留证" },
];

const ISSUING_COUNTRIES = [
  { code: "CN", name: "中国" },
  { code: "TW", name: "台湾" },
  { code: "HK", name: "香港" },
  { code: "US", name: "美国" },
];

function needsBackSide(docType: DocType) {
  return docType === "id_card" || docType === "driver";
}

export function IdentityVerificationModal({
  open,
  onClose,
  toast,
  onSubmitted,
  initialNames,
  residenceCountry = "中国",
}: Props) {
  const { state, dispatch } = usePA();
  const kycStatus = state.userProfile?.kycStatus ?? 0;
  const rejectReason = state.userProfile?.kycRejectReason ?? "";

  const [phase, setPhase] = useState<Phase>("intro");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [issuingCountry, setIssuingCountry] = useState("中国");
  const [docType, setDocType] = useState<DocType>("id_card");
  const [idNumber, setIdNumber] = useState("");
  const [idFrontImage, setIdFrontImage] = useState("");
  const [idBackImage, setIdBackImage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const locked = kycIdentityLocked(kycStatus);
  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const issuing = ISSUING_COUNTRIES.find((c) => c.name === issuingCountry) ?? ISSUING_COUNTRIES[0];
  const residence = ISSUING_COUNTRIES.find((c) => c.name === residenceCountry) ?? ISSUING_COUNTRIES[0];

  useEffect(() => {
    if (!open) return;
    setPhase("intro");
    setEditingName(false);
    setDocType("id_card");
    setIssuingCountry("中国");
    setIdNumber("");
    setIdFrontImage("");
    setIdBackImage("");
    setFirstName(initialNames?.firstName ?? "");
    setLastName(initialNames?.lastName ?? "");

    let cancelled = false;
    void kycApi
      .fetchKycStatus()
      .then((data) => {
        if (cancelled || !data.fullName) return;
        const parts = data.fullName.trim().split(/\s+/);
        if (parts.length >= 2) {
          setFirstName(parts[0]);
          setLastName(parts.slice(1).join(" "));
        } else if (parts.length === 1) {
          setFirstName(parts[0]);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [open, initialNames?.firstName, initialNames?.lastName]);

  if (!open) return null;

  async function submitKyc(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) {
      if (kycStatus === 1) toast("身份验证审核中，请等待后台处理。");
      else toast("身份验证已通过。");
      onClose();
      return;
    }
    if (!fullName) {
      toast("请填写姓名。");
      return;
    }
    if (!idNumber.trim()) {
      toast("请填写证件号码。");
      return;
    }
    if (!idFrontImage.trim()) {
      toast("请上传证件正面照片。");
      return;
    }
    if (needsBackSide(docType) && !idBackImage.trim()) {
      toast("请上传证件反面照片。");
      return;
    }
    setSubmitting(true);
    try {
      await kycApi.submitKyc({
        fullName,
        idNumber: idNumber.trim(),
        idFrontImage,
        idBackImage: needsBackSide(docType) ? idBackImage : idFrontImage,
      });
      const nextStatus = await refreshUserProfile(dispatch);
      if (nextStatus === 2) toast("身份验证已通过。");
      else if (nextStatus === 1) toast("已提交，正在审核中，请等待后台处理。");
      else toast("已提交，请等待后台审核。");
      onSubmitted?.();
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "提交失败，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalPortal>
      <div className="profile-modal-backdrop" onClick={onClose} role="presentation">
        <div
          className={`profile-modal profile-kyc-modal${phase === "upload" ? " profile-modal--wide" : ""}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <button type="button" className="profile-modal-close" aria-label="关闭" onClick={onClose}>
            <X size={20} />
          </button>

          {kycStatus === 1 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              您的身份资料正在审核中，审核完成前不可修改或重新提交。
            </Alert>
          ) : null}
          {kycStatus === 3 && rejectReason ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              审核未通过：{rejectReason}。请重新上传证件并提交。
            </Alert>
          ) : null}
          {kycStatus === 2 ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              身份验证已通过，可进行 Real 账户入金与出金。
            </Alert>
          ) : null}

          {phase === "intro" ? (
            <div className="profile-kyc-intro">
              <div className="profile-kyc-intro-art" aria-hidden="true">
                <FileText size={48} strokeWidth={1.2} />
              </div>
              <h2 className="profile-kyc-heading">文件验证</h2>
              <p className="profile-kyc-lead">
                我们将在下一页面要求您上传一/两份可证明自己的姓名和居住国家/地区的文件。您当前的居住地为{" "}
                <CountryFlag code={residence.code} size="sm" /> {residenceCountry}
              </p>
              <div className="profile-kyc-name-row">
                <span className="profile-kyc-name-label">检查姓名：</span>
                {editingName ? (
                  <div className="profile-kyc-name-edit">
                    <input
                      className="profile-field"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="名"
                    />
                    <input
                      className="profile-field"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="姓"
                    />
                    <button
                      type="button"
                      className="profile-btn-secondary"
                      onClick={() => setEditingName(false)}
                    >
                      完成
                    </button>
                  </div>
                ) : (
                  <>
                    <strong className="profile-kyc-name-value">{fullName || "—"}</strong>
                    <button
                      type="button"
                      className="profile-kyc-edit-link"
                      onClick={() => setEditingName(true)}
                    >
                      <Pencil size={14} />
                      编辑
                    </button>
                  </>
                )}
              </div>
              <div className="profile-kyc-intro-actions">
                <button
                  type="button"
                  className="profile-btn-primary"
                  disabled={!fullName || locked}
                  onClick={() => setPhase("doc-type")}
                >
                  上传文件
                </button>
              </div>
            </div>
          ) : null}

          {phase === "doc-type" ? (
            <div className="profile-kyc-doc-type">
              <h2 className="profile-kyc-heading">验证身份</h2>
              <ol className="profile-kyc-steps-list">
                <li>
                  <span className="profile-kyc-step-label">选择开具证件的国家/地区</span>
                  <div className="profile-kyc-country-select">
                    <CountryFlag code={issuing.code} />
                    <select
                      value={issuingCountry}
                      onChange={(e) => setIssuingCountry(e.target.value)}
                      disabled={locked}
                    >
                      {ISSUING_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </li>
                <li>
                  <span className="profile-kyc-step-label">选择您的身份文件</span>
                  <div className="profile-kyc-doc-options" role="radiogroup">
                    {DOC_OPTIONS.map((opt, i) => (
                      <label
                        key={opt.id}
                        className={`profile-kyc-doc-option${docType === opt.id ? " is-selected" : ""}`}
                      >
                        <span className="profile-kyc-doc-num">{i + 1}</span>
                        <input
                          type="radio"
                          name="docType"
                          checked={docType === opt.id}
                          onChange={() => setDocType(opt.id)}
                          disabled={locked}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </li>
              </ol>
              <div className="profile-kyc-doc-type-actions">
                <button type="button" className="profile-btn-secondary" onClick={() => setPhase("intro")}>
                  返回
                </button>
                <button
                  type="button"
                  className="profile-btn-primary"
                  disabled={locked}
                  onClick={() => setPhase("upload")}
                >
                  继续
                </button>
              </div>
            </div>
          ) : null}

          {phase === "upload" ? (
            <form className="profile-kyc-upload" onSubmit={(e) => void submitKyc(e)}>
              <h2 className="profile-kyc-heading">验证身份</h2>
              <ol className="profile-kyc-steps-list profile-kyc-steps-list--upload">
                <li>
                  <span className="profile-kyc-step-label">选择开具证件的国家/地区</span>
                  <div className="profile-kyc-country-select">
                    <CountryFlag code={issuing.code} />
                    <select
                      value={issuingCountry}
                      onChange={(e) => setIssuingCountry(e.target.value)}
                      disabled={locked || submitting}
                    >
                      {ISSUING_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </li>
                <li>
                  <span className="profile-kyc-step-label">选择您的身份文件</span>
                  <div className="profile-kyc-doc-options profile-kyc-doc-options--compact" role="radiogroup">
                    {DOC_OPTIONS.map((opt, i) => (
                      <label
                        key={opt.id}
                        className={`profile-kyc-doc-option${docType === opt.id ? " is-selected" : ""}`}
                      >
                        <span className="profile-kyc-doc-num">{i + 1}</span>
                        <input
                          type="radio"
                          name="docTypeUpload"
                          checked={docType === opt.id}
                          onChange={() => setDocType(opt.id)}
                          disabled={locked || submitting}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </li>
                <li>
                  <span className="profile-kyc-step-label">身份证件照片</span>
                  <div className="profile-info-box profile-kyc-upload-tip">
                    <Info size={18} />
                    <p>确保文件显示您的照片、全名、出生日期和证件开具日期。</p>
                  </div>
                  <div className="profile-kyc-examples">
                    <div className="profile-kyc-example profile-kyc-example--ok">
                      <span className="profile-kyc-example-tag">正确示范</span>
                      <ul>
                        <li>照片清晰</li>
                        <li>细节可辨认</li>
                        <li>高质量</li>
                        <li>文件四角完整</li>
                      </ul>
                    </div>
                    <div className="profile-kyc-example profile-kyc-example--bad">
                      <span className="profile-kyc-example-tag">错误示范</span>
                      <ul>
                        <li>照片模糊/失焦</li>
                        <li>细节无法辨认</li>
                        <li>质量差</li>
                        <li>四角未完整展示</li>
                      </ul>
                    </div>
                  </div>
                  <button type="button" className="profile-kyc-mobile-link">
                    <Smartphone size={16} />
                    使用手机上传文件
                  </button>
                  <ProfileIdUploadFields
                    idNumber={idNumber}
                    idFrontImage={idFrontImage}
                    idBackImage={idBackImage}
                    onIdNumberChange={setIdNumber}
                    onFrontImageChange={setIdFrontImage}
                    onBackImageChange={setIdBackImage}
                    onError={(msg) => toast(msg)}
                    disabled={locked || submitting}
                    showBack={needsBackSide(docType)}
                    frontLabel={docType === "passport" ? "上传护照个人信息页" : "上传文件的正面"}
                    backLabel="上传文件的反面"
                    idNumberPlaceholder={
                      docType === "id_card" ? "身份证号码" : "证件号码"
                    }
                  />
                </li>
              </ol>
              <div className="profile-kyc-upload-actions">
                <button
                  type="button"
                  className="profile-btn-secondary"
                  disabled={submitting}
                  onClick={() => setPhase("doc-type")}
                >
                  返回
                </button>
                <button
                  type="submit"
                  className="profile-btn-primary"
                  disabled={locked || submitting}
                >
                  {submitting ? "提交中..." : kycStatus === 1 ? "审核中" : "提交审核"}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </ModalPortal>
  );
}
