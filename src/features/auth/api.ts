import axios from "axios";
import { request } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { User } from "@/types/user";
import type {
  LoginInput,
  RegisterInput,
  TutorRegisterInput,
  TutorOtpInput,
  UpdateProfileInput,
  ForgotPasswordInput,
} from "./schemas";
import type {
  OtpStartResponse,
  SessionResponse,
  TutorRegisterResult,
} from "./types";

// Browser → Next BFF (sets httpOnly refresh cookie)
const bff = axios.create({ baseURL: "", withCredentials: true });

export const authApi = {
  login: (body: LoginInput) =>
    bff
      .post<SessionResponse>("/api/auth/session", body)
      .then((r) => r.data),

  register: (body: RegisterInput) =>
    bff
      .post<SessionResponse>("/api/auth/session/register", body)
      .then((r) => r.data),

  // Tutor signup is a two-step OTP flow and does NOT log the user in:
  // the account stays PENDING until an admin approves it.
  tutorRegisterStart: (body: TutorRegisterInput) => {
    const { confirmPassword: _confirmPassword, ...payload } = body;
    void _confirmPassword;
    return bff
      .post<OtpStartResponse>("/api/auth/session/register-tutor/start", payload)
      .then((r) => r.data);
  },

  tutorRegisterVerify: (body: { email: string } & TutorOtpInput) =>
    bff
      .post<TutorRegisterResult>("/api/auth/session/register-tutor/verify", body)
      .then((r) => r.data),

  logout: () =>
    bff.post<void>("/api/auth/session/logout").then((r) => r.data),

  me: () => request<User>({ url: endpoints.auth.me, method: "GET" }),

  updateMe: (body: UpdateProfileInput) =>
    request<User>({ url: endpoints.auth.me, method: "PUT", data: body }),

  // Account recovery — the three public flows go through the BFF (no auth header),
  // mirroring login/register. The email-verify request is authed and uses the
  // client `request` so the in-memory access token is attached.
  forgotPassword: (body: ForgotPasswordInput) =>
    bff.post<void>("/api/auth/password/forgot", body).then((r) => r.data),

  resetPassword: (body: { token: string; password: string }) =>
    bff.post<void>("/api/auth/password/reset", body).then((r) => r.data),

  verifyEmail: (body: { token: string }) =>
    bff.post<void>("/api/auth/email/verify/confirm", body).then((r) => r.data),

  requestEmailVerification: () =>
    request<void>({ url: endpoints.auth.emailVerifyRequest, method: "POST" }),
};
