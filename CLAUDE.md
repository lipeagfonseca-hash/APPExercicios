# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão geral e estado atual

App de treino gamificado (Next.js 16 + Prisma 7 + Neon) com tema "Solo Leveling" (ARISE / SISTEMA). Em produção em **produção na Vercel** (URL, time e comando exato em `CLAUDE.local.md`; deploy com `vercel deploy --prod --scope <time>`; o Mestre autorizou deploys sem reconfirmar quando pedir).

**Serviços ligados ao projeto (todos via Vercel, variáveis em `.env.local`):**
- **Neon Postgres** — banco único, compartilhado entre dev e prod. 6 migrations aplicadas (a última: `exercises`). Dados hoje são só de teste (3 usuários, 4 treinos).
- **Upstash Redis** (vars `KV_*`/`REDIS_URL`) — usado só pelo rate limit.
- **Vercel Blob público** (`BLOB_READ_WRITE_TOKEN`) — imagens da identidade visual.
- **`ADMIN_EMAILS`** (env, produção/preview/dev) — lista de admins separados por vírgula; vazio = ninguém é admin. Email do admin: ver `CLAUDE.local.md` (senha nunca em arquivo).

**Estado do código:** `npm run build` passa; `npm run lint` tem 0 erros e 2 warnings de fonte em `layout.tsx` (link do Material Symbols). Não há suíte de testes.

### Segurança aplicada (baseada na nota "Segurança em apps web" do vault Obsidian `08 - Aprendizados`)
- Headers em `next.config.ts`: CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS, sem `X-Powered-By`. A CSP libera `fonts.googleapis.com`/`gstatic` e o domínio do Blob (`img-src` e `connect-src`); mantém `'unsafe-inline'` em scripts.
- `src/lib/rateLimit.ts` — `@upstash/ratelimit` (janela deslizante) com fallback em memória se o Redis falhar. Usado em login (20/15min por IP, 8/15min por conta, em `auth.ts`), registro (5/h por IP) e upload de marca (30/h por usuário).
- Login roda `bcrypt` mesmo com email inexistente (evita enumeração por tempo). Senha mínima 8 / máx 72, `bcrypt` custo 12. Rotas que leem JSON usam `.json().catch(() => null)`.

### Configurações gerais e identidade visual (somente admin)
- `src/lib/admin.ts` → `isAdminEmail()`. Rota `/configuracoes` (layout checa admin e redireciona para `/dashboard`; `proxy.ts` protege o prefixo). Item "CONFIGURAÇÕES" na `Sidebar` só para admin (prop `isAdmin` vinda do `AppShell`).
- Abas (`SettingsTabs`): `/configuracoes/usuarios` e `/configuracoes/identidade-visual`.
- Identidade visual: 4 slots em `src/lib/brandSlots.ts` (`logo`, `loginBackground`, `favicon`, `loginWindow`; arquivo separado porque o cliente não pode importar `brand.ts`, que puxa o Prisma). URLs ficam na tabela `AppSetting` (chave `brand.<slot>`); `getBrand()` em `src/lib/brand.ts` valida que a URL é do nosso Blob (`*.public.blob.vercel-storage.com/brand/`). O `layout.tsx` publica as imagens como CSS vars no `<body>` (`--brand-logo`, `--brand-login-bg`, `--brand-login-window`) e o favicon via `generateMetadata`. Login/cadastro usam `AuthBrand.tsx`.
- API: `POST /api/admin/brand/upload` (token de upload direto do navegador, tipos de imagem, 8 MB) e `PUT`/`DELETE /api/admin/brand` (salva/remove URL e apaga o arquivo antigo do Blob).

