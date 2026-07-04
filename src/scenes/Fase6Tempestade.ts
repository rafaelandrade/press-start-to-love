import Phaser from "phaser";
import { DIALOGOS, falaSegura } from "../dialogos";
import { UI, GAME_WIDTH, GAME_HEIGHT, FONT_SM, FONT_MD } from "../ui/constants";
import { fadeToScene } from "../ui/transitions";
import { TouchControls } from "../ui/TouchControls";
import { createTextureFromData } from "../sprites/factory";
import { atualizarAndar, trotar, pose } from "../sprites/anims";
import { criarTexturasCoracoes } from "../ui/effects";
import { GABITCHA, RAFITCHO, RAFITCHO_SENTADO_FRAMES, YUUMITCHA, SpriteData } from "../sprites/data";
import {
  criarApartamento,
  dessaturarCor,
  APTO,
  APTO_LARGURA,
  APTO_CHAO_Y,
} from "./apartamento";

/**
 * Fase 6 — "A Tempestade" (INTOCÁVEL — inversão do arco: ELA é a força)
 * O MESMO apartamento da Fase 5, dessaturado e em penumbra, chuva na
 * janela. O apartamento é desenhado DUAS vezes (quente embaixo, cinza
 * em cima); acender cada luz abre um furo na camada cinza — a cor
 * volta em círculo crescente. A cada luz, o Rafitcho levanta a cabeça
 * um estágio. Sem inimigos, sem timer: a mecânica é a metáfora.
 */

const CHAO_Y = APTO_CHAO_Y;
const PERSONAGEM_Y = CHAO_Y - 24;
const YUUMI_Y = CHAO_Y - 8;
const VELOCIDADE = 110; // contemplativa, como a Fase 4
const ALCANCE_LUZ = 18;
const CARGA_TOTAL = 1000; // segurar 1s

const RAF_X = APTO.sofa + 6;
const NOTEBOOK_X = RAF_X + 13;

// os 5 pontos de luz (x de interação, centro do círculo de cor)
interface PontoDef {
  id: string;
  x: number;
  focoY: number;
}
const PONTOS_DEF: PontoDef[] = [
  { id: "entrada", x: 50, focoY: 100 },
  { id: "abajur", x: 118, focoY: 118 },
  { id: "vela", x: 178, focoY: 138 },
  { id: "estante", x: 330, focoY: 95 },
  { id: "cozinha", x: 452, focoY: 90 },
];

type Etapa = "titulo" | "abertura" | "acender" | "fim";

interface PontoLuz extends PontoDef {
  aceso: boolean;
  carga: number;
}

// ------------------------------------------------------------
// Poses da Yuumitcha (as mesmas da Fase 5 — cada fase registra as suas)
// ------------------------------------------------------------

const YUUMI_CORPO = YUUMITCHA.grid.slice(0, 12);
const YUUMI_RUN_A = [
  ...YUUMI_CORPO,
  "..aFa..aa....aa..aFa....",
  ".aFa...aa....aa...aFa...",
  ".aa.....a....a.....aa...",
  "........................",
];
const YUUMI_RUN_B = [
  ...YUUMI_CORPO,
  "....aFa.aa..aa.aFa......",
  "....aFaaa....aaaFa......",
  "........................",
  "........................",
];
const YUUMI_DEITADA = [
  ...Array.from({ length: 8 }, () => "........................"),
  ".........eKe......eKe...",
  ".........eKMeaaaaeKMe...",
  "........aKKefFFFfeKKa...",
  "........afEEFFFFEEFFa...",
  ".QQaaaaaFfEWFKKFEWFfa...",
  ".aFFFFFFFfeKNNKeFFFa....",
  ".aFFffffFfeKKKKeaFFa....",
  ".aaaaaaaaaaaaaaaaaaa....",
];
const YUUMI_WAG_B = [
  YUUMITCHA.grid[0],
  YUUMITCHA.grid[1],
  "..Q.....aKKefFFFfeKKa...",
  ".QQ.....afFFaaaaaFFFa...",
  "..Q.....afEEFFFFEEFFa...",
  "...aaaaaFfEWFKKFEWFfa...",
  ...YUUMITCHA.grid.slice(6),
];

// ------------------------------------------------------------
// Os 5 estágios do Rafitcho no sofá: derrotado → ereto → meio
// sorriso → sorriso (o "de pé" é o sprite normal, no final).
// Cabeça baixa = cabeça desce N px sobre os ombros (curvado).
// ------------------------------------------------------------

const LINHA_VAZIA_32 = ".".repeat(32);

/** Substitui um trecho da linha preservando o comprimento. */
function trecho(linha: string, col: number, s: string): string {
  return linha.slice(0, col) + s + linha.slice(col + s.length);
}

const CABECA_RAF = RAFITCHO.grid.slice(0, 22);

const CABECA_SERIA = (() => {
  const g = [...CABECA_RAF];
  g[17] = ".......dssssssssssssssddd......."; // sem o sorrisão
  return g;
})();

const CABECA_MEIO_SORRISO = (() => {
  const g = [...CABECA_RAF];
  g[17] = ".......dssssssMWWMssssddd.......";
  g[18] = ".......dssssssMMMMssssddd.......";
  return g;
})();

function cabecaBaixa(cabeca: string[], desloc: number): string[] {
  return [
    ...Array.from({ length: desloc }, () => LINHA_VAZIA_32),
    ...cabeca.slice(0, 22 - desloc),
  ];
}

