import { FastifyInstance } from 'fastify';
import { prisma } from '../repositories/prisma';
import {
  espMovimentacaoSchema,
  espEstadoSchema,
  type EspMovimentacaoInput,
  type EspEstadoInput,
} from '../schemas/esp.schema';

async function resolveSalaByToken(tokenEsp: string) {
  const sala = await prisma.sala.findFirst({ where: { tokenEsp } });
  if (!sala) throw new Error('TOKEN_INVALIDO');
  return sala;
}

export default async function espRoutes(app: FastifyInstance) {
  app.post('/movimentacao', async (req, rep) => {
    const { tokenEsp, numeroCartao, acao, timestamp } =
      espMovimentacaoSchema.parse(req.body) as EspMovimentacaoInput;

    const sala = await resolveSalaByToken(tokenEsp);
    const ts = timestamp ?? new Date();

    try {
      const result = await prisma.$transaction(async (tx) => {
        const presencaEmAlgumaSala = await tx.pessoaEmSala.findFirst({
          where: { numeroCartao },
          select: { salaId: true },
        });

        if (acao === 'enter') {
          if (presencaEmAlgumaSala && presencaEmAlgumaSala.salaId !== sala.id) {
            return { ok: false, status: 409 as const, code: 'CARTAO_EM_OUTRA_SALA' };
          }

          await tx.pessoaEmSala.upsert({
            where: { numeroCartao_salaId: { numeroCartao, salaId: sala.id } },
            update: { timestamp: ts },
            create: { numeroCartao, salaId: sala.id, timestamp: ts },
          });
        } else {
          const presenteNestaSala = await tx.pessoaEmSala.findUnique({
            where: { numeroCartao_salaId: { numeroCartao, salaId: sala.id } },
            select: { numeroCartao: true },
          });

          if (!presenteNestaSala) {
            return { ok: false, status: 409 as const, code: 'NAO_ESTA_NA_SALA' };
          }

          await tx.pessoaEmSala.delete({
            where: { numeroCartao_salaId: { numeroCartao, salaId: sala.id } },
          });
        }

        const total = await tx.pessoaEmSala.count({ where: { salaId: sala.id } });
        await tx.ocupacao.create({ data: { salaId: sala.id, ocupacao: total, timestamp: ts } });

        return { ok: true, status: 201 as const };
      });

      if (!result.ok) {
        if (result.code === 'CARTAO_EM_OUTRA_SALA') {
          return rep.code(result.status).send({ message: 'O cartão já está presente em outra sala.', code: result.code });
        }
        if (result.code === 'NAO_ESTA_NA_SALA') {
          return rep.code(result.status).send({ message: 'Ação de saída inválida: o cartão não está nesta sala.', code: result.code });
        }
      }

      return rep.code(201).send({ ok: true });
    } catch (e: any) {
      if (e?.message === 'TOKEN_INVALIDO') return rep.code(401).send({ message: 'Token inválido' });
      app.log.error(e);
      return rep.code(500).send({ message: 'Erro interno' });
    }
  });

  app.post('/estado', async (req, rep) => {
    const { tokenEsp, timestamp, temperatura, internetVel, wifiVel, ocupacao } =
      espEstadoSchema.parse(req.body) as EspEstadoInput;

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
