import { z } from "zod";
import { GeneratorType } from "@/types/generator";

export const createGeneratorRequestSchema = z.object({
  type: z.nativeEnum(GeneratorType),
  tags: z.array(z.string()).optional(),
  prompt: z.string().optional(),
});

export type CreateGeneratorRequestFormData = z.infer<
  typeof createGeneratorRequestSchema
>;