// corpo sentado com as mãos no teclado (digitando no notebook);
// os chars da cadeira (C/c/E/r) ficam fora da paleta → transparentes
const CORPO_NOTEBOOK = RAFITCHO_SENTADO_FRAMES[1].grid.slice(22);

const RAF_ESTAGIOS: SpriteData[] = [
  { palette: { ...RAFITCHO.palette }, grid: [...cabecaBaixa(CABECA_SERIA, 3), ...CORPO_NOTEBOOK] },
  { palette: { ...RAFITCHO.palette }, grid: [...cabecaBaixa(CABECA_SERIA, 1), ...CORPO_NOTEBOOK] },
  { palette: { ...RAFITCHO.palette }, grid: [...CABECA_SERIA, ...CORPO_NOTEBOOK] },
  { palette: { ...RAFITCHO.palette }, grid: [...CABECA_MEIO_SORRISO, ...CORPO_NOTEBOOK] },
  { palette: { ...RAFITCHO.palette }, grid: RAFITCHO_SENTADO_FRAMES[1].grid },
];

// ------------------------------------------------------------
// O ABRAÇO (40x48) — O frame da fase: os dois sprites reais se
// abraçando. Ela na frente (esq), ele meio passo atrás (dir), a
// cabeça dele 1px inclinada sobre a dela, o braço dele cruzando
// as costas dela por cima.
// ------------------------------------------------------------

function desloca(linha: string, dx: number, largura: number): string {
  const saida = new Array<string>(largura).fill(".");
  [...linha].forEach((ch, i) => {
    const x = i + dx;
    if (ch !== "." && x >= 0 && x < largura) saida[x] = ch;
  });
  return saida.join("");
}

function mesclar(frente: string, tras: string): string {
  return [...frente].map((ch, i) => (ch !== "." ? ch : tras[i])).join("");
}

// remapeia os chars dele que colidem com a paleta dela
const remapRaf = (l: string) =>
  l
    .replace(/G/g, "5")
    .replace(/y/g, "4")
    .replace(/d/g, "1")
    .replace(/s/g, "2")
    .replace(/S/g, "3");

const ABRACO_GRID: string[] = (() => {
  const VAZIA_40 = ".".repeat(40);
  const g: string[] = [];
  for (let i = 0; i < 48; i++) {
    const dela = desloca(GABITCHA.grid[i], -3, 40);
    // cabeça dele desce 1px (encostada na dela); corpo alinhado no chão
    const fonte = i <= 21 ? (i >= 1 ? RAFITCHO.grid[i - 1] : null) : RAFITCHO.grid[i];
    const dele = fonte ? desloca(remapRaf(fonte), 11, 40) : VAZIA_40;
    g.push(mesclar(dela, dele));
  }
  // o braço dele cruza as costas dela (por cima do cabelo)
  g[23] = trecho(g[23], 13, "2222");
  g[24] = trecho(g[24], 7, "2222222222");
  g[25] = trecho(g[25], 6, "22222222");
  g[26] = trecho(g[26], 6, "332");
  return g;
})();

const ABRACO: SpriteData = {
  palette: {
    ...GABITCHA.palette,
    "1": "#7d5430", // pele dele (sombra)
    "2": "#a5713f",
    "3": "#c08d55",
    "4": "#40507a", // jeans brilho
    "5": "#14110f", // armação dos óculos
    M: "#5a2a2a",
    P: "#e75a8a",
    T: "#3aa6a0",
    j: "#1c2236",
    J: "#2c3854",
    v: "#6b7080",
    w: "#c2c6d0",
  },
  grid: ABRACO_GRID,
};

