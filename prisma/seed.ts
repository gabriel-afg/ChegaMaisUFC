import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  await prisma.sala.createMany({
    data: [
      { nome: 'Laboratório 1', vagas: 30, tokenEsp: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' },
      { nome: 'Laboratório 2', vagas: 25, tokenEsp: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' },
    ],
  });
}

run().finally(() => prisma.$disconnect());
