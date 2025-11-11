-- CreateTable
CREATE TABLE "Sala" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(45) NOT NULL,
    "vagas" INTEGER NOT NULL,
    "tokenEsp" CHAR(32) NOT NULL,

    CONSTRAINT "Sala_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Temperatura" (
    "id" SERIAL NOT NULL,
    "salaId" INTEGER NOT NULL,
    "temperatura" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Temperatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Internet" (
    "id" SERIAL NOT NULL,
    "salaId" INTEGER NOT NULL,
    "velocidade" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Internet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wifi" (
    "id" SERIAL NOT NULL,
    "salaId" INTEGER NOT NULL,
    "velocidade" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wifi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PessoaEmSala" (
    "id" SERIAL NOT NULL,
    "numeroCartao" VARCHAR(15) NOT NULL,
    "salaId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PessoaEmSala_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ocupacao" (
    "id" SERIAL NOT NULL,
    "salaId" INTEGER NOT NULL,
    "ocupacao" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ocupacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sala_nome_idx" ON "Sala"("nome");

-- CreateIndex
CREATE INDEX "Temperatura_salaId_timestamp_idx" ON "Temperatura"("salaId", "timestamp");

-- CreateIndex
CREATE INDEX "Internet_salaId_timestamp_idx" ON "Internet"("salaId", "timestamp");

-- CreateIndex
CREATE INDEX "Wifi_salaId_timestamp_idx" ON "Wifi"("salaId", "timestamp");

-- CreateIndex
CREATE INDEX "PessoaEmSala_salaId_idx" ON "PessoaEmSala"("salaId");

-- CreateIndex
CREATE UNIQUE INDEX "PessoaEmSala_numeroCartao_salaId_key" ON "PessoaEmSala"("numeroCartao", "salaId");

-- CreateIndex
CREATE INDEX "Ocupacao_salaId_timestamp_idx" ON "Ocupacao"("salaId", "timestamp");

-- AddForeignKey
ALTER TABLE "Temperatura" ADD CONSTRAINT "Temperatura_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Internet" ADD CONSTRAINT "Internet_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wifi" ADD CONSTRAINT "Wifi_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PessoaEmSala" ADD CONSTRAINT "PessoaEmSala_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ocupacao" ADD CONSTRAINT "Ocupacao_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala"("id") ON DELETE CASCADE ON UPDATE CASCADE;
