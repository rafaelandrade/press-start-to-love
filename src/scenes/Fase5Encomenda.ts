import Phaser from "phaser";
import { DIALOGOS, falaSegura } from "../dialogos";
import { UI, GAME_WIDTH, GAME_HEIGHT, FONT_SM } from "../ui/constants";
import { fadeIn, fadeToScene } from "../ui/transitions";
import { TouchControls } from "../ui/TouchControls";
import { ShippingLabel } from "../ui/ShippingLabel";
import { createTextureFromData } from "../sprites/factory";
import { atualizarAndar, trotar, pose } from "../sprites/anims";
import { criarTexturasCoracoes } from "../ui/effects";
import { GABITCHA, RAFITCHO, RAFITCHO_SENTADO_FRAMES, YUUMITCHA, SpriteData } from "../sprites/data";
import {
  criarApartamento,
  PALETA_APTO_QUENTE,
  APTO,
  APTO_LARGURA,
  APTO_CHAO_Y,
} from "./apartamento";

/**
 * Fase 5 — "A Encomenda do Futuro" (INTOCÁVEL — dá nome ao jogo)
 * A fase mais engraçada: estreia da Yuumitcha em 3 atos.
 * Ato 1 (mistério): campainha, caixa na porta... que PULA.
 * Ato 2 (revelação): a pug salta da caixa + head tilt obrigatório.
 * Ato 3 (caos): salve os itens da destruidora — mas a barra de
 * FELICIDADE DA CASA sobe com item salvo OU destruído (filhote =
 * felicidade incondicional). Sem game over; barra cheia = final doce.
 */

const CHAO_Y = APTO_CHAO_Y;
const PERSONAGEM_Y = CHAO_Y - 24;
const YUUMI_Y = CHAO_Y - 8;
const CAIXA_X = APTO.porta + 28;

const VEL_GABITCHA = 130;
const VEL_YUUMI = 150;
const ALCANCE_RESGATE = 16;
const FELICIDADE_MAX = 100;
const PONTOS_POR_EVENTO = 7;

type TipoItem = "chinelo" | "fio" | "almofada" | "controle" | "planta" | "papel";
const TIPOS_ITEM: TipoItem[] = ["chinelo", "fio", "almofada", "controle", "planta", "papel"];
const CORES_ITEM: Record<TipoItem, number> = {
  chinelo: 0xe05a8a,
  fio: 0x3f3f4c,
  almofada: 0xff7aa2,
  controle: 0x2b2b33,
  planta: 0x4c9a44,
  papel: 0xf2f0f7,
};
const ANCORAS_ITENS = [88, 132, 240, 298, 352, 414, 476, 522];

type Etapa =
  | "titulo"
  | "misterio"
  | "dialogoCaixa"
  | "promptCaixa"
  | "revelacao"
  | "instrucao"
  | "caos"
  | "placar"
  | "fim";

interface Item {
  tipo: TipoItem;
  x: number;
  sprite: Phaser.GameObjects.Image;
  alerta: Phaser.GameObjects.Text;
  estado: "livre" | "destruindo";
}

type YuumiEstado = "parada" | "correndo" | "passeio" | "destruindo" | "orgulho";
type RafEstado = "parado" | "correndo" | "tombo";

// ------------------------------------------------------------
// Poses da Yuumitcha (24x16) — derivadas do grid base:
// corrida 2 frames, sentada, head tilt, deitada e rabo abanando
// ------------------------------------------------------------

const YUUMI_CORPO = YUUMITCHA.grid.slice(0, 12);

const YUUMI_RUN_A: string[] = [
  ...YUUMI_CORPO,
  "..aFa..aa....aa..aFa....",
  ".aFa...aa....aa...aFa...",
  ".aa.....a....a.....aa...",
  "........................",
];

const YUUMI_RUN_B: string[] = [
  ...YUUMI_CORPO,
  "....aFa.aa..aa.aFa......",
  "....aFaaa....aaaFa......",
  "........................",
  "........................",
];

const YUUMI_SENTADA: string[] = [
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
];

// head tilt: a cabeça inclina (topo desloca 2px, meio 1px) — o golpe de fofura
const YUUMI_TILT: string[] = YUUMI_SENTADA.map((linha, i) => {
  const desloc = i <= 2 ? 2 : i <= 5 ? 1 : 0;
  if (desloc === 0) return linha;
  return ".".repeat(desloc) + linha.slice(0, 24 - desloc);
});

