import Phaser from "phaser";
import { DIALOGOS, falaSegura } from "../dialogos";
import { UI, GAME_WIDTH, GAME_HEIGHT, FONT_SM, FONT_MD } from "../ui/constants";
import { fadeIn, fadeToScene } from "../ui/transitions";
import { TouchControls } from "../ui/TouchControls";
import { BoardingPass } from "../ui/BoardingPass";
import { createTextureFromData } from "../sprites/factory";
import { criarTexturaMala, criarTexturaNuvem } from "../ui/effects";
import { atualizarAndar } from "../sprites/anims";
import { RAFITCHO, RAFITCHO_SENTADO_FRAMES, SpriteData } from "../sprites/data";

/**
 * Fase 4 — "O Sonho da Viagem" (Chile)
 * Fase contemplativa: SEM inimigos, SEM timer, SEM game over.
 * Abertura: aeroporto interativo (ela leva a mala até o portão 7) →
 * cutscene do avião (pista → nuvens → Andes pela janela) →
 * 3 cartões-postais (Santiago, Vale do Vinho, Valparaíso), cada um
 * anunciado por um separador de postal (moldura branca + selo + carimbo).
 * Coletáveis: 2 polaroids por local (álbum com 6 slots no HUD).
 * NPCs 100% opcionais; conversar com os 5 desbloqueia a polaroid
 * bônus secreta (7º slot: a foto dos dois com o gato).
 */

const VELOCIDADE = 110; // passeio, não corrida
const CHAO_Y = GAME_HEIGHT - 24;
const PERSONAGEM_Y = CHAO_Y - 24;
const ALCANCE_COLETA = 16;
const ALCANCE_CONVERSA = 26;

// aeroporto (abertura)
const AEROPORTO_LARGURA = 480;
const PORTAO_DIALOGO_X = 396;
const PORTAO_X = 452;

// os 3 cartões-postais
interface LocalDef {
  largura: number;
  fimX: number;
  fotos: Array<{ x: number; indice: number }>;
}
const LOCAIS: LocalDef[] = [
  { largura: 760, fimX: 690, fotos: [{ x: 260, indice: 0 }, { x: 420, indice: 1 }] },
  { largura: 720, fimX: 660, fotos: [{ x: 380, indice: 2 }, { x: 540, indice: 3 }] },
  { largura: 900, fimX: 810, fotos: [{ x: 300, indice: 4 }, { x: 700, indice: 5 }] },
];
const TOTAL_FOTOS = 6;
const TOTAL_NPCS = 5;

// cor dominante da mini-foto de cada polaroid (slots do álbum no HUD)
const CORES_FOTO = [0x8a86a8, 0x8ac8ee, 0xa03460, 0xd9a441, 0xe05a4a, 0xff7aa2, 0xd97b29];
// identidade visual de cada postal: [cor do nome, cor da área interna]
const CORES_POSTAL: Array<[string, number]> = [
  ["#c0392b", 0xcfe4f4],
  ["#7a2244", 0xf8e0c0],
  ["#1f6ab0", 0xcfeaf4],
];

type Etapa =
  | "titulo"
  | "aeroporto"
  | "embarcando"
  | "aviao"
  | "postal"
  | "andando"
  | "conversa"
  | "brinde"
  | "foto"
  | "fim";

interface Foto {
  cont: Phaser.GameObjects.Container;
  glow: Phaser.GameObjects.Image;
  item: Phaser.GameObjects.Image;
  hint: Phaser.GameObjects.Text;
  x: number;
  indice: number;
  coletada: boolean;
}

interface Npc {
  id: string;
  x: number;
  falaY: number;
  falas: string[];
  balao: Phaser.GameObjects.Container;
  hint: Phaser.GameObjects.Text;
  conversado: boolean;
  aoTerminar?: () => void;
}

// ------------------------------------------------------------
// NPCs 32x48 (mesmo esquema da Fase 2: recolor do grid do Rafitcho —
// óculos vira sobrancelha, sem estampa/tatuagem)
// ------------------------------------------------------------

const PESSOA_GRID = RAFITCHO.grid.map((linha, i) => {
  if (i === 11) return linha.replace(/G/g, "k");
  return linha.replace(/G/g, "s").replace(/P/g, "t").replace(/T/g, "t");
});

const PELE_CLARA = { d: "#c68a62", s: "#e0a87c", S: "#f0c49a" };
const PELE_MORENA = { d: "#7d5430", s: "#a5713f", S: "#c08d55" };

function palettePessoa(
  cabelo: [string, string, string],
  pele: { d: string; s: string; S: string },
  camisa: [string, string, string]
): Record<string, string> {
  return {
    k: cabelo[0],
    h: cabelo[1],
    H: cabelo[2],
    ...pele,
    W: "#ffffff",
    I: "#5a3a22",
    p: "#1a0f08",
    M: "#5a2a2a",
    R: "#c96a55",
    o: camisa[0],
    t: camisa[1],
    u: camisa[2],
    j: "#1c2236",
    J: "#2c3854",
    y: "#40507a",
    v: "#6b7080",
    w: "#c2c6d0",
  };
}

const PALETTE_COMPLETOS = palettePessoa(
  ["#241812", "#4a3020", "#6b4a2f"],
  PELE_MORENA,
  ["#7a1f1f", "#b83232", "#d95454"]
);
const PALETTE_TURISTA = palettePessoa(
  ["#5a4318", "#8a6a2f", "#b08d3f"],
  PELE_CLARA,
  ["#8a4a14", "#c47a1f", "#e8a23f"]
);
const PALETTE_VINHO = palettePessoa(
  ["#1a1114", "#2e1d22", "#4a3038"],
  PELE_CLARA,
  ["#4a1428", "#7a2244", "#a03460"]
);
const PALETTE_FILA_A = palettePessoa(
  ["#3f3f4c", "#6a6a78", "#8a8a98"],
  PELE_MORENA,
  ["#1a2a5a", "#31479c", "#4a63c4"]
);
const PALETTE_FILA_B = palettePessoa(
  ["#241812", "#4a3020", "#6b4a2f"],
  PELE_CLARA,
  ["#2a1f4a", "#4a3a80", "#6a55a8"]
);

// violonista: pose sentada do Rafitcho, sem a cadeira (paleta omite os
// chars C/c/E/r), sem óculos e com camisa de couro quente
const VIOLONISTA_FRAMES: SpriteData[] = RAFITCHO_SENTADO_FRAMES.slice(0, 2).map((f) => ({
  palette: { ...RAFITCHO.palette, o: "#4a2410", t: "#7a3d1c", u: "#a05a2c" },
  grid: f.grid.map((linha, i) =>
    i === 11
      ? linha.replace(/G/g, "k")
      : linha.replace(/G/g, "s").replace(/P/g, "t").replace(/T/g, "t")
  ),
}));

// gato laranja de Valparaíso (2 frames: rabo pra cima / pra baixo)
const GATO_PALETTE: Record<string, string> = {
  l: "#8a4515",
  L: "#d97b29",
  f: "#f0a860",
  e: "#7ad858",
  p: "#e05a8a",
};
const GATO_BASE = [
  ".ll..ll.....",
  ".lLllLLl....",
  "lLLLLLLLl...",
  "lLeLLLeLl...",
  "lLLLppLLl...",
];
const GATO_FRAME_A: SpriteData = {
  palette: GATO_PALETTE,
  grid: [
    ...GATO_BASE,
    ".lLLLLLl..ll",
    ".lLLLLLLl.lL",
    ".lLLLLLLllLl",
    ".lLLLLLLl...",
    ".lLfLLfLl...",
    ".ll.ll.ll...",
  ],
};
const GATO_FRAME_B: SpriteData = {
  palette: GATO_PALETTE,
  grid: [
    ...GATO_BASE,
    ".lLLLLLl....",
    ".lLLLLLLl...",
    ".lLLLLLLll..",
    ".lLLLLLLl.l.",
    ".lLfLLfLl.l.",
    ".ll.ll.ll...",
  ],
};

// ------------------------------------------------------------
// Polaroids coletáveis (~20x24): moldura branca com borda inferior
// grande + mini-foto DIFERENTE por local. A inclinação alternada
// (-1/+1 px) vem de 2 texturas com o grid "cisalhado" — pixels duros.
// ------------------------------------------------------------

const POLAROID_PAL: Record<string, string> = {
  F: "#f6f2e8", // moldura branca
  f: "#b9b3a8", // contorno da moldura
  c: "#8ac8ee", // céu
  W: "#ffffff",
  m: "#8a86a8", // rocha
  g: "#4c8a3f", // grama
  G: "#5fa04c",
  a: "#d9a441", // dourado (sol/massa)
  A: "#b8801f",
  s: "#f0c890", // entardecer
  p: "#ff7aa2", // rosa/coração
  b: "#7a92b8", // torre
  d: "#d8c8a8", // toalha/fundo quente
  w: "#8a6240", // madeira/muro
  r: "#a03460", // vinho
  o: "#d97b29", // gato
  l: "#8a4515",
  e: "#7ad858",
  k: "#3a3548", // juntas do muro
  "1": "#e05a4a",
  "2": "#e9b44c",
  "3": "#4fa0d8",
  "4": "#58b868",
  "5": "#b86ac8",
};

// mini-fotos 16x14 (uma por polaroid, na ordem global 0..5 + bônus 6)
const MINIS_POLAROID: string[][] = [
  [
    // 0: os Andes
    "ccccccccccccaacc",
    "cccccccccccaaaac",
    "ccccWcccccccaacc",
    "cccWWWcccccccccc",
    "ccWWWWWccccccccc",
    "cmmWWWmmccWWcccc",
    "cmmmWmmmccWWWccc",
    "mmmmmmmmmcWWWWcc",
    "mmmmmmmmmmmWWmmc",
    "mmmmmmmmmmmmmmmm",
    "mmmmmmmmmmmmmmmm",
    "gmmmmmmmmmmmmmgg",
    "gggggggggggggggg",
    "gggggggggggggggg",
  ],
  [
    // 1: Sky Costanera
    "ccccccccbccccccc",
    "ccccccccbccccccc",
    "cWWccccbbbcccccc",
    "cccccccbbbccWWcc",
    "cccccccbbbcccccc",
    "ccccccbbbbbccccc",
    "ccccccbWbWbccccc",
    "ccccccbbbbbccccc",
    "ccccccbWbWbccccc",
    "ccccccbbbbbccccc",
    "ccccccbWbWbccccc",
    "ccccccbbbbbccccc",
    "mmmmmmbbbbbmmmmm",
    "mmmmmmmmmmmmmmmm",
  ],
  [
    // 2: as taças do brinde
    "ssssssssssssssss",
    "ssssaassssssssss",
    "sssaaaassppsssss",
    "ssssaasssspsssss",
    "sssWrrWssWrrWsss",
    "sssWrrWssWrrWsss",
    "ssssWWssssWWssss",
    "sssssWssssWsssss",
    "sssssWssssWsssss",
    "ssssWWWssWWWssss",
    "gggggggggggggggg",
    "gwggggwggggwgggg",
    "gwggggwggggwgggg",
    "GGGGGGGGGGGGGGGG",
  ],
  [
    // 3: a empanada
    "dddddddddddddddd",
    "ddddddWddddddddd",
    "ddddddddWddddddd",
    "dddddddddddddddd",
    "ddddddaaaadddddd",
    "ddddaaaaaaaadddd",
    "dddaaaaaaaaaaddd",
    "ddAaAaAaAaAaAadd",
    "ddAAAAAAAAAAAAdd",
    "dddddddddddddddd",
    "dwwwwwwwwwwwwwwd",
    "ddwwwwwwwwwwwwdd",
    "dddddddddddddddd",
    "dddddddddddddddd",
  ],
  [
    // 4: as casinhas coloridas
    "cccccccccccccccc",
    "ccccWcWccccccccc",
    "cccccccccccccccc",
    "cc444411113333cc",
    "cc4W441W113W33cc",
    "cc444411113333cc",
    "cc222255551111cc",
    "cc2W2255W51W11cc",
    "cc222255551111cc",
    "cc333344445555cc",
    "cc3W3344W455W5cc",
    "cc333344445555cc",
    "gggggggggggggggg",
    "gggggggggggggggg",
  ],
  [
    // 5: coração sobre a cordilheira ("a gente volta")
    "cccccccccccccccc",
    "cccccppcppcccccc",
    "ccccpppppppccccc",
    "ccccpppppppccccc",
    "cccccpppppcccccc",
    "ccccccpppccccccc",
    "cccccccpcccccccc",
    "cccccccccccccccc",
    "ccWccccccccWcccc",
    "cWWWccccccWWWccc",
    "mmmmmmccmmmmmmcc",
    "mmmmmmmmmmmmmmmm",
    "gggggggggggggggg",
    "gggggggggggggggg",
  ],
  [
    // 6 (bônus): o gato no muro
    "cccccccccccccccc",
    "ccccccpcpccccccc",
    "ccccccpppccccccc",
    "cccccccpcccccccc",
    "ccclccclcccccccc",
    "cccloooolccccccc",
    "cccloeeolccccccc",
    "ccclooooolcccccc",
    "ccloooooolcccccc",
    "ccloooooolcccccc",
    "wwwwwwwwwwwwwwww",
    "wwkwwwwkwwwwkwww",
    "wwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwww",
  ],
];

