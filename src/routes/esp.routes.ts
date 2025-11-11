import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../repositories/prisma';

async function resolveSalaByToken(tokenEsp: string) {
  const sala = await prisma.sala.findFirst({ where: { tokenEsp } });
  if (!sala) throw new Error('TOKEN_INVALIDO');
  return sala;
}

export default async function espRoutes(app: FastifyInstance) {
  // POST /esp/movimentacao – cria OU deleta uma PessoaEmSala e registra a nova ocupação
  const movSchema = z.object({
    tokenEsp: z.string().length(32),
    numeroCartao: z.string().min(1).max(15),
    acao: z.enum(['enter', 'exit']), 
    timestamp: z.coerce.date().optional(),
  });

  app.post('/movimentacao', async (req, rep) => {
    const { tokenEsp, numeroCartao, acao, timestamp } = movSchema.parse(req.body);
    const sala = await resolveSalaByToken(tokenEsp);

    try {
      await prisma.$transaction(async (tx) => {
        if (acao === 'enter') {
          await tx.pessoaEmSala.upsert({
            where: { numeroCartao_salaId: { numeroCartao, salaId: sala.id } },
            update: { timestamp: timestamp ?? new Date() },
            create: { salaId: sala.id, numeroCartao, timestamp: timestamp ?? new Date() },
          });
        } else {
          await tx.pessoaEmSala.deleteMany({
            where: { numeroCartao, salaId: sala.id },
          });
        }

        const total = await tx.pessoaEmSala.count({ where: { salaId: sala.id } });
        await tx.ocupacao.create({
          data: { salaId: sala.id, ocupacao: total, timestamp: timestamp ?? new Date() },
        });
      });

      return rep.code(201).send({ ok: true });
    } catch (e: any) {
      if (e?.message === 'TOKEN_INVALIDO') return rep.code(401).send({ message: 'Token inválido' });
      app.log.error(e);
      return rep.code(500).send({ message: 'Erro interno' });
    }
  });

  // POST /esp/estado – recebe o estado atual da sala e grava leituras
  const estadoSchema = z.object({
    tokenEsp: z.string().length(32),
    timestamp: z.coerce.date().optional(),
    temperatura: z.number().optional(),
    internetVel: z.number().optional(),
    wifiVel: z.number().optional(),
    ocupacao: z.number().int().nonnegative().optional(),
  });

  app.post('/estado', async (req, rep) => {
    const { tokenEsp, timestamp, temperatura, internetVel, wifiVel, ocupacao } =
      estadoSchema.parse(req.body);
    const sala = await resolveSalaByToken(tokenEsp);

    try {
      await prisma.$transaction(async (tx) => {
        const ts = timestamp ?? new Date();

        if (typeof temperatura === 'number') {
          await tx.temperatura.create({ data: { salaId: sala.id, temperatura, timestamp: ts } });
        }
        if (typeof internetVel === 'number') {
          await tx.internet.create({ data: { salaId: sala.id, velocidade: internetVel, timestamp: ts } });
        }
        if (typeof wifiVel === 'number') {
          await tx.wifi.create({ data: { salaId: sala.id, velocidade: wifiVel, timestamp: ts } });
        }

        if (typeof ocupacao === 'number') {
          await tx.ocupacao.create({ data: { salaId: sala.id, ocupacao, timestamp: ts } });
        }
      });

      return rep.code(201).send({ ok: true });
    } catch (e: any) {
      if (e?.message === 'TOKEN_INVALIDO') return rep.code(401).send({ message: 'Token inválido' });
      app.log.error(e);
      return rep.code(500).send({ message: 'Erro interno' });
    }
  });
}
