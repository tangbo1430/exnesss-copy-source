import { compressImageFile } from "../api/client";

type Props = {
  idNumber: string;
  idFrontImage: string;
  idBackImage: string;
  onIdNumberChange: (value: string) => void;
  onFrontImageChange: (value: string) => void;
  onBackImageChange: (value: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  showBack?: boolean;
  frontLabel?: string;
  backLabel?: string;
  idNumberPlaceholder?: string;
};

export function ProfileIdUploadFields({
  idNumber,
  idFrontImage,
  idBackImage,
  onIdNumberChange,
  onFrontImageChange,
  onBackImageChange,
  onError,
  disabled,
  showBack = true,
  frontLabel = "身份证正面",
  backLabel = "身份证反面",
  idNumberPlaceholder = "身份证号码",
}: Props) {
  async function handlePick(file: File | undefined, setter: (value: string) => void) {
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setter(dataUrl);
    } catch {
      onError?.("图片格式无效，请上传 JPG 或 PNG。");
    }
  }

  return (
    <>
      <label className="profile-field-label">证件号码</label>
      <input
        className="profile-field"
        value={idNumber}
        onChange={(e) => onIdNumberChange(e.target.value)}
        placeholder={idNumberPlaceholder}
        disabled={disabled}
      />
      <span className="profile-field-hint">与证件一致的号码</span>

      <div className="profile-id-upload">
        <span className="profile-field-label">
          {frontLabel} <span className="profile-required">*</span>
        </span>
        <label className={`profile-id-upload-zone${disabled ? " is-disabled" : ""}`}>
          <span className="profile-id-upload-zone-text">点击或拖拽上传</span>
          <input
            hidden
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            disabled={disabled}
            onChange={(e) => void handlePick(e.target.files?.[0], onFrontImageChange)}
          />
        </label>
        {idFrontImage ? (
          <img src={idFrontImage} alt="身份证正面" className="profile-id-preview" />
        ) : null}
      </div>

      {showBack ? (
        <div className="profile-id-upload">
          <span className="profile-field-label">
            {backLabel} <span className="profile-required">*</span>
          </span>
          <label className={`profile-id-upload-zone${disabled ? " is-disabled" : ""}`}>
            <span className="profile-id-upload-zone-text">点击或拖拽上传</span>
            <input
              hidden
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              disabled={disabled}
              onChange={(e) => void handlePick(e.target.files?.[0], onBackImageChange)}
            />
          </label>
          {idBackImage ? (
            <img src={idBackImage} alt={backLabel} className="profile-id-preview" />
          ) : null}
        </div>
      ) : null}
    </>
  );
}
