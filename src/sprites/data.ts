// Matrizes de pixels dos personagens — estilo chibi (ver docs/art-references/).
// `.` = transparente; cada caractere mapeia para uma cor na paleta.
// Regras: contorno de 1px no tom mais escuro da própria região (nunca preto puro),
// 3 tons por material (sombra/base/brilho), luz vinda de cima-esquerda.

export interface SpriteData {
  palette: Record<string, string>;
  grid: string[];
}

// 32x48 — cabeça ~45% da altura, tronco ~30%, pernas+pés ~25%
export const GABITCHA: SpriteData = {
  palette: {
    k: "#1a1114", // cabelo sombra/contorno
    h: "#2e1d22", // cabelo base
    H: "#4a3038", // cabelo brilho
    d: "#c68a62", // pele sombra
    s: "#e0a87c", // pele base
    S: "#f0c49a", // pele brilho
    W: "#ffffff", // branco (olho/brilho)
    I: "#5f3d26", // íris castanho-escura
    p: "#1a0f08", // pupila
    R: "#e2867d", // blush
    L: "#b85560", // batom
    G: "#d9a441", // ouro (colar/brincos)
    g: "#f0cd7a", // ouro brilho
    o: "#0d0a10", // renda contorno
    t: "#16121a", // renda base
    u: "#2a2432", // renda pontos
    x: "#171426", // saia sombra/contorno
    X: "#232045", // saia base
    y: "#34305c", // saia brilho
    b: "#3a2517", // bota sombra/contorno
    B: "#5a3b24", // bota base
    m: "#7a5436", // bota brilho
  },
  grid: [
    "...........kkkkkkkkkk...........",
    ".........khhhhhkkhhhhhk.........",
    ".......kHHHHHhhkkhhhhhHk........",
    "......khHHHHHHhkkhhhhhhHhk......",
    ".....khHHHHHhhhhhhhhhhhhhhk.....",
    "....khHHHHhhhhhhhhhhhhhhhhhk....",
    "....khhhhkSSSSsssssssskhhhhk....",
    "....khhhkSSSssssssssssdkhhhk....",
    "...khhhkSSssssssssssssddkhhhk...",
    "...khhhkSSssssssssssssddkhhhk...",
    "...khhhkSsssssssssssssddkhhhk...",
    "...khhhkSkkkkksssskkkkkdkhhhk...",
    "...khhhkSIWWIIssssIWWIIdkhhhk...",
    "...khhhkSWIpIWssssWIpIWdkhhhk...",
    "...khhhkSWIIIWssssWIIIWdkhhhk...",
    "...khhhkSsdddsssssdddssdkhhhk...",
    "...khhhGssRRssssdsssRRsdGhhhk...",
    "...khhhgssRRssssssssRRsdghhhk...",
    "...khhhkssssssLLLLssssddkhhhk...",
    "...khhhhkSssssssssssddkhhhhk....",
    "...khhhhhkssssssssssddkhhhhhk...",
    "...khhhhhhhhhdssssdhhhhhhhhhk...",
    "...khhhhhhttSsssssddtthhhhhhk...",
    "...khhhhhhttsGgGGGsdtthhhhhhk...",
    "....khhhotutttuttuttuttohhhk....",
    "....khhSsouttuttuttuttosdhhk....",
    "....khhSsotuttuttuttutosdhhk....",
    ".....khSsouttuttuttuttosdhk.....",
    ".....khSsotuttuttuttutosdhk.....",
    "......kSsouttuttuttuttosdk......",
    ".......ssottttttttttttosd.......",
    ".......ddoooooooooooooodd.......",
    "..........xyXXXXXXXXXx..........",
    ".........xyXXXXXXXXXXXx.........",
    ".........xyXXXXXXXXXXXx.........",
    "........xyXXXXXXXXXXXXxx........",
    "........xXXXXXXXXXXXXXxx........",
    "........xxxxxxxxxxxxxxxx........",
    "...........Ssd....ssd...........",
    "...........Ssd....ssd...........",
    "...........Ssd....ssd...........",
    "...........Ssd....ssd...........",
    "...........Ssd....ssd...........",
    "..........bmBb....bBBb..........",
    "..........bmBb....bBBb..........",
    "..........bBBb....bBBb..........",
    ".........bmBBb....bBBBb.........",
    ".........bbbbb....bbbbb.........",
  ],
};

