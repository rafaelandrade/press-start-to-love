import Phaser from "phaser";
import { DIALOGOS } from "../dialogos";
import { UI, GAME_WIDTH, GAME_HEIGHT } from "../ui/constants";
import { fadeIn, fadeToScene } from "../ui/transitions";
import { TouchControls } from "../ui/TouchControls";
import { Balao } from "../ui/Balao";
import { criarTexturaNuvem, criarTexturaMala } from "../ui/effects";

/**
 * Prólogo — "Duas cidades"
 * Gabitcha sai da cidade pequena rumo a São Paulo, arrastando a malinha.
 * Fundo em parallax (sol, nuvens, morros), falas engraçadas em balão e
 * o painel "enquanto isso..." com o Rafitcho no PC.
 * Mecânica: andar para a direita (tutorial disfarçado).
 */

const MUNDO_LARGURA = 1150;
const VELOCIDADE = 90;
const CHAO_Y = GAME_HEIGHT - 24;

interface Gatilho {
  x: number;
  tipo: "fala" | "enquantoIsso" | "fim";
  indiceFala?: number;
  usado: boolean;
}

export class Prologo extends Phaser.Scene {
  private gabitcha!: Phaser.Physics.Arcade.Sprite;
  private mala!: Phaser.GameObjects.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private touch!: TouchControls;
  private balao!: Balao;
  private gatilhos: Gatilho[] = [];
  private emCena = false; // pausa o movimento durante balões/painéis

  constructor() {
    super("Prologo");
  }

