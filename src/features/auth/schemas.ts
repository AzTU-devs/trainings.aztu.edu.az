import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(80),
    lastName: z.string().min(1, "Last name is required").max(80),
    email: z.string().email("Enter a valid email").max(255),
    password: z
      .string()
      .min(10, "At least 10 characters")
      .max(100)
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/\d/, "Must contain a digit"),
    confirmPassword: z.string(),
    phone: z.string().max(32).optional().or(z.literal("")),
    locale: z.string().max(8).optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const tutorRegisterSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(80),
    lastName: z.string().min(1, "Last name is required").max(80),
    email: z.string().email("Enter a valid email").max(255),
    password: z
      .string()
      .min(10, "At least 10 characters")
      .max(100)
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/\d/, "Must contain a digit"),
    confirmPassword: z.string(),
    phone: z.string().max(32).optional().or(z.literal("")),
    locale: z.string().max(8).optional(),
    headline: z.string().max(160).optional().or(z.literal("")),
    bio: z.string().max(5000).optional().or(z.literal("")),
    yearsExperience: z.number().int().min(0).max(80).optional(),
    websiteUrl: z.string().url("Enter a valid URL").max(255).optional().or(z.literal("")),
    linkedinUrl: z.string().url("Enter a valid URL").max(255).optional().or(z.literal("")),
    categoryIds: z.array(z.string().uuid()).min(1, "Pick at least one expertise area"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type TutorRegisterInput = z.infer<typeof tutorRegisterSchema>;

export const tutorOtpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});
export type TutorOtpInput = z.infer<typeof tutorOtpSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(10, "At least 10 characters")
      .max(100)
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/\d/, "Must contain a digit"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(80),
  lastName: z.string().min(1, "Last name is required").max(80),
  phone: z.string().max(32).optional().or(z.literal("")),
  locale: z.enum(["en", "az"]),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
