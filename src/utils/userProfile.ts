import * as authApi from "../api/auth";
import * as kycApi from "../api/kyc";
import type { Dispatch } from "react";
import type { UserProfile } from "../types";

export async function refreshUserProfile(
  dispatch: Dispatch<{ type: "SET_USER_PROFILE"; profile: UserProfile }>,
): Promise<number> {
  const [profile, kyc] = await Promise.all([authApi.fetchProfile(), kycApi.fetchKycStatus()]);
  const kycStatus = kyc.kycStatus ?? profile.kycStatus;
  dispatch({
    type: "SET_USER_PROFILE",
    profile: {
      email: profile.email,
      maskedEmail: profile.maskedEmail,
      phone: profile.phone ?? "",
      maskedPhone: profile.maskedPhone ?? "",
      phoneVerified: Boolean(profile.phoneVerified),
      kycStatus,
      kycRejectReason: kyc.rejectReason ?? "",
    },
  });
  return kycStatus;
}