  create(): void {
    fadeIn(this);
    criarTexturaNuvem(this);
    criarTexturaMala(this);

    this.physics.world.setBounds(0, 0, MUNDO_LARGURA, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, MUNDO_LARGURA, GAME_HEIGHT);

    this.criarCenario();

    // Gabitcha + malinha de rodinha
    this.gabitcha = this.physics.add.sprite(40, CHAO_Y - 18, "gabitcha").setScale(1.5);
    (this.gabitcha.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.gabitcha.setCollideWorldBounds(true);
    this.gabitcha.setDepth(20);

    this.mala = this.add.image(this.gabitcha.x - 14, CHAO_Y - 4, "mala").setDepth(19);

    this.cameras.main.startFollow(this.gabitcha, true, 0.08, 0.08);
    this.cameras.main.followOffset.set(-40, 0);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.touch = new TouchControls(this);
    this.balao = new Balao(this);

    // Título + dica de movimento
    const titulo = this.add
      .text(GAME_WIDTH / 2, 14, DIALOGOS.prologo.titulo, {
        fontFamily: UI.fonte,
        fontSize: "9px",
        color: "#7a4a2f",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(50);
    this.time.delayedCall(3000, () =>
      this.tweens.add({ targets: titulo, alpha: 0, duration: 800 })
    );

    const dica = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 10, DIALOGOS.prologo.dica, {
        fontFamily: UI.fonte,
        fontSize: "7px",
        color: "#5a3a24",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(50);
    this.tweens.add({ targets: dica, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
    this.time.delayedCall(5000, () => dica.destroy());

    // Gatilhos das falas ao longo do caminho
    this.gatilhos = [
      { x: 70, tipo: "fala", indiceFala: 0, usado: false },
      { x: 300, tipo: "fala", indiceFala: 1, usado: false },
      { x: 520, tipo: "enquantoIsso", usado: false },
      { x: 720, tipo: "fala", indiceFala: 2, usado: false },
      { x: 930, tipo: "fala", indiceFala: 3, usado: false },
      { x: MUNDO_LARGURA - 80, tipo: "fim", usado: false },
    ];
  }

  update(time: number): void {
    if (this.emCena) {
      this.gabitcha.setVelocityX(0);
      return;
    }

    const esquerda = this.cursors.left.isDown || this.touch.esquerda;
    const direita = this.cursors.right.isDown || this.touch.direita;
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

    // "Animação" de caminhada: bob vertical + malinha balançando atrás
    if (andando) {
      this.gabitcha.y = CHAO_Y - 18 + Math.abs(Math.sin(time / 90)) * -2;
      this.gabitcha.angle = Math.sin(time / 90) * 2;
    } else {
      this.gabitcha.y = CHAO_Y - 18 + Math.sin(time / 300); // idle suave
      this.gabitcha.angle = 0;
    }

    const lado = this.gabitcha.flipX ? 14 : -14;
    this.mala.x = this.gabitcha.x + lado;
    this.mala.y = CHAO_Y - 4 + (andando ? Math.sin(time / 80) * 1.5 : 0);
    this.mala.angle = andando ? Math.sin(time / 80) * 6 : 0;

    // Gatilhos
    for (const g of this.gatilhos) {
      if (!g.usado && this.gabitcha.x >= g.x) {
        g.usado = true;
        this.disparar(g);
        break;
      }
    }
  }

  // ---------- gatilhos ----------

  private disparar(g: Gatilho): void {
    this.emCena = true;
    this.gabitcha.setVelocityX(0);
    this.gabitcha.angle = 0;

    if (g.tipo === "fala") {
      const fala = DIALOGOS.prologo.falas[g.indiceFala!];
      this.balao.falar(this.gabitcha.x, this.gabitcha.y - 20, fala, () => {
        this.emCena = false;
      });
    } else if (g.tipo === "enquantoIsso") {
      this.mostrarEnquantoIsso();
    } else {
      this.finalizar();
    }
  }

  /** Painel "enquanto isso, na cidade grande..." com o Rafitcho no PC. */
  private mostrarEnquantoIsso(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const overlay = this.add
      .rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x101223, 0.75)
      .setScrollFactor(0)
      .setDepth(150);
    const painel = this.add
      .rectangle(cx, cy, 230, 110, UI.painel)
      .setScrollFactor(0)
      .setDepth(151)
      .setStrokeStyle(2, 0x2c3160);

    // Rafitcho + "monitor" com luz piscando
    const monitor = this.add
      .rectangle(cx - 62, cy - 6, 34, 24, 0x0b0d1a)
      .setScrollFactor(0)
      .setDepth(152)
      .setStrokeStyle(1, 0x4fd6c4);
    const luz = this.add
      .rectangle(cx - 62, cy - 6, 28, 18, 0x4fd6c4, 0.35)
      .setScrollFactor(0)
      .setDepth(152);
    this.tweens.add({ targets: luz, alpha: 0.1, duration: 300, yoyo: true, repeat: -1 });

    const rafitcho = this.add
      .image(cx - 62, cy + 26, "rafitcho")
      .setScale(1.5)
      .setScrollFactor(0)
      .setDepth(152);
    this.tweens.add({ targets: rafitcho, y: cy + 24, duration: 500, yoyo: true, repeat: -1 });

    const texto = this.add
      .text(cx + 25, cy, "", {
        fontFamily: UI.fonte,
        fontSize: "6px",
        color: UI.texto,
        align: "center",
        lineSpacing: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(152);

    // typewriter do painel
    const fala = DIALOGOS.prologo.enquantoIsso;
    let i = 0;
    const timer = this.time.addEvent({
      delay: 30,
      repeat: fala.length - 1,
      callback: () => texto.setText(fala.slice(0, ++i)),
    });

    const fechar = () => {
      if (i < fala.length) {
        timer.remove();
        texto.setText(fala);
        i = fala.length;
        this.time.delayedCall(150, () => {
          this.input.once("pointerdown", fechar);
          this.input.keyboard?.once("keydown-SPACE", fechar);
        });
        return;
      }
      [overlay, painel, monitor, luz, rafitcho, texto].forEach((o) => o.destroy());
      this.emCena = false;
    };
    this.time.delayedCall(400, () => {
      this.input.once("pointerdown", fechar);
      this.input.keyboard?.once("keydown-SPACE", fechar);
    });
  }

  /** Narração final + transição pra Fase 1. */
  private finalizar(): void {
    this.balao.fechar(false);
    const cx = GAME_WIDTH / 2;

    const escurecer = this.add
      .rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x101223)
      .setScrollFactor(0)
      .setDepth(150)
      .setAlpha(0);
    this.tweens.add({ targets: escurecer, alpha: 0.85, duration: 1200 });

    const narracao = this.add
      .text(cx, GAME_HEIGHT / 2, DIALOGOS.prologo.narracao, {
        fontFamily: UI.fonte,
        fontSize: "8px",
        color: UI.texto,
        align: "center",
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(151)
      .setAlpha(0);
    this.tweens.add({ targets: narracao, alpha: 1, duration: 1200, delay: 800 });

    this.time.delayedCall(2400, () => {
      const ir = () => fadeToScene(this, "Fase1Match");
      this.input.once("pointerdown", ir);
      this.input.keyboard?.once("keydown-SPACE", ir);
      this.time.delayedCall(4000, ir); // avança sozinho se ela só assistir
    });
  }

  // ---------- cenário ----------

  private criarCenario(): void {
    // Céu de fim de tarde (gradiente em faixas, cobre a tela toda)
    const ceu = this.add.graphics().setDepth(-10).setScrollFactor(0);
    const topo = Phaser.Display.Color.ValueToColor(0x7ec8e3);
    const base = Phaser.Display.Color.ValueToColor(0xffd9a0);
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
      const t = y / GAME_HEIGHT;
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(topo, base, 100, t * 100);
      ceu.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      ceu.fillRect(0, y, GAME_WIDTH, 4);
    }

    // Sol com raios pulsando
    const sol = this.add.circle(48, 34, 12, 0xffe066).setScrollFactor(0.05).setDepth(-9);
    const brilho = this.add.circle(48, 34, 16, 0xffe066, 0.3).setScrollFactor(0.05).setDepth(-9);
    this.tweens.add({ targets: brilho, scale: 1.25, alpha: 0.1, duration: 1500, yoyo: true, repeat: -1 });
    void sol;

    // Nuvens em parallax, deslizando devagar
    for (let i = 0; i < 6; i++) {
      const nuvem = this.add
        .image(Phaser.Math.Between(0, MUNDO_LARGURA), 20 + (i % 3) * 16, "nuvem")
        .setScrollFactor(0.25)
        .setDepth(-8)
        .setAlpha(0.85)
        .setScale(Phaser.Math.FloatBetween(0.8, 1.6));
      this.tweens.add({
        targets: nuvem,
        x: nuvem.x + Phaser.Math.Between(30, 70),
        duration: Phaser.Math.Between(9000, 16000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // Morros distantes (parallax)
    const morros = this.add.graphics().setScrollFactor(0.4).setDepth(-7);
    morros.fillStyle(0x7aa95c, 1);
    for (let i = 0; i < 14; i++) {
      const mx = i * 110 - 30;
      morros.fillEllipse(mx, GAME_HEIGHT - 14, 160, 70);
    }
    morros.fillStyle(0x5d8a44, 1);
    for (let i = 0; i < 14; i++) {
      const mx = i * 95 + 20;
      morros.fillEllipse(mx, GAME_HEIGHT - 4, 140, 46);
    }

    // Chão / estradinha de terra
    const chao = this.add.graphics().setDepth(-5);
    chao.fillStyle(0x4c8a3f, 1);
    chao.fillRect(0, CHAO_Y - 6, MUNDO_LARGURA, GAME_HEIGHT - CHAO_Y + 6);
    chao.fillStyle(0xb08d5f, 1);
    chao.fillRect(0, CHAO_Y, MUNDO_LARGURA, 10);
    chao.fillStyle(0x94764e, 1);
    for (let x = 0; x < MUNDO_LARGURA; x += 22) chao.fillRect(x + 6, CHAO_Y + 4, 8, 2);

    // Cidade pequena no começo: casinhas + igrejinha
    this.criarCasinha(85, 0xe8b4b8);
    this.criarCasinha(150, 0xa8c8e8);
    this.criarIgrejinha(215);
    this.criarCasinha(275, 0xf0d8a8);

    // Árvores e flores pelo caminho
    for (let x = 360; x < MUNDO_LARGURA - 200; x += 120) {
      this.criarArvore(x + Phaser.Math.Between(-20, 20));
    }
    for (let x = 60; x < MUNDO_LARGURA - 120; x += 34) {
      const cor = [0xff7aa2, 0xe9b44c, 0xffffff][Phaser.Math.Between(0, 2)];
      this.add.rectangle(x + Phaser.Math.Between(0, 16), CHAO_Y - 8, 2, 2, cor).setDepth(-4);
      this.add.rectangle(x + Phaser.Math.Between(0, 16), CHAO_Y - 7, 1, 3, 0x2d5a1e).setDepth(-5);
    }

    // Placa "SÃO PAULO →"
    const placaX = MUNDO_LARGURA - 260;
    this.add.rectangle(placaX, CHAO_Y - 14, 3, 22, 0x6b4a2f).setDepth(-4);
    this.add.rectangle(placaX, CHAO_Y - 26, 62, 16, 0x3d6b35).setDepth(-4).setStrokeStyle(1, 0xffffff);
    this.add
      .text(placaX, CHAO_Y - 26, DIALOGOS.prologo.placa, {
        fontFamily: UI.fonte,
        fontSize: "5px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(-3);

    // Silhueta da cidade grande no horizonte final
    const cidade = this.add.graphics().setDepth(-6);
    let cx = MUNDO_LARGURA - 190;
    let i = 0;
    while (cx < MUNDO_LARGURA) {
      const largura = 20 + ((i * 13) % 14);
      const altura = 45 + ((i * 27) % 55);
      cidade.fillStyle(0x5a6b8c, 0.9);
      cidade.fillRect(cx, CHAO_Y - altura, largura, altura);
      cidade.fillStyle(0xe9b44c, 0.6);
      for (let wy = CHAO_Y - altura + 4; wy < CHAO_Y - 6; wy += 8) {
        for (let wx = cx + 3; wx < cx + largura - 3; wx += 7) {
          if ((wx + wy + i) % 3 === 0) cidade.fillRect(wx, wy, 2, 3);
        }
      }
      cx += largura + 4;
      i++;
    }

    // Passarinhos (v's animados)
    for (let i2 = 0; i2 < 4; i2++) {
      const p = this.add
        .text(Phaser.Math.Between(100, MUNDO_LARGURA), Phaser.Math.Between(20, 55), "v", {
          fontFamily: UI.fonte,
          fontSize: "5px",
          color: "#3a3a3a",
        })
        .setScrollFactor(0.6)
        .setDepth(-7);
      this.tweens.add({
        targets: p,
        x: p.x - Phaser.Math.Between(150, 400),
        y: p.y + Phaser.Math.Between(-12, 12),
        duration: Phaser.Math.Between(12000, 20000),
        repeat: -1,
      });
    }
  }

  private criarCasinha(x: number, cor: number): void {
    const g = this.add.graphics().setDepth(-4);
    g.fillStyle(cor, 1);
    g.fillRect(x - 16, CHAO_Y - 26, 32, 26); // corpo
    g.fillStyle(0x8a4a3a, 1); // telhado
    g.fillTriangle(x - 20, CHAO_Y - 26, x + 20, CHAO_Y - 26, x, CHAO_Y - 40);
    g.fillStyle(0x5a3a24, 1); // porta
    g.fillRect(x - 4, CHAO_Y - 12, 8, 12);
    g.fillStyle(0xfff3cf, 1); // janela acesa
    g.fillRect(x + 6, CHAO_Y - 20, 6, 6);
    g.lineStyle(1, 0x5a3a24, 1);
    g.strokeRect(x + 6, CHAO_Y - 20, 6, 6);
  }

  private criarIgrejinha(x: number): void {
    const g = this.add.graphics().setDepth(-4);
    g.fillStyle(0xf5f0e8, 1);
    g.fillRect(x - 12, CHAO_Y - 34, 24, 34);
    g.fillStyle(0x8a4a3a, 1);
    g.fillTriangle(x - 15, CHAO_Y - 34, x + 15, CHAO_Y - 34, x, CHAO_Y - 52);
    g.fillStyle(0x5a3a24, 1);
    g.fillRect(x - 3, CHAO_Y - 14, 6, 14);
    // cruz
    g.fillStyle(0xe9b44c, 1);
    g.fillRect(x - 1, CHAO_Y - 60, 2, 8);
    g.fillRect(x - 3, CHAO_Y - 58, 6, 2);
  }

  private criarArvore(x: number): void {
    const g = this.add.graphics().setDepth(-4);
    g.fillStyle(0x6b4a2f, 1);
    g.fillRect(x - 2, CHAO_Y - 16, 4, 16);
    g.fillStyle(0x3d6b35, 1);
    g.fillCircle(x, CHAO_Y - 22, 10);
    g.fillCircle(x - 7, CHAO_Y - 16, 7);
    g.fillCircle(x + 7, CHAO_Y - 16, 7);
  }
}
