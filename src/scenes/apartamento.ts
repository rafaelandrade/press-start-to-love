import Phaser from "phaser";
import { GAME_HEIGHT } from "../ui/constants";

/**
 * O apartamento do casal — ASSET COMPARTILHADO (Fase 5 e Fase 6).
 * Sala aconchegante (sofá 2 tons, TV, estante, tapete, quadros) +
 * cozinha americana ao fundo + janelas com a cidade. 3 planos:
 * parede/janelas (-8), móveis de fundo (-6), móveis de meio (-4);
 * personagens em ~20 e um plano de primeiro (mesa de centro) em 24.
 * A Fase 6 usa o MESMO apartamento em versão dessaturada
 * (`dessaturada: true`) e coleta os objetos via `aoCriar` para
 * mascarar a camada cinza e revelar a cor por baixo.
 */

export const APTO_LARGURA = 560;
export const APTO_CHAO_Y = GAME_HEIGHT - 24;

// âncoras de móveis (compartilhadas pelas fases)
export const APTO = {
  porta: 36,
  quadroPolaroids: 96,
  sofa: 176,
  janelaSala: 218,
  tv: 270,
  relogio: 296,
  estante: 330,
  planta: 372,
  balcao: 460,
  janelaCozinha: 472,
  geladeira: 528,
} as const;

export interface PaletaApto {
  parede: number;
  paredeSombra: number;
  friso: number;
  rodape: number;
  piso: number;
  pisoLinha: number;
  madeira: number;
  madeiraClara: number;
  madeiraEscura: number;
  sofaEscuro: number;
  sofaBase: number;
  sofaClaro: number;
  almofada: number;
  tapete1: number;
  tapete2: number;
  janelaCeu: number;
  janelaCeu2: number;
  predio: number;
  janelaAcesa: number;
  tela: number;
  metal: number;
  metalClaro: number;
  planta: number;
  plantaClara: number;
  vaso: number;
  porta: number;
  portaClara: number;
  detalhe: number;
  branco: number;
}

/** Noite aconchegante: madeira quente, sofá teal (as cores do casal). */
export const PALETA_APTO_QUENTE: PaletaApto = {
  parede: 0x5a4050,
  paredeSombra: 0x4a3442,
  friso: 0x6a4e5c,
  rodape: 0x3a2a30,
  piso: 0x7a5436,
  pisoLinha: 0x5a3b24,
  madeira: 0x8a6240,
  madeiraClara: 0xa87f4e,
  madeiraEscura: 0x5a3a24,
  sofaEscuro: 0x1f5a54,
  sofaBase: 0x2c7f7a,
  sofaClaro: 0x4fd6c4,
  almofada: 0xe05a8a,
  tapete1: 0xc4907a,
  tapete2: 0xa8705c,
  janelaCeu: 0x2a2148,
  janelaCeu2: 0x3a2d5c,
  predio: 0x161930,
  janelaAcesa: 0xe9b44c,
  tela: 0x11131f,
  metal: 0x8a8a98,
  metalClaro: 0xc2c6d0,
  planta: 0x3a6b30,
  plantaClara: 0x4c9a44,
  vaso: 0xb85838,
  porta: 0x6b4a2f,
  portaClara: 0x8a6240,
  detalhe: 0xe9b44c,
  branco: 0xf2f0f7,
};

/** Converte qualquer cor para a rampa fria cinza-azulada da tempestade. */
export function dessaturarCor(cor: number): number {
  const r = (cor >> 16) & 255;
  const g = (cor >> 8) & 255;
  const b = cor & 255;
  const luz = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const r2 = Math.round(22 + luz * 80);
  const g2 = Math.round(24 + luz * 86);
  const b2 = Math.round(36 + luz * 104);
  return (r2 << 16) | (g2 << 8) | b2;
}

