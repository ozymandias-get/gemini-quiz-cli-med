import { z } from "zod";
import type { Question } from "../types";
import { devWarn } from "./devLog";

const aiQuestionSchema = z
  .object({
    text: z.preprocess(
      (v) => (v == null ? "" : String(v).trim()),
      z.string().min(1)
    ),
    options: z
      .array(z.union([z.string(), z.number(), z.boolean()]))
      .min(2)
      .transform((arr) => arr.map((o) => String(o).trim()))
      .refine((opts) => opts.every((s) => s.length > 0), {
        message: "Each option must be non-empty",
      }),
    correctAnswerIndex: z.coerce.number().int(),
    explanation: z.preprocess((v) => (v == null || v === undefined ? "" : String(v)), z.string()),
    sourceQuote: z.preprocess((v) => {
      if (v == null || v === undefined) return undefined;
      const s = String(v).trim();
      return s.length === 0 ? undefined : s;
    }, z.string().optional()),
  })
  .superRefine((data, ctx) => {
    if (data.correctAnswerIndex < 0 || data.correctAnswerIndex >= data.options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "correctAnswerIndex out of range",
        path: ["correctAnswerIndex"],
      });
    }
  });

/**
 * Gemini (ve benzeri) JSON çıktısındaki ham öğeleri doğrular; halüsinasyon veya bozuk yapıları eler.
 */
export function filterValidQuestions(raw: unknown): Question[] {
  if (!Array.isArray(raw)) return [];

  const out: Question[] = [];
  for (const item of raw) {
    const r = aiQuestionSchema.safeParse(item);
    if (r.success) {
      const q: Question = {
        id: "",
        text: r.data.text,
        options: r.data.options,
        correctAnswerIndex: r.data.correctAnswerIndex,
        explanation: r.data.explanation,
      };
      if (r.data.sourceQuote !== undefined) {
        q.sourceQuote = r.data.sourceQuote;
      }
      out.push(q);
    } else {
      devWarn("[filterValidQuestions] Skipped invalid question:", r.error.issues);
    }
  }
  return out;
}
