import type { VerificationStep } from "../types";

function completedStep(step: VerificationStep): VerificationStep {
  return {
    ...step,
    status: "Completed",
    completedAt: step.completedAt ?? new Date().toISOString(),
  };
}

export function mapVerificationFromKyc(
  kycStatus: number,
  rejectReason: string,
  steps: VerificationStep[],
): VerificationStep[] {
  return steps.map((step) => {
    if (kycStatus === 2) {
      return completedStep(step);
    }
    if (step.id !== "identity") {
      return step;
    }
    if (kycStatus === 1) {
      return {
        ...step,
        status: "In progress",
        description: "Your identity documents are under review.",
      };
    }
    if (kycStatus === 3) {
      return {
        ...step,
        status: "Pending",
        description: rejectReason
          ? `Rejected: ${rejectReason}. Please upload documents again.`
          : "Your previous submission was rejected. Please upload documents again.",
      };
    }
    return { ...step, status: "Pending" };
  });
}

export function kycPaymentsAllowed(kycStatus: number): boolean {
  return kycStatus === 2;
}

/** 已通过或审核中时不可再上传/提交 KYC */
export function kycIdentityLocked(kycStatus: number): boolean {
  return kycStatus === 1 || kycStatus === 2;
}

export function kycPaymentBlockedMessage(kycStatus: number): string {
  if (kycStatus === 1) {
    return "Identity verification is under review. Deposit and withdrawal unlock after approval.";
  }
  if (kycStatus === 3) {
    return "Identity verification was rejected. Resubmit documents before deposit or withdrawal.";
  }
  return "Complete identity verification before deposit or withdrawal.";
}

export function kycStatusLabel(kycStatus: number): string {
  switch (kycStatus) {
    case 1:
      return "审核中";
    case 2:
      return "已通过";
    case 3:
      return "已拒绝";
    default:
      return "未认证";
  }
}