export interface OpcoesApto {
  paleta?: PaletaApto;
  /** Animações ambiente (luzes da cidade, pêndulo, vapor). */
  animar?: boolean;
  /** Versão tempestade: toda cor passa pela rampa cinza-azulada. */
  dessaturada?: boolean;
  /** Recebe cada objeto criado (p/ máscaras ou limpeza pela fase). */
  aoCriar?: (obj: Phaser.GameObjects.GameObject) => void;
}

export function criarApartamento(scene: Phaser.Scene, opcoes: OpcoesApto = {}): void {
  const animar = opcoes.animar ?? true;
  const dessat = opcoes.dessaturada ?? false;
  const C = (cor: number): number => (dessat ? dessaturarCor(cor) : cor);
  const base = opcoes.paleta ?? PALETA_APTO_QUENTE;
  const P: PaletaApto = dessat
    ? (Object.fromEntries(
        Object.entries(base).map(([k, v]) => [k, dessaturarCor(v as number)])
      ) as unknown as PaletaApto)
    : base;
  const reg = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
    opcoes.aoCriar?.(o);
    return o;
  };
  const Ch = APTO_CHAO_Y;

  // ---------- plano 1: parede, piso, janelas ----------
  const fundo = reg(scene.add.graphics().setDepth(-8));
  fundo.fillStyle(P.parede, 1);
  fundo.fillRect(0, 0, APTO_LARGURA, Ch - 10);
  fundo.fillStyle(P.paredeSombra, 1);
  fundo.fillRect(0, 0, APTO_LARGURA, 14); // faixa do teto
  fundo.fillStyle(P.friso, 1);
  fundo.fillRect(0, 14, APTO_LARGURA, 1);
  fundo.fillRect(0, Ch - 16, APTO_LARGURA, 1); // friso baixo
  fundo.fillStyle(P.rodape, 1);
  fundo.fillRect(0, Ch - 15, APTO_LARGURA, 5); // rodapé
  // piso de tábuas com juntas alternadas
  fundo.fillStyle(P.piso, 1);
  fundo.fillRect(0, Ch - 10, APTO_LARGURA, GAME_HEIGHT - Ch + 10);
  fundo.fillStyle(P.pisoLinha, 1);
  for (let fy = Ch - 4; fy < GAME_HEIGHT; fy += 8) fundo.fillRect(0, fy, APTO_LARGURA, 1);
  for (let fx = 0; fx < APTO_LARGURA; fx += 34) {
    fundo.fillRect(fx + (Math.floor(fx / 34) % 2) * 17, Ch - 9, 1, 6);
    fundo.fillRect(fx + (Math.floor(fx / 34) % 2) * 17 + 8, Ch - 2, 1, 8);
  }
  fundo.fillStyle(P.madeiraClara, 0.35);
  fundo.fillRect(0, Ch - 10, APTO_LARGURA, 1); // brilho na quina do piso

  criarJanela(scene, P, C, reg, APTO.janelaSala - 28, 38, 56, 48, animar);
  criarJanela(scene, P, C, reg, APTO.janelaCozinha - 20, 44, 40, 40, animar);

  // ---------- porta de entrada ----------
  const porta = reg(scene.add.graphics().setDepth(-7));
  porta.fillStyle(P.madeiraEscura, 1);
  porta.fillRect(APTO.porta - 16, 42, 32, Ch - 52); // batente
  porta.fillStyle(P.porta, 1);
  porta.fillRect(APTO.porta - 13, 45, 26, Ch - 55);
  porta.fillStyle(P.portaClara, 1);
  porta.fillRect(APTO.porta - 13, 45, 2, Ch - 55); // luz na quina
  porta.fillRect(APTO.porta - 9, 52, 18, 26); // almofada superior
  porta.fillStyle(P.porta, 1);
  porta.fillRect(APTO.porta - 7, 54, 14, 22);
  porta.fillStyle(P.portaClara, 1);
  porta.fillRect(APTO.porta - 9, 86, 18, 34); // almofada inferior
  porta.fillStyle(P.porta, 1);
  porta.fillRect(APTO.porta - 7, 88, 14, 30);
  porta.fillStyle(P.detalhe, 1);
  porta.fillRect(APTO.porta + 7, 92, 3, 3); // maçaneta
  // capacho
  porta.fillStyle(P.tapete2, 1);
  porta.fillRect(APTO.porta - 14, Ch - 6, 28, 6);
  porta.fillStyle(P.tapete1, 1);
  porta.fillRect(APTO.porta - 12, Ch - 5, 24, 4);

  // ---------- quadros ----------
  // easter egg: as polaroids do Chile em leque ♥
  const quadro = reg(scene.add.graphics().setDepth(-7));
  quadro.fillStyle(P.madeiraEscura, 1);
  quadro.fillRect(APTO.quadroPolaroids - 17, 48, 34, 30);
  quadro.fillStyle(P.parede, 1);
  quadro.fillRect(APTO.quadroPolaroids - 15, 50, 30, 26);
  const fotinhos: Array<[number, number, number]> = [
    [-10, 2, 0x8ac8ee], // Andes
    [-3, 0, 0xd9a441], // vinhedo
    [4, 2, 0xe05a4a], // Valparaíso
  ];
  for (const [dx, dy, cor] of fotinhos) {
    quadro.fillStyle(P.branco, 1);
    quadro.fillRect(APTO.quadroPolaroids + dx - 1, 52 + dy, 9, 12);
    quadro.fillStyle(C(cor), 1);
    quadro.fillRect(APTO.quadroPolaroids + dx, 53 + dy, 7, 6);
  }
  quadro.fillStyle(C(0xff7aa2), 1); // coraçãozinho
  quadro.fillRect(APTO.quadroPolaroids - 2, 68, 2, 2);
  quadro.fillRect(APTO.quadroPolaroids + 1, 68, 2, 2);
  quadro.fillRect(APTO.quadroPolaroids - 2, 70, 5, 2);
  quadro.fillRect(APTO.quadroPolaroids, 72, 1, 1);

  // quadro abstrato menor na cozinha
  quadro.fillStyle(P.madeiraEscura, 1);
  quadro.fillRect(APTO.balcao - 62, 52, 20, 16);
  quadro.fillStyle(P.detalhe, 1);
  quadro.fillRect(APTO.balcao - 60, 54, 16, 12);
  quadro.fillStyle(P.vaso, 1);
  quadro.fillRect(APTO.balcao - 56, 57, 8, 6);

  // relógio de parede com pêndulo
  const relogio = reg(scene.add.graphics().setDepth(-7));
  relogio.fillStyle(P.madeiraEscura, 1);
  relogio.fillRect(APTO.relogio - 7, 44, 14, 14);
  relogio.fillStyle(P.branco, 1);
  relogio.fillRect(APTO.relogio - 5, 46, 10, 10);
  relogio.fillStyle(P.rodape, 1);
  relogio.fillRect(APTO.relogio - 1, 48, 2, 4); // ponteiros
  relogio.fillRect(APTO.relogio, 51, 3, 1);
  const pendulo = reg(
    scene.add
      .rectangle(APTO.relogio - 2, 58, 2, 7, P.detalhe)
      .setOrigin(0.5, 0)
      .setDepth(-7)
  );
  if (animar) {
    scene.time.addEvent({
      delay: 700,
      loop: true,
      callback: () =>
        pendulo.setX(pendulo.x === APTO.relogio - 2 ? APTO.relogio + 2 : APTO.relogio - 2),
    });
  }

  // ---------- plano 2: móveis de fundo ----------
  const moveis = reg(scene.add.graphics().setDepth(-6));

  // rack + TV
  moveis.fillStyle(P.madeira, 1);
  moveis.fillRect(APTO.tv - 26, Ch - 26, 52, 16);
  moveis.fillStyle(P.madeiraClara, 1);
  moveis.fillRect(APTO.tv - 26, Ch - 26, 52, 2);
  moveis.fillStyle(P.madeiraEscura, 1);
  moveis.fillRect(APTO.tv - 24, Ch - 10, 3, 4);
  moveis.fillRect(APTO.tv + 21, Ch - 10, 3, 4); // pés
  moveis.fillRect(APTO.tv - 4, Ch - 22, 8, 8); // nicho
  moveis.fillStyle(P.metal, 1);
  moveis.fillRect(APTO.tv - 20, Ch - 52, 40, 26); // moldura da TV
  moveis.fillStyle(P.tela, 1);
  moveis.fillRect(APTO.tv - 18, Ch - 50, 36, 22); // tela
  moveis.fillStyle(P.janelaCeu2, 0.6);
  moveis.fillRect(APTO.tv - 16, Ch - 48, 8, 6); // reflexo
  moveis.fillStyle(P.metal, 1);
  moveis.fillRect(APTO.tv - 3, Ch - 27, 6, 2); // pé da TV

  // estante com livros e action figure (o canto nerd)
  moveis.fillStyle(P.madeira, 1);
  moveis.fillRect(APTO.estante - 22, 58, 44, Ch - 68);
  moveis.fillStyle(P.madeiraEscura, 1);
  moveis.fillRect(APTO.estante - 22, 58, 44, 2);
  for (const py of [78, 100, 122]) {
    moveis.fillStyle(P.madeiraEscura, 1);
    moveis.fillRect(APTO.estante - 20, py, 40, 2);
  }
  // livros coloridos (alturas variadas)
  const coresLivros = [0xc14a5a, 0x4a63c4, 0xe9b44c, 0x4c9a44, 0xb86ac8, 0x4fd6c4];
  let lx = APTO.estante - 18;
  let li = 0;
  while (lx < APTO.estante + 14) {
    const alt = 10 + ((li * 7) % 5);
    moveis.fillStyle(C(coresLivros[li % coresLivros.length]), 1);
    moveis.fillRect(lx, 78 - alt, 4, alt);
    lx += 5;
    li++;
  }
  // segunda prateleira: action figure + porta-retrato
  moveis.fillStyle(P.metalClaro, 1);
  moveis.fillRect(APTO.estante - 14, 88, 6, 12); // robôzinho
  moveis.fillStyle(C(0xc14a5a), 1);
  moveis.fillRect(APTO.estante - 13, 90, 4, 3);
  moveis.fillStyle(P.tela, 1);
  moveis.fillRect(APTO.estante - 12, 85, 2, 3); // cabeça
  moveis.fillStyle(P.madeiraEscura, 1);
  moveis.fillRect(APTO.estante + 2, 90, 12, 10);
  moveis.fillStyle(C(0xff7aa2), 1);
  moveis.fillRect(APTO.estante + 4, 92, 8, 6); // foto rosa (eles)
  // terceira prateleira: livros deitados
  moveis.fillStyle(C(0x4a63c4), 1);
  moveis.fillRect(APTO.estante - 16, 116, 14, 3);
  moveis.fillStyle(C(0xe9b44c), 1);
  moveis.fillRect(APTO.estante - 14, 113, 12, 3);

  // cozinha americana: balcão + armários + geladeira
  moveis.fillStyle(P.paredeSombra, 1);
  moveis.fillRect(APTO.balcao - 64, 24, 128, 32); // armários superiores
  moveis.fillStyle(P.madeira, 1);
  moveis.fillRect(APTO.balcao - 62, 26, 60, 28);
  moveis.fillRect(APTO.balcao + 2, 26, 60, 28);
  moveis.fillStyle(P.madeiraEscura, 1);
  moveis.fillRect(APTO.balcao - 34, 26, 2, 28);
  moveis.fillRect(APTO.balcao + 30, 26, 2, 28); // divisões
  moveis.fillStyle(P.detalhe, 1);
  moveis.fillRect(APTO.balcao - 40, 38, 2, 4);
  moveis.fillRect(APTO.balcao + 24, 38, 2, 4); // puxadores
  // bancada do fundo (pia + fogão)
  moveis.fillStyle(P.metal, 1);
  moveis.fillRect(APTO.balcao - 64, 96, 128, 4);
  moveis.fillStyle(P.paredeSombra, 1);
  moveis.fillRect(APTO.balcao - 64, 100, 128, 22);
  moveis.fillStyle(P.metalClaro, 1);
  moveis.fillRect(APTO.balcao - 44, 94, 18, 3); // pia
  moveis.fillRect(APTO.balcao - 38, 88, 2, 7); // torneira
  moveis.fillRect(APTO.balcao - 40, 88, 3, 2);
  moveis.fillStyle(P.tela, 1);
  moveis.fillRect(APTO.balcao + 12, 94, 22, 4); // fogão
  moveis.fillStyle(P.metal, 1);
  moveis.fillRect(APTO.balcao + 14, 95, 6, 2);
  moveis.fillRect(APTO.balcao + 24, 95, 6, 2); // bocas
  // balcão americano (na frente da cozinha)
  moveis.fillStyle(P.madeiraClara, 1);
  moveis.fillRect(APTO.balcao - 66, 118, 132, 4); // tampo
  moveis.fillStyle(P.madeira, 1);
  moveis.fillRect(APTO.balcao - 62, 122, 124, Ch - 132);
  moveis.fillStyle(P.madeiraEscura, 1);
  for (let bx = APTO.balcao - 50; bx < APTO.balcao + 60; bx += 24) {
    moveis.fillRect(bx, 126, 1, Ch - 140);
  }
  // banquetas
  for (const sx of [APTO.balcao - 40, APTO.balcao + 8]) {
    moveis.fillStyle(P.metal, 1);
    moveis.fillRect(sx, Ch - 28, 14, 3);
    moveis.fillRect(sx + 2, Ch - 25, 2, 15);
    moveis.fillRect(sx + 10, Ch - 25, 2, 15);
    moveis.fillStyle(P.almofada, 1);
    moveis.fillRect(sx + 1, Ch - 30, 12, 3);
  }
  // geladeira
  moveis.fillStyle(P.metalClaro, 1);
  moveis.fillRect(APTO.geladeira - 16, Ch - 80, 32, 70);
  moveis.fillStyle(P.metal, 1);
  moveis.fillRect(APTO.geladeira + 12, Ch - 80, 4, 70); // lateral sombreada
  moveis.fillRect(APTO.geladeira - 16, Ch - 52, 32, 2); // divisão freezer
  moveis.fillStyle(P.tela, 1);
  moveis.fillRect(APTO.geladeira - 12, Ch - 74, 2, 8);
  moveis.fillRect(APTO.geladeira - 12, Ch - 46, 2, 12); // puxadores
  moveis.fillStyle(C(0xff7aa2), 1);
  moveis.fillRect(APTO.geladeira - 4, Ch - 44, 5, 5); // imã de coração
  moveis.fillStyle(P.branco, 1);
  moveis.fillRect(APTO.geladeira + 2, Ch - 66, 6, 7); // bilhetinho

  // caneca fumegante no balcão (vida ambiente)
  moveis.fillStyle(P.detalhe, 1);
  moveis.fillRect(APTO.balcao - 12, 112, 7, 6);
  moveis.fillRect(APTO.balcao - 4, 114, 2, 3); // asa
  if (animar) {
    scene.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => {
        const v = scene.add
          .rectangle(APTO.balcao - 9 + Phaser.Math.Between(-1, 1), 108, 1, 2, 0xffffff, 0.5)
          .setDepth(-6);
        scene.tweens.add({
          targets: v,
          y: 98,
          alpha: 0,
          duration: 1400,
          ease: "Sine.easeOut",
          onComplete: () => v.destroy(),
        });
      },
    });
  }

  // luminária pendente sobre a sala
  const luminaria = reg(scene.add.graphics().setDepth(-6));
  luminaria.fillStyle(P.rodape, 1);
  luminaria.fillRect(APTO.sofa + 22, 14, 1, 12);
  luminaria.fillStyle(P.detalhe, 1);
  luminaria.fillRect(APTO.sofa + 18, 26, 9, 5);
  const luz = reg(scene.add.rectangle(APTO.sofa + 22, 32, 5, 2, C(0xfff6d0), 0.8).setDepth(-6));
  if (animar) {
    scene.tweens.add({ targets: luz, alpha: 0.4, duration: 1600, yoyo: true, repeat: -1 });
  }

  // ---------- plano 3: móveis de meio (sofá, tapete, planta) ----------
  // tapete listrado
  const tapete = reg(scene.add.graphics().setDepth(-5));
  for (let k = 0; k < 5; k++) {
    tapete.fillStyle(k % 2 === 0 ? P.tapete1 : P.tapete2, 1);
    tapete.fillRect(APTO.sofa - 56 + k * 4, Ch - 4 + k, 112 - k * 8, 4);
  }

  const meio = reg(scene.add.graphics().setDepth(-4));
  // sofá de 2 tons
  meio.fillStyle(P.sofaEscuro, 1);
  meio.fillRect(APTO.sofa - 38, Ch - 60, 10, 40); // braço esq
  meio.fillRect(APTO.sofa + 28, Ch - 60, 10, 40); // braço dir
  meio.fillRect(APTO.sofa - 34, Ch - 66, 68, 30); // encosto
  meio.fillStyle(P.sofaBase, 1);
  meio.fillRect(APTO.sofa - 32, Ch - 64, 64, 26);
  meio.fillRect(APTO.sofa - 28, Ch - 36, 56, 14); // assento
  meio.fillStyle(P.sofaClaro, 1);
  meio.fillRect(APTO.sofa - 28, Ch - 36, 56, 2); // luz no assento
  meio.fillRect(APTO.sofa - 36, Ch - 60, 2, 38);
  meio.fillStyle(P.sofaEscuro, 1);
  meio.fillRect(APTO.sofa - 2, Ch - 36, 2, 14); // vinco das almofadas
  meio.fillStyle(P.madeiraEscura, 1);
  meio.fillRect(APTO.sofa - 34, Ch - 22, 4, 4);
  meio.fillRect(APTO.sofa + 30, Ch - 22, 4, 4); // pés
  // almofadas
  meio.fillStyle(P.almofada, 1);
  meio.fillRect(APTO.sofa - 26, Ch - 48, 14, 11);
  meio.fillStyle(C(0xf08ab0), 1);
  meio.fillRect(APTO.sofa - 26, Ch - 48, 14, 2);
  meio.fillStyle(P.detalhe, 1);
  meio.fillRect(APTO.sofa + 10, Ch - 47, 13, 10);
  meio.fillStyle(C(0xf0cd7a), 1);
  meio.fillRect(APTO.sofa + 10, Ch - 47, 13, 2);

  // planta grande entre a sala e a cozinha
  meio.fillStyle(P.vaso, 1);
  meio.fillRect(APTO.planta - 8, Ch - 22, 16, 12);
  meio.fillStyle(P.madeiraEscura, 1);
  meio.fillRect(APTO.planta - 8, Ch - 12, 16, 2);
  meio.fillStyle(P.planta, 1);
  meio.fillRect(APTO.planta - 2, Ch - 40, 4, 18);
  meio.fillRect(APTO.planta - 12, Ch - 34, 10, 4);
  meio.fillRect(APTO.planta + 2, Ch - 38, 11, 4);
  meio.fillStyle(P.plantaClara, 1);
  meio.fillRect(APTO.planta - 12, Ch - 36, 6, 3);
  meio.fillRect(APTO.planta + 6, Ch - 40, 6, 3);
  meio.fillRect(APTO.planta - 1, Ch - 44, 3, 5);

  // ---------- plano de primeiro: mesa de centro ----------
  const frente = reg(scene.add.graphics().setDepth(24));
  frente.fillStyle(P.madeiraClara, 1);
  frente.fillRect(APTO.sofa - 20, GAME_HEIGHT - 14, 44, 3);
  frente.fillStyle(P.madeira, 1);
  frente.fillRect(APTO.sofa - 20, GAME_HEIGHT - 11, 44, 8);
  frente.fillStyle(P.madeiraEscura, 1);
  frente.fillRect(APTO.sofa - 18, GAME_HEIGHT - 3, 4, 3);
  frente.fillRect(APTO.sofa + 18, GAME_HEIGHT - 3, 4, 3);
  frente.fillStyle(P.detalhe, 1);
  frente.fillRect(APTO.sofa - 4, GAME_HEIGHT - 17, 6, 3); // caneca na mesa
}

