import { FastifyInstance } from 'fastify';
import { prisma } from '../repositories/prisma';
import { z } from 'zod';

export default async function salaResumoRoute(app: FastifyInstance) {
    const paramsSchema = z.object({ id: z.coerce.number().int().positive() });
    const querySchema = z.object({
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional()
    });

    app.get('/:id/resumo', async (req, rep) => {
        const { id } = paramsSchema.parse(req.params);
        const { from, to } = querySchema.parse(req.query);

        const sala = await prisma.sala.findUnique({ where: { id } });
        if (!sala) return rep.code(404).send({ message: 'Sala não encontrada' });

        const [ocupacaoAtual, tempUlt, netUlt, wifiUlt, medias] = await Promise.all([
            prisma.pessoaEmSala.count({ where: { salaId: id } }), 
            prisma.temperatura.findFirst({ where: { salaId: id }, orderBy: { timestamp: 'desc' } }),
            prisma.internet.findFirst({ where: { salaId: id }, orderBy: { timestamp: 'desc' } }),
            prisma.wifi.findFirst({ where: { salaId: id }, orderBy: { timestamp: 'desc' } }),
            (async () => {
                if (!from || !to) return null;
                const [tAvg, iAvg, wAvg] = await Promise.all([
                    prisma.temperatura.aggregate({
                        _avg: { temperatura: true },
                        where: { salaId: id, timestamp: { gte: from, lte: to } },
                    }),
                    prisma.internet.aggregate({
                        _avg: { velocidade: true },
                        where: { salaId: id, timestamp: { gte: from, lte: to } },
                    }),
                    prisma.wifi.aggregate({
                        _avg: { velocidade: true },
                        where: { salaId: id, timestamp: { gte: from, lte: to } },
                    }),
                ]);
                return {
                    temperatura: tAvg._avg.temperatura ?? null,
                    internet: iAvg._avg.velocidade ?? null,
                    wifi: wAvg._avg.velocidade ?? null,
                };
            })(),
        ]);

        const payload = {
            id: sala.id,
            nome: sala.nome,
            vagas: sala.vagas,
            ocupacaoAtual,
            ocupacaoPercent: sala.vagas > 0 ? Number(((ocupacaoAtual / sala.vagas) * 100).toFixed(1)) : 0,
            ultimas: {
                temperatura: tempUlt ? { valor: tempUlt.temperatura, timestamp: tempUlt.timestamp } : null,
                internet: netUlt ? { valor: netUlt.velocidade, timestamp: netUlt.timestamp } : null,
                wifi: wifiUlt ? { valor: wifiUlt.velocidade, timestamp: wifiUlt.timestamp } : null,
            },
            mediasIntervalo: medias,
        };

        return payload;
    });
    app.get('/resumo', async () => {
        const salas = await prisma.sala.findMany({ orderBy: { id: 'asc' } });

        const itens = await Promise.all(salas.map(async (s) => {
            const [ocup, t, i, w] = await Promise.all([
                prisma.pessoaEmSala.count({ where: { salaId: s.id } }),
                prisma.temperatura.findFirst({ where: { salaId: s.id }, orderBy: { timestamp: 'desc' } }),
                prisma.internet.findFirst({ where: { salaId: s.id }, orderBy: { timestamp: 'desc' } }),
                prisma.wifi.findFirst({ where: { salaId: s.id }, orderBy: { timestamp: 'desc' } }),
            ]);
            return {
                id: s.id,
                nome: s.nome,
                vagas: s.vagas,
                ocupacaoAtual: ocup,
                ocupacaoPercent: s.vagas > 0 ? Number(((ocup / s.vagas) * 100).toFixed(1)) : 0,
                ultimas: {
                    temperatura: t ? { valor: t.temperatura, timestamp: t.timestamp } : null,
                    internet: i ? { valor: i.velocidade, timestamp: i.timestamp } : null,
                    wifi: w ? { valor: w.velocidade, timestamp: w.timestamp } : null,
                },
            };
        }));

        return itens;
    });
}
