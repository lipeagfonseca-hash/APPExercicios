// Cria o usuário interno usado pelo aquecedor (veja src/config/aquecimento.ts).
// Ele NÃO consegue fazer login: a senha é aleatória e descartada na hora. A sessão que o
// aquecedor usa é gerada em memória, com o AUTH_SECRET, a cada chamada.
// Uso: node scripts/criar-usuario-aquecedor.cjs
const crypto = require("crypto");
const { Client } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local", quiet: true });

const EMAIL = "aquecedor@interno.invalid";

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const existente = await client.query('select id from "User" where email = $1', [EMAIL]);
  if (existente.rowCount) {
    console.log("usuário aquecedor já existe");
  } else {
    const senhaDescartada = crypto.randomBytes(48).toString("base64");
    const hash = await bcrypt.hash(senhaDescartada, 12);
    await client.query('insert into "User"(id, name, email, password) values($1, $2, $3, $4)', [
      "aq" + crypto.randomBytes(10).toString("hex"),
      "Aquecedor (interno)",
      EMAIL,
      hash,
    ]);
    console.log("usuário aquecedor criado (sem senha utilizável)");
  }
  await client.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
