import { FastifyInstance } from 'fastify';
import { prisma } from '../repositories/prisma';
import { z } from 'zod';

const queryListSchema = z.object({
  salaId: z.coerce.number().int().positive(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(1000).default(100),
});

export default async function leiturasRoutes(app: FastifyInstance) {
  // --- TEMPERATURAS ---
  app.get('/temperaturas', async (req) => {
    const { salaId, from, to, limit } = queryListSchema.parse(req.query);
    return prisma.temperatura.findMany({
      where: { salaId, timestamp: { gte: from, lte: to } },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  });

  app.get('/temperaturas/ultima', async (req) => {
    const salaId = z.coerce.number().int().positive().parse((req.query as any).salaId);
    return prisma.temperatura.findFirst({
      where: { salaId },
      orderBy: { timestamp: 'desc' },
    });
  });

  app.post('/temperaturas', async (req, rep) => {
    const body = z.object({
      salaId: z.number().int().positive(),
      temperatura: z.number(),
      timestamp: z.coerce.date().optional(),
    }).parse(req.body);

    const created = await prisma.temperatura.create({ data: body });
    return rep.code(201).send(created);
  });

  // --- INTERNET (cabo) ---
  app.get('/internets', async (req) => {
    const { salaId, from, to, limit } = queryListSchema.parse(req.query);
    return prisma.internet.findMany({
      where: { salaId, timestamp: { gte: from, lte: to } },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  });

  app.post('/internets', async (req, rep) => {
    const body = z.object({
      salaId: z.number().int().positive(),
      velocidade: z.number(),
      timestamp: z.coerce.date().optional(),
    }).parse(req.body);

    const created = await prisma.internet.create({ data: body });
    return rep.code(201).send(created);
  });

  // --- WIFI ---
  app.get('/wifis', async (req) => {
    const { salaId, from, to, limit } = queryListSchema.parse(req.query);
    return prisma.wifi.findMany({
      where: { salaId, timestamp: { gte: from, lte: to } },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  });

  app.post('/wifis', async (req, rep) => {
    const body = z.object({
      salaId: z.number().int().positive(),
      velocidade: z.number(),
      timestamp: z.coerce.date().optional(),
    }).parse(req.body);

    const created = await prisma.wifi.create({ data: body });
    return rep.code(201).send(created);
  });
}