/** Janela com moldura + cidade à noite (luzes que piscam se `animar`). */
function criarJanela(
  scene: Phaser.Scene,
  P: PaletaApto,
  C: (cor: number) => number,
  reg: <T extends Phaser.GameObjects.GameObject>(o: T) => T,
  x: number,
  y: number,
  w: number,
  h: number,
  animar: boolean
): void {
  const g = reg(scene.add.graphics().setDepth(-8));
  g.fillStyle(P.rodape, 1);
  g.fillRect(x - 2, y - 2, w + 4, h + 4); // moldura
  g.fillStyle(P.janelaCeu, 1);
  g.fillRect(x, y, w, h);
  g.fillStyle(P.janelaCeu2, 1);
  g.fillRect(x, y, w, Math.floor(h / 3)); // faixa alta do céu
  // lua pequena na janela maior
  if (w > 48) {
    g.fillStyle(C(0xfff3cf), 0.9);
    g.fillRect(x + w - 14, y + 6, 4, 4);
    g.fillRect(x + w - 13, y + 5, 2, 6);
  }
  // skyline
  let bx = x + 2;
  let i = 0;
  while (bx < x + w - 4) {
    const larg = 8 + ((i * 7) % 8);
    const alt = Math.floor(h / 3) + ((i * 11) % Math.floor(h / 4));
    g.fillStyle(P.predio, 1);
    g.fillRect(bx, y + h - alt, Math.min(larg, x + w - bx), alt);
    g.fillStyle(P.janelaAcesa, 0.9);
    for (let wy = y + h - alt + 3; wy < y + h - 3; wy += 6) {
      for (let wx = bx + 2; wx < Math.min(bx + larg, x + w) - 2; wx += 5) {
        if ((wx + wy + i) % 4 < 2) g.fillRect(wx, wy, 1, 2);
      }
    }
    bx += larg + 2;
    i++;
  }
  // travessas da janela
  g.fillStyle(P.rodape, 1);
  g.fillRect(x + Math.floor(w / 2), y, 2, h);
  g.fillRect(x, y + Math.floor(h / 2), w, 2);

  // luzes da cidade piscando (vida ambiente)
  if (animar) {
    for (const [jx, jy, delay] of [
      [x + 8, y + h - 10, 2600],
      [x + w - 12, y + h - 16, 3900],
    ]) {
      const luz = reg(
        scene.add.rectangle(jx, jy, 1, 2, P.janelaAcesa, 0.95).setOrigin(0).setDepth(-8)
      );
      scene.time.addEvent({
        delay,
        loop: true,
        callback: () => luz.setVisible(!luz.visible),
      });
    }
  }
}
