import { z } from "zod";

export const createObservationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  bhk: z.number().int().min(1).max(5),
  rent_inr: z.number().int().positive(),
  furnishing: z.enum(["unfurnished", "semi", "fully"]),
  society_name: z.string().min(2).max(120),
  area_slug: z.string().min(2).max(40),
  is_gated: z.boolean().optional(),
  deposit_months: z.number().positive().max(12).optional(),
  maintenance_inr: z.number().int().nonnegative().optional(),
  comment: z.string().max(500).optional(),
  confirm_outlier: z.boolean().optional(),
});

export const voteSchema = z.object({
  society_key: z.string(),
  bachelors_allowed: z.enum(["yes", "no", "depends"]),
  visitors_restricted: z.enum(["yes", "no", "depends"]).optional(),
});

export const reportSchema = z.object({
  observation_id: z.string().min(1),
  reason: z.string().min(3).max(300),
});