// 32x48
export const RAFITCHO: SpriteData = {
  palette: {
    k: "#1a1114", // cabelo sombra/contorno
    h: "#2e1d22", // cabelo base
    H: "#4a3038", // cabelo brilho
    d: "#7d5430", // pele sombra
    s: "#a5713f", // pele base
    S: "#c08d55", // pele brilho
    G: "#14110f", // armação dos óculos
    W: "#ffffff", // branco (olho/lente/dentes)
    I: "#5a3a22", // íris castanho-escura
    p: "#1a0f08", // pupila
    M: "#5a2a2a", // interior da boca
    R: "#c96a55", // blush
    o: "#101014", // camiseta contorno
    t: "#1b1b1f", // camiseta base
    u: "#2b2b33", // camiseta brilho
    P: "#e75a8a", // estampa rosa
    T: "#3aa6a0", // tatuagem teal
    j: "#1c2236", // jeans sombra/contorno
    J: "#2c3854", // jeans base
    y: "#40507a", // jeans brilho
    v: "#6b7080", // tênis contorno
    w: "#c2c6d0", // tênis sombra
  },
  grid: [
    "..........kkkk..kkk.kk..........",
    ".........khhHHHhhhhhhhk.........",
    ".......khHHHHHhhhhhhhhhhk.......",
    "......khHHHHhhhhhhhhhhhhhk......",
    ".....khHHHhhhhhhhhhhhhhhhhk.....",
    ".....khhhhhhhhhhhhhhhhhhhhk.....",
    ".....khhhhShhhhhShhhhhShhhk.....",
    "......khSSssssssssssssddhk......",
    "......khSSssssssssssssddhk......",
    "......khSsssssssssssssddhk......",
    "......khSsssssssssssssddhk......",
    "......khsGGGGGssssGGGGGdhk......",
    "......khGIWWIIGssGIWWIIGhk......",
    "......khGWIpIWGGGGWIpIWGhk......",
    "......khGWIIIWGssGWIIIWGhk......",
    "......khsGGGGGssssGGGGGdhk......",
    ".......dsRRssssddssssRRdd.......",
    ".......dssssMWWWWWWMssddd.......",
    ".......dsssssMMMMMMsssddd.......",
    ".......dSsssssssssssssddd.......",
    "..........dssssssssssd..........",
    ".............dssssd.............",
    ".........ottttsssstttto.........",
    ".........outtttttttttto.........",
    ".......ouuttttttttttttttto......",
    ".......ottttttPPtPPtttttto......",
    ".......otttttPPPPPPPttttto......",
    ".......SstttttPPPPPttttsd.......",
    ".......SsttttttPPPtttttTd.......",
    ".......SsttttttttttttttTd.......",
    ".......ssoooooooooooooosd.......",
    ".......sdjyJJJJJJJJJJJjsd.......",
    ".......ddjyJJJJJJJJJJJjdd.......",
    ".........jyJJJJJJJJJJJj.........",
    ".........jJJJJJJJJJJJJj.........",
    ".........jyJJJj..jJJJJj.........",
    ".........jyJJJj..jJJJJj.........",
    ".........jyJJJj..jJJJJj.........",
    ".........jyJJJj..jJJJJj.........",
    ".........jyJJJj..jJJJJj.........",
    ".........jyJJJj..jJJJJj.........",
    ".........jyJJJj..jJJJJj.........",
    ".........jyJJJj..jJJJJj.........",
    ".........jjjjjj..jjjjjj.........",
    ".........vWWWwv..vWWWwv.........",
    ".........vWWWwv..vWWWwv.........",
    "........vWWWWwv..vWWWWwv........",
    "........vvvvvvv..vvvvvvv........",
  ],
};

// ------------------------------------------------------------
// RAFITCHO SENTADO (32x38) — cadeira de escritório, de perfil pro
// monitor (à direita). A cabeça é EXATAMENTE a do sprite em pé
// (mesma identidade); o corpo é sentado: pernas dobradas, braços
// no teclado. 3 frames: digitando A/B (mãos) + feliz (olhos ^ ^).
// ------------------------------------------------------------