export class Fase6Tempestade extends Phaser.Scene {
  private gabitcha!: Phaser.Physics.Arcade.Sprite;
  private rafitcho!: Phaser.GameObjects.Image;
  private yuumi!: Phaser.GameObjects.Sprite;
  private notebook!: Phaser.GameObjects.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private teclasAD!: { A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private espaco!: Phaser.Input.Keyboard.Key;
  private touch!: TouchControls;

  private etapa: Etapa = "titulo";
  private paradaMs = 0;
  private pontos: PontoLuz[] = [];
  private acesas = 0;
  private corCompleta = false;

  // camadas da tempestade
  private objsDessat: Phaser.GameObjects.GameObject[] = [];
  private escuridao1!: Phaser.GameObjects.Rectangle;
  private escuridao2!: Phaser.GameObjects.Rectangle;
  private maskCorG!: Phaser.GameObjects.Graphics;
  private maskLuz1G!: Phaser.GameObjects.Graphics;
  private maskLuz2G!: Phaser.GameObjects.Graphics;
  private regioesCor: Array<{ x: number; y: number; r: number }> = [];

  private chuva = { intensidade: 1 };
  private relampagoTimer!: Phaser.Time.TimerEvent;

  private luzinha: Phaser.GameObjects.Image | null = null;
  private luzinhaFrameA = true;
  private litG!: Phaser.GameObjects.Graphics;
  private barraCarga!: Phaser.GameObjects.Graphics;
  private hintLuz!: Phaser.GameObjects.Text;

  private wagAcc = 0;
  private wagFrameA = true;

  private balaoAtual: {
    cont: Phaser.GameObjects.Container;
    timer: Phaser.Time.TimerEvent;
  } | null = null;

  constructor() {
    super("Fase6Tempestade");
  }

  create(): void {
    this.etapa = "titulo";
    this.paradaMs = 0;
    this.acesas = 0;
    this.corCompleta = false;
    this.objsDessat = [];
    this.regioesCor = [];
    this.chuva = { intensidade: 1 };
    this.luzinha = null;
    this.balaoAtual = null;
    this.pontos = PONTOS_DEF.map((p) => ({ ...p, aceso: false, carga: 0 }));

    this.criarTexturas();

    this.physics.world.setBounds(0, 0, APTO_LARGURA, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, APTO_LARGURA, GAME_HEIGHT);

    // camada COLORIDA embaixo (a casa como ela é de verdade)...
    criarApartamento(this, { animar: false });
    // ...e a camada CINZA por cima, mascarada pelos círculos de cor
    criarApartamento(this, {
      animar: false,
      dessaturada: true,
      aoCriar: (o) => this.objsDessat.push(o),
    });

    this.maskCorG = this.make.graphics({ x: 0, y: 0 });
    const mascaraCor = this.maskCorG.createGeometryMask();
    mascaraCor.invertAlpha = true;
    for (const o of this.objsDessat) {
      (o as Phaser.GameObjects.Graphics).setMask(mascaraCor);
    }

    // penumbra em 2 camadas (2 estágios de alpha, sem gradiente suave)
    this.maskLuz1G = this.make.graphics({ x: 0, y: 0 });
    this.maskLuz2G = this.make.graphics({ x: 0, y: 0 });
    const m1 = this.maskLuz1G.createGeometryMask();
    const m2 = this.maskLuz2G.createGeometryMask();
    m1.invertAlpha = true;
    m2.invertAlpha = true;
    this.escuridao1 = this.add
      .rectangle(APTO_LARGURA / 2, GAME_HEIGHT / 2, APTO_LARGURA, GAME_HEIGHT, 0x06070f, 0.35)
      .setDepth(30)
      .setMask(m1);
    this.escuridao2 = this.add
      .rectangle(APTO_LARGURA / 2, GAME_HEIGHT / 2, APTO_LARGURA, GAME_HEIGHT, 0x06070f, 0.35)
      .setDepth(31)
      .setMask(m2);

    this.criarPropsLuz();
    this.litG = this.add.graphics().setDepth(-3);
    this.criarChuva();

    // personagens: ele derrotado no sofá com o notebook; ela ainda não entrou
    this.rafitcho = this.add.image(RAF_X, 108, "rafStorm0").setDepth(19);
    this.notebook = this.add.image(NOTEBOOK_X, 126, "notebookLigado").setDepth(20);
    const brilhoNb = this.add.rectangle(NOTEBOOK_X, 121, 10, 6, 0x9ab8d8, 0.35).setDepth(20);
    this.tweens.add({ targets: brilhoNb, alpha: 0.12, duration: 420, yoyo: true, repeat: -1 });
    this.yuumi = this.add.sprite(APTO.balcao - 36, YUUMI_Y, "yuumitcha").setDepth(18);
    this.gabitcha = this.physics.add.sprite(APTO.porta + 4, PERSONAGEM_Y, "gabitcha");
    (this.gabitcha.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.gabitcha.setCollideWorldBounds(true);
    this.gabitcha.setDepth(20).setAlpha(0);

    this.cameras.main.centerOn(APTO.sofa + 30, GAME_HEIGHT / 2);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.teclasAD = this.input.keyboard!.addKeys("A,D") as {
      A: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
    };
    this.espaco = this.input.keyboard!.addKey("SPACE");
    this.touch = new TouchControls(this);

    this.barraCarga = this.add.graphics().setDepth(35);
    this.hintLuz = this.add
      .text(0, 0, DIALOGOS.fase6.hintLuz, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
      })
      .setOrigin(0.5)
      .setDepth(35)
      .setAlpha(0.8)
      .setVisible(false);

    this.atualizarMascaras();
    this.tituloSobrio();
  }

  // ---------- título SÓBRIO: o tom muda aqui ----------

  private tituloSobrio(): void {
    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 1)
      .setScrollFactor(0)
      .setDepth(200);
    const alvo = DIALOGOS.fase6.titulo.toUpperCase();
    const titulo = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "", {
        fontFamily: UI.fonte,
        fontSize: FONT_MD,
        color: "#e8e6f2",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201);

    // letra por letra, sem festa
    let i = 0;
    this.time.addEvent({
      delay: 110,
      repeat: alvo.length - 1,
      callback: () => titulo.setText(alvo.slice(0, ++i)),
    });

    // um relâmpago ilumina a tela uma única vez
    this.time.delayedCall(alvo.length * 110 + 600, () => {
      const flash = this.add
        .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.85)
        .setScrollFactor(0)
        .setDepth(202);
      const raio = this.add.graphics().setScrollFactor(0).setDepth(203);
      this.desenharRaio(raio, 216, 0, 62, 0x101223);
      this.time.delayedCall(50, () => flash.destroy());
      this.time.delayedCall(160, () => raio.destroy());
    });

