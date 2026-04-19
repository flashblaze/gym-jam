import { z } from "zod";

export const categoryRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export const exerciseRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  type: z.enum(["weighted", "bodyweight", "assisted", "timed"]),
});

const numericCoercion = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return null;
  const num = Number(val);
  return Number.isNaN(num) ? val : num;
}, z.number().nullable());

export const sessionSegmentRowSchema = z.object({
  sessionId: z.string().min(1),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  sessionName: z.string(),
  blockExerciseId: z.string().min(1),
  setIndex: z.preprocess((val) => Number(val), z.number().int().nonnegative()),
  segmentIndex: z.preprocess((val) => Number(val), z.number().int().nonnegative()),
  segmentExId: z.string().min(1),
  weight: numericCoercion,
  repsOrSeconds: numericCoercion,
});

export type CategoryRow = z.infer<typeof categoryRowSchema>;
export type ExerciseRow = z.infer<typeof exerciseRowSchema>;
export type SessionSegmentRow = z.infer<typeof sessionSegmentRowSchema>;
