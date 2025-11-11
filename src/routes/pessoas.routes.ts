import { FastifyInstance } from 'fastify';
import { prisma } from '../repositories/prisma';
import { z } from 'zod';

export default async function pessoasRoutes(app: FastifyInstance) {
  app.get('/', async (req) => {
    const salaId = z.coerce.number().int().positive().parse((req.query as any).salaId);
    return prisma.pessoaEmSala.findMany({
      where: { salaId },
      orderBy: { timestamp: 'desc' },
    });
  });

  app.post('/', async (req, rep) => {
    const body = z.object({
      salaId: z.number().int().positive(),
      numeroCartao: z.string().min(1).max(15),
    }).parse(req.body);

    // upsert: se já existir (numeroCartao + salaId), apenas atualiza timestamp
    const up = await prisma.pessoaEmSala.upsert({
      where: { numeroCartao_salaId: { numeroCartao: body.numeroCartao, salaId: body.salaId } },
      update: { timestamp: new Date() },
      create: body,
    });
    return rep.code(201).send(up);
  });

  app.delete('/', async (req, rep) => {
    const body = z.object({
      salaId: z.number().int().positive(),
      numeroCartao: z.string().min(1).max(15),
    }).parse(req.body);

    await prisma.pessoaEmSala.delete({
      where: { numeroCartao_salaId: { numeroCartao: body.numeroCartao, salaId: body.salaId } },
    });
    return rep.code(204).send();
  });
}