### Catálogo de exercícios (2026-10-13)
- Fonte: dataset `hasaneyldrm/exercises-dataset` (dados MIT; **mídias © Gym visual**, 180×180, uso condicionado à atribuição e aos termos deles — licenciar com a Gym visual antes de tornar o app público/comercial). Recorte de **370 exercícios**: 325 de peso do corpo + 45 de academia comuns. 17 dos "staples" planejados não existem no dataset (ex.: `cable lat pulldown`, `barbell overhead press`).
- Tabela `Exercise` (id do dataset "0001"…, `namePt`, `nameEn`, `bodyPart`, `equipment`, `target`, `secondary[]`, `instructionsEn/Es`, `search` normalizado sem acento). **Não há instruções em português** no dataset (en/es apenas); nomes foram traduzidos à mão (`data/exercises/pt.txt`, formato `id|nome`). Nomes que o app já usa foram mantidos idênticos (ex.: "Flexão", "Burpee", "Mountain climber", "Skater jump", "Abdominal canivete", "Corrida") porque `rank.ts`/`dailyQuest.ts` agrupam por nome exato.
- Reimportar: `node scripts/import-exercises.cjs data/exercises/rows.json data/exercises/pt.txt` (upsert; `scripts/` fica fora do eslint). Mídia em `public/exercises/{thumb,gif}/<id>.{jpg,gif}` (servida pelo CDN com `Cache-Control` imutável via `next.config.ts`; **não usa o Blob**, que no plano Hobby tem só 2.000 operações de upload/mês).
- API: `GET /api/exercicios?q=` (autenticada, 90/min por usuário, até 40 resultados, cache privado 5 min) e `GET /api/exercicios/[id]` (detalhe com instruções). Cliente: `ExercisePicker` (combobox com debounce de 180 ms, cache em memória, miniatura 40 px lazy) e `ExerciseDetailModal` (GIF só ao abrir) dentro do `WorkoutForm` (usado só em `/dashboard`). Nome digitado livremente continua permitido. Catálogo em `src/lib/exerciseCatalog.ts`.
- Aba **Exercícios** (`/exercicios`, em `PROTECTED_PREFIXES`/`Sidebar`/`BottomNav`): `ExerciseGallery` filtra no cliente (busca, região, equipamento) os 370 itens enviados pelo servidor e pagina por `IntersectionObserver` (48 por vez; miniaturas lazy). Clique abre `ExerciseDetailModal`.
- **Programa do dia** (`TodayProgram`, no topo do `/dashboard`, acima da Missão Diária): usa `getScheduleForDate(new Date())` (UTC, igual a `/programas`); em dia REST mostra um cartão de descanso. GIFs vêm de `PROGRAM_EXERCISE_MEDIA` em `src/lib/programMedia.ts` (nome do exercício do programa -> id do catálogo; alguns são o movimento mais próximo, não exato). Circuito guiado: "Iniciar circuito" -> "Série concluída" -> descanso de 20 s entre exercícios / 60 s entre rounds (`CIRCUIT_REST`, vindo da descrição dos programas) com beep (`src/lib/beep.ts`, compartilhado com `Timer`). Ao terminar, oferece `UseProgramButton` para registrar o treino. Não grava nada no banco por conta própria.
- Não feito: mostrar miniaturas/GIF em `/programas`, instruções em português, ampliar o recorte (o dataset tem 1.324).

### GitHub, CI e deploy (2026-10-13)
- Repositório **público** no GitHub (URL em `CLAUDE.local.md`), branch `main`, histórico linear. Antes de cada push, varrer segredos no que será publicado: `.env*`, `CLAUDE.local.md`, `backups/` e `public/exercises/` (mídia © Gym visual) **nunca** entram no git (`.gitignore`). O `.vercelignore` existe para que o `vercel deploy` local continue enviando `public/exercises/` (sem ele o CLI usaria o `.gitignore` e os GIFs sumiriam).
- Acesso: `gh` logado na conta dona do repo (token no cofre do Windows) + `gh auth setup-git`. Nunca colocar token em comando, arquivo ou `remote` URL.
- **Simple workflow** (`.github/workflows/simple-workflow.yml`): roda em push na `main` e em PRs. Passos: resumo do commit, `npm ci`, `prisma generate`, `npm run lint`, `npm test`, `npm run build`. Usa só valores falsos (`DATABASE_URL`/`AUTH_SECRET` de mentira), permissão `contents: read`, nenhum segredo. Para reproduzir localmente num clone limpo: exportar essas duas variáveis falsas e rodar os mesmos passos.
- **Deploy em produção (manual)** (`deploy-manual.yml`): `workflow_dispatch`, só na `main`, ambiente `production` (aparece em Code → Deployments). Baixa as mídias (`scripts/fetch-exercise-media.cjs`), faz `vercel pull/build/deploy --prebuilt`. Segredos: `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` (já cadastrados), `VERCEL_TOKEN` (**só o Mestre cria**: `! gh secret set VERCEL_TOKEN`). **Não roda migrations**: o banco é compartilhado entre dev e produção, então migrations continuam manuais. O deploy é manual de propósito.
- As actions usam a tag de major `@v7` (`checkout`, `setup-node`); a `@v4` rodava em Node 20, já obsoleto. Para atualizar no futuro: conferir `gh api repos/actions/<nome>/releases/latest` e trocar nos dois workflows.
- Commits: mensagem em português, uma fase/assunto por commit, terminando com o `Co-Authored-By` exigido. Fase 1 e CI já estão publicados.