/** Moldura polaroid 20x24 em volta de uma mini-foto 16x14. */
function gridPolaroid(mini: string[]): string[] {
  const grid: string[] = [];
  grid.push("f".repeat(20));
  grid.push("f" + "F".repeat(18) + "f");
  for (const linha of mini) grid.push("fF" + linha + "Ff");
  for (let i = 0; i < 7; i++) grid.push("f" + "F".repeat(18) + "f"); // borda inferior grande
  grid.push("f".repeat(20));
  return grid;
}

/** Inclinação de ±1px (terço de cima pra um lado, de baixo pro outro). */
function inclinarGrid(grid: string[], dir: 1 | -1): string[] {
  const n = grid.length;
  return grid.map((linha, y) => {
    const dx = y < n / 3 ? dir : y >= (2 * n) / 3 ? -dir : 0;
    if (dx === 1) return ".." + linha;
    if (dx === -1) return linha + "..";
    return "." + linha + ".";
  });
}

export class Fase4Viagem extends Phaser.Scene {
  private gabitcha!: Phaser.Physics.Arcade.Sprite;
  private rafitcho!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private teclasAD!: { A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private espaco!: Phaser.Input.Keyboard.Key;
  private touch!: TouchControls;

  private etapa: Etapa = "titulo";
  private paradaMs = 0;
  private localAtual = -1;
  private portaoIniciado = false;

  private fotos: Foto[] = [];
  private npcs: Npc[] = [];
  private coletadas: boolean[] = [];
  private bonusGanho = false;
  private conversas = new Set<string>();
  private fotoFrameA = true;

  private objsSeg: Phaser.GameObjects.GameObject[] = [];
  private timersSeg: Phaser.Time.TimerEvent[] = [];

  private albumG!: Phaser.GameObjects.Graphics;
  private malaGab: Phaser.GameObjects.Image | null = null;
  private malaRaf: Phaser.GameObjects.Image | null = null;

  private balaoAtual: {
    cont: Phaser.GameObjects.Container;
    timer: Phaser.Time.TimerEvent;
  } | null = null;

  constructor() {
    super("Fase4Viagem");
  }

  create(): void {
    this.etapa = "titulo";
    this.paradaMs = 0;
    this.localAtual = -1;
    this.portaoIniciado = false;
    this.fotos = [];
    this.npcs = [];
    this.coletadas = new Array(TOTAL_FOTOS + 1).fill(false);
    this.bonusGanho = false;
    this.conversas = new Set();
    this.objsSeg = [];
    this.timersSeg = [];
    this.balaoAtual = null;
    this.malaGab = null;
    this.malaRaf = null;

    fadeIn(this);
    this.criarTexturas();

    // os dois viajam juntos: ela joga, ele acompanha
    this.gabitcha = this.physics.add.sprite(48, PERSONAGEM_Y, "gabitcha");
    (this.gabitcha.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.gabitcha.setCollideWorldBounds(true);
    this.gabitcha.setDepth(20);
    this.rafitcho = this.add.sprite(22, PERSONAGEM_Y, "rafitcho").setDepth(19);

    this.cameras.main.startFollow(this.gabitcha, true, 0.08, 0.08);
    this.cameras.main.followOffset.set(-40, 0);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.teclasAD = this.input.keyboard!.addKeys("A,D") as {
      A: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
    };
    this.espaco = this.input.keyboard!.addKey("SPACE");
    this.touch = new TouchControls(this);

    this.criarAeroporto();

    // HUD do álbum (6 slots de polaroid; o 7º só aparece com o bônus)
    this.add
      .text(GAME_WIDTH - 4, 4, DIALOGOS.fase4.albumHud, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(50);
    this.albumG = this.add.graphics().setScrollFactor(0).setDepth(50);
    this.desenharAlbumHud();

    new BoardingPass(this).mostrar(
      {
        embarque: DIALOGOS.fase4.embarque,
        rota: DIALOGOS.fase4.rota,
        passageiros: DIALOGOS.fase4.passageiros,
        carimbo: DIALOGOS.fase4.carimbo,
      },
      () => this.iniciarAeroporto()
    );
  }

  // ---------- helpers de registro (limpos a cada troca de cenário) ----------

  private reg<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.objsSeg.push(obj);
    return obj;
  }

  private regTimer(t: Phaser.Time.TimerEvent): Phaser.Time.TimerEvent {
    this.timersSeg.push(t);
    return t;
  }

  private limparSegmento(): void {
    this.fecharBalaoTexto();
    for (const t of this.timersSeg) t.remove();
    this.timersSeg = [];
    for (const o of this.objsSeg) {
      this.tweens.killTweensOf(o);
      o.destroy();
    }
    this.objsSeg = [];
    this.fotos = [];
    this.npcs = [];
    this.malaGab = null;
    this.malaRaf = null;
  }

  // ---------- abertura 1: o aeroporto ----------

  private iniciarAeroporto(): void {
    this.etapa = "aeroporto";
    const dica = this.reg(
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT - 8, DIALOGOS.fase4.aeroporto.dica, {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: UI.texto,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(50)
        .setAlpha(0.7)
    );
    this.tweens.add({ targets: dica, alpha: 0.25, duration: 600, yoyo: true, repeat: -1 });
    this.time.delayedCall(5000, () => dica.destroy());
  }

  private criarAeroporto(): void {
    this.physics.world.setBounds(0, 0, AEROPORTO_LARGURA, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, AEROPORTO_LARGURA, GAME_HEIGHT);

    const g = this.reg(this.add.graphics().setDepth(-8));
    // parede e teto do saguão
    g.fillStyle(0x262b4a, 1);
    g.fillRect(0, 0, AEROPORTO_LARGURA, CHAO_Y + 2);
    g.fillStyle(0x1d2140, 1);
    g.fillRect(0, 0, AEROPORTO_LARGURA, 20);
    g.fillStyle(0x4fd6c4, 0.5);
    g.fillRect(0, 20, AEROPORTO_LARGURA, 1); // friso teal
    // piso com placas
    g.fillStyle(0x30364f, 1);
    g.fillRect(0, CHAO_Y + 2, AEROPORTO_LARGURA, GAME_HEIGHT - CHAO_Y - 2);
    g.fillStyle(0x262b4a, 1);
    for (let px = 0; px < AEROPORTO_LARGURA; px += 24) g.fillRect(px, CHAO_Y + 2, 1, 22);
    g.fillStyle(0x3a4266, 1);
    g.fillRect(0, CHAO_Y + 2, AEROPORTO_LARGURA, 1);

    // janelões: noite lá fora, avião parado na pista
    g.fillStyle(0x4a5178, 1);
    g.fillRect(16, 28, 216, 78);
    g.fillStyle(0x0d1020, 1);
    g.fillRect(18, 30, 212, 74);
    // estrelas
    g.fillStyle(0xffffff, 0.8);
    for (let i = 0; i < 14; i++) g.fillRect(24 + ((i * 41) % 200), 34 + ((i * 17) % 28), 1, 1);
    // pista + luzes azuis
    g.fillStyle(0x161a2c, 1);
    g.fillRect(18, 86, 212, 18);
    g.fillStyle(0x4fd6c4, 0.9);
    for (let px = 26; px < 226; px += 18) g.fillRect(px, 94, 2, 1);
    // avião parado (perfil, portas fechadas, janelinhas acesas)
    g.fillStyle(0x9aa2b8, 1);
    g.fillRect(64, 66, 104, 14);
    g.fillRect(166, 68, 8, 8); // nariz
    g.fillStyle(0x7a86a4, 1);
    g.fillRect(64, 76, 104, 4); // barriga sombreada
    g.fillStyle(0x4fd6c4, 1);
    g.fillRect(58, 48, 10, 20); // cauda
    g.fillRect(96, 80, 30, 5); // asa
    g.fillStyle(0xe9b44c, 1);
    for (let px = 76; px < 160; px += 8) g.fillRect(px, 70, 2, 2); // janelinhas acesas
    // torre de controle ao fundo
    g.fillStyle(0x3a4266, 1);
    g.fillRect(206, 46, 4, 40);
    g.fillRect(200, 38, 16, 10);
    const luzTorre = this.reg(this.add.rectangle(208, 36, 2, 2, 0xe05a4a).setDepth(-7));
    this.tweens.add({ targets: luzTorre, alpha: 0.15, duration: 700, yoyo: true, repeat: -1 });
    // colunas entre os janelões
    g.fillStyle(0x1d2140, 1);
    for (const cx of [86, 158]) g.fillRect(cx, 28, 5, 78);

    // painel de voos com efeito de placas girando (split-flap)
    g.fillStyle(0x4a5178, 1);
    g.fillRect(228, 26, 144, 40);
    g.fillStyle(0x0b0d1a, 1);
    g.fillRect(230, 28, 140, 36);
    const painelVoo = this.reg(
      this.add
        .text(300, 38, DIALOGOS.fase4.aeroporto.painelVoo, {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: UI.douradoYuumitcha,
        })
        .setOrigin(0.5)
        .setDepth(-7)
    );
    const painelStatus = this.reg(
      this.add
        .text(300, 52, DIALOGOS.fase4.aeroporto.painelStatus, {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: "#58c86a",
        })
        .setOrigin(0.5)
        .setDepth(-7)
    );
    this.tweens.add({ targets: painelStatus, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
    this.regTimer(
      this.time.addEvent({
        delay: 3200,
        loop: true,
        callback: () => this.girarPlacas(painelVoo, DIALOGOS.fase4.aeroporto.painelVoo),
      })
    );

    // esteira de malas
    g.fillStyle(0x11131f, 1);
    g.fillRect(240, 136, 120, 12);
    g.fillStyle(0x2c3160, 1);
    g.fillRect(240, 136, 120, 2);
    g.fillStyle(0x4a5178, 1);
    for (let px = 246; px < 356; px += 10) g.fillRect(px, 150, 2, 2); // rolos
    for (let i = 0; i < 2; i++) {
      const malaEsteira = this.reg(this.add.image(350 - i * 56, 130, "mala").setDepth(-6));
      this.tweens.add({
        targets: malaEsteira,
        x: 246,
        duration: 4200,
        delay: i * 900,
        repeat: -1,
        onRepeat: () => malaEsteira.setX(354),
      });
    }

    // fila de embarque (2 NPCs de fundo)
    this.reg(this.add.image(382, PERSONAGEM_Y - 2, "filaA").setDepth(12));
    this.reg(this.add.image(406, PERSONAGEM_Y - 2, "filaB").setDepth(13));

    // portão 7
    g.fillStyle(0x11131f, 1);
    g.fillRect(444, 102, 22, 54); // abertura escura
    g.fillStyle(0x2c7f7a, 1);
    g.fillRect(438, 100, 6, 56);
    g.fillRect(466, 100, 6, 56);
    g.fillRect(438, 94, 34, 8); // batentes + verga
    g.fillStyle(0x4fd6c4, 1);
    g.fillRect(438, 94, 34, 1);
    const placaPortao = this.reg(
      this.add.rectangle(430, 80, 92, 14, 0x2c7f7a).setDepth(-6).setStrokeStyle(1, 0xffffff)
    );
    const textoPortao = this.reg(
      this.add
        .text(426, 80, DIALOGOS.fase4.aeroporto.portao, {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: "#ffffff",
        })
        .setOrigin(0.5)
        .setDepth(-5)
    );
    this.tweens.add({
      targets: [placaPortao, textoPortao],
      x: "+=2",
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // malas de rodinha dos dois
    this.malaGab = this.reg(
      this.add.image(this.gabitcha.x - 14, PERSONAGEM_Y + 17, "malaRodinha").setDepth(19)
    );
    this.malaRaf = this.reg(
      this.add.image(this.rafitcho.x - 14, PERSONAGEM_Y + 17, "malaRodinha").setDepth(18)
    );
  }

  /** Split-flap: as letras "giram" antes de assentar no texto final. */
  private girarPlacas(t: Phaser.GameObjects.Text, textoFinal: string): void {
    const POOL = "ABCDEFGHJKLMNPQRSTUVXYZ0123456789";
    let tick = 0;
    const ev = this.time.addEvent({
      delay: 50,
      repeat: 11,
      callback: () => {
        if (!t.active) {
          ev.remove();
          return;
        }
        tick++;
        let saida = "";
        for (let i = 0; i < textoFinal.length; i++) {
          const ch = textoFinal[i];
          if (ch === " " || ch === "→" || i < tick - 3) saida += ch;
          else saida += POOL[Phaser.Math.Between(0, POOL.length - 1)];
        }
        t.setText(tick > 11 ? textoFinal : saida);
      },
    });
    this.regTimer(ev);
  }

  private dialogoPortao(): void {
    this.portaoIniciado = true;
    this.etapa = "conversa";
    this.gabitcha.setVelocityX(0);
    atualizarAndar(this.gabitcha, "gabitcha", false);
    atualizarAndar(this.rafitcho, "rafitcho", false);

    const falas = DIALOGOS.fase4.aeroporto.falas;
    const falar = (i: number) => {
      if (i >= falas.length) {
        this.embarcar();
        return;
      }
      const ehGab = i !== 1; // gab, raf, gab
      const quem = ehGab ? this.gabitcha : this.rafitcho;
      this.mostrarBalaoTexto(quem.x, quem.y - 24, falaSegura(falas[i]), 2600, 200);
      this.time.delayedCall(2700, () => falar(i + 1));
    };
    falar(0);
  }

  private embarcar(): void {
    this.etapa = "embarcando";
    atualizarAndar(this.gabitcha, "gabitcha", true);
    atualizarAndar(this.rafitcho, "rafitcho", true);
    const grupos: Array<[Phaser.GameObjects.GameObject[], number]> = [
      [[this.gabitcha, ...(this.malaGab ? [this.malaGab] : [])], 0],
      [[this.rafitcho, ...(this.malaRaf ? [this.malaRaf] : [])], 250],
    ];
    for (const [alvos, atraso] of grupos) {
      this.tweens.add({ targets: alvos, x: PORTAO_X, duration: 1200, delay: atraso, ease: "Sine.easeInOut" });
      this.tweens.add({ targets: alvos, alpha: 0, duration: 400, delay: atraso + 700 });
    }
    this.time.delayedCall(1700, () => {
      this.cameras.main.fadeOut(450, 16, 18, 35);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.limparSegmento();
        this.cutsceneAviao();
      });
    });
  }

  // ---------- abertura 2: o avião (pista → nuvens → Andes) ----------

  private cutsceneAviao(): void {
    this.etapa = "aviao";
    this.cameras.main.stopFollow();
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.fadeIn(400, 16, 18, 35);

    // cabine de perfil
    const g = this.reg(this.add.graphics().setDepth(-8));
    g.fillStyle(0xc4c8d8, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0xd0d4e0, 1);
    g.fillRect(0, 0, GAME_WIDTH, 22); // teto
    g.fillStyle(0x9aa2b8, 1);
    g.fillRect(0, 22, GAME_WIDTH, 3); // bagageiro
    g.fillStyle(0x7a86a4, 1);
    for (let px = 12; px < GAME_WIDTH; px += 46) g.fillRect(px, 12, 8, 2); // trincos
    g.fillStyle(0x2c3040, 1);
    g.fillRect(0, 150, GAME_WIDTH, 30); // piso
    g.fillStyle(0x4fd6c4, 0.35);
    g.fillRect(0, 150, GAME_WIDTH, 2); // faixa do corredor

    // janela GRANDE
    g.fillStyle(0x9aa2b8, 1);
    g.fillRect(198, 34, 104, 86);
    g.fillStyle(0xe8ecf4, 1);
    g.fillRect(200, 36, 100, 82);
    g.fillStyle(0x11131f, 1);
    g.fillRect(206, 42, 88, 70); // vão da janela (a vista entra aqui)
    // cantos "arredondados" em degraus
    g.fillStyle(0xe8ecf4, 1);
    g.fillRect(206, 42, 2, 2);
    g.fillRect(292, 42, 2, 2);
    g.fillRect(206, 110, 2, 2);
    g.fillRect(292, 110, 2, 2);

    // vista pela janela (container mascarado)
    const mascara = this.make.graphics({ x: 0, y: 0 });
    mascara.fillStyle(0xffffff, 1);
    mascara.fillRect(208, 44, 84, 66);
    const vista = this.reg(this.add.container(0, 0).setDepth(-6));
    vista.setMask(mascara.createGeometryMask());

    // fase 1 — pista correndo (noite)
    const noite = this.add.rectangle(250, 77, 84, 66, 0x0d1020);
    vista.add(noite);
    for (let i = 0; i < 8; i++) {
      const estrela = this.add.rectangle(214 + ((i * 29) % 76), 48 + ((i * 13) % 22), 1, 1, 0xffffff, 0.9);
      vista.add(estrela);
    }
    const pista = this.add.rectangle(250, 100, 84, 22, 0x161a2c);
    vista.add(pista);
    const luzesPista = this.regTimer(
      this.time.addEvent({
        delay: 130,
        loop: true,
        callback: () => {
          const luz = this.add.rectangle(292, 98, 3, 2, 0xe9b44c);
          vista.add(luz);
          this.tweens.add({
            targets: luz,
            x: 206,
            duration: 340,
            onComplete: () => luz.destroy(),
          });
        },
      })
    );
    // trepidação da decolagem
    const trepidacao = this.regTimer(
      this.time.addEvent({
        delay: 420,
        repeat: 5,
        callback: () => this.cameras.main.shake(90, 0.0008),
      })
    );

    // os dois sentados (encostos atrás, assento na frente cobre as pernas)
    for (const sx of [88, 136]) {
      g.fillStyle(0x1f5a54, 1);
      g.fillRect(sx - 26, 92, 10, 64); // encosto
      g.fillStyle(0x2c7f7a, 1);
      g.fillRect(sx - 25, 92, 8, 64);
      g.fillStyle(0xf2f0f7, 1);
      g.fillRect(sx - 25, 92, 8, 6); // apoio de cabeça
    }
    this.rafitcho.setVisible(true).setAlpha(1).setFlipX(false).setPosition(88, 116).setDepth(20);
    this.gabitcha.setVisible(true).setAlpha(1).setFlipX(false).setPosition(136, 116);
    this.gabitcha.setVelocity(0, 0);
    atualizarAndar(this.gabitcha, "gabitcha", false); // respiração sentados
    atualizarAndar(this.rafitcho, "rafitcho", false);
    const assentos = this.reg(this.add.graphics().setDepth(22));
    for (const sx of [88, 136]) {
      assentos.fillStyle(0x2c7f7a, 1);
      assentos.fillRect(sx - 18, 132, 42, 24); // assento cobre as pernas
      assentos.fillStyle(0x1f5a54, 1);
      assentos.fillRect(sx - 18, 132, 42, 2);
    }

    // aviso de cinto (aparece no pouso)
    const cinto = this.reg(
      this.add.container(GAME_WIDTH / 2, 12, [
        this.add.rectangle(0, 0, 168, 14, 0x0b0d1a).setStrokeStyle(1, 0xe9b44c),
        this.add
          .text(0, 0, DIALOGOS.fase4.aviao.aviso, {
            fontFamily: UI.fonte,
            fontSize: FONT_SM,
            color: UI.douradoYuumitcha,
          })
          .setOrigin(0.5),
      ])
    );
    cinto.setDepth(30).setVisible(false);

    // fase 2 — nuvens em parallax (amanhecer)
    const amanhecer = this.add.rectangle(250, 77, 84, 66, 0xe89ab0).setAlpha(0);
    vista.add(amanhecer);
    this.time.delayedCall(2600, () => {
      luzesPista.remove();
      trepidacao.remove();
      this.tweens.add({ targets: amanhecer, alpha: 1, duration: 900 });
      this.tweens.add({ targets: pista, y: 140, duration: 900 }); // a pista some pra baixo
      this.regTimer(
        this.time.addEvent({
          delay: 620,
          repeat: 6,
          callback: () => {
            const rapida = Math.random() < 0.5;
            const nuvem = this.add
              .image(308, Phaser.Math.Between(50, 102), "nuvem")
              .setAlpha(rapida ? 0.95 : 0.6);
            vista.add(nuvem);
            this.tweens.add({
              targets: nuvem,
              x: 192,
              duration: rapida ? 1700 : 2900,
              onComplete: () => nuvem.destroy(),
            });
          },
        })
      );
    });

    // balões (um por vez, os já escritos)
    this.time.delayedCall(3400, () =>
      this.mostrarBalaoTexto(136, 94, falaSegura(DIALOGOS.fase4.aviao.falas[0]), 2200, 200)
    );
    this.time.delayedCall(5800, () =>
      this.mostrarBalaoTexto(88, 94, falaSegura(DIALOGOS.fase4.aviao.falas[1]), 2200, 200)
    );

    // fase 3 — a CORDILHEIRA (o momento "uau")
    const andes = this.add.container(40, 0).setAlpha(0);
    const dia = this.add.rectangle(250, 77, 164, 66, 0x8ac8ee);
    const ga = this.add.graphics();
    ga.fillStyle(0xf0e6b8, 1);
    ga.fillCircle(280, 56, 6); // sol
    for (let i = 0; i < 5; i++) {
      const cx = 196 + i * 32;
      const topo = 62 + ((i * 19) % 18);
      ga.fillStyle(0x8a86a8, 1);
      ga.fillTriangle(cx - 24, 112, cx + 24, 112, cx, topo);
      ga.fillStyle(0xf2f6fc, 1);
      const meia = Math.round((24 * 9) / (112 - topo));
      ga.fillTriangle(cx - meia, topo + 9, cx + meia, topo + 9, cx, topo);
    }
    andes.add([dia, ga]);
    vista.add(andes);
    this.time.delayedCall(6600, () => {
      this.tweens.add({ targets: andes, alpha: 1, duration: 800 });
      this.tweens.add({ targets: andes, x: -20, duration: 3600, ease: "Sine.easeInOut" });
    });

    // pouso: chacoalhada sutil + aviso de cinto
    this.time.delayedCall(9700, () => {
      this.cameras.main.shake(180, 0.0015);
      cinto.setVisible(true);
      this.tweens.add({ targets: cinto, alpha: 0.25, duration: 260, yoyo: true, repeat: 3 });
    });

    // fade para o primeiro cartão-postal
    this.time.delayedCall(10800, () => {
      this.cameras.main.fadeOut(420, 16, 18, 35);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        mascara.destroy();
        this.limparSegmento();
        this.montarLocal(0);
        this.cameras.main.fadeIn(300, 16, 18, 35);
        this.mostrarPostal(0);
      });
    });
  }

  // ---------- cartões-postais: montagem e separador ----------

  private montarLocal(i: number): void {
    this.localAtual = i;
    const local = LOCAIS[i];
    this.physics.world.setBounds(0, 0, local.largura, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, local.largura, GAME_HEIGHT);

    this.gabitcha.setVisible(true).setAlpha(1).setFlipX(false).setPosition(34, PERSONAGEM_Y);
    this.gabitcha.setVelocity(0, 0);
    this.rafitcho
      .setVisible(true)
      .setAlpha(1)
      .setFlipX(false)
      .setPosition(12, PERSONAGEM_Y)
      .setDepth(19);

    this.cameras.main.startFollow(this.gabitcha, true, 0.08, 0.08);
    this.cameras.main.followOffset.set(-40, 0);
    this.cameras.main.centerOn(this.gabitcha.x + 40, GAME_HEIGHT / 2);

    if (i === 0) this.criarCenarioSantiago();
    else if (i === 1) this.criarCenarioVinhedo();
    else this.criarCenarioValparaiso();

    this.criarFotosDoLocal(local.fotos);

    // as polaroids balançam penduradas: alterna a inclinação -1/+1 px
    this.regTimer(
      this.time.addEvent({
        delay: 420,
        loop: true,
        callback: () => {
          this.fotoFrameA = !this.fotoFrameA;
          const sufixo = this.fotoFrameA ? "a" : "b";
          for (const f of this.fotos) {
            if (!f.coletada && f.item.active) f.item.setTexture(`polaroid${f.indice}_${sufixo}`);
          }
        },
      })
    );
  }

  /** Separador: a tela vira um cartão-postal que "vira" revelando o cenário. */
  private mostrarPostal(i: number): void {
    this.etapa = "postal";
    this.gabitcha.setVelocityX(0);
    atualizarAndar(this.gabitcha, "gabitcha", false);
    atualizarAndar(this.rafitcho, "rafitcho", false);

    const fundo = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, UI.fundoNoite, 1)
      .setScrollFactor(0)
      .setDepth(180);

    const W = 272;
    const H = 136;
    const [corNome, corArea] = CORES_POSTAL[i];
    const g = this.add.graphics();
    g.fillStyle(0x0b0d1a, 0.6);
    g.fillRect(-W / 2 + 3, -H / 2 + 3, W, H); // sombra dura
    g.fillStyle(0xb9b3a8, 1);
    g.fillRect(-W / 2, -H / 2, W, H);
    g.fillStyle(0xf6f2e8, 1);
    g.fillRect(-W / 2 + 1, -H / 2 + 1, W - 2, H - 2); // moldura branca
    g.fillStyle(corArea, 1);
    g.fillRect(-W / 2 + 12, -H / 2 + 12, W - 24, H - 24); // área interna
    this.desenharMotivoPostal(g, i, W, H);

    // selo (bandeira do Chile) com serrilha + carimbo postal
    const seloX = W / 2 - 36;
    const seloY = -H / 2 + 18;
    g.fillStyle(0xf6f2e8, 1);
    g.fillRect(seloX, seloY, 28, 22);
    g.fillStyle(corArea, 1);
    for (let px = seloX; px <= seloX + 28; px += 4) {
      g.fillRect(px, seloY - 1, 2, 2);
      g.fillRect(px, seloY + 21, 2, 2); // picote da serrilha
    }
    for (let py = seloY; py <= seloY + 22; py += 4) {
      g.fillRect(seloX - 1, py, 2, 2);
      g.fillRect(seloX + 27, py, 2, 2);
    }
    const selo = this.add.image(seloX + 14, seloY + 11, "bandeiraChile");
    g.fillStyle(0x4a4a58, 0.75);
    this.anelPixel(g, seloX - 6, seloY + 20, 11, 9); // carimbo redondo
    for (let k = 0; k < 3; k++) g.fillRect(seloX - 34, seloY + 14 + k * 5, 18, 1); // ondinhas

    const sombraNome = this.add
      .text(2, -4, falaSegura(DIALOGOS.fase4.postais[i].nome), {
        fontFamily: UI.fonte,
        fontSize: FONT_MD,
        color: "#3a3a4a",
      })
      .setOrigin(0.5)
      .setAlpha(0.4);
    const nome = this.add
      .text(0, -6, falaSegura(DIALOGOS.fase4.postais[i].nome), {
        fontFamily: UI.fonte,
        fontSize: FONT_MD,
        color: corNome,
      })
      .setOrigin(0.5);

    const cont = this.add
      .container(GAME_WIDTH / 2, GAME_HEIGHT / 2, [g, selo, sombraNome, nome])
      .setScrollFactor(0)
      .setDepth(181)
      .setScale(0.8)
      .setAlpha(0);
    this.tweens.add({ targets: cont, scale: 1, alpha: 1, duration: 160, ease: "Back.easeOut" });

    // o postal "vira" (flip) revelando o cenário
    this.time.delayedCall(1450, () => {
      this.tweens.add({
        targets: cont,
        scaleX: 0, // tween transitório de animação (flip)
        duration: 240,
        ease: "Sine.easeIn",
        onComplete: () => cont.destroy(),
      });
      this.tweens.add({
        targets: fundo,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          fundo.destroy();
          this.etapa = "andando";
          this.paradaMs = 0;
          this.mostrarPlacaLocal(i);
          if (i === 0) this.mostrarDicaPasseio();
        },
      });
    });
  }

  /** Faixa ilustrada na base da área interna do postal. */
  private desenharMotivoPostal(g: Phaser.GameObjects.Graphics, i: number, W: number, H: number): void {
    const base = H / 2 - 12;
    if (i === 0) {
      // cordilheira
      for (let k = 0; k < 6; k++) {
        const cx = -W / 2 + 34 + k * 42;
        g.fillStyle(0x8a86a8, 1);
        g.fillTriangle(cx - 22, base, cx + 22, base, cx, base - 26 - ((k * 7) % 10));
        g.fillStyle(0xf2f6fc, 1);
        const topo = base - 26 - ((k * 7) % 10);
        g.fillTriangle(cx - 6, topo + 8, cx + 6, topo + 8, cx, topo);
      }
    } else if (i === 1) {
      // colinas com fileiras de parreira
      g.fillStyle(0x7a9048, 1);
      g.fillRect(-W / 2 + 12, base - 18, W - 24, 18);
      g.fillStyle(0x5a7038, 1);
      for (let px = -W / 2 + 22; px < W / 2 - 20; px += 18) g.fillRect(px, base - 14, 2, 14);
      g.fillStyle(0xa03460, 1);
      for (let px = -W / 2 + 20; px < W / 2 - 20; px += 18) g.fillRect(px, base - 10, 6, 2);
    } else {
      // casinhas coloridas
      const cores = [0xe05a4a, 0xe9b44c, 0x4fa0d8, 0x58b868, 0xb86ac8];
      let px = -W / 2 + 14;
      let k = 0;
      while (px < W / 2 - 30) {
        const larg = 18 + ((k * 7) % 8);
        const alt = 16 + ((k * 11) % 10);
        g.fillStyle(cores[k % cores.length], 1);
        g.fillRect(px, base - alt, larg, alt);
        g.fillStyle(0xf6f2e8, 0.9);
        g.fillRect(px + 3, base - alt + 4, 3, 4);
        px += larg + 3;
        k++;
      }
    }
  }

  /** Anel de carimbo desenhado por varredura (círculo em pixels duros). */
  private anelPixel(g: Phaser.GameObjects.Graphics, cx: number, cy: number, rFora: number, rDentro: number): void {
    for (let dy = -rFora; dy <= rFora; dy++) {
      const wFora = Math.floor(Math.sqrt(rFora * rFora - dy * dy));
      const wDentro =
        Math.abs(dy) <= rDentro ? Math.floor(Math.sqrt(rDentro * rDentro - dy * dy)) : -1;
      if (wDentro < 0) {
        g.fillRect(cx - wFora, cy + dy, wFora * 2 + 1, 1);
      } else {
        g.fillRect(cx - wFora, cy + dy, wFora - wDentro, 1);
        g.fillRect(cx + wDentro + 1, cy + dy, wFora - wDentro, 1);
      }
    }
  }

  /** Mini-placa no HUD com o objetivo local ("Santiago — 2 fotos"). */
  private mostrarPlacaLocal(i: number): void {
    const texto = this.add
      .text(9, 25, falaSegura(DIALOGOS.fase4.postais[i].placa), {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
        lineSpacing: 3,
      })
      .setScrollFactor(0)
      .setDepth(50);
    const fundo = this.add
      .rectangle(4, 20, texto.width + 10, texto.height + 10, 0x1d2140, 0.88)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(49)
      .setStrokeStyle(1, 0x4fd6c4);
    this.time.delayedCall(3800, () => {
      this.tweens.add({
        targets: [texto, fundo],
        alpha: 0,
        duration: 400,
        onComplete: () => {
          texto.destroy();
          fundo.destroy();
        },
      });
    });
  }

  private mostrarDicaPasseio(): void {
    const dica = this.reg(
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT - 8, DIALOGOS.fase4.dica, {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: UI.texto,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(50)
        .setAlpha(0.7)
    );
    this.tweens.add({ targets: dica, alpha: 0.25, duration: 600, yoyo: true, repeat: -1 });
    this.time.delayedCall(5000, () => dica.destroy());
  }

  // ---------- loop ----------

  update(_time: number, delta: number): void {
    if (this.etapa !== "andando" && this.etapa !== "aeroporto") {
      this.gabitcha?.setVelocityX(0);
      return;
    }

    const esquerda = this.cursors.left.isDown || this.teclasAD.A.isDown || this.touch.esquerda;
    const direita = this.cursors.right.isDown || this.teclasAD.D.isDown || this.touch.direita;
    const andando = esquerda || direita;

    if (esquerda) {
      this.gabitcha.setVelocityX(-VELOCIDADE);
      this.gabitcha.setFlipX(true);
    } else if (direita) {
      this.gabitcha.setVelocityX(VELOCIDADE);
      this.gabitcha.setFlipX(false);
    } else {
      this.gabitcha.setVelocityX(0);
    }
    this.paradaMs = andando ? 0 : this.paradaMs + delta;

    // ciclo de caminhada de verdade (frames em vez de bob)
    this.gabitcha.y = PERSONAGEM_Y;
    atualizarAndar(this.gabitcha, "gabitcha", andando);

    // o Rafitcho acompanha, um passinho atrás
    const alvoRaf = this.gabitcha.x + (this.gabitcha.flipX ? 26 : -26);
    this.rafitcho.x += (alvoRaf - this.rafitcho.x) * 0.08;
    this.rafitcho.setFlipX(this.rafitcho.x > this.gabitcha.x);
    const rafAndando = Math.abs(alvoRaf - this.rafitcho.x) > 3;
    this.rafitcho.y = PERSONAGEM_Y;
    atualizarAndar(this.rafitcho, "rafitcho", rafAndando);

    if (this.etapa === "aeroporto") {
      // malas de rodinha seguem os dois
      this.malaGab?.setPosition(
        this.gabitcha.x + (this.gabitcha.flipX ? 14 : -14),
        this.gabitcha.y + 17
      );
      this.malaRaf?.setPosition(
        this.rafitcho.x + (this.rafitcho.flipX ? 14 : -14),
        this.rafitcho.y + 17
      );
      if (this.gabitcha.x >= PORTAO_DIALOGO_X && !this.portaoIniciado) this.dialogoPortao();
      return;
    }

    // fotos: hint por proximidade + coleta (ESPAÇO ou parar em cima)
    const coletando = this.espaco.isDown || this.paradaMs > 300;
    for (const f of this.fotos) {
      if (f.coletada) continue;
      const perto = Math.abs(this.gabitcha.x - f.x) < ALCANCE_COLETA;
      f.glow.setVisible(perto);
      f.hint.setVisible(perto);
      if (perto && coletando) {
        this.abrirFoto(f);
        return;
      }
    }

    // NPCs: "..." vira convite ao se aproximar
    const conversando = this.espaco.isDown || this.paradaMs > 450;
    for (const npc of this.npcs) {
      if (npc.conversado) continue;
      const perto = Math.abs(this.gabitcha.x - npc.x) < ALCANCE_CONVERSA;
      npc.balao.setVisible(!perto);
      npc.hint.setVisible(perto);
      if (perto && conversando) {
        this.conversar(npc);
        return;
      }
    }

    // fim do cartão-postal atual
    if (this.localAtual >= 0 && this.gabitcha.x >= LOCAIS[this.localAtual].fimX) {
      if (this.localAtual >= LOCAIS.length - 1) this.finalizar();
      else this.proximoLocal();
    }
  }

  private proximoLocal(): void {
    const proximo = this.localAtual + 1;
    this.etapa = "postal";
    this.gabitcha.setVelocityX(0);
    this.limparSegmento();
    this.montarLocal(proximo);
    this.mostrarPostal(proximo);
  }

  // ---------- polaroids ----------

  private criarFotosDoLocal(defs: Array<{ x: number; indice: number }>): void {
    for (const def of defs) {
      const glow = this.add.image(0, 0, "fotoGlow").setVisible(false);
      const item = this.add.image(0, 0, `polaroid${def.indice}_a`);
      const cont = this.reg(this.add.container(def.x, 116, [glow, item]).setDepth(6));
      this.tweens.add({
        targets: cont,
        y: 113,
        duration: 700 + def.indice * 80,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      // cintilo no canto da foto
      const cintilo = this.add.rectangle(-5, -7, 1, 1, 0xffffff).setAlpha(0.9);
      cont.add(cintilo);
      this.tweens.add({
        targets: cintilo,
        alpha: 0.1,
        duration: 500,
        yoyo: true,
        repeat: -1,
        delay: def.indice * 130,
      });
      const hint = this.reg(
        this.add
          .text(def.x, 92, DIALOGOS.fase4.hintFoto, {
            fontFamily: UI.fonte,
            fontSize: FONT_SM,
            color: UI.douradoYuumitcha,
          })
          .setOrigin(0.5)
          .setDepth(7)
          .setVisible(false)
      );
      this.fotos.push({ cont, glow, item, hint, x: def.x, indice: def.indice, coletada: false });
    }
  }

  /** Flash branco de 2 frames: a foto foi TIRADA. */
  private flashTela(): void {
    const flash = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 1)
      .setScrollFactor(0)
      .setDepth(250);
    this.time.delayedCall(90, () => flash.destroy());
  }

  private abrirFoto(foto: Foto): void {
    foto.coletada = true;
    foto.hint.destroy();
    this.tweens.killTweensOf(foto.cont);
    foto.cont.destroy();
    this.abrirPolaroid(foto.indice);
  }

  private abrirPolaroid(indice: number): void {
    this.etapa = "foto";
    this.gabitcha.setVelocityX(0);
    atualizarAndar(this.gabitcha, "gabitcha", false);
    this.flashTela();

    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x101223, 0.6)
      .setScrollFactor(0)
      .setDepth(80);

    // moldura polaroid grande (borda inferior bem maior)
    const g = this.add.graphics();
    g.fillStyle(0x0b0d1a, 0.5);
    g.fillRect(-72, -50, 148, 104); // sombra dura
    g.fillStyle(0xb9b3a8, 1);
    g.fillRect(-74, -52, 148, 104);
    g.fillStyle(0xf6f2e8, 1);
    g.fillRect(-73, -51, 146, 102);
    g.fillStyle(0x1d2140, 1);
    g.fillRect(-68, -46, 136, 64); // área da foto

    const cont = this.add.container(GAME_WIDTH / 2, 84, [g]).setScrollFactor(0).setDepth(85);
    this.desenharConteudoFoto(cont, indice);

    const legenda =
      indice >= TOTAL_FOTOS
        ? falaSegura(DIALOGOS.fase4.polaroidBonus)
        : falaSegura(DIALOGOS.fase4.polaroids[indice]);
    cont.add(
      this.add
        .text(0, 32, legenda, {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: "#3a3a4a",
          align: "center",
          lineSpacing: 3,
        })
        .setOrigin(0.5)
    );

    // pop de revelação
    cont.setScale(0);
    this.tweens.add({
      targets: cont,
      scaleX: 1, // tween transitório de animação
      scaleY: 1,
      duration: 240,
      ease: "Back.easeOut",
    });
    this.particulas(this.gabitcha.x, 116, 0x4fd6c4, 6);

    // fecha com toque/espaço: a foto voa GIRANDO pro slot dela no álbum
    this.time.delayedCall(500, () => {
      const fechar = () => {
        if (indice >= TOTAL_FOTOS) this.bonusGanho = true;
        this.coletadas[indice] = true;
        this.desenharAlbumHud();
        const alvo = this.alvoAlbum(indice);
        this.tweens.add({
          targets: cont,
          x: alvo.x,
          y: alvo.y,
          scaleX: 0.12,
          scaleY: 0.12,
          angle: 360, // tween transitório de animação (voa girando)
          alpha: 0,
          duration: 420,
          ease: "Quad.easeIn",
          onComplete: () => cont.destroy(),
        });
        this.tweens.add({
          targets: overlay,
          alpha: 0,
          duration: 300,
          onComplete: () => overlay.destroy(),
        });
        this.etapa = "andando";
        this.paradaMs = 0;
      };
      this.input.once("pointerdown", fechar);
      this.input.keyboard?.once("keydown-SPACE", fechar);
    });
  }

  /** Mini-cena pixelada dentro de cada polaroid (área 136x64 em -68,-46). */
  private desenharConteudoFoto(cont: Phaser.GameObjects.Container, indice: number): void {
    const g = this.add.graphics();
    cont.add(g);

    switch (indice) {
      case 0: {
        // os Andes
        g.fillStyle(0x8ac8ee, 1);
        g.fillRect(-68, -46, 136, 64);
        g.fillStyle(0xf0e6b8, 1);
        g.fillCircle(50, -34, 7); // sol
        g.fillStyle(0x8a86a8, 1);
        g.fillTriangle(-70, 18, -18, 18, -44, -30);
        g.fillTriangle(-30, 18, 40, 18, 6, -38);
        g.fillTriangle(20, 18, 78, 18, 50, -22);
        g.fillStyle(0xf2f6fc, 1); // neve
        g.fillTriangle(-52, -18, -36, -18, -44, -30);
        g.fillTriangle(-4, -24, 16, -24, 6, -38);
        g.fillTriangle(42, -12, 58, -12, 50, -22);
        break;
      }
      case 1: {
        // Sky Costanera
        g.fillStyle(0x8ac8ee, 1);
        g.fillRect(-68, -46, 136, 64);
        g.fillStyle(0xffffff, 0.9);
        g.fillRect(-52, -30, 18, 4);
        g.fillRect(30, -20, 22, 4); // nuvens
        g.fillStyle(0x7a92b8, 1);
        g.fillRect(-8, -24, 16, 42); // corpo
        g.fillRect(-6, -34, 12, 10);
        g.fillRect(-3, -42, 6, 8);
        g.fillStyle(0xdfe8f4, 1);
        for (let wy = -30; wy < 14; wy += 5) {
          g.fillRect(-5, wy, 2, 3);
          g.fillRect(3, wy, 2, 3);
        }
        break;
      }
      case 2: {
        // as taças do brinde no vinhedo
        g.fillStyle(0xf0c890, 1);
        g.fillRect(-68, -46, 136, 64);
        g.fillStyle(0xe8a874, 1);
        g.fillRect(-68, -18, 136, 36); // entardecer baixo
        g.fillStyle(0xf0e6b8, 1);
        g.fillCircle(-44, -32, 7); // sol
        g.fillStyle(0x7a9048, 1);
        g.fillRect(-68, 6, 136, 12); // colina
        g.fillStyle(0x5a7038, 1);
        for (let px = -60; px < 66; px += 16) g.fillRect(px, 8, 2, 10); // parreiras
        // duas taças brindando (inclinadas uma pra outra)
        g.fillStyle(0xdfe8f4, 1);
        g.fillRect(-26, -22, 2, 14);
        g.fillRect(-10, -24, 2, 14); // bojo esq
        g.fillStyle(0xa03460, 1);
        g.fillRect(-24, -20, 14, 9);
        g.fillStyle(0xdfe8f4, 1);
        g.fillRect(-24, -8, 14, 2);
        g.fillRect(-18, -6, 2, 10);
        g.fillRect(-22, 4, 10, 2); // pé esq
        g.fillRect(8, -24, 2, 14);
        g.fillRect(24, -22, 2, 14); // bojo dir
        g.fillStyle(0xa03460, 1);
        g.fillRect(10, -20, 14, 9);
        g.fillStyle(0xdfe8f4, 1);
        g.fillRect(10, -8, 14, 2);
        g.fillRect(16, -6, 2, 10);
        g.fillRect(12, 4, 10, 2); // pé dir
        g.fillStyle(0xff7aa2, 1); // coraçãozinho do "tim!"
        g.fillRect(-3, -36, 2, 2);
        g.fillRect(1, -36, 2, 2);
        g.fillRect(-3, -34, 6, 3);
        g.fillRect(-1, -31, 2, 2);
        break;
      }
      case 3: {
        // empanada histórica
        g.fillStyle(0xd8c8a8, 1);
        g.fillRect(-68, -46, 136, 64);
        g.fillStyle(0xb89a6a, 1);
        g.fillRect(-40, 4, 80, 10); // prato
        g.fillStyle(0xd9a441, 1);
        g.fillCircle(0, 4, 22); // massa
        g.fillStyle(0xd8c8a8, 1);
        g.fillRect(-68, -46, 136, 50 - 22); // corta o topo: meia-lua
        g.fillStyle(0xb8801f, 1);
        g.fillRect(-22, -19, 44, 3); // borda assada
        for (let i = -18; i <= 18; i += 6) g.fillRect(i, -22, 2, 3); // repulgo
        g.fillStyle(0xffffff, 0.7); // vaporzinho
        g.fillRect(-6, -34, 1, 6);
        g.fillRect(4, -38, 1, 8);
        break;
      }
      case 4: {
        // as casinhas de Valparaíso
        g.fillStyle(0x8ac8ee, 1);
        g.fillRect(-68, -46, 136, 64);
        const cores = [0xe05a4a, 0xe9b44c, 0x4fa0d8, 0x58b868, 0xb86ac8];
        let px = -64;
        let k = 0;
        while (px < 60) {
          const larg = 20 + ((k * 7) % 10);
          const alt = 24 + ((k * 13) % 18);
          g.fillStyle(cores[k % cores.length], 1);
          g.fillRect(px, 18 - alt, larg, alt);
          g.fillStyle(0x3a3548, 1);
          g.fillRect(px - 1, 16 - alt, larg + 2, 3); // telhado
          g.fillStyle(0xf6f2e8, 0.9);
          g.fillRect(px + 4, 24 - alt, 4, 5);
          g.fillRect(px + larg - 8, 24 - alt, 4, 5); // janelas
          px += larg + 4;
          k++;
        }
        break;
      }
      case 5: {
        // os dois + bandeira + coração
        g.fillStyle(0x8ac8ee, 1);
        g.fillRect(-68, -46, 136, 64);
        g.fillStyle(0x4c8a3f, 1);
        g.fillRect(-68, 8, 136, 10);
        g.fillStyle(0x8a8fa8, 1);
        g.fillRect(-46, -34, 2, 44); // mastro
        const bandeira = this.add.image(-38, -30, "bandeiraChile");
        const ga = this.add.image(-4, -8, "gabitcha");
        const ra = this.add.image(30, -8, "rafitcho").setFlipX(true);
        cont.add([bandeira, ga, ra]);
        g.fillStyle(0xff7aa2, 1); // coraçãozinho entre os dois
        g.fillRect(11, -36, 2, 2);
        g.fillRect(15, -36, 2, 2);
        g.fillRect(11, -34, 6, 3);
        g.fillRect(13, -31, 2, 2);
        break;
      }
      case 6: {
        // BÔNUS: os dois com o gato no muro
        g.fillStyle(0x8ac8ee, 1);
        g.fillRect(-68, -46, 136, 64);
        g.fillStyle(0xe9b44c, 1);
        g.fillRect(-68, -46, 136, 6); // faixa de sol
        g.fillStyle(0x8a8494, 1);
        g.fillRect(20, -14, 48, 32); // muro
        g.fillStyle(0x6a6478, 1);
        for (let wy = -8; wy < 16; wy += 8) g.fillRect(20, wy, 48, 1);
        const ga = this.add.image(-30, -8, "gabitcha");
        const ra = this.add.image(4, -8, "rafitcho").setFlipX(true);
        const gato = this.add.image(44, -20, "gatoA");
        cont.add([ga, ra, gato]);
        g.fillStyle(0xff7aa2, 1); // coração do miau
        g.fillRect(40, -36, 2, 2);
        g.fillRect(44, -36, 2, 2);
        g.fillRect(40, -34, 6, 3);
        g.fillRect(42, -31, 2, 2);
        break;
      }
    }
  }

  // ---------- álbum no HUD (slots de polaroid) ----------

  private alvoAlbum(indice: number): { x: number; y: number } {
    const n = this.bonusGanho ? TOTAL_FOTOS + 1 : TOTAL_FOTOS;
    const x0 = GAME_WIDTH - 4 - (n * 9 - 2);
    return { x: x0 + indice * 9 + 3, y: 18 };
  }

  private desenharAlbumHud(): void {
    this.albumG.clear();
    const n = this.bonusGanho ? TOTAL_FOTOS + 1 : TOTAL_FOTOS;
    const x0 = GAME_WIDTH - 4 - (n * 9 - 2);
    const y0 = 14;
    for (let k = 0; k < n; k++) {
      const x = x0 + k * 9;
      if (this.coletadas[k]) {
        this.albumG.fillStyle(k >= TOTAL_FOTOS ? 0xe9b44c : 0xf6f2e8, 1);
        this.albumG.fillRect(x, y0, 7, 9);
        this.albumG.fillStyle(CORES_FOTO[k], 1);
        this.albumG.fillRect(x + 1, y0 + 1, 5, 4);
      } else {
        this.albumG.fillStyle(0x2c3160, 1);
        this.albumG.fillRect(x, y0, 7, 9);
        this.albumG.fillStyle(0x1d2140, 1);
        this.albumG.fillRect(x + 1, y0 + 1, 5, 7);
      }
    }
  }

  // ---------- NPCs conversáveis ----------

  private criarNpc(cfg: {
    id: string;
    x: number;
    falas: string[];
    y?: number;
    topoY?: number;
    aoTerminar?: () => void;
  }): void {
    const topo = cfg.topoY ?? (cfg.y ?? PERSONAGEM_Y) - 24;

    // balão de "..." flutuando
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 1);
    bg.fillRect(-9, -7, 18, 11);
    bg.lineStyle(1, 0x1d2140, 1);
    bg.strokeRect(-8.5, -6.5, 17, 10);
    bg.fillStyle(0xffffff, 1);
    bg.fillRect(-2, 4, 4, 2);
    bg.fillRect(-1, 6, 2, 1);
    const pontos = this.add
      .text(0, -2, DIALOGOS.fase4.npcIndicador, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: "#1d2140",
      })
      .setOrigin(0.5);
    const balao = this.reg(this.add.container(cfg.x, topo - 8, [bg, pontos]).setDepth(30));
    this.tweens.add({
      targets: balao,
      y: topo - 11,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const hint = this.reg(
      this.add
        .text(cfg.x, topo - 10, DIALOGOS.fase4.hintConversa, {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: UI.douradoYuumitcha,
        })
        .setOrigin(0.5)
        .setDepth(30)
        .setVisible(false)
    );

    this.npcs.push({
      id: cfg.id,
      x: cfg.x,
      falaY: topo,
      falas: cfg.falas,
      balao,
      hint,
      conversado: false,
      aoTerminar: cfg.aoTerminar,
    });
  }

  private conversar(npc: Npc): void {
    this.etapa = "conversa";
    this.gabitcha.setVelocityX(0);
    atualizarAndar(this.gabitcha, "gabitcha", false);
    npc.balao.setVisible(false);
    npc.hint.setVisible(false);

    const falar = (i: number) => {
      if (i >= npc.falas.length) {
        npc.conversado = true;
        npc.balao.destroy();
        npc.hint.destroy();
        this.registrarConversa(npc.id);
        this.paradaMs = 0;
        if (npc.aoTerminar) npc.aoTerminar();
        else this.etapa = "andando";
        return;
      }
      this.mostrarBalaoTexto(npc.x, npc.falaY, falaSegura(npc.falas[i]), 2400, 200);
      this.time.delayedCall(2500, () => falar(i + 1));
    };
    falar(0);
  }

  private registrarConversa(id: string): void {
    this.conversas.add(id);
    if (this.conversas.size >= TOTAL_NPCS && !this.bonusGanho) {
      // conversou com todo mundo: a polaroid BÔNUS secreta
      // (espera a fase estar livre — pode haver outra foto/conversa aberta)
      const tentar = () => {
        if (this.etapa === "andando") this.abrirPolaroid(TOTAL_FOTOS);
        else this.time.delayedCall(900, tentar);
      };
      this.time.delayedCall(700, tentar);
    }
  }

  /** A vendedora entrega as taças: micro-interação do brinde. */
  private microBrinde(vx: number, vy: number): void {
    this.etapa = "brinde";
    this.mostrarBalaoTexto(vx, vy - 24, falaSegura(DIALOGOS.fase4.npcs.vinhoEntrega), 2200, 200);

    this.time.delayedCall(2300, () => {
      // o Rafitcho vem ficar de frente pra ela
      this.rafitcho.setFlipX(false);
      atualizarAndar(this.rafitcho, "rafitcho", true);
      this.tweens.add({
        targets: this.rafitcho,
        x: this.gabitcha.x - 30,
        duration: 500,
        onComplete: () => atualizarAndar(this.rafitcho, "rafitcho", false),
      });

      const taca1 = this.add.image(vx + 6, vy - 6, "tacaVinho").setDepth(26);
      const taca2 = this.add.image(vx + 12, vy - 6, "tacaVinho").setDepth(26);
      this.tweens.add({ targets: taca1, x: this.gabitcha.x + 8, y: this.gabitcha.y - 2, duration: 500 });
      this.tweens.add({ targets: taca2, x: this.gabitcha.x - 38, y: this.gabitcha.y - 2, duration: 600 });

      this.time.delayedCall(900, () => {
        const meioX = this.gabitcha.x - 15;
        const meioY = this.gabitcha.y - 18;
        this.tweens.add({ targets: taca1, x: meioX + 5, y: meioY, angle: -14, duration: 350 }); // transitório
        this.tweens.add({ targets: taca2, x: meioX - 5, y: meioY, angle: 14, duration: 350 });
        this.time.delayedCall(400, () => {
          const tim = this.add
            .text(meioX, meioY - 12, DIALOGOS.fase4.brinde, {
              fontFamily: UI.fonte,
              fontSize: FONT_SM,
              color: UI.douradoYuumitcha,
            })
            .setOrigin(0.5)
            .setDepth(46)
            .setScale(0);
          this.tweens.add({ targets: tim, scale: 1, duration: 160, ease: "Back.easeOut" });
          this.particulas(meioX, meioY, 0xe9b44c, 8);
          const coracao = this.add.image(meioX, meioY - 20, "coracaoV").setDepth(46);
          this.tweens.add({ targets: coracao, y: meioY - 34, alpha: 0, duration: 1200 });

          this.time.delayedCall(1300, () => {
            this.tweens.add({
              targets: [taca1, taca2, tim],
              alpha: 0,
              duration: 300,
              onComplete: () => {
                taca1.destroy();
                taca2.destroy();
                tim.destroy();
              },
            });
            this.etapa = "andando";
            this.paradaMs = 0;
          });
        });
      });
    });
  }

  // ---------- final: o mirante de Valparaíso ----------

  private finalizar(): void {
    if (this.etapa === "fim") return;
    this.etapa = "fim";
    this.gabitcha.setVelocityX(0);
    this.gabitcha.setFlipX(false);

    atualizarAndar(this.gabitcha, "gabitcha", true);
    atualizarAndar(this.rafitcho, "rafitcho", true);
    this.tweens.add({ targets: this.gabitcha, x: 846, y: PERSONAGEM_Y, duration: 900, ease: "Sine.easeOut" });
    this.tweens.add({ targets: this.rafitcho, x: 818, y: PERSONAGEM_Y, duration: 900, ease: "Sine.easeOut" });
    this.rafitcho.setFlipX(false);
    this.time.delayedCall(950, () => {
      atualizarAndar(this.gabitcha, "gabitcha", false);
      atualizarAndar(this.rafitcho, "rafitcho", false);
    });

    this.time.delayedCall(1300, () => {
      this.mostrarBalaoTexto(
        this.gabitcha.x,
        this.gabitcha.y - 24,
        falaSegura(DIALOGOS.fase4.final),
        3000,
        200
      );
      // coraçõezinhos subindo no mirante
      this.time.addEvent({
        delay: 350,
        repeat: 7,
        callback: () => {
          const c = this.add
            .image(Phaser.Math.Between(806, 878), 118, "coracaoV")
            .setDepth(25);
          this.tweens.add({
            targets: c,
            y: Phaser.Math.Between(60, 90),
            alpha: 0,
            duration: 1600,
            ease: "Sine.easeOut",
            onComplete: () => c.destroy(),
          });
        },
      });
    });

    this.time.delayedCall(4600, () => fadeToScene(this, "Fase5Encomenda", 1500));
  }

  // ---------- balão de texto único (com clamp na câmera) ----------

  private mostrarBalaoTexto(
    x: number,
    topoY: number,
    texto: string,
    duracao = 2400,
    maxLargura = 144
  ): void {
    this.fecharBalaoTexto(true);

    const t = this.add
      .text(0, 0, texto, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: "#1d2140",
        align: "center",
        lineSpacing: 2,
        wordWrap: { width: maxLargura - 8 },
      })
      .setOrigin(0.5);
    const w = Math.min(t.width + 8, maxLargura);
    const h = t.height + 6;

    let cy = topoY - 6 - h / 2;
    let invertido = false;
    if (cy - h / 2 < 24) {
      invertido = true;
      cy = topoY + 60 + h / 2;
    }

    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRect(-w / 2, -h / 2, w, h);
    g.lineStyle(1, 0x1d2140, 1);
    g.strokeRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1);
    g.fillStyle(0xffffff, 1);
    if (invertido) {
      g.fillRect(-2, -h / 2 - 2, 4, 2);
      g.fillRect(-1, -h / 2 - 3, 2, 1);
    } else {
      g.fillRect(-2, h / 2, 4, 2);
      g.fillRect(-1, h / 2 + 2, 2, 1);
    }

    const cam = this.cameras.main;
    const cx = Phaser.Math.Clamp(
      x,
      cam.scrollX + w / 2 + 2,
      cam.scrollX + GAME_WIDTH - w / 2 - 2
    );
    const cont = this.add.container(cx, cy, [g, t]).setDepth(45);
    const timer = this.time.delayedCall(duracao, () => this.fecharBalaoTexto());
    this.balaoAtual = { cont, timer };
  }