    this.time.delayedCall(alvo.length * 110 + 2000, () => {
      this.tweens.add({
        targets: [overlay, titulo],
        alpha: 0,
        duration: 800,
        onComplete: () => {
          overlay.destroy();
          titulo.destroy();
          this.abertura();
        },
      });
    });
  }

  /** Silhueta de raio (zigue-zague de 2px). */
  private desenharRaio(g: Phaser.GameObjects.Graphics, x: number, y: number, altura: number, cor: number): void {
    g.fillStyle(cor, 1);
    const passos: Array<[number, number]> = [
      [0, 0],
      [-4, Math.round(altura * 0.25)],
      [3, Math.round(altura * 0.45)],
      [-3, Math.round(altura * 0.7)],
      [4, altura],
    ];
    for (let i = 0; i < passos.length - 1; i++) {
      const [dx1, y1] = passos[i];
      const [dx2, y2] = passos[i + 1];
      g.fillRect(x + dx1, y + y1, 2, y2 - y1); // trecho vertical
      g.fillRect(x + Math.min(dx1, dx2), y + y2, Math.abs(dx2 - dx1) + 2, 2); // degrau
    }
  }

  // ---------- abertura roteirizada (~20s) ----------

  private abertura(): void {
    this.etapa = "abertura";

    // e-mail no notebook (balão estilo janela de e-mail)
    this.time.delayedCall(600, () => {
      const g = this.add.graphics();
      g.fillStyle(0x0b0d1a, 0.9);
      g.fillRect(-102, -20, 204, 40);
      g.lineStyle(1, 0x3f4353, 1);
      g.strokeRect(-101.5, -19.5, 203, 39);
      g.fillStyle(0x1d2140, 1);
      g.fillRect(-101, -19, 202, 8); // barra de título
      g.fillStyle(0x5a5e70, 1);
      g.fillRect(96, -17, 3, 3); // "fechar"
      g.fillRect(90, -17, 3, 3);
      const assunto = this.add
        .text(0, 5, falaSegura(DIALOGOS.fase6.emailAssunto), {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: "#9aa2b8",
          align: "center",
          lineSpacing: 3,
        })
        .setOrigin(0.5);
      const email = this.add.container(RAF_X + 10, 84, [g, assunto]).setDepth(45).setAlpha(0);
      this.tweens.add({ targets: email, alpha: 1, duration: 400 });
      this.time.delayedCall(3400, () => {
        this.tweens.add({ targets: email, alpha: 0, duration: 400, onComplete: () => email.destroy() });
      });
    });

    // a Yuumitcha sente: vai até ele e deita nos pés
    this.time.delayedCall(4600, () => {
      this.andarYuumi(RAF_X + 26, 1500, () => {
        this.yuumi.setFlipX(true);
        pose(this.yuumi, "yuumiDeitada");
        this.yuumi.setY(YUUMI_Y);
      });
    });

    // a Gabitcha entra pela porta
    this.time.delayedCall(6800, () => {
      this.gabitcha.setAlpha(1);
      atualizarAndar(this.gabitcha, "gabitcha", true);
      this.tweens.add({
        targets: this.gabitcha,
        x: APTO.sofa - 58,
        duration: 2000,
        ease: "Sine.easeInOut",
        onComplete: () => atualizarAndar(this.gabitcha, "gabitcha", false),
      });
    });

    this.time.delayedCall(9200, () =>
      this.mostrarBalaoTexto(RAF_X, 92, falaSegura(DIALOGOS.fase6.abertura.raf), 2400, 200)
    );
    // ... 2 segundos de silêncio. deixar o silêncio existir ...
    this.time.delayedCall(13800, () =>
      this.mostrarBalaoTexto(
        this.gabitcha.x,
        this.gabitcha.y - 24,
        falaSegura(DIALOGOS.fase6.abertura.gab),
        3800,
        200
      )
    );

    // painel de objetivo, sóbrio
    this.time.delayedCall(18000, () => {
      const fundo = this.add
        .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 232, 42, 0x0b0d1a, 0.92)
        .setScrollFactor(0)
        .setDepth(150)
        .setStrokeStyle(1, 0x3f4353);
      const texto = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, falaSegura(DIALOGOS.fase6.objetivo), {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: UI.texto,
          align: "center",
          lineSpacing: 4,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(151);
      this.time.delayedCall(3800, () => {
        this.tweens.add({
          targets: [fundo, texto],
          alpha: 0,
          duration: 500,
          onComplete: () => {
            fundo.destroy();
            texto.destroy();
            this.iniciarAcender();
          },
        });
      });
    });
  }

  private andarYuumi(paraX: number, dur: number, aoChegar: () => void): void {
    this.yuumi.setFlipX(paraX < this.yuumi.x);
    trotar(this.yuumi);
    this.tweens.add({
      targets: this.yuumi,
      x: paraX,
      duration: dur,
      onComplete: () => {
        pose(this.yuumi, "yuumitcha");
        aoChegar();
      },
    });
  }

  private iniciarAcender(): void {
    this.etapa = "acender";
    this.cameras.main.startFollow(this.gabitcha, true, 0.08, 0.08);

    // a luzinha dela (vela de pixels, chama de 2 frames)
    this.luzinha = this.add.image(this.gabitcha.x + 9, this.gabitcha.y - 2, "luzinhaA").setDepth(21);
    this.time.addEvent({
      delay: 180,
      loop: true,
      callback: () => {
        this.luzinhaFrameA = !this.luzinhaFrameA;
        this.luzinha?.setTexture(this.luzinhaFrameA ? "luzinhaA" : "luzinhaB");
      },
    });
  }

  // ---------- chuva + relâmpago ----------

  private criarChuva(): void {
    const janelas = [
      { x: APTO.janelaSala - 28, y: 38, w: 56, h: 48 },
      { x: APTO.janelaCozinha - 20, y: 44, w: 40, h: 40 },
    ];
    this.time.addEvent({
      delay: 70,
      loop: true,
      callback: () => {
        if (this.chuva.intensidade <= 0.02) return;
        for (const j of janelas) {
          if (Math.random() > this.chuva.intensidade * 0.9) continue;
          const gota = this.add
            .rectangle(j.x + Phaser.Math.Between(4, j.w - 3), j.y + 3, 1, 3, 0x8a94b8, 0.75)
            .setDepth(-7);
          this.tweens.add({
            targets: gota,
            y: j.y + j.h - 4,
            x: gota.x - 5,
            duration: 340,
            onComplete: () => gota.destroy(),
          });
        }
      },
    });

    // relâmpago ocasional ilumina a sala por 1 frame
    this.relampagoTimer = this.time.addEvent({
      delay: Phaser.Math.Between(12000, 18000),
      loop: true,
      callback: () => {
        if (this.corCompleta) return;
        const flash = this.add
          .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xdfe8f4, 0.55)
          .setScrollFactor(0)
          .setDepth(60);
        const raio = this.add.graphics().setDepth(-7);
        this.desenharRaio(raio, APTO.janelaSala + 10, 40, 40, 0xf2f6fc);
        this.cameras.main.shake(90, 0.0015);
        this.time.delayedCall(55, () => flash.destroy());
        this.time.delayedCall(150, () => raio.destroy());
      },
    });
  }

  // ---------- pontos de luz: props apagados e acesos ----------

  private criarPropsLuz(): void {
    const g = this.add.graphics().setDepth(-3);
    const cinza = (c: number) => dessaturarCor(c);

    // arandela da entrada
    g.fillStyle(cinza(0x8a8a98), 1);
    g.fillRect(49, 58, 3, 5);
    g.fillStyle(cinza(0xc2c6d0), 1);
    g.fillRect(45, 62, 10, 9);
    g.fillStyle(cinza(0x5a5a66), 1);
    g.fillRect(46, 70, 8, 1);

    // abajur ao lado do sofá
    g.fillStyle(cinza(0x8a6240), 1);
    g.fillRect(108, CHAO_Y - 14, 20, 3); // mesinha
    g.fillRect(110, CHAO_Y - 11, 3, 11);
    g.fillRect(123, CHAO_Y - 11, 3, 11);
    g.fillStyle(cinza(0x8a8a98), 1);
    g.fillRect(117, CHAO_Y - 32, 2, 18); // haste
    g.fillStyle(cinza(0xe9b44c), 1);
    g.fillRect(110, CHAO_Y - 40, 16, 8); // cúpula
    g.fillRect(112, CHAO_Y - 42, 12, 2);

    // vela na mesa de centro (primeiro plano)
    const vela = this.add.graphics().setDepth(25);
    vela.fillStyle(cinza(0x8a8a98), 1);
    vela.fillRect(174, GAME_HEIGHT - 21, 8, 2);
    vela.fillRect(176, GAME_HEIGHT - 23, 4, 2); // castiçal
    vela.fillStyle(cinza(0xf2f0f7), 1);
    vela.fillRect(176, GAME_HEIGHT - 29, 4, 6); // vela
    vela.fillStyle(cinza(0x3a3a4a), 1);
    vela.fillRect(177, GAME_HEIGHT - 30, 1, 1); // pavio

    // cordão de luzes da estante
    g.fillStyle(cinza(0x3a3a4a), 1);
    g.fillRect(APTO.estante - 22, 62, 44, 1); // fio
    for (let k = 0; k < 5; k++) {
      g.fillRect(APTO.estante - 18 + k * 9, 63, 1, 2);
      g.fillStyle(cinza(0x8a8a98), 1);
      g.fillRect(APTO.estante - 19 + k * 9, 65, 3, 3); // lampadinhas apagadas
      g.fillStyle(cinza(0x3a3a4a), 1);
    }

    // luminária pendente da cozinha
    g.fillStyle(cinza(0x3a3a4a), 1);
    g.fillRect(451, 14, 1, 16);
    g.fillStyle(cinza(0xe9b44c), 1);
    g.fillRect(445, 30, 13, 5);
    g.fillRect(447, 35, 9, 2);
  }

  /** Redesenha a versão ACESA de cada ponto já ligado (cores quentes). */
  private desenharPropsAcesos(): void {
    const g = this.litG;
    g.clear();
    for (const p of this.pontos) {
      if (!p.aceso) continue;
      switch (p.id) {
        case "entrada": {
          g.fillStyle(0xfff6d0, 1);
          g.fillRect(46, 63, 8, 7); // globo aceso
          g.fillStyle(0xe9b44c, 0.6);
          g.fillRect(43, 66, 2, 1);
          g.fillRect(55, 66, 2, 1);
          g.fillRect(49, 73, 2, 1); // raios
          break;
        }
        case "abajur": {
          g.fillStyle(0xe9b44c, 1);
          g.fillRect(110, CHAO_Y - 40, 16, 8);
          g.fillRect(112, CHAO_Y - 42, 12, 2);
          g.fillStyle(0xfff6d0, 0.9);
          g.fillRect(111, CHAO_Y - 33, 14, 1); // boca da cúpula
          g.fillStyle(0xfff6d0, 0.2);
          g.fillRect(106, CHAO_Y - 32, 24, 18); // poça de luz
          break;
        }
        case "estante": {
          const cores = [0xe9b44c, 0xff7aa2, 0x4fd6c4, 0xe9b44c, 0xff7aa2];
          for (let k = 0; k < 5; k++) {
            g.fillStyle(cores[k], 1);
            g.fillRect(APTO.estante - 19 + k * 9, 65, 3, 3);
            g.fillStyle(0xfff6d0, 0.5);
            g.fillRect(APTO.estante - 18 + k * 9, 64, 1, 1);
          }
          break;
        }
        case "cozinha": {
          g.fillStyle(0xe9b44c, 1);
          g.fillRect(445, 30, 13, 5);
          g.fillRect(447, 35, 9, 2);
          g.fillStyle(0xfff6d0, 0.9);
          g.fillRect(447, 37, 9, 1);
          g.fillStyle(0xfff6d0, 0.18);
          g.fillRect(441, 38, 21, 80); // feixe até o balcão
          break;
        }
      }
    }
    // a vela acesa (primeiro plano) tem o próprio graphics
    const p = this.pontos.find((pt) => pt.id === "vela");
    if (p?.aceso) {
      const chama = this.add.graphics().setDepth(25);
      chama.fillStyle(0xe9b44c, 1);
      chama.fillRect(176, GAME_HEIGHT - 33, 3, 3);
      chama.fillStyle(0xfff6d0, 1);
      chama.fillRect(177, GAME_HEIGHT - 32, 1, 2);
      this.tweens.add({ targets: chama, alpha: 0.6, duration: 260, yoyo: true, repeat: -1 });
      p.id = "vela_ok"; // desenha a chama uma única vez
    }
  }

  private acender(ponto: PontoLuz): void {
    ponto.aceso = true;
    ponto.carga = 0;
    this.acesas++;
    this.barraCarga.clear();
    this.hintLuz.setVisible(false);

    // a cor volta em círculo crescente naquela região
    const regiao = { x: ponto.x, y: ponto.focoY, r: 6 };
    this.regioesCor.push(regiao);
    this.tweens.add({ targets: regiao, r: 74, duration: 900, ease: "Sine.easeOut" });

    this.desenharPropsAcesos();
    this.particulas(ponto.x, ponto.focoY, 0xe9b44c, 7);

    // fala dela (tom de força serena) + o Rafitcho levanta a cabeça
    this.mostrarBalaoTexto(
      this.gabitcha.x,
      this.gabitcha.y - 24,
      falaSegura(DIALOGOS.fase6.luzes[this.acesas - 1]),
      2600,
      200
    );
    if (this.acesas <= 4) this.rafitcho.setTexture(`rafStorm${this.acesas}`);

    // a Yuumitcha reage: senta na 1ª, fica de pé abanando nas seguintes
    if (this.acesas === 1) this.yuumi.setTexture("yuumiSentada");
    if (this.acesas === 2) this.yuumi.setTexture("yuumitcha");

    if (this.acesas >= 5) this.time.delayedCall(2800, () => this.finalizar());
  }

  // ---------- loop ----------

  update(_time: number, delta: number): void {
    if (!this.corCompleta) this.atualizarMascaras();

    if (this.etapa !== "acender") {
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
    this.gabitcha.y = PERSONAGEM_Y;
    atualizarAndar(this.gabitcha, "gabitcha", andando);

    // a luzinha acompanha a mão dela
    this.luzinha?.setPosition(
      this.gabitcha.x + (this.gabitcha.flipX ? -9 : 9),
      this.gabitcha.y - 2
    );

    // carga dos pontos de luz (segurar ESPAÇO 1s — ou parar em cima, no touch)
    this.barraCarga.clear();
    let algumPerto = false;
    for (const ponto of this.pontos) {
      if (ponto.aceso) continue;
      const perto = Math.abs(this.gabitcha.x - ponto.x) < ALCANCE_LUZ;
      if (!perto) {
        ponto.carga = Math.max(0, ponto.carga - delta * 1.5);
        continue;
      }
      algumPerto = true;
      this.hintLuz.setPosition(ponto.x, 66).setVisible(ponto.carga === 0);
      const segurando = this.espaco.isDown || this.paradaMs > 150;
      ponto.carga = segurando ? ponto.carga + delta : Math.max(0, ponto.carga - delta);
      if (ponto.carga > 0) {
        const largura = Math.round((16 * Math.min(ponto.carga, CARGA_TOTAL)) / CARGA_TOTAL);
        this.barraCarga.fillStyle(0x0b0d1a, 0.8);
        this.barraCarga.fillRect(ponto.x - 9, 74, 18, 5);
        this.barraCarga.fillStyle(0xe9b44c, 1);
        this.barraCarga.fillRect(ponto.x - 8, 75, largura, 3);
      }
      if (ponto.carga >= CARGA_TOTAL) {
        this.acender(ponto);
        break;
      }
    }
    if (!algumPerto) this.hintLuz.setVisible(false);

    // a Yuumitcha abana o rabo mais a cada luz
    if (this.acesas >= 2) {
      this.wagAcc += delta;
      if (this.wagAcc > 560 - this.acesas * 80) {
        this.wagAcc = 0;
        this.wagFrameA = !this.wagFrameA;
        this.yuumi.setTexture(this.wagFrameA ? "yuumitcha" : "yuumiWagB");
      }
    }
  }

  /** Furos de luz (pixels duros) na penumbra e na camada cinza. */
  private atualizarMascaras(): void {
    const g1 = this.maskLuz1G;
    const g2 = this.maskLuz2G;
    const gc = this.maskCorG;
    g1.clear();
    g2.clear();
    gc.clear();
    g1.fillStyle(0xffffff, 1);
    g2.fillStyle(0xffffff, 1);
    gc.fillStyle(0xffffff, 1);

    // o brilho frio do notebook
    this.discoPixel(g1, NOTEBOOK_X, 122, 16);
    this.discoPixel(g2, NOTEBOOK_X, 122, 9);

    // a luzinha dela (2 estágios de alpha: furo grande + furo pequeno)
    if (this.luzinha) {
      const lx = Math.round(this.luzinha.x);
      const ly = Math.round(this.luzinha.y);
      this.discoPixel(g1, lx, ly, 48);
      this.discoPixel(g2, lx, ly, 30);
    }

    // as regiões já acesas (cor + claridade total)
    for (const r of this.regioesCor) {
      const raio = Math.round(r.r);
      this.discoPixel(g1, r.x, r.y, raio);
      this.discoPixel(g2, r.x, r.y, raio);
      this.discoPixel(gc, r.x, r.y, raio);
    }
  }

  /** Disco preenchido por varredura de linhas (círculo em pixels). */
  private discoPixel(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number): void {
    for (let dy = -r; dy <= r; dy++) {
      const w = Math.floor(Math.sqrt(r * r - dy * dy));
      g.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
    }
  }

  // ---------- final: a cor volta, o abraço ----------

  private finalizar(): void {
    this.etapa = "fim";
    this.gabitcha.setVelocityX(0);
    this.gabitcha.y = PERSONAGEM_Y;
    atualizarAndar(this.gabitcha, "gabitcha", false);
    this.barraCarga.clear();
    this.hintLuz.setVisible(false);

    // a chuva PARA gradualmente
    this.tweens.add({ targets: this.chuva, intensidade: 0, duration: 2500 });
    this.relampagoTimer.remove();

    // a paleta inteira volta ao quente; a penumbra se dissolve
    this.time.delayedCall(600, () => {
      this.tweens.add({
        targets: [...this.objsDessat, this.escuridao1, this.escuridao2],
        alpha: 0,
        duration: 2200,
        onComplete: () => {
          this.corCompleta = true;
        },
      });

      // raio de sol entrando pela janela da sala (feixe diagonal)
      const sol = this.add.graphics().setDepth(28).setAlpha(0);
      sol.fillStyle(0xf8e2a8, 0.4);
      for (let k = 0; k < 10; k++) {
        sol.fillRect(APTO.janelaSala - 20 + k * 4, 44 + k * 9, 26, 9);
      }
      sol.fillStyle(0xfff6d0, 0.25);
      for (let k = 0; k < 10; k++) {
        sol.fillRect(APTO.janelaSala - 12 + k * 4, 44 + k * 9, 10, 9);
      }
      this.tweens.add({ targets: sol, alpha: 1, duration: 1800, delay: 400 });
    });

    // "E a cor voltou."
    this.time.delayedCall(1600, () => {
      const narracao = this.add
        .text(GAME_WIDTH / 2, 26, falaSegura(DIALOGOS.fase6.narracaoCor), {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: UI.douradoYuumitcha,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(60)
        .setAlpha(0);
      this.tweens.add({ targets: narracao, alpha: 1, duration: 600 });
      this.time.delayedCall(2400, () => {
        this.tweens.add({ targets: narracao, alpha: 0, duration: 500, onComplete: () => narracao.destroy() });
      });
    });

    // o Rafitcho se levanta (o notebook fica no sofá)
    this.time.delayedCall(3000, () => {
      this.rafitcho.setTexture("rafitcho").setPosition(APTO.sofa + 4, PERSONAGEM_Y);
      this.tweens.add({ targets: this.notebook, x: RAF_X - 16, y: 128, duration: 300 });
    });

    // ela vem... e o ABRAÇO
    this.time.delayedCall(3400, () => {
      this.gabitcha.setFlipX(this.gabitcha.x > APTO.sofa - 28);
      atualizarAndar(this.gabitcha, "gabitcha", true);
      this.tweens.add({
        targets: this.gabitcha,
        x: APTO.sofa - 28,
        duration: 900,
        ease: "Sine.easeInOut",
        onComplete: () => atualizarAndar(this.gabitcha, "gabitcha", false),
      });
    });

    this.time.delayedCall(4500, () => {
      this.gabitcha.setVisible(false);
      this.rafitcho.setVisible(false);
      if (this.luzinha) {
        this.tweens.add({
          targets: this.luzinha,
          alpha: 0,
          duration: 400,
          onComplete: () => this.luzinha?.destroy(),
        });
        this.luzinha = null;
      }
      const abraco = this.add.image(APTO.sofa - 12, PERSONAGEM_Y, "abraco").setDepth(20).setAlpha(0);
      this.tweens.add({ targets: abraco, alpha: 1, duration: 500 });

      const coracao = this.add.image(APTO.sofa - 12, PERSONAGEM_Y - 32, "coracao").setDepth(30).setAlpha(0);
      this.tweens.add({ targets: coracao, alpha: 1, y: coracao.y - 6, duration: 900, delay: 400 });

      // a Yuumitcha pula ao redor dos dois
      this.tweens.add({
        targets: this.yuumi,
        x: APTO.sofa - 44,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.tweens.add({
        targets: this.yuumi,
        y: YUUMI_Y - 6,
        duration: 200,
        yoyo: true,
        repeat: -1,
        ease: "Quad.easeOut",
      });
      this.time.addEvent({
        delay: 140,
        loop: true,
        callback: () => {
          this.wagFrameA = !this.wagFrameA;
          this.yuumi.setTexture(this.wagFrameA ? "yuumitcha" : "yuumiWagB");
        },
      });

      this.cameras.main.stopFollow();
      this.cameras.main.pan(APTO.sofa, 110, 2000, "Sine.easeInOut");

      this.time.delayedCall(1200, () =>
        this.mostrarBalaoTexto(APTO.sofa - 12, PERSONAGEM_Y - 28, falaSegura(DIALOGOS.fase6.final), 3400, 200)
      );

      // coraçõezinhos subindo
      this.time.addEvent({
        delay: 600,
        repeat: 7,
        callback: () => {
          const c = this.add
            .image(APTO.sofa + Phaser.Math.Between(-34, 20), 112, "coracaoMini")
            .setDepth(30);
          this.tweens.add({
            targets: c,
            y: Phaser.Math.Between(72, 90),
            alpha: 0,
            duration: 1700,
            ease: "Sine.easeOut",
            onComplete: () => c.destroy(),
          });
        },
      });

      // fade LONGO para a carta
      this.time.delayedCall(5600, () => fadeToScene(this, "FinalCarta", 3000));
    });
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

    const vw = this.cameras.main.worldView;
    const cx = Phaser.Math.Clamp(x, vw.x + w / 2 + 2, vw.right - w / 2 - 2);
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
        .setDepth(35);
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

  // ---------- texturas ----------

  private criarTexturas(): void {
    criarTexturasCoracoes(this);

    RAF_ESTAGIOS.forEach((data, i) => createTextureFromData(this, `rafStorm${i}`, data));
    createTextureFromData(this, "abraco", ABRACO);

    const poses: Array<[string, string[]]> = [
      ["yuumiRunA", YUUMI_RUN_A],
      ["yuumiRunB", YUUMI_RUN_B],
      ["yuumiDeitada", YUUMI_DEITADA],
      ["yuumiWagB", YUUMI_WAG_B],
      [
        "yuumiSentada",
        [
          ".........eKe......eKe...",
          ".........eKMeaaaaeKMe...",
          "........aKKefFFFfeKKa...",
          "........afFFaaaaaFFFa...",
          "........afEEFFFFEEFFa...",
          "........FfEWFKKFEWFfa...",
          ".......FfFeKNNKeFFFa....",
          "......aFfeMKKKKeFFa.....",
          "..Q..aFFfeKKKKKeFFa.....",
          ".QQ.aFFffeKKKKeaFFa.....",
          ".QQaFFfffFaaaaaaFFa.....",
          "..aFFffffFFaa.aFFa......",
          "..aFFFffffFFa..aFFa.....",
          "...aFFFFFFFa...aFFa.....",
          "...aFa..aFa....aFFa.....",
          "...aaa..aaa....aaaa.....",
        ],
      ],
    ];
    for (const [key, grid] of poses) {
      createTextureFromData(this, key, { palette: YUUMITCHA.palette, grid });
    }

    // notebook aberto no colo (a tela é a única luz do começo)
    if (!this.textures.exists("notebookLigado")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x3f3f4c, 1);
      g.fillRect(1, 0, 12, 9); // tampa
      g.fillStyle(0x9ab8d8, 1);
      g.fillRect(2, 1, 10, 7); // tela acesa (fria)
      g.fillStyle(0xdfe8f4, 0.9);
      g.fillRect(3, 2, 6, 1);
      g.fillRect(3, 4, 8, 1); // linhas do e-mail
      g.fillStyle(0x2b2b33, 1);
      g.fillRect(0, 9, 16, 3); // base/teclado
      g.fillStyle(0x4a4a58, 1);
      g.fillRect(1, 10, 14, 1);
      g.generateTexture("notebookLigado", 16, 12);
      g.destroy();
    }

    // a luzinha dela: vela com chama de 2 frames
    for (const [key, chamaAlta] of [
      ["luzinhaA", true],
      ["luzinhaB", false],
    ] as Array<[string, boolean]>) {
      if (this.textures.exists(key)) continue;
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xe9b44c, 1);
      if (chamaAlta) {
        g.fillRect(2, 0, 2, 3);
        g.fillStyle(0xfff6d0, 1);
        g.fillRect(2, 1, 1, 2);
      } else {
        g.fillRect(2, 1, 2, 2);
        g.fillStyle(0xfff6d0, 1);
        g.fillRect(3, 1, 1, 2);
      }
      g.fillStyle(0xf2f0f7, 1);
      g.fillRect(1, 3, 4, 4); // vela
      g.fillStyle(0xc2c6d0, 1);
      g.fillRect(1, 6, 4, 1);
      g.fillStyle(0x8a6240, 1);
      g.fillRect(0, 7, 6, 2); // suporte
      g.generateTexture(key, 6, 9);
      g.destroy();
    }
  }
}
