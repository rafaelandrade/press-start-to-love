// Copia as fotos reais de docs/us (fonte) para public/us (servido pelo
// Vite) e gera o manifest.json que o mural do FinalCarta carrega.
// Uso: pnpm gen:photos  (o build também roda isso automaticamente)
import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";

const FONTE = "docs/us";
const DESTINO = "public/us";
const EXTENSOES = /\.(png|jpe?g|webp|gif)$/i;

mkdirSync(DESTINO, { recursive: true });

const fotos = existsSync(FONTE)
  ? readdirSync(FONTE)
      .filter((f) => EXTENSOES.test(f))
      .sort((a, b) => a.localeCompare(b, "pt", { numeric: true }))
  : [];

for (const f of fotos) cpSync(`${FONTE}/${f}`, `${DESTINO}/${f}`);
writeFileSync(`${DESTINO}/manifest.json`, JSON.stringify(fotos, null, 2) + "\n");

console.log(`[gen:photos] ${fotos.length} foto(s) copiadas para ${DESTINO}`);