const YUUMI_DEITADA: string[] = [
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

// orgulho: rabinho abanando (frame B com o rabo pra cima; frame A = base)
const YUUMI_WAG_B: string[] = [
  YUUMITCHA.grid[0],
  YUUMITCHA.grid[1],
  "..Q.....aKKefFFFfeKKa...",
  ".QQ.....afFFaaaaaFFFa...",
  "..Q.....afEEFFFFEEFFa...",
  "...aaaaaFfEWFKKFEWFfa...",
  ...YUUMITCHA.grid.slice(6),
];

// ------------------------------------------------------------
// Gabitcha SENTADA (32x38): cabeça/torso do sprite em pé + pernas
// sentadas (saia sobre as coxas, botas), no esquema do rafitchoSentado
// ------------------------------------------------------------

function linha32(...partes: Array<[number, string]>): string {
  let out = "";
  for (const [col, s] of partes) out += ".".repeat(col - out.length) + s;
  return out + ".".repeat(32 - out.length);
}

const GABITCHA_SENTADA: SpriteData = {
  palette: GABITCHA.palette,
  grid: [
    ...GABITCHA.grid.slice(0, 32),
    linha32([9, "xyXXXXXXXXXXXx"]), // quadril
    linha32([9, "xyXXXXXXXXXXXXXXx"]), // coxa estendida
    linha32([9, "xxxxxxxxxxxx"], [21, "xXXx"]), // barra da saia + joelho
    linha32([21, "Ssd"]), // canela
    linha32([20, "bmBBb"]), // bota
    linha32([20, "bbbbb"]),
  ],
};

// Rafitcho no sofá: frame "feliz" da pose sentada, sem a cadeira
// (a paleta omite os chars C/c/E/r do escritório)
const RAFITCHO_SOFA: SpriteData = {
  palette: { ...RAFITCHO.palette },
  grid: RAFITCHO_SENTADO_FRAMES[2].grid,
};

export class Fase5Encomenda extends Phaser.Scene {
  private gabitcha!: Phaser.Physics.Arcade.Sprite;
  private rafitcho!: Phaser.GameObjects.Sprite;
  private yuumi!: Phaser.GameObjects.Sprite;
  private caixa!: Phaser.GameObjects.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private teclasAD!: { A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private espaco!: Phaser.Input.Keyboard.Key;
  private touch!: TouchControls;

  private etapa: Etapa = "titulo";
  private paradaMs = 0;
  private caixaReagiu = false;

  private itens: Item[] = [];
  private salvos = 0;
  private destruidos = 0;
  private felicidade = 0;

  private yuumiEstado: YuumiEstado = "parada";
  private yuumiAlvo: Item | null = null;
  private yuumiAlvoX = 0;
  private yuumiProximaAcao = 0;
  private yuumiAnimAcc = 0;
  private yuumiFrameA = true;
  private poeiraAcc = 0;

  private rafEstado: RafEstado = "parado";
  private rafProximaAcao = 0;

  private hudObjs: Phaser.GameObjects.GameObject[] = [];
  private barraG!: Phaser.GameObjects.Graphics;
  private felicidadeLabel!: Phaser.GameObjects.Text;
  private salvosTexto!: Phaser.GameObjects.Text;
  private destruidosTexto!: Phaser.GameObjects.Text;

  private balaoAtual: {
    cont: Phaser.GameObjects.Container;
    timer: Phaser.Time.TimerEvent;
  } | null = null;

  constructor() {
    super("Fase5Encomenda");
  }

  create(): void {
    this.etapa = "titulo";
    this.paradaMs = 0;
    this.caixaReagiu = false;
    this.itens = [];
    this.salvos = 0;
    this.destruidos = 0;
    this.felicidade = 0;
    this.yuumiEstado = "parada";
    this.yuumiAlvo = null;
    this.rafEstado = "parado";
    this.hudObjs = [];
    this.balaoAtual = null;

    fadeIn(this);
    this.criarTexturas();

    this.physics.world.setBounds(0, 0, APTO_LARGURA, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, APTO_LARGURA, GAME_HEIGHT);

    criarApartamento(this, { paleta: PALETA_APTO_QUENTE, animar: true });

    this.gabitcha = this.physics.add.sprite(APTO.sofa - 6, PERSONAGEM_Y, "gabitcha");
    (this.gabitcha.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.gabitcha.setCollideWorldBounds(true);
    this.gabitcha.setDepth(20);
    this.rafitcho = this.add.sprite(APTO.tv - 6, PERSONAGEM_Y, "rafitcho").setDepth(19).setFlipX(true);
    this.yuumi = this.add.sprite(0, YUUMI_Y, "yuumitcha").setDepth(18).setVisible(false);
    this.caixa = this.add.image(CAIXA_X, CHAO_Y - 9, "caixaPequena").setDepth(8).setVisible(false);

    this.cameras.main.startFollow(this.gabitcha, true, 0.08, 0.08);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.teclasAD = this.input.keyboard!.addKeys("A,D") as {
      A: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
    };
    this.espaco = this.input.keyboard!.addKey("SPACE");
    this.touch = new TouchControls(this);

    this.criarHud();

    new ShippingLabel(this).mostrar(
      {
        remetente: DIALOGOS.fase5.etiqueta.remetente,
        destinatario: DIALOGOS.fase5.etiqueta.destinatario,
        conteudo: DIALOGOS.fase5.etiqueta.conteudo,
        rastreio: DIALOGOS.fase5.etiqueta.rastreio,
        fragil: DIALOGOS.fase5.etiqueta.fragil,
      },
      () => this.ato1Misterio()
    );
  }

  // ---------- ato 1: o mistério ----------

  private ato1Misterio(): void {
    this.etapa = "misterio";

    // campainha: DING DONG tremendo, duas vezes
    const tocar = (atraso: number) => {
      this.time.delayedCall(atraso, () => {
        const ding = this.add
          .text(APTO.porta + 14, 56, falaSegura(DIALOGOS.fase5.campainha), {
            fontFamily: UI.fonte,
            fontSize: FONT_SM,
            color: UI.douradoYuumitcha,
          })
          .setOrigin(0.5)
          .setDepth(40);
        const tremor = this.time.addEvent({
          delay: 50,
          repeat: 13,
          callback: () =>
            ding.setPosition(
              APTO.porta + 14 + Phaser.Math.Between(-1, 1),
              56 + Phaser.Math.Between(-1, 1)
            ),
        });
        this.time.delayedCall(800, () => {
          tremor.remove();
          ding.destroy();
        });
      });
    };
    tocar(500);
    tocar(1900);

    this.time.delayedCall(900, () => this.caixa.setVisible(true));

    const dica = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 8, DIALOGOS.fase5.dicaPorta, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(50)
      .setAlpha(0.7);
    this.tweens.add({ targets: dica, alpha: 0.25, duration: 600, yoyo: true, repeat: -1 });
    this.time.delayedCall(6000, () => dica.destroy());
  }

  /** Hop de caixa: sobe `altura` px e volta (pixels inteiros). */
  private caixaPula(altura: number): void {
    this.tweens.add({
      targets: this.caixa,
      y: this.caixa.y - altura,
      duration: 110,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  private dialogoCaixa(): void {
    this.caixaReagiu = true;
    this.etapa = "dialogoCaixa";
    this.gabitcha.setVelocityX(0);
    atualizarAndar(this.gabitcha, "gabitcha", false);
    atualizarAndar(this.rafitcho, "rafitcho", false);

    // a caixa PULA + "?!"
    this.caixaPula(2);
    const susto = this.add
      .text(CAIXA_X, CHAO_Y - 26, falaSegura(DIALOGOS.fase5.susto), {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.rosaGabitcha,
      })
      .setOrigin(0.5)
      .setDepth(40)
      .setScale(0);
    this.tweens.add({ targets: susto, scale: 1, duration: 140, ease: "Back.easeOut" });
    this.time.delayedCall(900, () => susto.destroy());

    const falas = DIALOGOS.fase5.misterio;
    const falar = (i: number) => {
      if (i >= falas.length) {
        // a caixa pula DE NOVO, mais alto
        this.caixaPula(6);
        this.cameras.main.shake(70, 0.002);
        this.time.delayedCall(500, () => this.promptAbrir());
        return;
      }
      const quem = i === 1 ? this.rafitcho : this.gabitcha; // gab, raf, gab
      this.mostrarBalaoTexto(quem.x, quem.y - 24, falaSegura(falas[i]), 2600, 200);
      this.time.delayedCall(2700, () => falar(i + 1));
    };
    this.time.delayedCall(1100, () => falar(0));
  }

  private promptAbrir(): void {
    this.etapa = "promptCaixa";
    const prompt = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 10, DIALOGOS.fase5.abrirCaixa, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.douradoYuumitcha,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(50);
    this.tweens.add({ targets: prompt, alpha: 0.25, duration: 500, yoyo: true, repeat: -1 });

    const abrir = () => {
      this.input.keyboard?.off("keydown-SPACE", abrir);
      this.input.off("pointerdown", abrir);
      prompt.destroy();
      this.ato2Revelacao();
    };
    this.input.keyboard?.once("keydown-SPACE", abrir);
    this.input.once("pointerdown", abrir);
  }

  // ---------- ato 2: a revelação ----------

  private ato2Revelacao(): void {
    this.etapa = "revelacao";
    this.flashTela();
    this.caixa.setTexture("caixaAberta");

    // corações + confete saindo da caixa
    for (let i = 0; i < 8; i++) {
      const c = this.add
        .image(CAIXA_X + Phaser.Math.Between(-8, 8), CHAO_Y - 16, i % 2 === 0 ? "coracaoMini" : "coracao")
        .setDepth(30);
      this.tweens.add({
        targets: c,
        y: c.y - Phaser.Math.Between(18, 34),
        alpha: 0,
        duration: Phaser.Math.Between(700, 1200),
        ease: "Sine.easeOut",
        onComplete: () => c.destroy(),
      });
    }
    for (let i = 0; i < 22; i++) {
      const cores = [0xff7aa2, 0x4fd6c4, 0xe9b44c, 0xf2f0f7];
      const p = this.add
        .rectangle(
          CAIXA_X + Phaser.Math.Between(-6, 6),
          CHAO_Y - 18,
          2,
          2,
          cores[i % cores.length]
        )
        .setDepth(30);
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-26, 26),
        y: p.y + Phaser.Math.Between(-30, 8),
        alpha: 0,
        duration: Phaser.Math.Between(500, 900),
        onComplete: () => p.destroy(),
      });
    }

    // a Yuumitcha salta da caixa em arco e cai SENTADA
    this.yuumi.setVisible(true).setPosition(CAIXA_X, CHAO_Y - 18).setTexture("yuumitcha");
    this.tweens.add({ targets: this.yuumi, x: CAIXA_X + 40, duration: 520 });
    this.tweens.add({
      targets: this.yuumi,
      y: CHAO_Y - 36,
      duration: 240,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: this.yuumi,
          y: YUUMI_Y,
          duration: 280,
          ease: "Quad.easeIn",
          onComplete: () => this.pousoYuumi(),
        });
      },
    });
  }

  private pousoYuumi(): void {
    this.yuumi.setTexture("yuumiSentada");
    this.poeira(this.yuumi.x, CHAO_Y - 2, 4);

    // ela olha pros dois... e faz a cabecinha inclinada (o golpe de fofura)
    this.time.delayedCall(500, () => {
      this.yuumi.setTexture("yuumiTilt");
      const c = this.add.image(this.yuumi.x + 8, this.yuumi.y - 14, "coracaoMini").setDepth(30);
      this.tweens.add({
        targets: c,
        y: c.y - 10,
        alpha: 0,
        duration: 1000,
        onComplete: () => c.destroy(),
      });
      const brilho = this.add.rectangle(this.yuumi.x - 9, this.yuumi.y - 8, 1, 1, 0xffffff).setDepth(30);
      this.tweens.add({
        targets: brilho,
        alpha: 0,
        duration: 700,
        yoyo: true,
        repeat: 1,
        onComplete: () => brilho.destroy(),
      });
      this.time.delayedCall(1300, () => this.yuumi.setTexture("yuumiSentada"));
    });

    const falas = DIALOGOS.fase5.revelacao;
    this.time.delayedCall(800, () =>
      this.mostrarBalaoTexto(this.gabitcha.x, this.gabitcha.y - 24, falaSegura(falas[0]), 2800, 200)
    );
    this.time.delayedCall(3700, () =>
      this.mostrarBalaoTexto(this.rafitcho.x, this.rafitcho.y - 24, falaSegura(falas[1]), 2400, 200)
    );
    this.time.delayedCall(6200, () =>
      this.mostrarBalaoTexto(this.yuumi.x, this.yuumi.y - 10, falaSegura(falas[2]), 1600, 144)
    );
    this.time.delayedCall(8000, () => this.corteDeTela());
  }

  /** "20 minutos de fofura depois..." — corte para o apartamento bagunçado. */
  private corteDeTela(): void {
    const preto = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
      .setScrollFactor(0)
      .setDepth(150);
    const texto = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, falaSegura(DIALOGOS.fase5.corte), {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(151)
      .setAlpha(0);

    this.tweens.add({ targets: preto, fillAlpha: 1, duration: 400 });
    this.tweens.add({ targets: texto, alpha: 1, duration: 400, delay: 350 });

    this.time.delayedCall(900, () => {
      // reposiciona todo mundo e baguncinha leve (foi só o aquecimento)
      this.gabitcha.setPosition(APTO.sofa + 20, PERSONAGEM_Y);
      this.rafitcho.setPosition(APTO.tv + 16, PERSONAGEM_Y).setFlipX(true);
      this.yuumi.setPosition(APTO.planta - 40, YUUMI_Y).setTexture("yuumitcha");
      for (let i = 0; i < 10; i++) {
        this.add
          .rectangle(
            Phaser.Math.Between(80, APTO_LARGURA - 60),
            CHAO_Y + Phaser.Math.Between(-2, 14),
            2,
            1,
            [0xe05a8a, 0xf2f0f7, 0x8a6240][i % 3]
          )
          .setDepth(2);
      }
      this.spawnInicial();
    });

    this.time.delayedCall(3100, () => {
      this.tweens.add({ targets: texto, alpha: 0, duration: 300 });
      this.tweens.add({
        targets: preto,
        fillAlpha: 0,
        duration: 500,
        onComplete: () => {
          preto.destroy();
          texto.destroy();
          this.instrucaoCaos();
        },
      });
    });
  }

  // ---------- ato 3: o caos ----------

  private instrucaoCaos(): void {
    this.etapa = "instrucao";
    const objs: Phaser.GameObjects.GameObject[] = [];
    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x101223, 0.75)
      .setScrollFactor(0)
      .setDepth(150);
    objs.push(overlay);
    objs.push(
      this.add
        .text(GAME_WIDTH / 2, 62, falaSegura(DIALOGOS.fase5.instrucao), {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: UI.texto,
          align: "center",
          lineSpacing: 4,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(151)
    );
    objs.push(
      this.add
        .text(GAME_WIDTH / 2, 92, DIALOGOS.fase5.controles, {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: UI.tealRafitcho,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(151)
    );
    const comecar = this.add
      .text(GAME_WIDTH / 2, 120, DIALOGOS.fase5.comecar, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.rosaGabitcha,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(151);
    objs.push(comecar);
    this.tweens.add({ targets: comecar, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });

    const iniciar = () => {
      this.input.keyboard?.off("keydown-SPACE", iniciar);
      this.input.off("pointerdown", iniciar);
      objs.forEach((o) => o.destroy());
      this.iniciarCaos();
    };
    this.input.keyboard?.once("keydown-SPACE", iniciar);
    this.input.once("pointerdown", iniciar);
  }

  private iniciarCaos(): void {
    this.etapa = "caos";
    this.paradaMs = 0;
    this.hudObjs.forEach((o) => (o as Phaser.GameObjects.Text).setVisible(true));
    this.atualizarHud();
    this.yuumiProximaAcao = this.time.now + 600;
    this.rafProximaAcao = this.time.now + 4000;

    // felicidade passiva: filhote existindo já conta
    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        if (this.etapa === "caos") this.mudarFelicidade(1);
      },
    });

    // balões ocasionais do caos (um por vez)
    let idxCaos = 0;
    this.time.addEvent({
      delay: 8500,
      startAt: 4000,
      loop: true,
      callback: () => {
        if (this.etapa !== "caos" || this.balaoAtual) return;
        const falas = DIALOGOS.fase5.caos;
        const fala = falaSegura(falas[idxCaos % falas.length]);
        const quem = [this.gabitcha, this.rafitcho, this.gabitcha, this.yuumi][idxCaos % 4];
        const topo = quem === this.yuumi ? quem.y - 10 : quem.y - 24;
        this.mostrarBalaoTexto(quem.x, topo, fala, 2600, 200);
        idxCaos++;
      },
    });
  }

  private spawnInicial(): void {
    const ancoras = [...ANCORAS_ITENS];
    TIPOS_ITEM.forEach((tipo, i) => {
      const idx = (i * 3 + 1) % ancoras.length;
      const x = ancoras.splice(idx, 1)[0];
      this.criarItem(tipo, x);
    });
  }

  private criarItem(tipo: TipoItem, x: number): void {
    const sprite = this.add.image(x, CHAO_Y - 4, `item_${tipo}`).setDepth(8);
    sprite.setScale(0);
    this.tweens.add({ targets: sprite, scaleX: 1, scaleY: 1, duration: 200, ease: "Back.easeOut" });
    const alerta = this.add
      .text(x, CHAO_Y - 20, "!", {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: "#ff4a5a",
      })
      .setOrigin(0.5)
      .setDepth(9)
      .setVisible(false);
    this.tweens.add({
      targets: alerta,
      y: CHAO_Y - 23,
      duration: 260,
      yoyo: true,
      repeat: -1,
      ease: "Quad.easeOut",
    });
    this.itens.push({ tipo, x, sprite, alerta, estado: "livre" });
  }

  private agendarRespawn(): void {
    this.time.delayedCall(Phaser.Math.Between(2600, 4200), () => {
      if (this.etapa !== "caos" || this.itens.length >= 6) return;
      const livres = ANCORAS_ITENS.filter((ax) =>
        this.itens.every((it) => Math.abs(it.x - ax) > 30)
      );
      if (livres.length === 0) return;
      const x = livres[Phaser.Math.Between(0, livres.length - 1)];
      const tipo = TIPOS_ITEM[Phaser.Math.Between(0, TIPOS_ITEM.length - 1)];
      this.criarItem(tipo, x);
    });
  }

  private resgatar(item: Item): void {
    this.itens = this.itens.filter((i) => i !== item);
    item.alerta.destroy();
    this.tweens.killTweensOf(item.sprite);
    // o item voa pro contador de SALVOS
    const cam = this.cameras.main;
    this.tweens.add({
      targets: item.sprite,
      x: cam.scrollX + GAME_WIDTH - 30,
      y: 10,
      alpha: 0,
      duration: 420,
      ease: "Quad.easeIn",
      onComplete: () => item.sprite.destroy(),
    });
    this.particulas(item.x, CHAO_Y - 6, 0x4fd6c4, 5);
    this.salvos++;
    this.mudarFelicidade(PONTOS_POR_EVENTO);
    this.atualizarHud();
    this.agendarRespawn();

    if (this.yuumiAlvo === item) {
      this.yuumiAlvo = null;
      this.yuumiEstado = "parada";
      pose(this.yuumi, "yuumitcha");
      this.yuumi.y = YUUMI_Y;
      this.yuumiProximaAcao = this.time.now + 600;
      const duvida = this.add
        .text(this.yuumi.x, this.yuumi.y - 14, "?", {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: UI.douradoYuumitcha,
        })
        .setOrigin(0.5)
        .setDepth(30);
      this.time.delayedCall(600, () => duvida.destroy());
    }
  }

  // ---------- IA da Yuumitcha (filhote possuído) ----------

  private yuumiUpdate(time: number, delta: number): void {
    switch (this.yuumiEstado) {
      case "parada": {
        if (time >= this.yuumiProximaAcao) this.escolherAlvo();
        break;
      }
      case "correndo": {
        const alvo = this.yuumiAlvo;
        if (!alvo || alvo.estado !== "livre" || !alvo.sprite.active) {
          this.yuumiEstado = "parada";
          pose(this.yuumi, "yuumitcha");
          this.yuumi.y = YUUMI_Y;
          this.yuumiProximaAcao = time + 400;
          return;
        }
        this.correr(alvo.x, delta);
        if (Math.abs(this.yuumi.x - alvo.x) < 6) this.iniciarDestruicao(time, alvo);
        break;
      }
      case "passeio": {
        this.correr(this.yuumiAlvoX, delta);
        if (Math.abs(this.yuumi.x - this.yuumiAlvoX) < 6) {
          this.yuumiEstado = "parada";
          pose(this.yuumi, "yuumitcha");
          this.yuumi.y = YUUMI_Y;
          this.yuumiProximaAcao = time + Phaser.Math.Between(300, 800);
        }
        break;
      }
      case "destruindo": {
        this.yuumiAnimAcc += delta;
        if (this.yuumiAnimAcc > 130) {
          this.yuumiAnimAcc = 0;
          this.yuumiFrameA = !this.yuumiFrameA;
          this.yuumi.setTexture(this.yuumiFrameA ? "yuumitcha" : "yuumiWagB");
        }
        if (time >= this.yuumiProximaAcao) this.concluirDestruicao(time);
        break;
      }
      case "orgulho": {
        // rabinho abanando: o orgulho do dever cumprido
        this.yuumiAnimAcc += delta;
        if (this.yuumiAnimAcc > 150) {
          this.yuumiAnimAcc = 0;
          this.yuumiFrameA = !this.yuumiFrameA;
          this.yuumi.setTexture(this.yuumiFrameA ? "yuumitcha" : "yuumiWagB");
        }
        if (time >= this.yuumiProximaAcao) {
          this.yuumiEstado = "parada";
          this.yuumi.setTexture("yuumitcha");
          this.yuumiProximaAcao = time + Phaser.Math.Between(300, 900);
        }
        break;
      }
    }
  }

  private correr(alvoX: number, delta: number): void {
    const dir = alvoX > this.yuumi.x ? 1 : -1;
    this.yuumi.x = Phaser.Math.Clamp(
      this.yuumi.x + (dir * VEL_YUUMI * delta) / 1000,
      24,
      APTO_LARGURA - 24
    );
    this.yuumi.setFlipX(dir < 0);
    this.yuumi.y = YUUMI_Y;
    trotar(this.yuumi); // trote de 3 frames (bob embutido no frame)
    // poeirinha de filhote possuído
    this.poeiraAcc += delta;
    if (this.poeiraAcc > 90) {
      this.poeiraAcc = 0;
      this.poeira(this.yuumi.x - dir * 10, CHAO_Y - 2, 1);
    }
  }

  private escolherAlvo(): void {
    const livres = this.itens.filter((i) => i.estado === "livre" && i.sprite.active);
    if (livres.length === 0 || Math.random() < 0.25) {
      // zoomies: correr por correr
      this.yuumiEstado = "passeio";
      this.yuumiAlvoX = Phaser.Math.Between(60, APTO_LARGURA - 60);
      return;
    }
    const alvo = livres[Phaser.Math.Between(0, livres.length - 1)];
    this.yuumiAlvo = alvo;
    this.yuumiEstado = "correndo";
    alvo.alerta.setVisible(true); // mini-alerta: ela MIROU nesse item
  }

  private iniciarDestruicao(time: number, alvo: Item): void {
    alvo.estado = "destruindo";
    alvo.alerta.setVisible(false);
    this.yuumiEstado = "destruindo";
    pose(this.yuumi, "yuumitcha");
    this.yuumi.y = YUUMI_Y;
    this.yuumiProximaAcao = time + 750;
    // o item chacoalha
    this.tweens.add({
      targets: alvo.sprite,
      x: alvo.x + 1,
      duration: 45,
      yoyo: true,
      repeat: 7,
    });
  }

  private concluirDestruicao(time: number): void {
    const alvo = this.yuumiAlvo;
    this.yuumiAlvo = null;
    if (alvo && alvo.sprite.active) {
      this.itens = this.itens.filter((i) => i !== alvo);
      this.particulas(alvo.x, CHAO_Y - 6, CORES_ITEM[alvo.tipo], 8);
      // pedacinhos ficam no chão: a bagunça ACUMULA
      for (let i = 0; i < 3; i++) {
        this.add
          .rectangle(
            alvo.x + Phaser.Math.Between(-10, 10),
            CHAO_Y + Phaser.Math.Between(-2, 10),
            2,
            1,
            CORES_ITEM[alvo.tipo]
          )
          .setDepth(2);
      }
      this.tweens.killTweensOf(alvo.sprite);
      alvo.sprite.destroy();
      alvo.alerta.destroy();
      this.destruidos++;
      this.mudarFelicidade(PONTOS_POR_EVENTO);
      this.atualizarHud();
      this.agendarRespawn();
    }
    this.yuumiEstado = "orgulho";
    this.yuumiProximaAcao = time + 800;
  }

  // ---------- Rafitcho "ajudando" (a piada visual de fundo) ----------

  private rafUpdate(time: number, delta: number): void {
    switch (this.rafEstado) {
      case "parado": {
        if (time >= this.rafProximaAcao) {
          this.rafEstado = "correndo";
          this.rafProximaAcao = time + 1500;
        }
        break;
      }
      case "correndo": {
        const dir = this.yuumi.x > this.rafitcho.x ? 1 : -1;
        this.rafitcho.x = Phaser.Math.Clamp(
          this.rafitcho.x + (dir * 88 * delta) / 1000,
          30,
          APTO_LARGURA - 30
        );
        this.rafitcho.setFlipX(dir < 0);
        this.rafitcho.y = PERSONAGEM_Y;
        atualizarAndar(this.rafitcho, "rafitcho", true);
        if (time >= this.rafProximaAcao) {
          if (Math.random() < 0.55) {
            // TROPEÇA (rotação de 90° preserva o grid)
            this.rafEstado = "tombo";
            pose(this.rafitcho, "rafitcho");
            this.rafitcho.setAngle(90);
            this.rafitcho.y = PERSONAGEM_Y + 10;
            this.poeira(this.rafitcho.x, CHAO_Y - 2, 5);
            this.rafProximaAcao = time + 1200;
          } else {
            this.rafEstado = "parado";
            atualizarAndar(this.rafitcho, "rafitcho", false);
            this.rafitcho.y = PERSONAGEM_Y;
            this.rafProximaAcao = time + Phaser.Math.Between(4000, 8000);
          }
        }
        break;
      }
      case "tombo": {
        if (time >= this.rafProximaAcao) {
          this.rafitcho.setAngle(0);
          this.rafitcho.y = PERSONAGEM_Y;
          atualizarAndar(this.rafitcho, "rafitcho", false);
          this.rafEstado = "parado";
          this.rafProximaAcao = time + Phaser.Math.Between(5000, 9000);
        }
        break;
      }
    }
  }

  // ---------- loop ----------

  update(time: number, delta: number): void {
    if (this.etapa !== "misterio" && this.etapa !== "caos") {
      this.gabitcha?.setVelocityX(0);
      return;
    }

    const esquerda = this.cursors.left.isDown || this.teclasAD.A.isDown || this.touch.esquerda;
    const direita = this.cursors.right.isDown || this.teclasAD.D.isDown || this.touch.direita;
    const andando = esquerda || direita;

    if (esquerda) {
      this.gabitcha.setVelocityX(-VEL_GABITCHA);
      this.gabitcha.setFlipX(true);
    } else if (direita) {
      this.gabitcha.setVelocityX(VEL_GABITCHA);
      this.gabitcha.setFlipX(false);
    } else {
      this.gabitcha.setVelocityX(0);
    }
    this.paradaMs = andando ? 0 : this.paradaMs + delta;
    this.gabitcha.y = PERSONAGEM_Y;
    atualizarAndar(this.gabitcha, "gabitcha", andando);

    if (this.etapa === "misterio") {
      // o Rafitcho acompanha, um passinho atrás
      const alvoRaf = this.gabitcha.x + (this.gabitcha.flipX ? 26 : -26);
      this.rafitcho.x += (alvoRaf - this.rafitcho.x) * 0.08;
      this.rafitcho.setFlipX(this.rafitcho.x > this.gabitcha.x);
      const rafAndando = Math.abs(alvoRaf - this.rafitcho.x) > 3;
      this.rafitcho.y = PERSONAGEM_Y;
      atualizarAndar(this.rafitcho, "rafitcho", rafAndando);

      if (!this.caixaReagiu && Math.abs(this.gabitcha.x - CAIXA_X) < 34) this.dialogoCaixa();
      return;
    }

    // caos: resgate por proximidade (ESPAÇO ou parar em cima)
    const coletando = this.espaco.isDown || this.paradaMs > 300;
    if (coletando) {
      for (const item of this.itens) {
        if (item.estado !== "livre") continue;
        if (Math.abs(this.gabitcha.x - item.x) < ALCANCE_RESGATE) {
          this.resgatar(item);
          this.paradaMs = 0;
          break;
        }
      }
    }

    this.yuumiUpdate(time, delta);
    this.rafUpdate(time, delta);
  }

  // ---------- HUD: barra de felicidade + contadores ----------

  private criarHud(): void {
    this.felicidadeLabel = this.add
      .text(4, 4, DIALOGOS.fase5.hudFelicidade, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
      })
      .setScrollFactor(0)
      .setDepth(50)
      .setVisible(false);
    this.barraG = this.add.graphics().setScrollFactor(0).setDepth(50).setVisible(false);
    this.salvosTexto = this.add
      .text(GAME_WIDTH - 4, 4, "", {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.tealRafitcho,
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(50)
      .setVisible(false);
    this.destruidosTexto = this.add
      .text(GAME_WIDTH - 4, 14, "", {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.rosaGabitcha,
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(50)
      .setVisible(false);
    this.hudObjs = [this.felicidadeLabel, this.barraG, this.salvosTexto, this.destruidosTexto];
  }

  private atualizarHud(): void {
    this.salvosTexto.setText(`${falaSegura(DIALOGOS.fase5.hudSalvos)}: ${this.salvos}`);
    this.destruidosTexto.setText(`${falaSegura(DIALOGOS.fase5.hudDestruidos)}: ${this.destruidos}`);
    this.barraG.clear();
    this.barraG.fillStyle(0x1d2140, 1);
    this.barraG.fillRect(4, 14, 104, 8);
    this.barraG.fillStyle(0x2c3160, 1);
    this.barraG.fillRect(4, 14, 104, 1);
    this.barraG.fillRect(4, 21, 104, 1);
    const largura = Math.round(Math.min(this.felicidade, FELICIDADE_MAX));
    this.barraG.fillStyle(0xff7aa2, 1);
    this.barraG.fillRect(6, 16, largura, 4);
    this.barraG.fillStyle(0xffb8d0, 1);
    this.barraG.fillRect(6, 16, largura, 1);
  }

  private mudarFelicidade(quanto: number): void {
    if (this.etapa !== "caos") return;
    this.felicidade = Math.min(this.felicidade + quanto, FELICIDADE_MAX);
    this.atualizarHud();
    // pulso no rótulo: felicidade subiu (sempre sobe)
    this.tweens.killTweensOf(this.felicidadeLabel);
    this.felicidadeLabel.setAlpha(1);
    this.tweens.add({ targets: this.felicidadeLabel, alpha: 0.5, duration: 120, yoyo: true });
    if (this.felicidade >= FELICIDADE_MAX) this.finalizarCaos();
  }

  // ---------- final: placar + o momento doce ----------

  private finalizarCaos(): void {
    if (this.etapa !== "caos") return;
    this.etapa = "placar";
    this.gabitcha.setVelocityX(0);
    this.gabitcha.y = PERSONAGEM_Y;
    atualizarAndar(this.gabitcha, "gabitcha", false);
    this.fecharBalaoTexto();
    this.rafitcho.setAngle(0);
    this.rafitcho.y = PERSONAGEM_Y;
    atualizarAndar(this.rafitcho, "rafitcho", false);
    for (const item of this.itens) item.alerta.setVisible(false);

    // o caos congela: ela para, olha pros dois... e vai deitar na bagunça
    this.yuumiEstado = "parada";
    this.yuumiProximaAcao = Number.MAX_SAFE_INTEGER;
    pose(this.yuumi, "yuumiSentada");
    this.yuumi.setFlipX(this.gabitcha.x < this.yuumi.x);
    this.time.delayedCall(800, () => {
      const meio = APTO.sofa + 74;
      trotar(this.yuumi);
      this.tweens.add({
        targets: this.yuumi,
        x: meio,
        duration: 1000,
        onComplete: () => {
          this.yuumi.setFlipX(false);
          pose(this.yuumi, "yuumiDeitada");
        },
      });
    });

    this.time.delayedCall(1200, () => this.mostrarPlacar());
  }

  private mostrarPlacar(): void {
    const g = this.add.graphics();
    g.fillStyle(0x0b0d1a, 0.6);
    g.fillRect(-106, -44, 212, 92); // sombra
    g.fillStyle(0x1d2140, 1);
    g.fillRect(-108, -46, 212, 92);
    g.lineStyle(1, 0x4fd6c4, 1);
    g.strokeRect(-107.5, -45.5, 211, 91);

    const titulo = this.add
      .text(0, -28, falaSegura(DIALOGOS.fase5.placar.titulo), {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.douradoYuumitcha,
        align: "center",
        lineSpacing: 3,
      })
      .setOrigin(0.5);
    const salvos = this.add
      .text(0, 0, `${falaSegura(DIALOGOS.fase5.placar.salvos)} ${this.salvos}`, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.tealRafitcho,
      })
      .setOrigin(0.5);
    const destruidos = this.add
      .text(0, 14, `${falaSegura(DIALOGOS.fase5.placar.destruidos)} ${this.destruidos}`, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.rosaGabitcha,
      })
      .setOrigin(0.5);
    const arrependimentos = this.add
      .text(0, 32, falaSegura(DIALOGOS.fase5.placar.arrependimentos), {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
      })
      .setOrigin(0.5);

    const cont = this.add
      .container(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 6, [g, titulo, salvos, destruidos, arrependimentos])
      .setScrollFactor(0)
      .setDepth(160)
      .setScale(0);
    this.tweens.add({ targets: cont, scaleX: 1, scaleY: 1, duration: 220, ease: "Back.easeOut" });

    this.time.delayedCall(3600, () => {
      this.tweens.add({
        targets: cont,
        alpha: 0,
        duration: 400,
        onComplete: () => {
          cont.destroy();
          this.cenaSofa();
        },
      });
    });
  }

  private cenaSofa(): void {
    this.etapa = "fim";
    // HUD sai de cena antes do zoom
    this.tweens.add({ targets: this.hudObjs, alpha: 0, duration: 400 });

    const rafX = APTO.sofa - 16;
    const gabX = APTO.sofa + 16;
    this.gabitcha.setFlipX(gabX < this.gabitcha.x);
    this.rafitcho.setFlipX(rafX < this.rafitcho.x);
    atualizarAndar(this.gabitcha, "gabitcha", true);
    atualizarAndar(this.rafitcho, "rafitcho", true);
    this.tweens.add({ targets: this.gabitcha, x: gabX, duration: 900, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: this.rafitcho, x: rafX, duration: 900, ease: "Sine.easeInOut" });

    this.time.delayedCall(1000, () => {
      // sentam no sofá (variantes sentadas, sem a cadeira do escritório)
      pose(this.gabitcha, "gabSentada");
      this.gabitcha.setFlipX(true);
      this.gabitcha.y = 108;
      pose(this.rafitcho, "rafSofa");
      this.rafitcho.setFlipX(false);
      this.rafitcho.setPosition(rafX, 108);

      // a Yuumitcha pula no colo dela
      this.time.delayedCall(600, () => {
        trotar(this.yuumi);
        this.yuumi.setFlipX(this.yuumi.x > gabX);
        this.tweens.add({
          targets: this.yuumi,
          x: gabX - 8,
          duration: 420,
          onComplete: () => {
            this.yuumi.setDepth(21).setFlipX(false);
            pose(this.yuumi, "yuumiSentada");
            this.tweens.add({
              targets: this.yuumi,
              y: 116,
              duration: 260,
              ease: "Quad.easeOut",
            });
          },
        });
      });

      // câmera fecha lentamente nos três (zoom sutil permitido em cutscene)
      this.cameras.main.stopFollow();
      this.cameras.main.pan(APTO.sofa, 112, 2400, "Sine.easeInOut");
      this.cameras.main.zoomTo(1.25, 2400, "Sine.easeInOut");

      // coraçõezinhos subindo da cena
      this.time.addEvent({
        delay: 700,
        repeat: 8,
        callback: () => {
          const c = this.add
            .image(APTO.sofa + Phaser.Math.Between(-30, 30), 96, "coracaoMini")
            .setDepth(30);
          this.tweens.add({
            targets: c,
            y: Phaser.Math.Between(60, 76),
            alpha: 0,
            duration: 1600,
            ease: "Sine.easeOut",
            onComplete: () => c.destroy(),
          });
        },
      });

      const falas = DIALOGOS.fase5.final;
      this.time.delayedCall(1400, () =>
        this.mostrarBalaoTexto(this.gabitcha.x, 88, falaSegura(falas[0]), 2600, 176)
      );
      this.time.delayedCall(4100, () =>
        this.mostrarBalaoTexto(this.rafitcho.x, 88, falaSegura(falas[1]), 2400, 176)
      );
      this.time.delayedCall(6600, () =>
        this.mostrarBalaoTexto(this.yuumi.x, 106, falaSegura(falas[2]), 1800, 144)
      );

      this.time.delayedCall(9000, () => fadeToScene(this, "Fase6Tempestade", 1500));
    });
  }

  // ---------- efeitos ----------

  private flashTela(): void {
    const flash = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 1)
      .setScrollFactor(0)
      .setDepth(250);
    this.time.delayedCall(90, () => flash.destroy());
  }

  private poeira(x: number, y: number, quantidade: number): void {
    for (let i = 0; i < quantidade; i++) {
      const p = this.add
        .rectangle(x + Phaser.Math.Between(-4, 4), y + Phaser.Math.Between(-2, 2), 1, 1, 0xc4b8a8)
        .setDepth(17)
        .setAlpha(0.8);
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-6, 6),
        y: p.y - Phaser.Math.Between(2, 6),
        alpha: 0,
        duration: Phaser.Math.Between(250, 450),
        onComplete: () => p.destroy(),
      });
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

  // ---------- balão de texto único (com clamp na câmera/zoom) ----------

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

    // clamp pelo retângulo visível (funciona também com zoom da câmera)
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

  // ---------- texturas ----------

  private criarTexturas(): void {
    criarTexturasCoracoes(this);

    // poses da Yuumitcha
    const poses: Array<[string, string[]]> = [
      ["yuumiRunA", YUUMI_RUN_A],
      ["yuumiRunB", YUUMI_RUN_B],
      ["yuumiSentada", YUUMI_SENTADA],
      ["yuumiTilt", YUUMI_TILT],
      ["yuumiDeitada", YUUMI_DEITADA],
      ["yuumiWagB", YUUMI_WAG_B],
    ];
    for (const [key, grid] of poses) {
      createTextureFromData(this, key, { palette: YUUMITCHA.palette, grid });
    }

    // os dois sentados no sofá
    createTextureFromData(this, "gabSentada", GABITCHA_SENTADA);
    createTextureFromData(this, "rafSofa", RAFITCHO_SOFA);

    // caixa fechada (com mini-etiqueta) e aberta
    if (!this.textures.exists("caixaPequena")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x8a6240, 1);
      g.fillRect(0, 0, 26, 20);
      g.fillStyle(0xb8894f, 1);
      g.fillRect(1, 1, 24, 18);
      g.fillStyle(0x8a6240, 1);
      g.fillRect(1, 6, 24, 1); // vinco das abas
      g.fillStyle(0xd8c8a8, 0.9);
      g.fillRect(11, 1, 4, 18); // fita
      g.fillStyle(0xf6f2e8, 1);
      g.fillRect(3, 9, 7, 8); // mini-etiqueta
      g.fillStyle(0x2c7f7a, 1);
      g.fillRect(4, 11, 5, 1);
      g.fillStyle(0x5a5a66, 1);
      g.fillRect(4, 13, 5, 1);
      g.fillRect(4, 15, 3, 1);
      g.generateTexture("caixaPequena", 26, 20);
      g.destroy();
    }
    if (!this.textures.exists("caixaAberta")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      // abas abertas pra cima
      g.fillStyle(0x8a6240, 1);
      g.fillRect(0, 0, 4, 10);
      g.fillRect(22, 0, 4, 10);
      g.fillStyle(0xa87f4e, 1);
      g.fillRect(1, 1, 2, 8);
      g.fillRect(23, 1, 2, 8);
      // corpo
      g.fillStyle(0x8a6240, 1);
      g.fillRect(0, 8, 26, 16);
      g.fillStyle(0xb8894f, 1);
      g.fillRect(1, 9, 24, 14);
      g.fillStyle(0x2a1c12, 1);
      g.fillRect(3, 9, 20, 4); // interior escuro
      g.fillStyle(0xf6f2e8, 1);
      g.fillRect(3, 14, 7, 7); // etiqueta
      g.fillStyle(0x2c7f7a, 1);
      g.fillRect(4, 16, 5, 1);
      g.fillStyle(0x5a5a66, 1);
      g.fillRect(4, 18, 4, 1);
      g.generateTexture("caixaAberta", 26, 24);
      g.destroy();
    }

    this.criarTexturasItens();
  }

  private criarTexturasItens(): void {
    // chinelo (do par NOVO)
    if (!this.textures.exists("item_chinelo")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xb03060, 1);
      g.fillRect(1, 1, 10, 6); // sola (contorno)
      g.fillStyle(0xe05a8a, 1);
      g.fillRect(2, 2, 8, 4);
      g.fillStyle(0xf2f0f7, 1);
      g.fillRect(4, 1, 1, 3);
      g.fillRect(6, 1, 1, 3);
      g.fillRect(5, 0, 1, 2); // tirinhas
      g.generateTexture("item_chinelo", 12, 8);
      g.destroy();
    }
    // fio de carregador
    if (!this.textures.exists("item_fio")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x3f3f4c, 1);
      g.fillRect(0, 4, 4, 1);
      g.fillRect(3, 2, 1, 3);
      g.fillRect(4, 2, 4, 1);
      g.fillRect(7, 2, 1, 4);
      g.fillRect(8, 5, 4, 1); // cabo em zigue-zague
      g.fillStyle(0xf2f0f7, 1);
      g.fillRect(11, 3, 3, 5); // plugue
      g.fillStyle(0xc2c6d0, 1);
      g.fillRect(12, 1, 1, 2); // pino
      g.generateTexture("item_fio", 14, 8);
      g.destroy();
    }
    // almofada do sofá
    if (!this.textures.exists("item_almofada")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xb03060, 1);
      g.fillRect(0, 1, 11, 7);
      g.fillStyle(0xff7aa2, 1);
      g.fillRect(1, 2, 9, 5);
      g.fillStyle(0xffb8d0, 1);
      g.fillRect(1, 2, 9, 1);
      g.fillStyle(0xb03060, 1);
      g.fillRect(5, 4, 1, 1); // botão central
      g.generateTexture("item_almofada", 11, 9);
      g.destroy();
    }
    // controle de TV
    if (!this.textures.exists("item_controle")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x101014, 1);
      g.fillRect(0, 0, 12, 6);
      g.fillStyle(0x2b2b33, 1);
      g.fillRect(1, 1, 10, 4);
      g.fillStyle(0xc0392b, 1);
      g.fillRect(2, 2, 2, 2); // botão de power
      g.fillStyle(0xc2c6d0, 1);
      g.fillRect(6, 2, 1, 1);
      g.fillRect(8, 2, 1, 1);
      g.fillRect(7, 3, 1, 1);
      g.generateTexture("item_controle", 12, 6);
      g.destroy();
    }
    // plantinha de vaso
    if (!this.textures.exists("item_planta")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x3a6b30, 1);
      g.fillRect(5, 0, 2, 6);
      g.fillRect(2, 2, 3, 2);
      g.fillRect(7, 1, 3, 2); // folhas
      g.fillStyle(0x4c9a44, 1);
      g.fillRect(2, 1, 2, 2);
      g.fillRect(8, 0, 2, 2);
      g.fillStyle(0xb85838, 1);
      g.fillRect(3, 6, 6, 5); // vaso
      g.fillStyle(0x8a3f28, 1);
      g.fillRect(3, 10, 6, 1);
      g.generateTexture("item_planta", 12, 12);
      g.destroy();
    }
    // rolo de papel higiênico
    if (!this.textures.exists("item_papel")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xc2c6d0, 1);
      g.fillRect(0, 1, 8, 7);
      g.fillStyle(0xf2f0f7, 1);
      g.fillRect(1, 2, 6, 5);
      g.fillStyle(0x9aa2b8, 1);
      g.fillRect(3, 4, 2, 2); // furo do rolo
      g.fillStyle(0xf2f0f7, 1);
      g.fillRect(7, 5, 4, 2); // pontinha solta
      g.generateTexture("item_papel", 11, 9);
      g.destroy();
    }
  }
}
