// Imports the curated exercise catalog into Postgres.
// Usage: node scripts/import-exercises.cjs <rows.json> <pt.txt>
// rows.json: dataset subset (hasaneyldrm/exercises-dataset); pt.txt: "id|nome em português" per line.
const fs = require("fs");
const { Client } = require("pg");
require("dotenv").config({ path: ".env.local", quiet: true });

const [rowsPath, ptPath] = process.argv.slice(2);
if (!rowsPath || !ptPath) {
  console.error("uso: node scripts/import-exercises.cjs <rows.json> <pt.txt>");
  process.exit(1);
}

const normalize = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

const rows = JSON.parse(fs.readFileSync(rowsPath, "utf8"));
const pt = new Map(
  fs.readFileSync(ptPath, "utf8").split(/\r?\n/).filter(Boolean).map((l) => {
    const i = l.indexOf("|");
    return [l.slice(0, i), l.slice(i + 1).trim()];
  }),
);

const missing = rows.filter((r) => !pt.get(r.id));
if (missing.length) {
  console.error("sem tradução:", missing.map((r) => r.id + " " + r.nameEn).join(", "));
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query("begin");
  try {
    for (const r of rows) {
      const namePt = pt.get(r.id);
      const search = normalize([namePt, r.nameEn, r.target, r.bodyPart, r.equipment].join(" "));
      await client.query(
        `insert into "Exercise"(id,"namePt","nameEn","bodyPart",equipment,target,secondary,"instructionsEn","instructionsEs","mediaId",search)
         values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         on conflict (id) do update set "namePt"=excluded."namePt","nameEn"=excluded."nameEn","bodyPart"=excluded."bodyPart",
           equipment=excluded.equipment,target=excluded.target,secondary=excluded.secondary,
           "instructionsEn"=excluded."instructionsEn","instructionsEs"=excluded."instructionsEs","mediaId"=excluded."mediaId",search=excluded.search`,
        [r.id, namePt, r.nameEn, r.bodyPart, r.equipment, r.target, r.secondary, r.instructionsEn, r.instructionsEs, r.mediaId, search],
      );
    }
    await client.query("commit");
  } catch (e) {
    await client.query("rollback");
    throw e;
  }
  const { rows: c } = await client.query('select count(*)::int n from "Exercise"');
  console.log("exercícios no banco:", c[0].n);
  await client.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
