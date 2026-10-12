-- AlterTable
ALTER TABLE "PlayerProfile" ADD COLUMN     "itemDesde" TEXT,
ADD COLUMN     "posicaoRotacao" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sessaoIniciadaEm" TIMESTAMP(3),
ADD COLUMN     "sessaoTreinoId" TEXT;

-- CreateTable
CREATE TABLE "TreinoConcluido" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dia" TEXT NOT NULL,
    "treinoId" TEXT NOT NULL,
    "posicao" INTEGER NOT NULL,
    "xpConcedido" INTEGER NOT NULL,
    "duracaoSegundos" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreinoConcluido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TreinoConcluido_userId_createdAt_idx" ON "TreinoConcluido"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TreinoConcluido_userId_dia_key" ON "TreinoConcluido"("userId", "dia");

-- AddForeignKey
ALTER TABLE "TreinoConcluido" ADD CONSTRAINT "TreinoConcluido_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
