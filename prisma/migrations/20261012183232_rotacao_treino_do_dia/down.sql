-- REVERSÃO MANUAL de rotacao_treino_do_dia (o Prisma não faz rollback sozinho).
-- Rodar com: npx prisma db execute --file <este arquivo>  e depois
--   DELETE FROM "_prisma_migrations" WHERE migration_name LIKE '%rotacao_treino_do_dia';
-- ATENÇÃO: apaga o histórico de treinos concluídos. Faça backup antes (node scripts/backup-db.cjs).
DROP TABLE IF EXISTS "TreinoConcluido";
ALTER TABLE "PlayerProfile"
  DROP COLUMN IF EXISTS "itemDesde",
  DROP COLUMN IF EXISTS "posicaoRotacao",
  DROP COLUMN IF EXISTS "sessaoIniciadaEm",
  DROP COLUMN IF EXISTS "sessaoTreinoId";
