import { apiRequest } from "./client";

export type KycDocumentItem = {
  docType: number;
  imageUrl?: string;
};

export type KycStatusData = {
  kycStatus: number;
  applicationId?: number;
  fullName?: string;
  rejectReason?: string;
  submittedAt?: string;
  documents?: KycDocumentItem[];
};

export function fetchKycStatus() {
  return apiRequest<KycStatusData>("/kyc/status");
}

export function submitKyc(body: {
  fullName: string;
  idNumber: string;
  idFrontImage?: string;
  idBackImage?: string;
}) {
  return apiRequest<{ applicationId: number }>("/kyc/submit", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
