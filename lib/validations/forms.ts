import { z } from "zod";

/**
 * Shared across all form Route Handlers (see Technical Architecture,
 * Section 5). Validated server-side — client-side validation is a UX
 * nicety, never the source of truth.
 */

export const inquiryTypes = [
  "investor",
  "partner",
  "press",
  "volunteer",
  "general",
] as const;

export const contactFormSchema = z.object({
  inquiryType: z.enum(inquiryTypes),
  name: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Please enter a valid email address"),
  organization: z.string().optional(),
  message: z.string().min(10, "Please provide a bit more detail"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

const referenceSchema = z.object({
  name: z.string().min(2, "Enter the reference's name"),
  phone: z.string().min(7, "Enter a phone number"),
  village: z.string().min(2, "Enter their village"),
  relationship: z.string().min(2, "Say how you know them"),
});

export const givingIntentSchema = z.object({
  interest: z.literal("giving-intent"),
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2).optional(),
});

export const memberApplicationSchema = z.object({
  interest: z.enum(["member", "volunteer", "both"]),
  name: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(7, "Enter a phone number"),
  whatsapp: z.string().optional(),
  residenceCountry: z.string().min(2, "Enter the country where you live"),
  residenceState: z.string().min(2, "Enter the state or region where you live"),
  residenceCity: z.string().min(2, "Enter the city or town where you live"),
  residenceAddress: z.string().min(3, "Enter your address"),
  birthPlace: z.string().min(2, "Enter which Ikeduru community you are from"),
  birthState: z.string().min(2, "Enter the state or region"),
  birthCountry: z.string().min(2, "Enter the country"),
  school: z.string().min(2, "Enter where you schooled"),
  qualification: z.string().min(2, "Enter your qualification"),
  occupation: z.string().min(2, "Enter your work or source of income"),
  reference1: referenceSchema,
  reference2: referenceSchema,
});

export const memberSignupSchema = z.union([givingIntentSchema, memberApplicationSchema]);

export type MemberSignupData = z.infer<typeof memberSignupSchema>;

export const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type NewsletterData = z.infer<typeof newsletterSchema>;

/** Which internal recipient each Contact inquiry type routes to. */
export const inquiryRoutingMap: Record<(typeof inquiryTypes)[number], string> = {
  investor: "investors@iedf.org",
  partner: "partnerships@iedf.org",
  press: "press@iedf.org",
  volunteer: "volunteers@iedf.org",
  general: "info@iedf.org",
};
