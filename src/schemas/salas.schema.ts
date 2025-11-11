import { z } from 'zod';

export const createSalaSchema = z.object({
  nome: z.string().min(1).max(45),
  vagas: z.number().int().nonnegative(),
  tokenEsp: z.string().length(32),
});

export const updateSalaSchema = createSalaSchema.partial();
