import { FastifyInstance } from 'fastify';
import { prisma } from '../repositories/prisma';
import { createSalaSchema, updateSalaSchema } from '../schemas/salas.schema';

export default async function salasRoutes(app: FastifyInstance) {

  // GET /salas - lista todas as salas
  app.get('/', async () => {
    return prisma.sala.findMany({
      orderBy: { id: 'asc' },
    });
  });

  // POST /salas - cria sala
  app.post('/', async (req, rep) => {
    const data = createSalaSchema.parse(req.body);
    const sala = await prisma.sala.create({ data });
    return rep.code(201).send(sala);
  });

  // GET /salas/:id - devolve uma sala
  app.get('/:id', async (req, rep) => {
    const id = Number((req.params as any).id);
    const sala = await prisma.sala.findUnique({
      where: { id },
      include: {
        ocupacoes: { take: 1, orderBy: { timestamp: 'desc' } }, 
      },
    });
    if (!sala) return rep.code(404).send({ message: 'Sala não encontrada' });
    return sala;
  });

  // PATCH /salas/:id - atualiza parcialmente
  app.patch('/:id', async (req, rep) => {
    const id = Number((req.params as any).id);
    const data = updateSalaSchema.parse(req.body);
    try {
      const sala = await prisma.sala.update({ where: { id }, data });
      return sala;
    } catch {
      return rep.code(404).send({ message: 'Sala não encontrada' });
    }
  });

  // DELETE /salas/:id - remove
  app.delete('/:id', async (req, rep) => {
    const id = Number((req.params as any).id);
    try {
      await prisma.sala.delete({ where: { id } });
      return rep.code(204).send();
    } catch {
      return rep.code(404).send({ message: 'Sala não encontrada' });
    }
  });
}
