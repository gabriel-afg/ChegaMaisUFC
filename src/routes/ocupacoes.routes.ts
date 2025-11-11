import { FastifyInstance } from 'fastify';
import { prisma } from '../repositories/prisma';
import { z } from 'zod';

export default async function ocupacoesRoutes(app: FastifyInstance) {
  const query = z.object({
    salaId: z.coerce.number().int().positive(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    limit: z.coerce.number().int().positive().max(1000).default(100)
  });

  app.get('/', async (req) => {
    const { salaId, from, to, limit } = query.parse(req.query);
    return prisma.ocupacao.findMany({
      where: { salaId, timestamp: { gte: from, lte: to } },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  });

  app.get('/ultima', async (req) => {
    const salaId = z.coerce.number().int().positive().parse((req.query as any).salaId);
    return prisma.ocupacao.findFirst({
      where: { salaId },
      orderBy: { timestamp: 'desc' },
    });
  });

  app.post('/', async (req, rep) => {
    const body = z.object({
      salaId: z.number().int().positive(),
      ocupacao: z.number().int().nonnegative(),
      timestamp: z.coerce.date().optional(),
    }).parse(req.body);

    const created = await prisma.ocupacao.create({ data: body });
    return rep.code(201).send(created);
  });
}
