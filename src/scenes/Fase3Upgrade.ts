import Phaser from "phaser";
import { DIALOGOS, falaSegura } from "../dialogos";
import { UI, GAME_WIDTH, GAME_HEIGHT, FONT_SM } from "../ui/constants";
import { fadeIn } from "../ui/transitions";
import { TouchControls } from "../ui/TouchControls";
import { UpdateWindow } from "../ui/UpdateWindow";
import { createTextureFromData } from "../sprites/factory";
import { RAFITCHO, RAFITCHO_SENTADO_FRAMES } from "../sprites/data";
import { atualizarAndar } from "../sprites/anims";

/**
 * Fase 3 — "O Upgrade" (a virada)
 * Intro roteirizada: a Gabitcha entra, desabafa, e o Rafitcho propõe
 * montar o currículo — as 5 qualidades materializam no quarto.
 * Metade 1: coletar as badges-medalhão que enchem o CURRÍCULO.DOC.
 * Metade 2: escritório cinza que ganha vida a cada lâmpada de ideia.
 * Título: janela de atualização de sistema (UpdateWindow).
 */

const VELOCIDADE = 150;
const GABITCHA_Y = GAME_HEIGHT - 32;
const ALCANCE_COLETA = 18;

const CORES_QUALIDADES = [0x4fd6c4, 0xe9b44c, 0xffd94a, 0xff7aa2, 0x8a6fd8];
const MONITOR_QUARTO = { x: 293, y: 135 }; // pra onde as badges voam
const RAFITCHO_SENTADO_POS = { x: 262, y: 145 };

// Ícones 10px das qualidades (silhuetas escuras, legíveis no medalhão)
const ICONE_BALAO = [
  ".XXXXXXXX.",
  "XXXXXXXXXX",
  "XXXXXXXXXX",
  "XXXXXXXXXX",
  "XXXXXXXXXX",
  ".XXXXXXXX.",
  "..XXX.....",
  ".XX.......",
];
const ICONE_LAMPADA = [
  "...XXXX...",
  "..XXXXXX..",
  "..XXXXXX..",
  "..XXXXXX..",
  "...XXXX...",
  "...XXXX...",
  "....XX....",
  "...XXXX...",
  "...XXXX...",
];
const ICONE_SOL = [
  "X...X...X",
  ".X..X..X.",
  "..XXXXX..",
  "..XXXXX..",
  "XXXXXXXXX",
  "..XXXXX..",
  "..XXXXX..",
  ".X..X..X.",
  "X...X...X",
];
const ICONE_ESTRELA = [
  "....X....",
  "....X....",
  "...XXX...",
  "XXXXXXXXX",
  ".XXXXXXX.",
  "..XXXXX..",
  "..XX.XX..",
  ".XX...XX.",
  ".X.....X.",
];
const ICONE_MASCARA = [
  ".XXXXXXXX.",
  "XXXXXXXXXX",
  "XX..XX..XX",
  "XXXXXXXXXX",
  "XXX....XXX",
  ".XX....XX.",
  ".XXXXXXXX.",
  "..XXXXXX..",
  "...XXXX...",
];
const ICONES_QUALIDADES = [ICONE_BALAO, ICONE_LAMPADA, ICONE_SOL, ICONE_ESTRELA, ICONE_MASCARA];

