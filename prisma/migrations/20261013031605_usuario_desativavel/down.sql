-- Reverte usuario_desativavel (rode manualmente; depois apague a linha de _prisma_migrations desta migration).
ALTER TABLE "User" DROP COLUMN "desativadoEm";