### Rotina de treino = Missão Diária (Fase 1, 2026-10-13)
O treino do dia **é** a missão. Não existe mais missão por repetições/km, "+5 REPS", Treino Livre, `/api/daily-quest/*`, `/api/workouts*`, `dailyQuest.ts`, `gains.ts`, `hud.ts` (HP/MP/Fadiga) nem punição de XP. Regras e onde ficam:
- **Dia = 00h de Brasília** (`America/Sao_Paulo`), string "AAAA-MM-DD" (`src/lib/diaBrasilia.ts`). Isto **substitui** a antiga regra de "UTC em tudo" para a rotina de treino.
- **Configuração** (sem lógica): `src/config/rotacao.ts` (sequência `A,B,DESCANSO,C,D,DESCANSO`), `src/config/treinos.ts` (A–D; o build falha se algum passar de 600 s), `src/config/xp.ts` (XP por treino = 50; fração mínima de tempo = 0,9).
- **Regras puras e testadas**: `src/lib/rotacao.ts` (ponteiro, estado do dia, projeção, sequência). Treino não concluído **continua pendente** no dia seguinte; concluir avança o ponteiro e o próximo vale **desde amanhã**; descanso passa sozinho quando o dia vira; descanso não quebra a sequência; só treino atrasado a zera.
- **Servidor**: `src/lib/rotacaoServico.ts` (`carregarVisaoDoDia` cacheada por requisição, `registrarInicioDoTreino`, `concluirTreinoDoDia` em transação). Rotas `POST /api/treino-do-dia/iniciar` e `/concluir` (sessão + rate limit). XP único por dia garantido por `UNIQUE(userId, dia)` em `TreinoConcluido`; conclusão exige ter iniciado e esperado >= 90% da duração (valida no servidor).
- **Banco**: `PlayerProfile.posicaoRotacao/itemDesde/sessaoIniciadaEm/sessaoTreinoId` e tabela `TreinoConcluido`. Migration `rotacao_treino_do_dia` tem `down.sql` ao lado.
- **UI**: dashboard mostra treino pendente (`TimedProgram`, modo missão), "concluído hoje" ou descanso; `/programas` é só leitura; `/calendario` mostra concluídos reais + projeção. `Sidebar`/`HudHeader`/`AppShell` usam a mesma visão do dia.
- **Testes**: `npm test` (`node --test`, sem dependência nova) cobre dia de Brasília e rotação. `src/lib/*.ts` puros usam imports relativos com `.ts` (`allowImportingTsExtensions`).
- **Fases seguintes**: 3 = XP/bônus (100 XP a cada 5 treinos seguidos), atributos derivados de dados reais, recompensas reais, rank por tempo; 4 = limpeza dos "Missão Diária" vazios (mostrar antes de apagar) e auditoria das rotas de escrita.