const SETA_BAIXO = ["..XXX..", "..XXX..", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."];

// Lâmpada de ideia coletável (metade 2)
const LAMPADA_IDEIA = {
  palette: { k: "#8a5a1a", X: "#f0cd7a", x: "#e9b44c", b: "#8a8fa8" },
  grid: [
    ".kkkkk.",
    "kXXXXXk",
    "kXXXXxk",
    "kXXXXxk",
    ".kXXxk.",
    ".kXXxk.",
    "..bbb..",
    "..bbb..",
    "...b...",
  ],
};

// ------------------------------------------------------------
// Pessoas 32x48 derivadas do Rafitcho (mesma técnica da Fase 2)
// ------------------------------------------------------------

function sobrepor(linha: string, col: number, trecho: string): string {
  return linha.slice(0, col) + trecho + linha.slice(col + trecho.length);
}

const PESSOA_GRID = RAFITCHO.grid.map((linha, i) => {
  if (i === 11) return linha.replace(/G/g, "k");
  return linha.replace(/G/g, "s").replace(/P/g, "t").replace(/T/g, "t");
});

const PESSOA_SERIA_GRID = (() => {
  const g = [...PESSOA_GRID];
  g[17] = sobrepor(g[17], 12, "ssMMMMss");
  g[18] = sobrepor(g[18], 13, "ssssss");
  return g;
})();

function palettePessoa(
  cabelo: [string, string, string],
  pele: [string, string, string],
  camisa: [string, string, string],
  calca: [string, string, string],
  tenis: [string, string]
): Record<string, string> {
  return {
    k: cabelo[0],
    h: cabelo[1],
    H: cabelo[2],
    d: pele[0],
    s: pele[1],
    S: pele[2],
    W: "#ffffff",
    I: "#5a3a22",
    p: "#1a0f08",
    M: "#5a2a2a",
    R: "#c96a55",
    o: camisa[0],
    t: camisa[1],
    u: camisa[2],
    j: calca[0],
    J: calca[1],
    y: calca[2],
    v: tenis[0],
    w: tenis[1],
  };
}

const COLEGA_CINZA: Record<string, string> = {
  k: "#3a3a42",
  h: "#4a4a55",
  H: "#5a5a66",
  d: "#8a8078",
  s: "#a89a8e",
  S: "#b8aa9e",
  W: "#d8d8dc",
  I: "#4a4a50",
  p: "#2a2a30",
  M: "#5a5158",
  R: "#a89a8e",
  o: "#4a4c55",
  t: "#63656e",
  u: "#7a7c88",
  j: "#3f3f48",
  J: "#52525e",
  y: "#646476",
  v: "#5a5a64",
  w: "#9a9aa4",
};

const COLEGAS_COLORIDOS: Record<string, string>[] = [
  palettePessoa(
    ["#1a1114", "#2e1d22", "#4a3038"],
    ["#c68a62", "#e0a87c", "#f0c49a"],
    ["#5a1f28", "#a03448", "#c14a5a"],
    ["#1c2236", "#2c3854", "#40507a"],
    ["#6b7080", "#c2c6d0"]
  ),
  palettePessoa(
    ["#241812", "#4a3020", "#6b4a2f"],
    ["#7d5430", "#a5713f", "#c08d55"],
    ["#1a2a5a", "#31479c", "#4a63c4"],
    ["#2a1d16", "#4a3320", "#6b4a2f"],
    ["#6b7080", "#c2c6d0"]
  ),
  palettePessoa(
    ["#5a4318", "#8a6a2f", "#b08d3f"],
    ["#c68a62", "#e0a87c", "#f0c49a"],
    ["#6b4a14", "#b8801f", "#d9a441"],
    ["#1c2236", "#2c3854", "#40507a"],
    ["#6b7080", "#c2c6d0"]
  ),
];

interface Badge {
  cont: Phaser.GameObjects.Container;
  glow: Phaser.GameObjects.Image;
  placa: Phaser.GameObjects.Container;
  destaque: Phaser.GameObjects.Container;
  x: number;
  alturaBase: number;
  indice: number;
  coletada: boolean;
}

interface Lampada {
  cont: Phaser.GameObjects.Container;
  x: number;
  coletada: boolean;
}

type Etapa = "titulo" | "intro" | "quarto" | "corte" | "escritorio" | "fim";

export class Fase3Upgrade extends Phaser.Scene {
  private gabitcha!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private teclasAD!: { A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private espaco!: Phaser.Input.Keyboard.Key;
  private touch!: TouchControls;

  private etapa: Etapa = "titulo";
  private paradaMs = 0;
  private ultimaDirecao = 0;

  // metade 1
  private objetosQuarto: Phaser.GameObjects.GameObject[] = [];
  private badges: Badge[] = [];
  private badgesColetadas = 0;
  private barraCV!: Phaser.GameObjects.Graphics;
  private checklist: Phaser.GameObjects.Text[] = [];
  private rafitchoSentado: Phaser.GameObjects.Image | null = null;
  private rafitchoFelizAte = 0;

  // metade 2
  private lampadas: Lampada[] = [];
  private lampadasColetadas = 0;
  private ideiasTexto!: Phaser.GameObjects.Text;
  private colegasEscritorio: Phaser.GameObjects.Image[] = [];
  private paredeColorida!: Phaser.GameObjects.Graphics;
  private plantas: Phaser.GameObjects.Graphics | null = null;
  private quadros: Phaser.GameObjects.Graphics | null = null;
  private janelasQuentes: Phaser.GameObjects.Graphics | null = null;
  private letreiro: Phaser.GameObjects.Container | null = null;

  private balaoAtual: {
    cont: Phaser.GameObjects.Container;
    timer: Phaser.Time.TimerEvent;
  } | null = null;

  constructor() {
    super("Fase3Upgrade");
  }

  create(): void {
    this.etapa = "titulo";
    this.paradaMs = 0;
    this.ultimaDirecao = 0;
    this.objetosQuarto = [];
    this.badges = [];
    this.badgesColetadas = 0;
    this.rafitchoSentado = null;
    this.rafitchoFelizAte = 0;
    this.checklist = [];
    this.lampadas = [];
    this.lampadasColetadas = 0;
    this.colegasEscritorio = [];
    this.plantas = null;
    this.quadros = null;
    this.janelasQuentes = null;
    this.letreiro = null;
    this.balaoAtual = null;

    fadeIn(this);
    this.criarTexturas();
    this.montarQuarto();

    // ela começa fora da tela: entra andando na intro
    this.gabitcha = this.physics.add.sprite(-20, GABITCHA_Y, "gabitcha");
    (this.gabitcha.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.gabitcha.setDepth(10);
    this.tweens.add({
      targets: this.gabitcha,
      y: GABITCHA_Y - 2,
      duration: 350,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.teclasAD = this.input.keyboard!.addKeys("A,D") as {
      A: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
    };
    this.espaco = this.input.keyboard!.addKey("SPACE");
    this.touch = new TouchControls(this);

    new UpdateWindow(this).mostrar(
      DIALOGOS.fase3.instalando,
      DIALOGOS.fase3.concluido,
      () => this.iniciarIntro()
    );

    // cintilo ocasional de 1px nas badges ("me pega!")
    this.time.addEvent({
      delay: 450,
      loop: true,
      callback: () => {
        if (this.etapa !== "quarto" && this.etapa !== "intro") return;
        const vivas = this.badges.filter((b) => !b.coletada && b.cont.visible);
        if (vivas.length === 0) return;
        const b = vivas[Phaser.Math.Between(0, vivas.length - 1)];
        const px = this.add
          .rectangle(
            b.cont.x + Phaser.Math.Between(-9, 9),
            b.cont.y + Phaser.Math.Between(-9, 9),
            1,
            1,
            0xffffff
          )
          .setDepth(7);
        this.tweens.add({ targets: px, alpha: 0, duration: 260, onComplete: () => px.destroy() });
      },
    });
  }

  // ---------- intro roteirizada ----------

  private iniciarIntro(): void {
    this.etapa = "intro";
    // ela entra andando pela esquerda e para perto do Rafitcho
    this.gabitcha.setFlipX(false);
    this.tweens.add({
      targets: this.gabitcha,
      x: 214,
      duration: 1500,
      ease: "Linear",
      onComplete: () => {
        this.gabitcha.setCollideWorldBounds(true);
        this.dialogoIntro(0);
      },
    });
  }

  private dialogoIntro(i: number): void {
    const falas = DIALOGOS.fase3.intro;
    if (i >= falas.length) {
      this.materializarBadges();
      return;
    }
    const deGabitcha = i % 2 === 0;
    const x = deGabitcha ? this.gabitcha.x : RAFITCHO_SENTADO_POS.x;
    const topoY = deGabitcha ? this.gabitcha.y - 24 : RAFITCHO_SENTADO_POS.y - 19;
    this.mostrarBalaoTexto(x, topoY, falaSegura(falas[i]), 2400, 240);
    this.time.delayedCall(2500, () => this.dialogoIntro(i + 1));
  }

  /** As 5 badges materializam uma a uma, respondendo ao "olha em volta". */
  private materializarBadges(): void {
    this.badges.forEach((badge, i) => {
      this.time.delayedCall(i * 300, () => {
        badge.cont.setVisible(true).setScale(0);
        this.tweens.add({
          targets: badge.cont,
          scaleX: 1, // tween transitório de animação (pop)
          scaleY: 1,
          duration: 260,
          ease: "Back.easeOut",
          onComplete: () => {
            badge.placa.setVisible(true);
            this.iniciarBobBadge(badge);
          },
        });
        this.particulas(badge.x, badge.alturaBase, CORES_QUALIDADES[badge.indice], 6);
      });
    });
    this.time.delayedCall(5 * 300 + 500, () => this.painelObjetivo());
  }

  private iniciarBobBadge(badge: Badge): void {
    this.tweens.add({
      targets: badge.cont,
      y: badge.alturaBase - 2,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: badge.indice * 160, // bob alternado entre badges
    });
  }

  private painelObjetivo(): void {
    const painel = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 4, 280, 72, 0x0b0d1a, 0.82)
      .setStrokeStyle(1, UI.linha)
      .setDepth(59);
    const objetivo = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 22, DIALOGOS.fase3.objetivo, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.douradoYuumitcha,
        align: "center",
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setDepth(60);
    const controles = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 2, DIALOGOS.fase3.controles, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
      })
      .setOrigin(0.5)
      .setDepth(60);
    const comecar = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 22, DIALOGOS.fase3.comecar, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setAlpha(0.7);
    this.tweens.add({ targets: comecar, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });

    const iniciar = () => {
      [painel, objetivo, controles, comecar].forEach((o) => o.destroy());
      this.etapa = "quarto";
    };
    this.input.once("pointerdown", iniciar);
    this.input.keyboard?.once("keydown-SPACE", iniciar);
  }

  // ---------- loop ----------

  update(_time: number, delta: number): void {
    if (this.etapa !== "quarto" && this.etapa !== "escritorio") {
      this.gabitcha?.setVelocityX(0);
      return;
    }

    const esquerda = this.cursors.left.isDown || this.teclasAD.A.isDown || this.touch.esquerda;
    const direita = this.cursors.right.isDown || this.teclasAD.D.isDown || this.touch.direita;
    const direcao = esquerda ? -1 : direita ? 1 : 0;

    if (esquerda) {
      this.gabitcha.setVelocityX(-VELOCIDADE);
      this.gabitcha.setFlipX(true);
    } else if (direita) {
      this.gabitcha.setVelocityX(VELOCIDADE);
      this.gabitcha.setFlipX(false);
    } else {
      this.gabitcha.setVelocityX(0);
    }
    if (direcao !== 0 && direcao !== this.ultimaDirecao) this.aplicarSquash();
    this.ultimaDirecao = direcao;
    atualizarAndar(this.gabitcha, "gabitcha", direcao !== 0);
    this.paradaMs = direcao === 0 ? this.paradaMs + delta : 0;

    const coletando = this.espaco.isDown || this.paradaMs > 250;

    if (this.etapa === "quarto") {
      for (const b of this.badges) {
        if (b.coletada || !b.cont.visible) continue;
        const perto = Math.abs(this.gabitcha.x - b.x) < ALCANCE_COLETA;
        b.glow.setVisible(perto);
        b.destaque.setVisible(perto);
        if (perto && coletando) {
          this.coletarBadge(b);
          break;
        }
      }
    } else if (this.etapa === "escritorio" && coletando) {
      for (const l of this.lampadas) {
        if (!l.coletada && Math.abs(this.gabitcha.x - l.x) < ALCANCE_COLETA) {
          this.coletarLampada(l);
          break;
        }
      }
    }
  }

  private aplicarSquash(): void {
    this.gabitcha.setScale(1);
    this.tweens.add({
      targets: this.gabitcha,
      scaleX: 1.15, // tween transitório de animação (exceção permitida)
      scaleY: 0.85,
      duration: 70,
      yoyo: true,
      onComplete: () => this.gabitcha.setScale(1),
    });
  }

  // ---------- metade 1: o quarto ----------

  private montarQuarto(): void {
    this.cameras.main.setBackgroundColor(0x3a2c26);
    const g = this.add.graphics().setDepth(-8);
    this.objetosQuarto.push(g);

    // parede quente + rodapé + chão de madeira
    g.fillStyle(0x4a3830, 1);
    g.fillRect(0, 0, GAME_WIDTH, 126);
    g.fillStyle(0x5a443a, 1);
    g.fillRect(0, 0, GAME_WIDTH, 10);
    g.fillStyle(0x2e211c, 1);
    g.fillRect(0, 124, GAME_WIDTH, 3);
    g.fillStyle(0x6b4a2f, 1);
    g.fillRect(0, 127, GAME_WIDTH, GAME_HEIGHT - 127);
    g.fillStyle(0x5a3b24, 1);
    for (let py = 133; py < GAME_HEIGHT; py += 10) g.fillRect(0, py, GAME_WIDTH, 1);
    g.fillStyle(0x7a5436, 1);
    for (let px = 0; px < GAME_WIDTH; px += 34) g.fillRect(px + ((px / 34) % 3) * 8, 128, 12, 1);

    // mesinha + abajur âmbar com glow em degraus
    g.fillStyle(0x3a2517, 1);
    g.fillRect(14, 138, 22, 3);
    g.fillRect(16, 141, 2, 12);
    g.fillRect(30, 141, 2, 12);
    g.fillStyle(0x8a5a2a, 1);
    g.fillRect(23, 128, 2, 10);
    g.fillStyle(0xe9b44c, 1);
    g.fillRect(18, 120, 12, 8);
    g.fillStyle(0xf0cd7a, 1);
    g.fillRect(18, 120, 12, 2);
    g.fillStyle(0xffd98a, 0.16);
    g.fillRect(10, 128, 28, 14);
    g.fillStyle(0xffd98a, 0.08);
    g.fillRect(4, 128, 40, 24);

    // janela: noite + mini-skyline da Fase 1
    g.fillStyle(0x2e211c, 1);
    g.fillRect(38, 26, 50, 56);
    g.fillStyle(0x101223, 1);
    g.fillRect(41, 29, 44, 50);
    g.fillStyle(0xfff3cf, 1);
    g.fillRect(74, 34, 4, 4);
    g.fillStyle(0xffffff, 1);
    g.fillRect(46, 33, 1, 1);
    g.fillRect(56, 38, 1, 1);
    g.fillRect(66, 31, 1, 1);
    g.fillStyle(0x1d2140, 1);
    g.fillRect(41, 58, 8, 21);
    g.fillRect(51, 52, 7, 27);
    g.fillRect(60, 62, 9, 17);
    g.fillRect(71, 55, 8, 24);
    g.fillStyle(0xe9b44c, 0.85);
    g.fillRect(43, 62, 1, 2);
    g.fillRect(53, 56, 1, 2);
    g.fillRect(63, 66, 1, 2);
    g.fillRect(73, 60, 1, 2);
    g.fillRect(46, 70, 1, 2);
    g.fillRect(55, 66, 1, 2);
    g.fillStyle(0x2e211c, 1);
    g.fillRect(62, 29, 2, 50);
    g.fillRect(41, 53, 44, 2);

    // cama com colcha de 2 tons
    g.fillStyle(0x3a2517, 1);
    g.fillRect(96, 118, 4, 34);
    g.fillStyle(0x5a3b24, 1);
    g.fillRect(96, 118, 2, 34);
    g.fillStyle(0xf2f0f7, 1);
    g.fillRect(100, 128, 12, 6);
    g.fillStyle(0xc14a5a, 1);
    g.fillRect(100, 134, 52, 12);
    g.fillStyle(0xa03448, 1);
    g.fillRect(100, 141, 52, 5);
    g.fillStyle(0xe2867d, 1);
    for (let qx = 104; qx < 148; qx += 8) g.fillRect(qx, 136, 3, 2);
    g.fillStyle(0x3a2517, 1);
    g.fillRect(100, 146, 52, 4);
    g.fillRect(102, 150, 3, 5);
    g.fillRect(146, 150, 3, 5);

    // estante com livros coloridos
    g.fillStyle(0x3a2517, 1);
    g.fillRect(166, 64, 40, 88);
    g.fillStyle(0x241812, 1);
    g.fillRect(169, 68, 34, 22);
    g.fillRect(169, 94, 34, 22);
    g.fillRect(169, 120, 34, 28);
    const coresLivros = [0xff7aa2, 0x4fd6c4, 0xe9b44c, 0xe8e6f2, 0xc14a5a, 0x8a6fd8, 0x4a63c4];
    coresLivros.forEach((cor, i) => {
      const h = 14 + (i % 3) * 2;
      g.fillStyle(cor, 1);
      g.fillRect(171 + i * 4, 90 - h, 3, h);
      g.fillRect(171 + ((i * 5 + 2) % 28), 116 - h, 3, h);
    });
    g.fillStyle(0x4fd6c4, 1);
    g.fillRect(174, 124, 6, 8);
    g.fillStyle(0xe9b44c, 1);
    g.fillRect(190, 126, 8, 6);

    // poster de anime
    g.fillStyle(0xe8e6f2, 1);
    g.fillRect(214, 32, 24, 34);
    g.fillStyle(0x2a2432, 1);
    g.fillRect(215, 33, 22, 32);
    g.fillStyle(0x4fd6c4, 1);
    g.fillRect(215, 33, 22, 4);
    g.fillStyle(0xff7aa2, 1);
    g.fillRect(220, 42, 12, 16);
    g.fillStyle(0xffffff, 1);
    g.fillRect(223, 46, 2, 2);
    g.fillRect(228, 46, 2, 2);

    // escrivaninha + monitor (altura casada com o Rafitcho sentado)
    g.fillStyle(0x3a2517, 1);
    g.fillRect(248, 150, 58, 4);
    g.fillRect(250, 154, 3, 12);
    g.fillRect(301, 154, 3, 12);
    g.fillStyle(0x5a3b24, 1);
    g.fillRect(248, 150, 58, 1);
    g.fillStyle(0x0b0d1a, 1);
    g.fillRect(280, 124, 26, 22);
    g.fillStyle(0x1d2140, 1);
    g.fillRect(291, 146, 4, 4);

    const tela = this.add
      .rectangle(MONITOR_QUARTO.x, MONITOR_QUARTO.y, 22, 18, 0x4fd6c4, 0.35)
      .setDepth(-7);
    this.tweens.add({ targets: tela, alpha: 0.15, duration: 320, yoyo: true, repeat: -1 });
    this.objetosQuarto.push(tela);

    // luz da tela refletida no rosto dele (pisca junto)
    const luzRosto = this.add
      .rectangle(RAFITCHO_SENTADO_POS.x + 4, RAFITCHO_SENTADO_POS.y - 10, 16, 12, 0x4fd6c4, 0.12)
      .setDepth(-5);
    this.tweens.add({ targets: luzRosto, alpha: 0.04, duration: 320, yoyo: true, repeat: -1 });
    this.objetosQuarto.push(luzRosto);

    // Rafitcho sentado digitando (sprite novo de data.ts, 2 frames + feliz)
    const sentado = this.add
      .image(RAFITCHO_SENTADO_POS.x, RAFITCHO_SENTADO_POS.y, "rafSentado0")
      .setDepth(-6);
    this.rafitchoSentado = sentado;
    this.objetosQuarto.push(sentado);
    let frameDigita = 0;
    this.time.addEvent({
      delay: 220,
      loop: true,
      callback: () => {
        if (!sentado.active) return;
        if (this.time.now < this.rafitchoFelizAte) return; // segurando o sorriso
        frameDigita = 1 - frameDigita;
        sentado.setTexture(frameDigita === 0 ? "rafSentado0" : "rafSentado1");
      },
    });

    // HUD à direita: CURRÍCULO.DOC + checklist das 5 qualidades
    const cvLabel = this.add
      .text(GAME_WIDTH - 6, 6, DIALOGOS.fase3.cvDoc, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
      })
      .setOrigin(1, 0)
      .setDepth(50);
    this.barraCV = this.add.graphics().setDepth(50);
    this.objetosQuarto.push(cvLabel, this.barraCV);
    this.desenharBarraCV();

    DIALOGOS.fase3.qualidades.forEach((nome, i) => {
      const item = this.add
        .text(GAME_WIDTH - 6, 30 + i * 10, `· ${nome}`, {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: "#8a8fa8",
        })
        .setOrigin(1, 0)
        .setDepth(50);
      this.checklist.push(item);
      this.objetosQuarto.push(item);
    });

    this.criarBadges();
  }

  /** Badges-medalhão: douradas, nome sempre visível, destaque ao encostar. */
  private criarBadges(): void {
    const posicoes = [48, 92, 148, 204, 256];
    const alturas = [88, 116, 88, 116, 88];

    DIALOGOS.fase3.qualidades.forEach((nome, i) => {
      const x = posicoes[i];
      const alturaBase = alturas[i];

      const glow = this.add.image(0, 0, "badgeGlow").setVisible(false);
      const medalha = this.add.image(0, 0, "medalhao");
      const icone = this.add.image(0, 0, `qIcone${i}`);
      const cont = this.add
        .container(x, alturaBase, [glow, medalha, icone])
        .setDepth(5)
        .setVisible(false); // materializa na intro

      // plaquinha com o nome SEMPRE visível
      const rotulo = this.add
        .text(0, 0, nome, {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: "#ffffff",
        })
        .setOrigin(0.5);
      const fundoPlaca = this.add
        .rectangle(0, 0, rotulo.width + 6, 12, 0x101223, 0.7);
      const placaX = Phaser.Math.Clamp(
        x,
        (rotulo.width + 6) / 2 + 2,
        GAME_WIDTH - (rotulo.width + 6) / 2 - 2
      );
      const placa = this.add
        .container(placaX, alturaBase + 18, [fundoPlaca, rotulo])
        .setDepth(6)
        .setVisible(false);

      // destaque de proximidade: seta ↓ + hint ESPAÇO
      const seta = this.add.image(0, 0, "setaBaixo");
      const hint = this.add
        .text(0, -12, DIALOGOS.fase3.hintColeta, {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: UI.douradoYuumitcha,
        })
        .setOrigin(0.5);
      const destaque = this.add
        .container(x, alturaBase - 22, [seta, hint])
        .setDepth(7)
        .setVisible(false);
      this.tweens.add({
        targets: destaque,
        y: alturaBase - 25,
        duration: 300,
        yoyo: true,
        repeat: -1,
      });

      this.badges.push({ cont, glow, placa, destaque, x, alturaBase, indice: i, coletada: false });
      this.objetosQuarto.push(cont, placa, destaque);
    });
  }

  private desenharBarraCV(): void {
    this.barraCV.clear();
    this.barraCV.fillStyle(0x1a1420, 1);
    this.barraCV.fillRect(GAME_WIDTH - 63, 17, 57, 8);
    this.barraCV.fillStyle(0xf2f0f7, 1);
    this.barraCV.fillRect(GAME_WIDTH - 62, 18, 55, 6);
    this.barraCV.fillStyle(0x2c5aa8, 1);
    for (let i = 0; i < this.badgesColetadas; i++) {
      this.barraCV.fillRect(GAME_WIDTH - 61 + i * 11, 19, 10, 4);
    }
  }

  private coletarBadge(badge: Badge): void {
    badge.coletada = true;
    badge.placa.destroy();
    badge.destaque.destroy();
    badge.glow.setVisible(false);
    this.tweens.killTweensOf(badge.cont);

    // voa em arco até o monitor, deixando rastro de partículas
    const trilha = this.time.addEvent({
      delay: 40,
      loop: true,
      callback: () => {
        const p = this.add.rectangle(badge.cont.x, badge.cont.y, 2, 2, 0xf0cd7a).setDepth(8);
        this.tweens.add({
          targets: p,
          alpha: 0,
          y: p.y + 4,
          duration: 300,
          onComplete: () => p.destroy(),
        });
      },
    });
    this.tweens.add({
      targets: badge.cont,
      x: (badge.cont.x + MONITOR_QUARTO.x) / 2,
      y: Math.min(badge.cont.y, MONITOR_QUARTO.y) - 26,
      duration: 260,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: badge.cont,
          x: MONITOR_QUARTO.x,
          y: MONITOR_QUARTO.y,
          scaleX: 0.4, // tween transitório de animação
          scaleY: 0.4,
          duration: 360,
          ease: "Quad.easeIn",
          onComplete: () => {
            trilha.remove();
            badge.cont.destroy();
            this.badgeChegou(badge);
          },
        });
      },
    });
  }

  /** A badge chegou ao monitor: ✓ no checklist, barra, e o Rafitcho sorri. */
  private badgeChegou(badge: Badge): void {
    this.particulas(MONITOR_QUARTO.x, MONITOR_QUARTO.y, 0x4fd6c4, 6);
    this.badgesColetadas++;
    this.desenharBarraCV();

    const item = this.checklist[badge.indice];
    item.setText(`✓ ${DIALOGOS.fase3.qualidades[badge.indice]}`);
    item.setColor("#4fd6c4");

    if (this.rafitchoSentado) {
      this.rafitchoSentado.setTexture("rafSentado2"); // vira e sorri
      this.rafitchoFelizAte = this.time.now + 1400;
      this.mostrarBalaoTexto(
        this.rafitchoSentado.x,
        this.rafitchoSentado.y - 19,
        falaSegura(DIALOGOS.fase3.reacoesCV[badge.indice]),
        2200
      );
    }

    if (this.badgesColetadas >= 5) {
      this.etapa = "corte";
      this.gabitcha.setVelocityX(0);
      this.time.delayedCall(2400, () => this.enviarCV());
    }
  }

  private enviarCV(): void {
    this.cameras.main.flash(120, 255, 255, 255);
    if (this.rafitchoSentado) {
      this.mostrarBalaoTexto(
        this.rafitchoSentado.x,
        this.rafitchoSentado.y - 19,
        falaSegura(DIALOGOS.fase3.enviado),
        2400
      );
    }
    this.time.delayedCall(2600, () => this.corteTresDias());
  }

  private corteTresDias(): void {
    this.fecharBalaoTexto();
    const preto = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000)
      .setDepth(150)
      .setAlpha(0);
    this.tweens.add({ targets: preto, alpha: 1, duration: 350 });

    this.time.delayedCall(450, () => {
      this.objetosQuarto.forEach((o) => o.destroy());
      this.objetosQuarto = [];
      this.badges = [];
      this.checklist = [];
      this.rafitchoSentado = null;
      this.montarEscritorio();
      this.gabitcha.setX(36).setFlipX(false);

      const texto = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, DIALOGOS.fase3.tresDias, {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: UI.texto,
        })
        .setOrigin(0.5)
        .setDepth(151);

      this.time.delayedCall(1800, () => {
        texto.destroy();
        this.tweens.add({
          targets: preto,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            preto.destroy();
            this.etapa = "escritorio";
          },
        });
      });
    });
  }

  // ---------- metade 2: o escritório ----------

  private montarEscritorio(): void {
    this.cameras.main.setBackgroundColor(0x45475a);
    const g = this.add.graphics().setDepth(-9);

    g.fillStyle(0x565866, 1);
    g.fillRect(0, 0, GAME_WIDTH, 104);
    g.fillStyle(0x4a4c58, 1);
    g.fillRect(0, 0, GAME_WIDTH, 10);
    g.fillStyle(0x3a3c4a, 1);
    g.fillRect(0, 102, GAME_WIDTH, 4);
    for (const jx of [48, 152, 256]) {
      g.fillStyle(0x3f414e, 1);
      g.fillRect(jx - 19, 22, 38, 44);
      g.fillStyle(0x6a7080, 1);
      g.fillRect(jx - 17, 24, 34, 40);
      g.fillStyle(0x3f414e, 1);
      g.fillRect(jx - 1, 24, 2, 40);
      g.fillRect(jx - 17, 43, 34, 2);
    }
    g.fillStyle(0x45475a, 1);
    g.fillRect(0, 106, GAME_WIDTH, GAME_HEIGHT - 106);
    g.fillStyle(0x3a3c4e, 1);
    for (let px = 14; px < GAME_WIDTH; px += 30) g.fillRect(px, 108, 1, GAME_HEIGHT - 108);
    g.fillRect(0, 138, GAME_WIDTH, 1);
    g.fillRect(0, 162, GAME_WIDTH, 1);

    this.paredeColorida = this.add.graphics().setDepth(-8).setAlpha(0);
    this.paredeColorida.fillStyle(0x4a8a80, 1);
    this.paredeColorida.fillRect(0, 0, GAME_WIDTH, 104);
    this.paredeColorida.fillStyle(0x5aa090, 1);
    this.paredeColorida.fillRect(0, 0, GAME_WIDTH, 10);
    this.paredeColorida.fillStyle(0x2e5a52, 1);
    this.paredeColorida.fillRect(0, 102, GAME_WIDTH, 4);
    for (const jx of [48, 152, 256]) {
      this.paredeColorida.fillStyle(0x3f414e, 1);
      this.paredeColorida.fillRect(jx - 19, 22, 38, 44);
      this.paredeColorida.fillStyle(0x6a7080, 1);
      this.paredeColorida.fillRect(jx - 17, 24, 34, 40);
      this.paredeColorida.fillStyle(0x3f414e, 1);
      this.paredeColorida.fillRect(jx - 1, 24, 2, 40);
      this.paredeColorida.fillRect(jx - 17, 43, 34, 2);
    }

    this.janelasQuentes = this.add.graphics().setDepth(-7).setAlpha(0);
    for (const jx of [48, 152, 256]) {
      this.janelasQuentes.fillStyle(0xffd9a0, 0.85);
      this.janelasQuentes.fillRect(jx - 17, 24, 34, 40);
      this.janelasQuentes.fillStyle(0xffd9a0, 0.18);
      this.janelasQuentes.fillRect(jx - 20, 66, 40, 5);
      this.janelasQuentes.fillStyle(0xffd9a0, 0.08);
      this.janelasQuentes.fillRect(jx - 23, 71, 46, 6);
      this.janelasQuentes.fillStyle(0x8a5a2a, 1);
      this.janelasQuentes.fillRect(jx - 1, 24, 2, 40);
      this.janelasQuentes.fillRect(jx - 17, 43, 34, 2);
    }

    for (let i = 0; i < 3; i++) {
      const colega = this.add.image(96 + i * 80, GABITCHA_Y - 4, "colegaEsc_cinza").setDepth(5);
      this.colegasEscritorio.push(colega);
    }

    const mesas = this.add.graphics().setDepth(6);
    for (const mx of [96, 176, 256]) {
      mesas.fillStyle(0x2e3040, 1);
      mesas.fillRect(mx - 23, 137, 46, 6);
      mesas.fillStyle(0x6a6c7a, 1);
      mesas.fillRect(mx - 22, 138, 44, 2);
      mesas.fillStyle(0x2e3040, 1);
      mesas.fillRect(mx - 20, 143, 3, 24);
      mesas.fillRect(mx + 17, 143, 3, 24);
      mesas.fillStyle(0x23242e, 1);
      mesas.fillRect(mx - 8, 122, 16, 13);
      mesas.fillStyle(0x3a3c4a, 1);
      mesas.fillRect(mx - 6, 124, 12, 9);
      mesas.fillRect(mx - 2, 135, 4, 2);
    }

    this.plantas = this.add.graphics().setDepth(7).setVisible(false);
    for (const mx of [78, 158, 238]) {
      this.plantas.fillStyle(0xa05a3a, 1);
      this.plantas.fillRect(mx - 3, 132, 7, 5);
      this.plantas.fillStyle(0x7a3f28, 1);
      this.plantas.fillRect(mx - 3, 135, 7, 2);
      this.plantas.fillStyle(0x2d5a26, 1);
      this.plantas.fillRect(mx - 1, 124, 3, 8);
      this.plantas.fillStyle(0x468a38, 1);
      this.plantas.fillRect(mx - 4, 126, 3, 4);
      this.plantas.fillRect(mx + 2, 125, 3, 5);
    }

    this.quadros = this.add.graphics().setDepth(-6).setVisible(false);
    this.quadros.fillStyle(0xe8e6f2, 1);
    this.quadros.fillRect(88, 34, 20, 16);
    this.quadros.fillStyle(0xff7aa2, 1);
    this.quadros.fillRect(90, 36, 16, 12);
    this.quadros.fillStyle(0xe9b44c, 1);
    this.quadros.fillRect(93, 39, 4, 4);
    this.quadros.fillStyle(0x4fd6c4, 1);
    this.quadros.fillRect(99, 42, 5, 3);
    this.quadros.fillStyle(0xe8e6f2, 1);
    this.quadros.fillRect(200, 32, 18, 20);
    this.quadros.fillStyle(0x4a63c4, 1);
    this.quadros.fillRect(202, 34, 14, 16);
    this.quadros.fillStyle(0xf0cd7a, 1);
    this.quadros.fillRect(205, 40, 8, 2);
    const coresPostIt = [0xffd94a, 0xff7aa2, 0x4fd6c4, 0x8a6fd8, 0xe9b44c, 0x5cc4b8];
    coresPostIt.forEach((cor, i) => {
      this.quadros!.fillStyle(cor, 1);
      this.quadros!.fillRect(118 + (i % 3) * 8, 60 + Math.floor(i / 3) * 8, 6, 6);
    });

    const letreiroFundo = this.add
      .rectangle(0, 0, 176, 26, 0xe9b44c)
      .setStrokeStyle(1, 0x8a5a1a);
    const letreiroTexto = this.add
      .text(0, 0, DIALOGOS.fase3.letreiro, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: "#3a2a20",
        align: "center",
        lineSpacing: 2,
      })
      .setOrigin(0.5);
    this.letreiro = this.add
      .container(GAME_WIDTH / 2, 88, [letreiroFundo, letreiroTexto])
      .setDepth(-6)
      .setVisible(false);

    this.add.image(GAME_WIDTH - 46, 11, "lampadaIdeia").setDepth(50);
    this.ideiasTexto = this.add
      .text(GAME_WIDTH - 6, 6, "0/6", {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.douradoYuumitcha,
      })
      .setOrigin(1, 0)
      .setDepth(50);

    const posicoes = [36, 76, 136, 196, 236, 288];
    const alturas = [100, 112, 96, 108, 98, 112];
    posicoes.forEach((x, i) => {
      const glow = this.add.image(0, 0, "lampGlow");
      const bulbo = this.add.image(0, 0, "lampadaIdeia");
      const cont = this.add.container(x, alturas[i], [glow, bulbo]).setDepth(5);
      this.tweens.add({ targets: glow, alpha: 0.35, duration: 320, yoyo: true, repeat: -1 });
      this.tweens.add({
        targets: cont,
        y: alturas[i] - 3,
        duration: 650 + i * 70,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.lampadas.push({ cont, x, coletada: false });
    });
  }

  private coletarLampada(lampada: Lampada): void {
    lampada.coletada = true;
    this.tweens.killTweensOf(lampada.cont);
    this.particulas(lampada.x, lampada.cont.y, 0xf0cd7a, 8);
    lampada.cont.destroy();

    this.lampadasColetadas++;
    this.ideiasTexto.setText(`${this.lampadasColetadas}/6`);
    this.transformar(this.lampadasColetadas);
  }

  /** Cada lâmpada transforma o escritório em camadas — o coração da fase. */
  private transformar(estagio: number): void {
    this.cameras.main.flash(90, 255, 226, 180);

    switch (estagio) {
      case 1:
        this.tweens.add({ targets: this.paredeColorida, alpha: 1, duration: 600 });
        this.particulas(GAME_WIDTH / 2, 60, 0x5aa090, 10);
        break;
      case 2:
        this.plantas?.setVisible(true).setAlpha(0);
        this.tweens.add({ targets: this.plantas, alpha: 1, duration: 400 });
        for (const mx of [78, 158, 238]) this.particulas(mx, 128, 0x468a38, 5);
        break;
      case 3:
        this.quadros?.setVisible(true).setAlpha(0);
        this.tweens.add({ targets: this.quadros, alpha: 1, duration: 400 });
        this.particulas(98, 42, 0xff7aa2, 5);
        this.particulas(130, 64, 0xffd94a, 5);
        this.particulas(209, 42, 0x4a63c4, 5);
        break;
      case 4:
        this.colegasEscritorio.forEach((colega, i) => {
          colega.setTexture(`colegaEsc_${i}`);
          const coracao = this.add.image(colega.x, colega.y - 30, "coracaoMini3").setDepth(12);
          this.tweens.add({
            targets: coracao,
            y: coracao.y - 10,
            alpha: 0,
            duration: 900,
            onComplete: () => coracao.destroy(),
          });
          this.particulas(colega.x, colega.y - 10, 0xff7aa2, 5);
        });
        this.falaColega(0);
        break;
      case 5:
        this.tweens.add({ targets: this.janelasQuentes, alpha: 1, duration: 600 });
        for (const jx of [48, 152, 256]) this.particulas(jx, 44, 0xffd9a0, 6);
        this.falaColega(1);
        break;
      case 6:
        this.letreiro?.setVisible(true).setAlpha(0);
        this.tweens.add({ targets: this.letreiro, alpha: 1, duration: 500 });
        this.particulas(GAME_WIDTH / 2, 88, 0xf0cd7a, 12);
        this.falaColega(2);
        this.finalDaFase();
        break;
    }
  }

  private falaColega(indice: number): void {
    const colega = this.colegasEscritorio[indice];
    if (!colega) return;
    this.mostrarBalaoTexto(
      colega.x,
      colega.y - 24,
      falaSegura(DIALOGOS.fase3.colegasNovos[indice]),
      2200
    );
  }

  private finalDaFase(): void {
    this.etapa = "fim";
    this.gabitcha.setVelocityX(0);

    this.cameras.main.flash(200, 255, 220, 160);
    const coresConfete = [0xff7aa2, 0x4fd6c4, 0xe9b44c, 0xffffff, 0x8a6fd8];
    this.time.addEvent({
      delay: 60,
      repeat: 22,
      callback: () => {
        const c = this.add
          .rectangle(
            Phaser.Math.Between(0, GAME_WIDTH),
            -4,
            2,
            2,
            coresConfete[Phaser.Math.Between(0, 4)]
          )
          .setDepth(60);
        this.tweens.add({
          targets: c,
          y: GAME_HEIGHT + 6,
          x: c.x + Phaser.Math.Between(-20, 20),
          duration: Phaser.Math.Between(1800, 3000),
          onComplete: () => c.destroy(),
        });
      },
    });

    const mensagem = this.add
      .text(GAME_WIDTH / 2, 12, DIALOGOS.fase3.mensagem, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
      })
      .setOrigin(0.5, 0)
      .setDepth(60)
      .setAlpha(0);
    this.tweens.add({ targets: mensagem, alpha: 1, duration: 800, delay: 400 });

    this.time.delayedCall(2600, () => {
      this.mostrarBalaoTexto(
        this.gabitcha.x,
        this.gabitcha.y - 24,
        falaSegura(DIALOGOS.fase3.final),
        2800,
        200
      );
    });

    this.time.delayedCall(5800, () => {
      this.cameras.main.fadeOut(1500, 90, 45, 20);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
        this.scene.start("Fase4Viagem")
      );
    });
  }

  // ---------- balão de texto único (sistema da Fase 2) ----------

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

    const cx = Phaser.Math.Clamp(x, w / 2 + 2, GAME_WIDTH - w / 2 - 2);
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

  // ---------- efeitos ----------

  private particulas(x: number, y: number, cor: number, quantidade: number): void {
    for (let i = 0; i < quantidade; i++) {
      const p = this.add
        .rectangle(x + Phaser.Math.Between(-6, 6), y + Phaser.Math.Between(-6, 6), 2, 2, cor)
        .setDepth(55);
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-14, 14),
        y: p.y - Phaser.Math.Between(6, 18),
        alpha: 0,
        duration: Phaser.Math.Between(350, 600),
        ease: "Quad.easeOut",
        onComplete: () => p.destroy(),
      });
    }
  }

  // ---------- texturas ----------

  private criarTexturas(): void {
    const pixelArt = (key: string, grid: string[], cor: number) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(cor, 1);
      grid.forEach((row, y) => {
        [...row].forEach((ch, x) => {
          if (ch === "X") g.fillRect(x, y, 1, 1);
        });
      });
      g.generateTexture(key, grid[0].length, grid.length);
      g.destroy();
    };

    // ícones escuros (gravados no medalhão dourado)
    ICONES_QUALIDADES.forEach((grid, i) => pixelArt(`qIcone${i}`, grid, 0x3a2a20));
    pixelArt("setaBaixo", SETA_BAIXO, 0xfff3cf);
    pixelArt("coracaoMini3", [".X.X.", "XXXXX", "XXXXX", ".XXX.", "..X.."], 0xff7aa2);

    // medalhão dourado 20x20: 3 tons + contorno + borda clara
    if (!this.textures.exists("medalhao")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x8a5a1a, 1); // contorno
      g.fillCircle(10, 10, 10);
      g.fillStyle(0xf6e2a8, 1); // borda circular clara
      g.fillCircle(10, 10, 9);
      g.fillStyle(0xb8801f, 1); // sombra interna (baixo-direita)
      g.fillCircle(11, 11, 8);
      g.fillStyle(0xe9b44c, 1); // base deslocada pra luz
      g.fillCircle(9, 9, 8);
      g.fillStyle(0xf0cd7a, 1); // brilho de canto
      g.fillRect(5, 4, 3, 1);
      g.fillRect(4, 5, 1, 3);
      g.generateTexture("medalhao", 20, 20);
      g.destroy();
    }

    // glow do medalhão: losangos concêntricos de alpha escalonado
    if (!this.textures.exists("badgeGlow")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      const centro = 14;
      for (const [r, a] of [
        [13, 0.12],
        [10, 0.2],
        [7, 0.3],
      ] as Array<[number, number]>) {
        g.fillStyle(0xf0cd7a, a);
        for (let dy = -r; dy <= r; dy++) {
          const w = (r - Math.abs(dy)) * 2 + 1;
          g.fillRect(centro - (w - 1) / 2, centro + dy, w, 1);
        }
      }
      g.generateTexture("badgeGlow", 28, 28);
      g.destroy();
    }

    createTextureFromData(this, "lampadaIdeia", LAMPADA_IDEIA);

    if (!this.textures.exists("lampGlow")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      const centro = 10;
      for (const [r, a] of [
        [9, 0.12],
        [7, 0.2],
        [5, 0.3],
      ] as Array<[number, number]>) {
        g.fillStyle(0xf0cd7a, a);
        for (let dy = -r; dy <= r; dy++) {
          const w = (r - Math.abs(dy)) * 2 + 1;
          g.fillRect(centro - (w - 1) / 2, centro + dy, w, 1);
        }
      }
      g.generateTexture("lampGlow", 20, 20);
      g.destroy();
    }

    // Rafitcho sentado (sprite de verdade, de data.ts): digitando A/B + feliz
    RAFITCHO_SENTADO_FRAMES.forEach((data, i) => {
      createTextureFromData(this, `rafSentado${i}`, data);
    });

    createTextureFromData(this, "colegaEsc_cinza", {
      palette: COLEGA_CINZA,
      grid: PESSOA_SERIA_GRID,
    });
    COLEGAS_COLORIDOS.forEach((palette, i) => {
      createTextureFromData(this, `colegaEsc_${i}`, { palette, grid: PESSOA_GRID });
    });
  }
}
