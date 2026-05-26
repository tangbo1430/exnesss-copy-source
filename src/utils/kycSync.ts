import type { VerificationStep } from "../types";
import { translateText } from "../i18n";

function completedStep(step: VerificationStep): VerificationStep {
  return {
    ...step,
    status: "Completed",
    completedAt: step.completedAt ?? new Date().toISOString(),
  };
}

function t(text: string, language: string): string {
  return translateText(text, language);
}

export function mapVerificationFromKyc(
  kycStatus: number,
  rejectReason: string,
  steps: VerificationStep[],
  language: string,
): VerificationStep[] {
  return steps.map((step) => {
    const localized = {
      ...step,
      title: t(step.title, language),
      description: t(step.description, language),
    };
    if (kycStatus === 2) {
      return completedStep(localized);
    }
    if (step.id !== "identity") {
      return localized;
    }
    if (kycStatus === 1) {
      return {
        ...localized,
        status: "In progress",
        description: t("Your identity documents are under review.", language),
      };
    }
    if (kycStatus === 3) {
      return {
        ...localized,
        status: "Pending",
        description: rejectReason
          ? t(`Rejected: ${rejectReason}. Please upload documents again.`, language)
          : t("Your previous submission was rejected. Please upload documents again.", language),
      };
    }
    return { ...localized, status: "Pending" };
  });
}

export function kycPaymentsAllowed(kycStatus: number): boolean {
  return kycStatus === 2;
}

/** 已通过或审核中时不可再上传/提交 KYC */
export function kycIdentityLocked(kycStatus: number): boolean {
  return kycStatus === 1 || kycStatus === 2;
}

export function kycPaymentBlockedMessage(kycStatus: number, language: string): string {
  if (kycStatus === 1) {
    return t("Identity verification is under review. Deposit and withdrawal unlock after approval.", language);
  }
  if (kycStatus === 3) {
    return t("Identity verification was rejected. Resubmit documents before deposit or withdrawal.", language);
  }
  return t("Complete identity verification before deposit or withdrawal.", language);
}

export function kycStatusLabel(kycStatus: number, language: string): string {
  switch (kycStatus) {
    case 1:
      return t("In progress", language);
    case 2:
      return t("Verified", language);
    case 3:
      return t("Rejected", language);
    default:
      return t("Not verified", language);
  }
}

export function verificationStatusLabel(status: VerificationStep["status"], language: string): string {
  return t(status, language);
}
