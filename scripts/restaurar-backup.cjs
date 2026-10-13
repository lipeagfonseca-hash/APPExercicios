// Restaura um backup JSON (gerado por backup-db.cjs) em um banco VAZIO que já tenha o esquema
// (rode `npx prisma migrate deploy` nele antes). Serve para ensaiar o restore e para recuperar
// dados depois de um desastre.
// Uso: node scripts/restaurar-backup.cjs <arquivo.json> <url-do-banco-vazio>
// Proteção: recusa bancos que já tenham usuários e recusa o banco de produção "neondb"
// (para restaurar produção de verdade, crie o banco novo, restaure nele e troque a URL).
const fs = require("fs");
const { Client } = require("pg");

const ORDEM = ["User", "AppSetting", "Exercise", "PlayerProfile", "NutritionProfile", "TreinoConcluido",
  "Workout", "WorkoutExercise", "SetEntry", "SystemLog"];

(async () => {
  const [arquivo, url] = process.argv.slice(2);
  if (!arquivo || !url) throw new Error("Uso: node scripts/restaurar-backup.cjs <arquivo.json> <url-do-banco-vazio>");
  const alvo = new URL(url);
  if (alvo.pathname === "/neondb") throw new Error("Recusado: este é o banco de produção (neondb). Restaure em um banco novo.");
  alvo.searchParams.set("uselibpqcompat", "true");

  const dump = JSON.parse(fs.readFileSync(arquivo, "utf8"));
  const client = new Client({ connectionString: alvo.toString() });
  await client.connect();

  const { rows } = await client.query('select count(*)::int n from "User"');
  if (rows[0].n > 0) throw new Error("Recusado: o banco de destino já tem usuários. Use um banco vazio.");

  const extras = Object.keys(dump.tabelas).filter((t) => t !== "_prisma_migrations" && !ORDEM.includes(t));
  await client.query("begin");
  try {
    for (const tabela of [...ORDEM, ...extras]) {
      const linhas = dump.tabelas[tabela] ?? [];
      for (const linha of linhas) {
        const colunas = Object.keys(linha);
        const marcadores = colunas.map((_, i) => `$${i + 1}`).join(",");
        await client.query(
          `insert into "${tabela}" (${colunas.map((c) => `"${c}"`).join(",")}) values (${marcadores})`,
          colunas.map((c) => (linha[c] !== null && typeof linha[c] === "object" && !Array.isArray(linha[c]) ? JSON.stringify(linha[c]) : linha[c])),
        );
      }
      console.log(tabela.padEnd(20), linhas.length);
    }
    await client.query("commit");
  } catch (e) {
    await client.query("rollback");
    throw e;
  }
  await client.end();
  console.log("restaurado com sucesso");
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
