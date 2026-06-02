import type { User } from "@/types/user";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
  user: User;
};

export type SessionResponse = {
  accessToken: string;
  user: User;
};

export type OtpStartResponse = {
  message: string;
  otpExpiresAt: string;
  otpLength: number;
};

export type TutorRegisterResult = {
  message: string;
  tutorId: string;
  approvalStatus: string;
};
