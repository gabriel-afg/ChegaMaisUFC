import { z } from 'zod';

export const espMovimentacaoSchema = z.object({
  tokenEsp: z.string().length(32),
  numeroCartao: z.string().min(1).max(15),
  acao: z.enum(['enter', 'exit']),
  timestamp: z.coerce.date().optional(),
});

export type EspMovimentacaoInput = z.infer<typeof espMovimentacaoSchema>;

export const espEstadoSchema = z.object({
  tokenEsp: z.string().length(32),
  timestamp: z.coerce.date().optional(),
  temperatura: z.number().optional(),
  internetVel: z.number().optional(),
  wifiVel: z.number().optional(),
  ocupacao: z.number().int().nonnegative().optional(),
});

export type EspEstadoInput = z.infer<typeof espEstadoSchema>;
