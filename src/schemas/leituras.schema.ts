import { z } from 'zod';

export const leituraBase = z.object({
  salaId: z.number().int().positive(),
  velocidade: z.number().optional(),
  temperatura: z.number().optional(),
  timestamp: z.coerce.date().optional(),
});