/** Substitui um trecho da linha preservando o comprimento. */
function trecho(linha: string, col: number, s: string): string {
  return linha.slice(0, col) + s + linha.slice(col + s.length);
}

/** Monta uma linha de 32 colunas a partir de segmentos [coluna, arte]. */
function linha32(...partes: Array<[number, string]>): string {
  let out = "";
  for (const [col, s] of partes) {
    out += ".".repeat(col - out.length) + s;
  }
  return out + ".".repeat(32 - out.length);
}

const PALETA_SENTADO: Record<string, string> = {
  ...RAFITCHO.palette,
  C: "#2a2436", // cadeira base
  c: "#1a1520", // cadeira contorno
  E: "#3a3350", // cadeira brilho
  r: "#14121c", // rodinhas
};

/** Corpo sentado (linhas 22-37). `maos`: 0 = no alto, 1 = no teclado. */
function corpoSentado(maos: 0 | 1): string[] {
  const maoAlta = maos === 0;
  return [
    linha32([2, "cCCc"], [9, "ottttsssstttto"]), // ombros
    linha32([2, "cCCc"], [9, "outtttttttttto"]),
    linha32([2, "cCCc"], [7, "ouuttttttttttttttto"]),
    linha32([2, "cCCc"], [7, "otttttttPPttttttto"], [25, "sss"]), // braço estendido
    maoAlta
      ? linha32([2, "cCCc"], [7, "ottttttPPPtttttto"], [24, "ssssss"]) // mão em cima
      : linha32([2, "cCCc"], [7, "ottttttPPPtttttto"], [24, "ssss"]),
    maoAlta
      ? linha32([2, "cCCc"], [7, "otttttttttttttttto"])
      : linha32([2, "cCCc"], [7, "otttttttttttttttto"], [27, "sss"]), // mão embaixo
    linha32([2, "cCCc"], [8, "otttttttttttttto"]),
    linha32([2, "cCCc"], [8, "oooooooooooooooo"]), // barra da camiseta
    linha32([2, "cCCc"], [8, "jJJJJJJJJJJJJJJy"]), // quadril
    linha32([1, "cCCCCCC"], [8, "jJJJJJJJJJJJJJJJy"]), // coxa + assento
    linha32([1, "cCCCCCC"], [8, "jjjjjjjjjjjj"], [21, "jJJJj"]), // canela
    linha32([9, "cCc"], [21, "jJJJj"]), // pistão da cadeira
    linha32([9, "cCc"], [21, "jJJJj"]),
    linha32([5, "cCCCCCCCCCc"], [21, "vWWWWwv"]), // base + tênis
    linha32([5, "rr"], [13, "rr"], [21, "vvvvvvv"]), // rodinhas + sola
    linha32([5, "rr"], [13, "rr"]),
  ];
}

const CABECA_SENTADO = RAFITCHO.grid.slice(0, 22);

// frame feliz: olhos fechados de alegria (^ ^) atrás dos óculos
const CABECA_FELIZ = (() => {
  const g = [...CABECA_SENTADO];
  for (const ini of [9, 18]) {
    g[12] = trecho(g[12], ini, "sppps");
    g[13] = trecho(g[13], ini, "psssp");
    g[14] = trecho(g[14], ini, "sssss");
  }
  return g;
})();

export const RAFITCHO_SENTADO_FRAMES: SpriteData[] = [
  { palette: PALETA_SENTADO, grid: [...CABECA_SENTADO, ...corpoSentado(0)] },
  { palette: PALETA_SENTADO, grid: [...CABECA_SENTADO, ...corpoSentado(1)] },
  { palette: PALETA_SENTADO, grid: [...CABECA_FELIZ, ...corpoSentado(0)] },
];

// ------------------------------------------------------------
// CICLO DE CAMINHADA + IDLE — frames derivados dos sprites base
// (mesma identidade). Desenhados virados para a DIREITA; virar
// com setFlipX. Regra de ouro: deslocamentos em pixels inteiros.
// ------------------------------------------------------------

/** Sobe o grid inteiro 1px — o "subir" do passo (frame de passagem). */
function subir1px(grid: string[]): string[] {
  return [...grid.slice(1), ".".repeat(grid[0].length)];
}

