"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "./api";
import { qk } from "@/lib/query/keys";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setAccessToken,
  setUser,
  signOut as signOutAction,
} from "@/store/slices/auth-slice";
import type {
  LoginInput,
  RegisterInput,
  TutorRegisterInput,
  TutorOtpInput,
} from "./schemas";

export function useAuth() {
  return useAppSelector((s) => s.auth);
}

export function useLogin() {
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginInput) => authApi.login(body),
    onSuccess: (data) => {
      dispatch(setAccessToken(data.accessToken));
      dispatch(setUser(data.user));
      qc.setQueryData(qk.auth.me(), data.user);
    },
  });
}

export function useRegister() {
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RegisterInput) => authApi.register(body),
    onSuccess: (data) => {
      dispatch(setAccessToken(data.accessToken));
      dispatch(setUser(data.user));
      qc.setQueryData(qk.auth.me(), data.user);
    },
  });
}

// Tutor signup is a two-step OTP flow with no auto-login (account stays PENDING).
export function useTutorRegisterStart() {
  return useMutation({
    mutationFn: (body: TutorRegisterInput) => authApi.tutorRegisterStart(body),
  });
}

export function useTutorRegisterVerify() {
  return useMutation({
    mutationFn: (body: { email: string } & TutorOtpInput) =>
      authApi.tutorRegisterVerify(body),
  });
}

export function useLogout() {
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      dispatch(signOutAction());
      qc.clear();
    },
  });
}
