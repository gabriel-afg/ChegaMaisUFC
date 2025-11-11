import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../repositories/prisma';

export default async function dadosRoutes(app: FastifyInstance) {
  const q = z.object({
    salaId: z.coerce.number().int().positive(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    limit: z.coerce.number().int().positive().max(2000).default(500),
  });

  app.get('/', async (req) => {
    const { salaId, from, to, limit } = q.parse(req.query);
    const where = { salaId, timestamp: { gte: from, lte: to } as any };

    const [temperaturas, internets, wifis, ocupacoes] = await Promise.all([
      prisma.temperatura.findMany({ where, orderBy: { timestamp: 'desc' }, take: limit }),
      prisma.internet.findMany({ where, orderBy: { timestamp: 'desc' }, take: limit }),
      prisma.wifi.findMany({ where, orderBy: { timestamp: 'desc' }, take: limit }),
      prisma.ocupacao.findMany({ where, orderBy: { timestamp: 'desc' }, take: limit }),
    ]);

    return { temperaturas, internets, wifis, ocupacoes };
  });
}