  private fecharBalaoTexto(comFade = false): void {
    if (!this.balaoAtual) return;
    const b = this.balaoAtual;
    this.balaoAtual = null;
    b.timer.remove();
    if (comFade) {
      this.tweens.add({ targets: b.cont, alpha: 0, duration: 120, onComplete: () => b.cont.destroy() });
    } else {
      b.cont.destroy();
    }
  }

  private particulas(x: number, y: number, cor: number, quantidade: number): void {
    for (let i = 0; i < quantidade; i++) {
      const p = this.add
        .rectangle(x + Phaser.Math.Between(-6, 6), y + Phaser.Math.Between(-6, 6), 2, 2, cor)
        .setDepth(30);
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-12, 12),
        y: p.y - Phaser.Math.Between(6, 16),
        alpha: 0,
        duration: Phaser.Math.Between(350, 600),
        ease: "Quad.easeOut",
        onComplete: () => p.destroy(),
      });
    }
  }

  // ---------- cenário compartilhado: céu, chão, pássaros ----------

  private criarCeu(bandas: Array<[number, number]>): void {
    const ceu = this.reg(this.add.graphics().setDepth(-10).setScrollFactor(0));
    let y = 0;
    for (const [cor, altura] of bandas) {
      ceu.fillStyle(cor, 1);
      ceu.fillRect(0, y, GAME_WIDTH, altura);
      y += altura;
    }
  }

  private criarSol(x: number, y: number): void {
    const halo2 = this.reg(this.add.circle(x, y, 17, 0xfff6d0, 0.14).setScrollFactor(0.05).setDepth(-9));
    const halo1 = this.reg(this.add.circle(x, y, 12, 0xfff6d0, 0.28).setScrollFactor(0.05).setDepth(-9));
    this.reg(this.add.circle(x, y, 9, 0xfff6d0).setScrollFactor(0.05).setDepth(-9));
    this.tweens.add({
      targets: [halo1, halo2],
      scale: 1.15,
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private criarChao(largura: number, corGrama: number, corGramaClara: number): void {
    const chao = this.reg(this.add.graphics().setDepth(-5));
    chao.fillStyle(corGrama, 1);
    chao.fillRect(0, CHAO_Y - 6, largura, GAME_HEIGHT - CHAO_Y + 6);
    chao.fillStyle(corGramaClara, 1);
    chao.fillRect(0, CHAO_Y - 6, largura, 2);
    chao.fillStyle(0xc4ae8a, 1);
    chao.fillRect(0, CHAO_Y + 2, largura, 12);
    chao.fillStyle(0xd8c8a8, 1);
    chao.fillRect(0, CHAO_Y + 2, largura, 1);
    chao.fillStyle(0x9a8668, 1);
    chao.fillRect(0, CHAO_Y + 13, largura, 1);
    for (let px = 0; px < largura; px += 26) {
      chao.fillStyle(px % 52 === 0 ? 0xb09a76 : 0xd0ba96, 1);
      chao.fillRect(px + 9, CHAO_Y + 5 + ((px / 26) % 6), 2, 1);
    }
    // tufos e flores
    for (let t2 = 0; t2 < largura / 8; t2++) {
      const tx = (t2 * 61 + 9) % largura;
      const ty = t2 % 2 === 0 ? CHAO_Y - 5 : CHAO_Y + 16 + ((t2 * 11) % 5);
      chao.fillStyle(t2 % 3 === 0 ? 0x6db558 : 0x3a6b30, 1);
      chao.fillRect(tx, ty, 1, 3);
      chao.fillRect(tx - 1, ty + 1, 1, 2);
      chao.fillRect(tx + 1, ty + 1, 1, 2);
      if (t2 % 4 === 1) {
        chao.fillStyle([0xff7aa2, 0xe9b44c, 0xffffff][t2 % 3], 1);
        chao.fillRect(tx + 3, ty - 1, 2, 2);
      }
    }
  }

  private criarPassaros(textura: string): void {
    this.regTimer(
      this.time.addEvent({
        delay: 15000,
        startAt: 11000,
        loop: true,
        callback: () => {
          const py = Phaser.Math.Between(24, 54);
          const p = this.add.image(GAME_WIDTH + 12, py, textura).setScrollFactor(0).setDepth(-8);
          this.tweens.add({ targets: p, scaleY: 0.5, duration: 160, yoyo: true, repeat: -1 });
          this.tweens.add({
            targets: p,
            x: -12,
            y: py + Phaser.Math.Between(-8, 8),
            duration: Phaser.Math.Between(6000, 9000),
            onComplete: () => p.destroy(),
          });
        },
      })
    );
  }

  // ---------- cartão-postal 1: Santiago ----------

  private criarCenarioSantiago(): void {
    this.criarCeu([
      [0x6ab7e8, 34],
      [0x8ac8ee, 34],
      [0xaad8f2, 30],
      [0xd8ecf8, GAME_HEIGHT - 98],
    ]);
    this.criarSol(52, 30);

    // Cordilheira dos Andes — camada distante (azulada, picos nevados)
    const dist = this.reg(this.add.graphics().setScrollFactor(0.2).setDepth(-8));
    dist.fillStyle(0xb8c8de, 1);
    for (let i = 0; i < 9; i++) {
      const cx = i * 68 - 12;
      const topo = 58 + ((i * 17) % 22);
      dist.fillTriangle(cx - 46, 122, cx + 46, 122, cx, topo);
    }
    dist.fillRect(0, 120, 620, GAME_HEIGHT - 120);
    dist.fillStyle(0xf2f6fc, 1); // neve
    for (let i = 0; i < 9; i++) {
      const cx = i * 68 - 12;
      const topo = 58 + ((i * 17) % 22);
      const meia = Math.round((46 * 10) / (122 - topo));
      dist.fillTriangle(cx - meia, topo + 10, cx + meia, topo + 10, cx, topo);
    }

    // Cordilheira próxima (mais escura, neve menor)
    const perto = this.reg(this.add.graphics().setScrollFactor(0.38).setDepth(-7));
    perto.fillStyle(0x8a86a8, 1);
    for (let i = 0; i < 9; i++) {
      const cx = i * 84 - 20;
      const topo = 82 + ((i * 23) % 18);
      perto.fillTriangle(cx - 52, 148, cx + 52, 148, cx, topo);
    }
    perto.fillRect(0, 146, 700, GAME_HEIGHT - 146);
    perto.fillStyle(0xe8ecf6, 1);
    for (let i = 0; i < 9; i++) {
      const cx = i * 84 - 20;
      const topo = 82 + ((i * 23) % 18);
      const meia = Math.round((52 * 7) / (148 - topo));
      perto.fillTriangle(cx - meia, topo + 7, cx + meia, topo + 7, cx, topo);
    }

    // Santiago: prédios claros + Sky Costanera
    const cidade = this.reg(this.add.graphics().setDepth(-6));
    let bx = 40;
    let i2 = 0;
    while (bx < 300) {
      const largura = 22 + ((i2 * 13) % 16);
      const altura = 34 + ((i2 * 27) % 34);
      cidade.fillStyle(0x9aa4c0, 1);
      cidade.fillRect(bx, CHAO_Y - altura, largura, altura);
      cidade.fillStyle(0x7a86a4, 1);
      cidade.fillRect(bx + largura - 3, CHAO_Y - altura, 3, altura);
      cidade.fillStyle(0xdfe8f4, 0.8);
      for (let wy = CHAO_Y - altura + 4; wy < CHAO_Y - 6; wy += 8) {
        for (let wx = bx + 3; wx < bx + largura - 4; wx += 6) {
          if ((wx + wy + i2) % 3 === 0) cidade.fillRect(wx, wy, 2, 3);
        }
      }
      bx += largura + 5;
      i2++;
    }
    // Sky Costanera (a torre afunilada)
    cidade.fillStyle(0x8aa2c4, 1);
    cidade.fillRect(330, 60, 16, CHAO_Y - 60);
    cidade.fillRect(332, 48, 12, 12);
    cidade.fillRect(334, 40, 8, 8);
    cidade.fillStyle(0x6a82a4, 1);
    cidade.fillRect(342, 60, 4, CHAO_Y - 60); // lado sombreado
    cidade.fillStyle(0xdfe8f4, 0.85);
    for (let wy = 64; wy < CHAO_Y - 8; wy += 7) cidade.fillRect(334, wy, 2, 3);
    cidade.fillStyle(0x5a6a88, 1);
    cidade.fillRect(337, 28, 2, 12); // espigão

    this.criarChao(LOCAIS[0].largura, 0x4c8a3f, 0x5fa04c);
    for (const px of [470, 640]) this.criarPalmeira(px);

    // mastro com a bandeira do Chile
    const mastro = this.reg(this.add.graphics().setDepth(-4));
    mastro.fillStyle(0x8a8fa8, 1);
    mastro.fillRect(600, CHAO_Y - 52, 2, 52);
    mastro.fillStyle(0xb8bdd0, 1);
    mastro.fillRect(600, CHAO_Y - 52, 1, 52);
    this.reg(this.add.image(610, CHAO_Y - 47, "bandeiraChile").setDepth(-4));

    // food cart de completos + vendedor
    this.reg(this.add.image(160, PERSONAGEM_Y - 2, "npcCompletos").setDepth(9));
    const cart = this.reg(this.add.graphics().setDepth(10));
    cart.fillStyle(0x8a6240, 1);
    cart.fillRect(138, CHAO_Y - 26, 44, 22); // corpo
    cart.fillStyle(0xa87f4e, 1);
    cart.fillRect(138, CHAO_Y - 26, 44, 2); // balcão
    cart.fillStyle(0x1d2140, 1);
    cart.fillRect(144, CHAO_Y - 2, 5, 5);
    cart.fillRect(170, CHAO_Y - 2, 5, 5); // rodas
    // toldo listrado
    for (let k = 0; k < 8; k++) {
      cart.fillStyle(k % 2 === 0 ? 0xc0392b : 0xf2f0f7, 1);
      cart.fillRect(134 + k * 7, CHAO_Y - 46, 7, 6);
    }
    cart.fillStyle(0x5a3a24, 1);
    cart.fillRect(136, CHAO_Y - 40, 2, 14);
    cart.fillRect(180, CHAO_Y - 40, 2, 14); // hastes
    // completos no balcão
    for (const hx of [146, 158, 170]) {
      cart.fillStyle(0xe8c87a, 1);
      cart.fillRect(hx, CHAO_Y - 30, 8, 3);
      cart.fillStyle(0xc0392b, 1);
      cart.fillRect(hx + 1, CHAO_Y - 29, 6, 1);
    }
    this.reg(
      this.add
        .text(160, CHAO_Y - 54, DIALOGOS.fase4.letreiroCompletos, {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: "#ffffff",
        })
        .setOrigin(0.5)
        .setDepth(10)
    );
    this.criarNpc({ id: "completos", x: 160, falas: [...DIALOGOS.fase4.npcs.completos], topoY: CHAO_Y - 60 });

    // turista perdido com mapa gigante (de costas pra cordilheira)
    this.reg(this.add.image(520, PERSONAGEM_Y - 2, "npcTurista").setDepth(12));
    this.reg(this.add.image(524, PERSONAGEM_Y + 4, "mapaGigante").setDepth(13));
    this.criarNpc({ id: "turista", x: 520, falas: [...DIALOGOS.fase4.npcs.turista] });

    this.criarPassaros("passaroV");
  }

  private criarPalmeira(x: number): void {
    const g = this.reg(this.add.graphics().setDepth(-4));
    // tronco alto e fino com anéis
    g.fillStyle(0x8a6240, 1);
    g.fillRect(x - 2, CHAO_Y - 58, 4, 58);
    g.fillStyle(0x6b4a2f, 1);
    g.fillRect(x + 1, CHAO_Y - 58, 1, 58);
    g.fillStyle(0xa87f4e, 1);
    for (let ry = CHAO_Y - 52; ry < CHAO_Y - 6; ry += 8) g.fillRect(x - 2, ry, 3, 1);
    // copa em leque (2 tons)
    g.fillStyle(0x2d6a30, 1);
    g.fillCircle(x, CHAO_Y - 62, 9);
    g.fillCircle(x - 11, CHAO_Y - 58, 6);
    g.fillCircle(x + 11, CHAO_Y - 58, 6);
    g.fillCircle(x - 15, CHAO_Y - 52, 4);
    g.fillCircle(x + 15, CHAO_Y - 52, 4);
    g.fillStyle(0x4c9a44, 1);
    g.fillCircle(x - 4, CHAO_Y - 64, 5);
    g.fillCircle(x + 6, CHAO_Y - 62, 4);
  }

  // ---------- cartão-postal 2: Vale do Vinho ----------

  private criarCenarioVinhedo(): void {
    this.criarCeu([
      [0xf8d8a0, 40],
      [0xf2c488, 40],
      [0xe8ab74, 34],
      [0xf6e2c0, GAME_HEIGHT - 114],
    ]);
    this.criarSol(60, 36);

    // colinas douradas em camadas
    const fundo = this.reg(this.add.graphics().setScrollFactor(0.25).setDepth(-8));
    fundo.fillStyle(0xb8a860, 1);
    for (let i = 0; i < 6; i++) fundo.fillCircle(i * 90 - 10, 150, 52);
    fundo.fillRect(0, 130, 460, GAME_HEIGHT - 130);
    const meio = this.reg(this.add.graphics().setScrollFactor(0.45).setDepth(-7));
    meio.fillStyle(0x8a9a4c, 1);
    for (let i = 0; i < 6; i++) meio.fillCircle(i * 100 + 30, 168, 58);
    meio.fillRect(0, 150, 520, GAME_HEIGHT - 150);
    // fileiras de parreira nas colinas do meio
    meio.fillStyle(0x5a7038, 1);
    for (let px = 10; px < 500; px += 26) {
      meio.fillRect(px, 128 + ((px / 26) % 3) * 4, 14, 2);
    }

    // casona da vinícola
    const casona = this.reg(this.add.graphics().setDepth(-6));
    casona.fillStyle(0xf2ead8, 1);
    casona.fillRect(470, CHAO_Y - 42, 70, 36); // paredes
    casona.fillStyle(0xd8c8a8, 1);
    casona.fillRect(534, CHAO_Y - 42, 6, 36); // sombra
    casona.fillStyle(0xb85838, 1); // telhado terracota em degraus
    casona.fillRect(464, CHAO_Y - 48, 82, 7);
    casona.fillRect(470, CHAO_Y - 53, 70, 5);
    casona.fillStyle(0x8a3f28, 1);
    casona.fillRect(464, CHAO_Y - 42, 82, 1);
    casona.fillStyle(0x6b4a2f, 1);
    casona.fillRect(498, CHAO_Y - 26, 12, 20); // porta
    casona.fillStyle(0x8ac8ee, 0.9);
    casona.fillRect(478, CHAO_Y - 34, 8, 8);
    casona.fillRect(522, CHAO_Y - 34, 8, 8); // janelas
    // barris encostados
    for (const bxr of [452, 552]) {
      casona.fillStyle(0x8a6240, 1);
      casona.fillRect(bxr, CHAO_Y - 18, 14, 14);
      casona.fillStyle(0x5a3a24, 1);
      casona.fillRect(bxr, CHAO_Y - 15, 14, 1);
      casona.fillRect(bxr, CHAO_Y - 8, 14, 1);
    }

    this.criarChao(LOCAIS[1].largura, 0x6a9a44, 0x86b458);

    // fileiras de parreira em primeiro plano (atrás do caminho)
    const vinhas = this.reg(this.add.graphics().setDepth(-4));
    // vãos: vendedora (260), fotos (380/540) e casona com barris (505)
    const vaos: Array<[number, number]> = [[260, 40], [380, 22], [505, 75], [540, 22]];
    for (let px = 60; px < 660; px += 46) {
      if (vaos.some(([vx, raio]) => Math.abs(px - vx) < raio)) continue;
      vinhas.fillStyle(0x5a3a24, 1);
      vinhas.fillRect(px, CHAO_Y - 24, 3, 18); // poste
      vinhas.fillStyle(0x8a6240, 1);
      vinhas.fillRect(px - 14, CHAO_Y - 21, 31, 1); // arame
      vinhas.fillRect(px - 14, CHAO_Y - 14, 31, 1);
      vinhas.fillStyle(0x3a6b30, 1); // folhagem
      vinhas.fillRect(px - 12, CHAO_Y - 24, 8, 8);
      vinhas.fillRect(px + 6, CHAO_Y - 22, 9, 7);
      vinhas.fillStyle(0x4c9a44, 1);
      vinhas.fillRect(px - 10, CHAO_Y - 26, 6, 4);
      vinhas.fillRect(px + 8, CHAO_Y - 24, 5, 3);
      vinhas.fillStyle(0x7a2244, 1); // cachos
      vinhas.fillRect(px - 8, CHAO_Y - 16, 3, 4);
      vinhas.fillRect(px + 9, CHAO_Y - 15, 3, 4);
    }

    // vendedora de vinho com o barril como balcão
    this.reg(this.add.image(260, PERSONAGEM_Y - 2, "npcVinho").setDepth(9));
    const barril = this.reg(this.add.graphics().setDepth(10));
    barril.fillStyle(0x8a6240, 1);
    barril.fillRect(246, CHAO_Y - 22, 26, 20);
    barril.fillStyle(0xa87f4e, 1);
    barril.fillRect(248, CHAO_Y - 22, 4, 20); // brilho
    barril.fillStyle(0x5a3a24, 1);
    barril.fillRect(246, CHAO_Y - 18, 26, 1);
    barril.fillRect(246, CHAO_Y - 8, 26, 1); // arcos
    barril.fillStyle(0xd8c8a8, 1);
    barril.fillRect(246, CHAO_Y - 23, 26, 2); // tampo
    this.reg(this.add.image(254, CHAO_Y - 28, "tacaVinho").setDepth(11));
    this.reg(this.add.image(264, CHAO_Y - 28, "tacaVinho").setDepth(11));
    this.criarNpc({
      id: "vinho",
      x: 260,
      falas: [...DIALOGOS.fase4.npcs.vinho],
      aoTerminar: () => this.microBrinde(260, PERSONAGEM_Y),
    });

    // borboletas douradas
    for (let i = 0; i < 2; i++) {
      const b = this.reg(
        this.add.rectangle(180 + i * 260, CHAO_Y - 34 - i * 8, 2, 2, i === 0 ? 0xe9b44c : 0xf2f0f7).setDepth(-3)
      );
      this.tweens.add({
        targets: b,
        x: b.x + 30,
        y: b.y - 10,
        duration: 2200 + i * 500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    this.criarPassaros("passaroV");
  }

  // ---------- cartão-postal 3: Valparaíso ----------

  private criarCenarioValparaiso(): void {
    this.criarCeu([
      [0x5aa8e0, 30],
      [0x7ac0ec, 34],
      [0x9ad4f4, 32],
      [0xc8e8f8, GAME_HEIGHT - 96],
    ]);
    this.criarSol(268, 28);

    // o mar no horizonte
    const mar = this.reg(this.add.graphics().setScrollFactor(0.15).setDepth(-9));
    mar.fillStyle(0x2a6a9c, 1);
    mar.fillRect(0, 96, 420, 28);
    mar.fillStyle(0x4a8ab8, 1);
    mar.fillRect(0, 96, 420, 2);
    mar.fillStyle(0xdfe8f4, 0.8);
    for (let i = 0; i < 22; i++) mar.fillRect((i * 37) % 416, 100 + ((i * 13) % 20), 3, 1); // brilhos

    // o morro de casinhas coloridas (2 fileiras em parallax)
    const morro = this.reg(this.add.graphics().setScrollFactor(0.5).setDepth(-7));
    const cores = [0xe05a4a, 0xe9b44c, 0x4fa0d8, 0x58b868, 0xb86ac8, 0xf08a3c];
    let hx = -10;
    let k = 0;
    while (hx < 640) {
      const larg = 20 + ((k * 9) % 10);
      const alt = 22 + ((k * 13) % 12);
      morro.fillStyle(cores[k % cores.length], 1);
      morro.fillRect(hx, 122 - alt, larg, alt);
      morro.fillStyle(0x3a3548, 1);
      morro.fillRect(hx - 1, 120 - alt, larg + 2, 3);
      morro.fillStyle(0xf6f2e8, 0.9);
      morro.fillRect(hx + 3, 128 - alt, 3, 4);
      hx += larg + 3;
      k++;
    }
    morro.fillStyle(0x8a9a6c, 1);
    morro.fillRect(0, 122, 640, GAME_HEIGHT - 122);
    hx = 6;
    k = 0;
    while (hx < 640) {
      const larg = 24 + ((k * 11) % 12);
      const alt = 20 + ((k * 17) % 14);
      morro.fillStyle(cores[(k + 3) % cores.length], 1);
      morro.fillRect(hx, 148 - alt, larg, alt);
      morro.fillStyle(0x3a3548, 1);
      morro.fillRect(hx - 1, 146 - alt, larg + 2, 3);
      morro.fillStyle(0xf6f2e8, 0.9);
      morro.fillRect(hx + 4, 154 - alt, 3, 4);
      morro.fillRect(hx + larg - 8, 154 - alt, 3, 4);
      hx += larg + 4;
      k++;
    }

    this.criarChao(LOCAIS[2].largura, 0x5a8a4c, 0x72a860);

    // fachadas com murais perto do caminho
    const murais = this.reg(this.add.graphics().setDepth(-4));
    const fachadas: Array<[number, number, number]> = [
      [130, 46, 0xe9b44c],
      [212, 40, 0x4fa0d8],
      [530, 44, 0xe05a4a],
    ];
    for (const [fx, alt, cor] of fachadas) {
      murais.fillStyle(cor, 1);
      murais.fillRect(fx, CHAO_Y - alt, 54, alt - 6);
      murais.fillStyle(0x3a3548, 1);
      murais.fillRect(fx - 2, CHAO_Y - alt - 3, 58, 4); // telhado
      murais.fillStyle(0x6b4a2f, 1);
      murais.fillRect(fx + 40, CHAO_Y - 24, 10, 18); // porta
    }
    // murais pintados: coração, sol e peixe
    murais.fillStyle(0xff7aa2, 1);
    murais.fillRect(140, CHAO_Y - 36, 4, 4);
    murais.fillRect(148, CHAO_Y - 36, 4, 4);
    murais.fillRect(140, CHAO_Y - 32, 12, 6);
    murais.fillRect(144, CHAO_Y - 26, 4, 4);
    murais.fillStyle(0xf8d8a0, 1);
    murais.fillCircle(232, CHAO_Y - 28, 6);
    murais.fillStyle(0xf2f0f7, 1);
    murais.fillRect(538, CHAO_Y - 32, 14, 6);
    murais.fillRect(552, CHAO_Y - 34, 4, 10); // rabo do peixe
    murais.fillStyle(0x3a3548, 1);
    murais.fillRect(541, CHAO_Y - 30, 2, 2); // olho

    // escadaria colorida subindo o morro
    const escada = this.reg(this.add.graphics().setDepth(-4));
    for (let d = 0; d < 7; d++) {
      const ex = 400 + d * 12;
      const ey = CHAO_Y - 8 - d * 8;
      escada.fillStyle(cores[d % cores.length], 1);
      escada.fillRect(ex, ey, 70 - d * 6, 8); // espelho colorido
      escada.fillStyle(0xc8c4d0, 1);
      escada.fillRect(ex, ey, 70 - d * 6, 2); // piso
    }

    // violonista sentado na escadaria (2 frames dedilhando + notas ♪)
    const violonista = this.reg(this.add.image(436, CHAO_Y - 8 - 19, "violonista0").setDepth(12));
    this.reg(this.add.image(448, CHAO_Y - 18, "violao").setDepth(13));
    this.regTimer(
      this.time.addEvent({
        delay: 420,
        loop: true,
        callback: () => {
          if (!violonista.active) return;
          violonista.setTexture(
            violonista.texture.key === "violonista0" ? "violonista1" : "violonista0"
          );
        },
      })
    );
    this.regTimer(
      this.time.addEvent({
        delay: 800,
        loop: true,
        callback: () => {
          const nota = this.add
            .image(450 + Phaser.Math.Between(-3, 3), CHAO_Y - 26, "notaMusical")
            .setDepth(13)
            .setAlpha(0.95);
          this.tweens.add({
            targets: nota,
            y: nota.y - 26,
            x: nota.x + Phaser.Math.Between(-5, 5),
            alpha: 0,
            duration: 1600,
            ease: "Sine.easeOut",
            onComplete: () => nota.destroy(),
          });
        },
      })
    );
    this.criarNpc({
      id: "violonista",
      x: 436,
      falas: [...DIALOGOS.fase4.npcs.violonista],
      topoY: CHAO_Y - 48,
    });

    // o gato no muro (Valparaíso é deles)
    const muro = this.reg(this.add.graphics().setDepth(-4));
    muro.fillStyle(0x8a8494, 1);
    muro.fillRect(596, CHAO_Y - 16, 70, 16);
    muro.fillStyle(0xa8a2b4, 1);
    muro.fillRect(596, CHAO_Y - 16, 70, 2);
    muro.fillStyle(0x6a6478, 1);
    for (let px = 604; px < 660; px += 14) muro.fillRect(px, CHAO_Y - 9, 8, 1);
    const gato = this.reg(this.add.image(630, CHAO_Y - 22, "gatoA").setDepth(12));
    this.regTimer(
      this.time.addEvent({
        delay: 600,
        loop: true,
        callback: () => {
          if (!gato.active) return;
          gato.setTexture(gato.texture.key === "gatoA" ? "gatoB" : "gatoA");
        },
      })
    );
    this.criarNpc({
      id: "gato",
      x: 630,
      falas: [DIALOGOS.fase4.npcs.gato],
      topoY: CHAO_Y - 30,
      aoTerminar: () => {
        // easter egg bobo: o miau rende um coração
        for (const [cx, cy] of [
          [630, CHAO_Y - 32],
          [this.gabitcha.x, this.gabitcha.y - 28],
        ]) {
          const c = this.add.image(cx, cy, "coracaoV").setDepth(30);
          this.tweens.add({
            targets: c,
            y: cy - 16,
            alpha: 0,
            duration: 1200,
            ease: "Sine.easeOut",
            onComplete: () => c.destroy(),
          });
        }
        this.etapa = "andando";
      },
    });

    // placa MIRADOR
    const placa = this.reg(this.add.graphics().setDepth(-4));
    placa.fillStyle(0x6b4a2f, 1);
    placa.fillRect(755, CHAO_Y - 24, 3, 24);
    placa.fillStyle(0x4a3320, 1);
    placa.fillRect(758, CHAO_Y - 24, 1, 24);
    this.reg(
      this.add
        .rectangle(756, CHAO_Y - 30, 84, 13, 0x3d6b35)
        .setDepth(-4)
        .setStrokeStyle(1, 0xffffff)
    );
    this.reg(
      this.add
        .text(756, CHAO_Y - 30, DIALOGOS.fase4.placa, {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: "#ffffff",
        })
        .setOrigin(0.5)
        .setDepth(-3)
    );

    // mirante: deque de madeira + guarda-corpo + banco + luneta
    const deck = this.reg(this.add.graphics().setDepth(-4));
    deck.fillStyle(0x8a6240, 1);
    deck.fillRect(776, CHAO_Y - 6, 124, 8);
    deck.fillStyle(0xa87f4e, 1);
    deck.fillRect(776, CHAO_Y - 6, 124, 1);
    deck.fillStyle(0x5a3a24, 1);
    for (let px = 784; px < 900; px += 12) deck.fillRect(px, CHAO_Y - 5, 1, 6);
    // guarda-corpo ao fundo
    for (let px = 780; px <= 892; px += 20) {
      deck.fillStyle(0x5a3a24, 1);
      deck.fillRect(px, CHAO_Y - 30, 2, 24);
      deck.fillStyle(0x8a6240, 1);
      deck.fillRect(px, CHAO_Y - 30, 1, 24);
    }
    deck.fillStyle(0xa87f4e, 1);
    deck.fillRect(780, CHAO_Y - 30, 114, 2);
    deck.fillStyle(0x8a6240, 1);
    deck.fillRect(780, CHAO_Y - 18, 114, 1);
    // banco
    deck.fillStyle(0x8a6240, 1);
    deck.fillRect(800, CHAO_Y - 14, 22, 3);
    deck.fillStyle(0xa87f4e, 1);
    deck.fillRect(800, CHAO_Y - 14, 22, 1);
    deck.fillStyle(0x5a3a24, 1);
    deck.fillRect(802, CHAO_Y - 11, 2, 5);
    deck.fillRect(818, CHAO_Y - 11, 2, 5);
    // luneta do mirante
    deck.fillStyle(0x2c7f7a, 1);
    deck.fillRect(866, CHAO_Y - 36, 12, 5);
    deck.fillStyle(0x4fd6c4, 1);
    deck.fillRect(866, CHAO_Y - 36, 12, 1);
    deck.fillStyle(0x3f445c, 1);
    deck.fillRect(871, CHAO_Y - 31, 2, 25);

    this.criarPassaros("gaivotaV");
  }

  // ---------- texturas ----------

  private criarTexturas(): void {
    criarTexturaMala(this);
    criarTexturaNuvem(this);

    // mala de rodinha (variante com haste e rodinhas)
    if (!this.textures.exists("malaRodinha")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x3d2a1a, 1);
      g.fillRect(4, 0, 4, 1); // punho
      g.fillRect(4, 1, 1, 3);
      g.fillRect(7, 1, 1, 3); // haste
      g.fillStyle(0x6b4a2f, 1);
      g.fillRect(1, 4, 10, 9); // corpo
      g.fillStyle(0x8a6240, 1);
      g.fillRect(1, 4, 10, 1);
      g.fillRect(1, 7, 10, 2); // faixa
      g.fillStyle(0x1d2140, 1);
      g.fillRect(2, 13, 2, 2);
      g.fillRect(8, 13, 2, 2); // rodinhas
      g.generateTexture("malaRodinha", 12, 15);
      g.destroy();
    }

    // polaroids coletáveis: 2 frames de inclinação por local
    MINIS_POLAROID.forEach((mini, i) => {
      const grid = gridPolaroid(mini);
      createTextureFromData(this, `polaroid${i}_a`, {
        palette: POLAROID_PAL,
        grid: inclinarGrid(grid, 1),
      });
      createTextureFromData(this, `polaroid${i}_b`, {
        palette: POLAROID_PAL,
        grid: inclinarGrid(grid, -1),
      });
    });

    if (!this.textures.exists("fotoGlow")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      const centro = 12;
      for (const [r, a] of [
        [11, 0.12],
        [8, 0.2],
        [6, 0.3],
      ] as Array<[number, number]>) {
        g.fillStyle(0x4fd6c4, a);
        for (let dy = -r; dy <= r; dy++) {
          const w = (r - Math.abs(dy)) * 2 + 1;
          g.fillRect(centro - (w - 1) / 2, centro + dy, w, 1);
        }
      }
      g.generateTexture("fotoGlow", 24, 24);
      g.destroy();
    }

    // bandeira do Chile (estrela, azul, branco, vermelho)
    if (!this.textures.exists("bandeiraChile")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 16, 5);
      g.fillStyle(0x2a4a9c, 1);
      g.fillRect(0, 0, 6, 5);
      g.fillStyle(0xffffff, 1);
      g.fillRect(2, 1, 2, 2); // estrela (aproximada)
      g.fillRect(1, 2, 4, 1);
      g.fillStyle(0xc0392b, 1);
      g.fillRect(0, 5, 16, 5);
      g.generateTexture("bandeiraChile", 16, 10);
      g.destroy();
    }

    // coração, pássaro e gaivota
    if (!this.textures.exists("coracaoV")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xff7aa2, 1);
      [".X.X.", "XXXXX", "XXXXX", ".XXX.", "..X.."].forEach((row, yy) => {
        [...row].forEach((ch, xx) => {
          if (ch === "X") g.fillRect(xx, yy, 1, 1);
        });
      });
      g.generateTexture("coracaoV", 5, 5);
      g.destroy();
    }
    for (const [key, cor] of [
      ["passaroV", 0x3a3540],
      ["gaivotaV", 0xf2f6fc],
    ] as Array<[string, number]>) {
      if (this.textures.exists(key)) continue;
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(cor, 1);
      g.fillRect(0, 0, 1, 1);
      g.fillRect(6, 0, 1, 1);
      g.fillRect(1, 1, 1, 1);
      g.fillRect(5, 1, 1, 1);
      g.fillRect(2, 2, 3, 1);
      g.generateTexture(key, 7, 3);
      g.destroy();
    }

    // NPCs 32x48 (recolor da base) + fila do aeroporto
    createTextureFromData(this, "npcCompletos", { palette: PALETTE_COMPLETOS, grid: PESSOA_GRID });
    createTextureFromData(this, "npcTurista", { palette: PALETTE_TURISTA, grid: PESSOA_GRID });
    createTextureFromData(this, "npcVinho", { palette: PALETTE_VINHO, grid: PESSOA_GRID });
    createTextureFromData(this, "filaA", { palette: PALETTE_FILA_A, grid: PESSOA_GRID });
    createTextureFromData(this, "filaB", { palette: PALETTE_FILA_B, grid: PESSOA_GRID });
    VIOLONISTA_FRAMES.forEach((data, i) => createTextureFromData(this, `violonista${i}`, data));
    createTextureFromData(this, "gatoA", GATO_FRAME_A);
    createTextureFromData(this, "gatoB", GATO_FRAME_B);

    // mapa gigante do turista
    if (!this.textures.exists("mapaGigante")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x9aa2b8, 1);
      g.fillRect(0, 0, 22, 16);
      g.fillStyle(0xf2f0f7, 1);
      g.fillRect(1, 1, 20, 14);
      g.fillStyle(0xc4c8d8, 1);
      g.fillRect(10, 1, 1, 14); // dobra
      g.fillStyle(0x58b868, 1);
      g.fillRect(3, 3, 4, 3); // parque
      g.fillStyle(0x4fa0d8, 1);
      g.fillRect(15, 10, 4, 3); // lago
      g.fillStyle(0xe05a4a, 1); // rota pontilhada
      for (const [px, py] of [
        [4, 11],
        [7, 9],
        [10, 7],
        [13, 5],
        [16, 4],
      ])
        g.fillRect(px, py, 1, 1);
      g.fillRect(17, 2, 2, 2); // X do destino
      g.generateTexture("mapaGigante", 22, 16);
      g.destroy();
    }

    // taça de vinho
    if (!this.textures.exists("tacaVinho")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xdfe8f4, 1);
      g.fillRect(0, 0, 1, 4);
      g.fillRect(6, 0, 1, 4); // bordas do bojo
      g.fillStyle(0xa03460, 1);
      g.fillRect(1, 1, 5, 3); // vinho
      g.fillStyle(0xdfe8f4, 1);
      g.fillRect(1, 4, 5, 1); // base do bojo
      g.fillRect(3, 5, 1, 3); // haste
      g.fillRect(1, 8, 5, 1); // pé
      g.generateTexture("tacaVinho", 7, 9);
      g.destroy();
    }

    // nota musical ♪ (traço de 1px)
    if (!this.textures.exists("notaMusical")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xf2f0f7, 1);
      g.fillRect(3, 0, 1, 5); // haste
      g.fillRect(4, 0, 1, 2); // bandeirola
      g.fillRect(0, 4, 3, 3); // cabeça
      g.generateTexture("notaMusical", 5, 7);
      g.destroy();
    }

    // violão
    if (!this.textures.exists("violao")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x8a5a28, 1);
      g.fillCircle(5, 6, 4);
      g.fillCircle(8, 5, 3);
      g.fillStyle(0xb8804a, 1);
      g.fillCircle(5, 5, 3);
      g.fillStyle(0x2a1810, 1);
      g.fillRect(4, 4, 2, 2); // boca
      g.fillStyle(0x5a3a1c, 1);
      g.fillRect(9, 3, 6, 2); // braço
      g.fillRect(15, 2, 2, 4); // mão do braço
      g.fillStyle(0xe8e6f2, 1);
      g.fillRect(5, 4, 10, 1); // cordas
      g.generateTexture("violao", 17, 11);
      g.destroy();
    }
  }
}