/** Escreve `s` na linha a partir de `col`, ignorando os "." de `s`. */
function pintar(linha: string, col: number, s: string): string {
  const chars = linha.split("");
  [...s].forEach((ch, i) => {
    if (ch !== ".") chars[col + i] = ch;
  });
  return chars.join("");
}

/** Respiração do idle: cabeça/tronco descem 1px, pernas plantadas. */
function respirar(grid: string[], linhaComprimida: number): string[] {
  return [
    ".".repeat(grid[0].length),
    ...grid.slice(0, linhaComprimida),
    ...grid.slice(linhaComprimida + 1),
  ];
}

// Rafitcho: perna esq = cols 9-14 (sapato 8-14), dir = cols 17-22 (17-23).
// A perna de trás ("tras") fica 1px ERGUIDA: cada linha usa o segmento
// da linha de baixo (o pé sai do chão) — passada legível sem fusão.
function pernasRafitcho(dxEsq: number, dxDir: number, tras: "esq" | "dir" | null): string[] {
  const g = [...RAFITCHO.grid];
  for (let r = 35; r <= 47; r++) {
    let linha = ".".repeat(32);
    for (const lado of ["esq", "dir"] as const) {
      const fonte = tras === lado ? r + 1 : r;
      if (fonte > 47) continue; // pé erguido: some 1px embaixo
      const larg = fonte >= 46 ? 7 : 6;
      const col = lado === "esq" ? (fonte >= 46 ? 8 : 9) : 17;
      const seg = RAFITCHO.grid[fonte].slice(col, col + larg);
      linha = pintar(linha, col + (lado === "esq" ? dxEsq : dxDir), seg);
    }
    g[r] = linha;
  }
  return g;
}

// braços do Rafitcho: esq = cols 7-8, dir = cols 23-24 (linhas 27-30)
function bracosRafitcho(grid: string[], direitoNaFrente: boolean): string[] {
  const g = [...grid];
  for (let r = 27; r <= 30; r++) {
    const base = RAFITCHO.grid[r];
    const esq = base.slice(7, 9);
    const dir = base.slice(23, 25);
    const torso = r === 30 ? "o" : "t";
    let linha = base;
    if (direitoNaFrente) {
      linha = trecho(linha, 23, torso); // o torso ocupa o lugar do braço
      linha = pintar(linha, 24, dir); // braço direito avança
      linha = trecho(linha, 8, torso);
      linha = pintar(linha, 6, esq); // braço esquerdo recua
    } else {
      linha = trecho(linha, 24, ".");
      linha = pintar(linha, 22, dir); // braço direito recua (na frente do torso)
      linha = trecho(linha, 7, ".");
      linha = pintar(linha, 8, esq); // braço esquerdo avança
    }
    g[r] = linha;
  }
  return g;
}

// Gabitcha: perna esq = cols 9-13, dir = cols 18-22 (a saia fica parada)
function pernasGabitcha(dxEsq: number, dxDir: number, tras: "esq" | "dir" | null): string[] {
  const g = [...GABITCHA.grid];
  for (let r = 38; r <= 47; r++) {
    let linha = ".".repeat(32);
    for (const lado of ["esq", "dir"] as const) {
      const fonte = tras === lado ? r + 1 : r;
      if (fonte > 47) continue; // pé erguido: some 1px embaixo
      const col = lado === "esq" ? 9 : 18;
      const seg = GABITCHA.grid[fonte].slice(col, col + 5);
      linha = pintar(linha, col + (lado === "esq" ? dxEsq : dxDir), seg);
    }
    g[r] = linha;
  }
  return g;
}

/** O cabelo dela "atrasa" 1px para trás nos frames de contato. */
function cabeloAtras(grid: string[]): string[] {
  const g = [...grid];
  for (let r = 18; r <= 31; r++) {
    const i0 = g[r].search(/[^.]/);
    if (i0 > 0 && (g[r][i0] === "k" || g[r][i0] === "h")) {
      g[r] = trecho(g[r], i0 - 1, "k");
    }
  }
  return g;
}