### Treinos A–D e alongamentos (Fase 2, 2026-10-13)
Tudo por **tempo** (nunca repetições), baixo impacto (sem saltos, burpee, afundo ou corrida), no máximo 10 min. O Mestre é obeso e está retomando a rotina: qualquer treino novo deve manter isso (apoio em parede/cadeira, pouco trabalho no chão, ritmo em que dá para conversar).
- **Onde editar** (nenhuma lógica muda):
  - `src/config/parametrosDeTempo.ts`: esforço (30 s), troca (10 s), pausa ativa (60 s), preparo (5 s), exercício da pausa e o limite de 600 s. **Progressão = mexer só aqui.** Subir o esforço estoura o limite com a estrutura atual; o build falha com mensagem explicando (reduza a pausa ou os blocos; ex.: esforço 35 s + pausa 40 s = 595 s).
  - `src/config/exercicios.ts`: biblioteca (nome único, `gifId` do catálogo, instrução curta, tipo, repetições estimadas).
  - `src/config/treinos.ts`: A–D como listas de ids em 3 blocos de 4, mais a rotina de alongamento. Conta atual: 5 + 3×(4×30 + 3×10) + 2×60 = **575 s (09:35)**.
- **Divisão**: A = Pernas Seguras (inferiores), B = Tronco e Postura (superiores + core), C = Cardio Suave (corpo todo), D = Core e Mobilidade. O antigo "Despertar" e os HIIT Q48 (com salto) foram removidos; estão no histórico do git.
- **Montagem pura e testada**: `src/lib/montarTreino.ts` (ids → `Program`, detalhes por nome, `validarTreinos`) e `src/lib/timedProgram.ts` (`buildSegments`: preparo → esforço/troca por bloco → pausa ativa entre blocos). `src/lib/programs.ts` só tem tipos. Os testes (`src/config/treinos.test.ts`) conferem duração, estrutura, baixo impacto e que todo `gifId` existe em `data/exercises/rows.json`.
- **Cronômetro** (`TimedProgram.tsx`): `modo="missao"` registra início/conclusão no servidor (XP); `modo="livre"` só cronometra. Mostra GIF, instrução curta e duração de cada exercício; clicar abre o detalhe com a instrução do catálogo (en/es).
- **Dia de descanso**: card "DESCANSO / RECUPERAÇÃO" + rotina de 8 alongamentos de 30 s (`PROGRAMA_DE_ALONGAMENTO`, modo livre): **sem XP, sem missão, sem efeito na sequência**.
- O catálogo não tem "marcha no lugar": "Marcha acelerada" e "Marcha estática" usam o GIF `3636` (joelho alto contra a parede), o mais próximo.

### Últimas alterações (2026-10-12)
1. Auditoria completa (build, lint, migrations, rotas protegidas, `npm audit`) e correção dos 2 erros de lint (`conquistas` com `Date.now()` virou `accountAgeInDays()`; `WorkoutForm` com `eslint-disable` justificado).
2. Hardening de segurança (seção acima) e deploy.
3. Rate limit migrado de memória para Redis (Upstash).
4. Blob + tabela `AppSetting` + painel de marca; depois reorganizado em `/configuracoes` com abas Usuários e Identidade visual.
5. Criada a conta admin e definida `ADMIN_EMAILS`.

