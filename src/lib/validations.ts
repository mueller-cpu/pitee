import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Mindestens 6 Zeichen"),
  name: z.string().min(2, "Mindestens 2 Zeichen"),
});

export const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(1, "Passwort eingeben"),
});

// ─── Onboarding ──────────────────────────────────────────────

export const willkommenSchema = z.object({
  name: z.string().min(2, "Mindestens 2 Zeichen"),
});

export const koerperdatenSchema = z.object({
  alter: z.number().min(18, "Mindestalter 18").max(100, "Maximalalter 100"),
  gewicht: z.number().min(40, "Mindestens 40 kg").max(250, "Maximal 250 kg"),
  groesse: z.number().min(140, "Mindestens 140 cm").max(220, "Maximal 220 cm"),
});

export const gesundheitSchema = z.object({
  herzKreislauf: z.boolean(),
  bluthochdruck: z.boolean(),
  diabetes: z.boolean(),
  medikamente: z.string().optional(),
  vorerkrankungen: z.string().optional(),
});

export const gelenkProblemSchema = z.object({
  gelenk: z.enum(["schulter", "knie", "huefte", "ruecken", "ellbogen", "handgelenk"]),
  seite: z.enum(["links", "rechts", "beide"]),
  schweregrad: z.number().min(1).max(3),
  notiz: z.string().optional(),
});

export const erfahrungSchema = z.object({
  erfahrung: z.enum(["anfaenger", "fortgeschritten", "erfahren"]),
  hauptziel: z.enum(["muskelaufbau", "fettabbau", "gesundheit", "kraft"]),
});

export const verfuegbarkeitSchema = z.object({
  trainingstagePW: z.number().min(2, "Mindestens 2 Tage").max(6, "Maximal 6 Tage"),
});

// ─── Fitnesstest ─────────────────────────────────────────────

export const fitnessTestErgebnisSchema = z.object({
  uebungName: z.string(),
  gewicht: z.number().optional(),
  wiederholungen: z.number().optional(),
  dauer: z.number().optional(),
  rpe: z.number().min(1).max(10).optional(),
});

// ─── Workout-Logging ─────────────────────────────────────────

export const satzLogSchema = z.object({
  satzNummer: z.number().min(1),
  gewicht: z.number().min(0).optional(),
  wiederholungen: z.number().min(0).optional(),
  rir: z.number().min(0).max(10).optional(),
  rpe: z.number().min(1).max(10).optional(),
  dauer: z.number().optional(),
  notiz: z.string().optional(),
});

// ─── Wellness ────────────────────────────────────────────────

export const wellnessLogSchema = z.object({
  schlafStunden: z.number().min(0).max(24).optional(),
  schlafQualitaet: z.number().min(1).max(5).optional(),
  energie: z.number().min(1).max(5).optional(),
  stress: z.number().min(1).max(5).optional(),
  muskelkater: z.number().min(1).max(5).optional(),
  stimmung: z.number().min(1).max(5).optional(),
  notiz: z.string().optional(),
});

// ─── Körperdaten-Tracking ────────────────────────────────────

export const bodyMetricSchema = z.object({
  gewicht: z.number().min(30).max(300).optional(),
  koerperfett: z.number().min(3).max(60).optional(),
  brustumfang: z.number().min(50).max(200).optional(),
  taillenumfang: z.number().min(50).max(200).optional(),
  oberarmumfang: z.number().min(15).max(60).optional(),
  oberschenkelumfang: z.number().min(30).max(100).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type KoerperdatenInput = z.infer<typeof koerperdatenSchema>;
export type GesundheitInput = z.infer<typeof gesundheitSchema>;
export type GelenkProblemInput = z.infer<typeof gelenkProblemSchema>;
export type ErfahrungInput = z.infer<typeof erfahrungSchema>;
export type WellnessLogInput = z.infer<typeof wellnessLogSchema>;
export type BodyMetricInput = z.infer<typeof bodyMetricSchema>;