// F1 contato (esq na frente, dir atrás erguida) / F2 passagem / F3 invertido
export const GABITCHA_ANDAR_FRAMES: SpriteData[] = [
  { palette: GABITCHA.palette, grid: cabeloAtras(pernasGabitcha(1, -1, "dir")) },
  { palette: GABITCHA.palette, grid: subir1px(pernasGabitcha(0, 0, null)) },
  { palette: GABITCHA.palette, grid: cabeloAtras(pernasGabitcha(-1, 1, "esq")) },
];
export const GABITCHA_IDLE_FRAME: SpriteData = {
  palette: GABITCHA.palette,
  grid: respirar(GABITCHA.grid, 28), // cabelo acompanha (desce junto)
};

// o vão entre as pernas dele é de só 2px: a perna de trás não recua
// (apenas ergue), senão os jeans se fundem num bloco só
export const RAFITCHO_ANDAR_FRAMES: SpriteData[] = [
  { palette: RAFITCHO.palette, grid: bracosRafitcho(pernasRafitcho(1, 0, "dir"), true) },
  { palette: RAFITCHO.palette, grid: subir1px(pernasRafitcho(0, 0, null)) },
  { palette: RAFITCHO.palette, grid: bracosRafitcho(pernasRafitcho(0, 1, "esq"), false) },
];
export const RAFITCHO_IDLE_FRAME: SpriteData = {
  palette: RAFITCHO.palette,
  grid: respirar(RAFITCHO.grid, 29),
};

// 24x16 — filhote quadrúpede de perfil (corpo), rosto 3/4 pra câmera
export const YUUMITCHA: SpriteData = {
  palette: {
    e: "#14100b", // preto contorno (máscara/orelhas)
    K: "#241c15", // preto base
    M: "#3d3125", // preto brilho
    a: "#a8845a", // pelo fawn sombra/contorno
    F: "#d8b488", // pelo fawn base
    f: "#ecd7b0", // pelo claro (peito/brilho)
    E: "#171210", // olhos
    W: "#ffffff", // brilho do olho
    N: "#0d0a08", // nariz
    Q: "#b08d5f", // rabinho enrolado
  },
  grid: [
    ".........eKe......eKe...",
    ".........eKMeaaaaeKMe...",
    "........aKKefFFFfeKKa...",
    "..Q.....afFFaaaaaFFFa...",
    ".QQ.....afEEFFFFEEFFa...",
    ".QQaaaaaFfEWFKKFEWFfa...",
    ".aFFFFFFFfFeKNNKeFFFa...",
    ".aFFFFFfFfFeMKKKKeFFa...",
    ".aFFFFffFfFeKKKKKeFFa...",
    ".aFFffffFFaeKKKKeaFFa...",
    ".aFFfffffaaaaaaaaFFa....",
    "..aFffffa...aFFa.aFFa...",
    "...aFa.aa....aa.aFa.....",
    "...aFa.aa....aa.aFa.....",
    "...aFa.aa....aa.aFa.....",
    "...aaa.aa....aa.aaa.....",
  ],
};

// ------------------------------------------------------------
// Trote da Yuumitcha — 3 frames (patas alternadas + bob de 1px
// embutido no frame de passagem)
// ------------------------------------------------------------

const TROTE_PATAS_A = [
  "..aFa..aa....aa..aFa....",
  ".aFa...aa....aa...aFa...",
  ".aa.....a....a.....aa...",
  "........................",
];
// alternância invertida = espelho horizontal das patas
const TROTE_PATAS_C = TROTE_PATAS_A.map((l) => [...l].reverse().join(""));

export const YUUMITCHA_TROTE_FRAMES: SpriteData[] = [
  { palette: YUUMITCHA.palette, grid: [...YUUMITCHA.grid.slice(0, 12), ...TROTE_PATAS_A] },
  {
    palette: YUUMITCHA.palette,
    grid: subir1px([
      ...YUUMITCHA.grid.slice(0, 12),
      "....aFa.aa..aa.aFa......",
      "....aFaaa....aaaFa......",
      "........................",
      "........................",
    ]),
  },
  { palette: YUUMITCHA.palette, grid: [...YUUMITCHA.grid.slice(0, 12), ...TROTE_PATAS_C] },
];