### Em aberto
- **Integração de exercícios: decidido hospedar o dataset (ver Catálogo) em vez de API externa; falta validação do Mestre.** As APIs externas abaixo ficaram como alternativa descartada.
- (histórico) **Integração via API externa.** O Mestre já tem APIs para testar; definir com ele qual usar e o que integrar (hoje exercícios são texto livre em `WorkoutForm`/`programs.ts` e a nutrição é só cálculo local em `nutrition.ts`). Candidatas gratuitas que já pesquisei, caso as dele não sirvam: **wger** (`https://wger.de/api/v2/exerciseinfo/`, catálogo de exercícios com músculos e imagens; respondeu 200 sem chave, mas o filtro `language` pareceu ser ignorado — verificar tradução pt antes de depender) e **Open Food Facts** (`https://world.openfoodfacts.org/api/v2`, alimentos/calorias; sem chave, exige `User-Agent` próprio, limite de 15 req/min leitura e 10 req/min busca por IP, dados sob ODbL com atribuição). Ao integrar: chamar sempre do servidor (rota `/api/...` autenticada), com cache (Redis já disponível) e rate limit, e não gravar chave em arquivo (usar `vercel env`).
- **Aba Usuários é só esqueleto:** o formulário (nome/email/senha) está desabilitado e sem API. Falta rota admin para criar usuário (zod, senha forte, rate limit, 409 em email duplicado, criar `PlayerProfile`), e idealmente trocar senha/remover.
- **Upload de identidade visual nunca foi testado ponta a ponta** (só o acesso às páginas como admin). Risco principal: a CSP bloquear a requisição de upload ao Blob; validar no navegador e ajustar `connect-src`.
- **Slot "Janela de login"** está aplicado como fundo do cartão de login/cadastro; confirmar se é isso que o produto quer.
- Trocar o admin atual por uma conta com email real (criar o usuário e atualizar `ADMIN_EMAILS` nos 3 ambientes).
- Rota de acesso de não-admin logado a `/configuracoes` não foi testada com conta comum.
- Rate limit do login só bloqueia (retorna erro genérico); não há mensagem/`429` específico para o usuário.
- Warnings de lint do `layout.tsx` (Material Symbols via `<link>`); `npm audit` aponta `mysql2` dentro do `prisma` (dev/CLI, baixo risco; não rodar `--force`, faz downgrade do Prisma). Prisma 8 está em rc — não atualizar ainda.
- Sem backup antes de migrations destrutivas (Neon tem restore por ponto no tempo, depende do plano).
- Notas do vault ainda não aplicáveis: nenhuma pendente relevante (Vite/Supabase/dashboards/recorrentes não se aplicam a este stack).

## Commands

```bash
npm run dev      # start dev server (Turbopack) on :3000 — kills nothing automatically, check for a stale process on the port first (see Gotchas)
npm run build    # production build; also runs TypeScript checks
npm run lint     # eslint
npx prisma migrate dev --name <name>   # create + apply a migration (local and prod share one Neon DB, see below)
npx prisma generate                    # regenerate client into src/generated/prisma — required after every schema change
npx prisma studio                      # browse the database
vercel deploy --prod --scope <time>   # deploy to production (time/projeto em CLAUDE.local.md)
```

There is no test suite.

## Architecture

This is a Next.js 16 App Router fitness app skinned as a Solo Leveling-style "System" HUD (sidebar, HP/MP/Fadiga header, holographic quest card). Branding: **ARISE** / **SISTEMA**.

### Data layer

