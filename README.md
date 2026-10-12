# APPExercicios · SISTEMA

[![Simple workflow](https://github.com/lipeagfonseca-hash/APPExercicios/actions/workflows/simple-workflow.yml/badge.svg)](https://github.com/lipeagfonseca-hash/APPExercicios/actions/workflows/simple-workflow.yml)

App de treino gamificado com tema "Solo Leveling". Todo dia o sistema define o treino
(HIIT de baixo impacto, por tempo, até 10 minutos); concluir o cronômetro é a missão e
rende XP.

**Stack:** Next.js 16 (App Router) · Prisma 7 · Postgres (Neon) · Auth.js · Tailwind v4 ·
Upstash Redis (rate limit) · Vercel Blob (identidade visual).

## Como acompanhar o projeto

| O quê | Onde |
|---|---|
| Commits | aba **Code → Commits** |
| Pushes e verificações (lint, testes, build) | aba **Actions → Simple workflow** — roda a cada push e pull request, com resumo do commit |
| Deploys em produção | aba **Actions → Deploy em produção (manual)** e **Code → Deployments** |

O deploy é manual de propósito: o banco é compartilhado entre desenvolvimento e produção.
Para publicar, vá em Actions → *Deploy em produção (manual)* → *Run workflow*.
Antes, configure os segredos `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`
(Settings → Secrets and variables → Actions).

## Rodar localmente

```bash
npm ci
cp .env.example .env.local        # preencha com seus valores (nunca versione este arquivo)
npx prisma generate
node scripts/fetch-exercise-media.cjs   # baixa as mídias dos exercícios (veja NOTICE.md)
npm run dev
```

```bash
npm run lint    # eslint
npm test        # testes das regras de rotação e do dia de Brasília
npm run build   # build de produção (também checa tipos)
```

## Segurança

- Segredos ficam só no `.env.local` e na Vercel. O `.env.example` lista apenas os nomes.
- Mídias de terceiros (© Gym visual) e backups do banco não entram no git.
- Contexto de infraestrutura fica em `CLAUDE.local.md` (ignorado). O `CLAUDE.md` é o mapa
  de arquitetura do projeto.

Mais detalhes de arquitetura e decisões em [`CLAUDE.md`](CLAUDE.md). Avisos de terceiros em
[`NOTICE.md`](NOTICE.md).
