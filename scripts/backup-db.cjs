// Backup lógico do banco em JSON, na pasta backups/ (ignorada pelo git).
// ATENÇÃO: o arquivo contém hashes de senha e dados de usuários — nunca versionar nem compartilhar.
// Uso: node scripts/backup-db.cjs
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: ".env.local", quiet: true });

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
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
  const arquivo = path.join(pasta, `backup-${dump.criadoEm.replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(arquivo, JSON.stringify(dump, null, 2), { mode: 0o600 });
  console.log("salvo em", path.relative(process.cwd(), arquivo));
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
