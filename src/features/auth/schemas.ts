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

/**
 * The API's limits on the areas an expert types themselves: at most ten, each
 * 2 to 60 characters once trimmed and its inner spaces collapsed, plain text.
 * The form applies them as each area is added (TutorRegisterForm), so the
 * schema only has to guard the list as a whole.
 */
export const OWN_AREA_MAX = 10;
export const OWN_AREA_MIN_LENGTH = 2;
export const OWN_AREA_MAX_LENGTH = 60;
/** `<`, `>` and control characters; the API rejects an area with any of them. */
export const OWN_AREA_FORBIDDEN = /[<>\p{Cc}]/u;

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
    // At least one area in total: a picked category, or one of their own.
    categoryIds: z.array(z.string().uuid()),
    customExpertise: z
      .array(
        z
          .string()
          .min(OWN_AREA_MIN_LENGTH)
          .max(OWN_AREA_MAX_LENGTH)
          .refine((v) => !OWN_AREA_FORBIDDEN.test(v)),
      )
      .max(OWN_AREA_MAX),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.categoryIds.length > 0 || d.customExpertise.length > 0, {
    message: "Choose at least one area of expertise or add your own",
    path: ["categoryIds"],
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
