// Backup lógico do banco em JSON, na pasta backups/ (ignorada pelo git).
// ATENÇÃO: o arquivo contém hashes de senha e dados de usuários — nunca versionar nem compartilhar.
// Uso: node scripts/backup-db.cjs          (banco de DESENVOLVIMENTO, o do .env.local)
//      node scripts/backup-db.cjs --prod   (banco de PRODUÇÃO "neondb", mesmo servidor)
//      acrescente --manter N para apagar os backups mais antigos, guardando só os N mais novos
//      (usado pela tarefa semanal do Windows: ver CLAUDE.md, "Backups").
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: ".env.local", quiet: true });

(async () => {
  const url = new URL(process.env.DATABASE_URL);
  if (process.argv.includes("--prod")) url.pathname = "/neondb";
  console.log("banco:", url.pathname);
  const client = new Client({ connectionString: url.toString() });
  await client.connect();

  const { rows: tabelas } = await client.query(
    "select tablename from pg_tables where schemaname = 'public' order by 1",
  );

  const dump = { criadoEm: new Date().toISOString(), tabelas: {} };
  for (const { tablename } of tabelas) {
    const { rows } = await client.query(`select * from "${tablename}"`);
    dump.tabelas[tablename] = rows;
    console.log(tablename.padEnd(22), rows.length);
  }
  await client.end();

  const pasta = path.join(__dirname, "../backups");
  fs.mkdirSync(pasta, { recursive: true });
  const prefixo = `backup-${url.pathname.slice(1)}-`; // ex.: backup-neondb- ou backup-treino_dev-
  const arquivo = path.join(pasta, `${prefixo}${dump.criadoEm.replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(arquivo, JSON.stringify(dump, null, 2), { mode: 0o600 });
  console.log("salvo em", path.relative(process.cwd(), arquivo));

  const i = process.argv.indexOf("--manter");
  const manter = i > -1 ? Number(process.argv[i + 1]) : 0;
  if (Number.isInteger(manter) && manter > 0) {
    const antigos = fs
      .readdirSync(pasta)
      .filter((f) => f.startsWith(prefixo) && f.endsWith(".json")) // só os do mesmo banco
      .sort() // o nome começa pela data, então ordem alfabética = ordem cronológica
      .slice(0, -manter);
    for (const f of antigos) fs.unlinkSync(path.join(pasta, f));
    if (antigos.length) console.log(`removidos ${antigos.length} backup(s) antigo(s); mantidos os ${manter} mais novos`);
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