- **Database**: single Postgres instance (Neon, via Vercel's native integration). Local dev and production point at the *same* database — there is no separate dev DB. `.env.local` holds `DATABASE_URL` (pulled via `vercel env pull`).
- **Prisma 7** uses the new driver-adapter architecture: `PrismaClient` must be constructed with an explicit adapter (`src/lib/prisma.ts` wires up `@prisma/adapter-pg`). Omitting the adapter throws at runtime, not at build time.
- Generated client lives at `src/generated/prisma` (not `node_modules/.prisma`), imported as `@/generated/prisma/client`. Config is `prisma7.config.ts`, not `schema.prisma`-embedded env — it loads `.env.local` then `.env`.
- Core models (`prisma/schema.prisma`): `User` → `Workout` → `WorkoutExercise` → `SetEntry` (reps + optional weightKg) is the raw workout log. `PlayerProfile` (1:1 with User) holds the RPG state: level/xp, four stats (str/vit/agi/end), streak tracking, `lastRewardClaimDate`. `SystemLog` is an append-only feed tied to `PlayerProfile`, rendered in the UI's "System Log" panel. `NutritionProfile` is separate and optional.

### The gamification engine (`src/lib/`)

This is the part that spans multiple files and isn't obvious from any single one:

- `leveling.ts` — pure functions: XP curve, rank letters (E→S), and `resolveDailyActivity()` which decides streak/penalty state from `lastActivityDate` vs "now" (UTC day boundaries only, never local time — see `toUtcDateOnly`).
- `gains.ts` — `applyGainsForExercises()` is the single chokepoint that turns a set of logged exercises into XP/stat deltas and writes them to `PlayerProfile` + `SystemLog`. Both the free-form workout API and the daily-quest increment API call this; don't duplicate its logic.
- `dailyQuest.ts` — the "Missão Diária" is **not** user-defined: it's four hardcoded objectives (100 push-ups / 100 sit-ups / 100 squats / 10km run) backed by a real `Workout` row named `"Missão Diária"` that gets created/updated for "today" (UTC). `QUEST_OBJECTIVES` exercise names must match what `trainingCycle`/`rank` expect verbatim.
- `trainingCycle.ts` — a separate, deterministic 6-day cycle (2 HIIT workouts + 1 rest, repeated, intercalating 4 programs) computed from a fixed anchor date (`2024-01-01`), not from user data. Used by `/programas` (highlight today's program) and `/calendario` (month grid).
- `rank.ts` — per-exercise E→SSS rank, computed on the fly (no stored rank) from all of a user's logged sets, grouped by exercise name. For bodyweight/no-weight sets it sums reps across the session; for weighted sets it takes the best single-set estimated 1RM (Epley). Rank = growth ratio vs that exercise's first-ever session.
- `achievements.ts` — same pattern: evaluated live from aggregate stats, nothing persisted.
- `hud.ts` — derives the cosmetic HP/MP/Fadiga numbers shown in the header from level + today's logged reps. These are flavor only, not a real mechanic.
- `programs.ts` — static HIIT program definitions (the `Program`/`ProgramExercise` shape is also what `trainingCycle.ts` indexes by id).

When adding anything that awards XP/stats, go through `gains.ts`, not around it.

### Request flow for the quest UI

`src/components/AppShell.tsx` (server component, wraps every route in `layout.tsx`) fetches the session, upserts `PlayerProfile`, and renders `Sidebar` + `HudHeader` + page content + `BottomNav`. Dashboard-specific widgets (`QuestCard`, `RewardsPanel`, `SystemLogPanel`) are client components that call `/api/daily-quest/increment` and `/api/daily-quest/claim`, then `router.refresh()` — this re-runs the server tree including `AppShell`, which is how the sidebar XP bar / header stay in sync after a client action.

### Auth & routing

NextAuth v5 (credentials provider, bcrypt, JWT sessions) in `src/lib/auth.ts`. Route protection is a `proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`) with a hardcoded `PROTECTED_PREFIXES` list — new authenticated routes must be added there *and* to `Sidebar.tsx`/`BottomNav.tsx` nav arrays.

### Styling

Tailwind v4, no config file — theme tokens (colors, type scale, spacing) are defined as CSS custom properties in `src/app/globals.css` under `@theme`, following the exact Material-3-flavored token names from the original design spec (`primary-container`, `surface-container-lowest`, etc.) rather than Tailwind's defaults. Three font families via `next/font/google`, exposed as `font-display` (Space Grotesk headings), `font-body` (Inter), `font-mono-label` (Space Mono, used for all HUD numbers/labels/timers). Do not introduce ad-hoc Tailwind color classes (`cyan-500`, `neutral-800`, etc.) — use the theme tokens so pages stay visually consistent.

Tailwind class names built with template-literal interpolation (e.g. `` `bg-${color}-container/20` ``) are **not** detected by the production build's static scanner and silently produce no styles — always use a lookup object of complete literal class strings instead (see `RewardsPanel.tsx` for the pattern).

## Gotchas

- **Prisma client survives hot reload stale.** The `globalForPrisma` singleton in `prisma.ts` is cached on `globalThis` across Turbopack HMR. After `prisma migrate dev` / schema changes, a running `npm run dev` will throw "X is not a function" on the new model/field until the dev server is fully killed and restarted — hot reload is not enough.
- **Rotina de treino usa o dia de Brasília** (`diaBrasilia.ts`); **o restante da lógica antiga** (se sobrar) é UTC. **Dates were UTC everywhere in gameplay logic** (streaks, daily quest "today", training-cycle day index, calendar). Mixing in local-time `Date` math reintroduces off-by-one-day bugs that have already been fixed once.
- Local dev and production share the one Neon database — there's no seed/reset step, migrations run against real data.
