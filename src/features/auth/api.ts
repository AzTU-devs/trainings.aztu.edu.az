import axios from "axios";
import { request } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { User } from "@/types/user";
import type {
  LoginInput,
  RegisterInput,
  TutorRegisterInput,
  TutorOtpInput,
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
};
