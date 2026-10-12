// Garante que todo ícone usado no código está na fonte de ícones (senão o ícone apareceria
// como TEXTO, ex.: "assignment_late"). Rodar com: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ICONES_USADOS } from "./icones.ts";

function arquivosTsx(pasta: string): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? arquivosTsx(join(pasta, e.name)) : e.name.endsWith(".tsx") ? [join(pasta, e.name)] : [],
  );
}

const caminho = (relativo: string) => new URL(relativo, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

test("todo ícone usado no código está em ICONES_USADOS", () => {
  const usados = new Set<string>();
  for (const arquivo of arquivosTsx(caminho("../"))) {
    const texto = readFileSync(arquivo, "utf8");
    for (const m of texto.matchAll(/material-symbols-outlined[^>]*>\s*([a-z0-9_]+)\s*</g)) usados.add(m[1]);
    for (const m of texto.matchAll(/\bicon:\s*"([a-z0-9_]+)"/g)) usados.add(m[1]);
  }
  const faltando = [...usados].filter((n) => !(ICONES_USADOS as readonly string[]).includes(n));
  assert.deepEqual(faltando, [], `ícones usados mas fora de ICONES_USADOS: ${faltando.join(", ")}`);
});

test("a fonte hospedada foi gerada com exatamente a lista atual de ícones", () => {
  const lista = caminho("../../public/fonts/material-symbols-icones.lista.txt");
  assert.ok(existsSync(lista), "rode: node scripts/gerar-fonte-de-icones.cjs");
  const gerada = readFileSync(lista, "utf8").split("\n").filter(Boolean);
  assert.deepEqual(gerada, [...ICONES_USADOS].sort(), "a lista mudou: rode node scripts/gerar-fonte-de-icones.cjs");
});

test("a fonte de ícones é um subconjunto pequeno (< 20 KB), não a fonte inteira", () => {
  const tamanho = statSync(caminho("../../public/fonts/material-symbols-icones.woff2")).size;
  assert.ok(tamanho > 1000 && tamanho < 20_000, `tamanho inesperado: ${tamanho} bytes`);
});
