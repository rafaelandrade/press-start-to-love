import Phaser from "phaser";
import { DIALOGOS } from "../dialogos";
import { UI, GAME_WIDTH, GAME_HEIGHT, FONT_SM, FONT_MD } from "../ui/constants";
import { fadeIn, fadeToScene } from "../ui/transitions";
import { TouchControls } from "../ui/TouchControls";
import { Balao } from "../ui/Balao";
import { criarTexturaNuvem, criarTexturaMala } from "../ui/effects";
import { createTextureFromData } from "../sprites/factory";
import { atualizarAndar } from "../sprites/anims";
import type { SpriteData } from "../sprites/data";

/**
 * Prólogo — "Duas cidades"
 * Gabitcha sai da cidade pequena rumo a São Paulo, arrastando a malinha.
 * Cenário em 3 planos (morros azulados > vilarejo > caminho de terra),
 * materiais com 3 tons e luz de cima-esquerda, set dressing de interior
 * (ponto de ônibus, varal, galinha, cerca) e vida ambiente (fumaça,
 * pássaros, roupas balançando). Mecânica: andar para a direita.
 */

const MUNDO_LARGURA = 1150;
const VELOCIDADE = 90;
const CHAO_Y = GAME_HEIGHT - 24;

// Galinha parada bicando o chão (set dressing com vida)
const GALINHA: SpriteData = {
  palette: {
    R: "#c14a5a", // crista
    W: "#f4efe2", // pena clara
    w: "#cfc4a8", // pena sombra
    G: "#e9b44c", // bico
    k: "#1a1114", // olho
    O: "#c98a3a", // patas
  },
  grid: [
    "..R.......",
    ".RWk......",
    "GWWW.www..",
    ".WWWWWWWw.",
    ".wWWWWWWw.",
    "..wwwwww..",
    "..O...O...",
  ],
};

// Pássaro que cruza o céu de tempos em tempos
const PASSARO: SpriteData = {
  palette: { k: "#3a3540", w: "#8a8494" },
  grid: [
    "k.....k",
    ".k.w.k.",
    "..kkk..",
  ],
};

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
    createTextureFromData(this, "galinha", GALINHA);
    createTextureFromData(this, "passaro", PASSARO);

    this.physics.world.setBounds(0, 0, MUNDO_LARGURA, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, MUNDO_LARGURA, GAME_HEIGHT);

    this.criarCenario();

    // Gabitcha + malinha de rodinha
    this.gabitcha = this.physics.add.sprite(40, CHAO_Y - 24, "gabitcha").setScale(1);
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
        fontSize: FONT_MD,
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
        fontSize: FONT_SM,
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
      atualizarAndar(this.gabitcha, "gabitcha", false);
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

    // ciclo de caminhada de verdade (frames) + malinha balançando atrás
    this.gabitcha.y = CHAO_Y - 24;
    this.gabitcha.angle = 0;
    atualizarAndar(this.gabitcha, "gabitcha", andando);

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

  /** Painel "enquanto isso..." — o quarto gamer do Rafitcho. */
  private mostrarEnquantoIsso(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const px = cx - 152; // canto sup-esquerdo do painel
    const py = cy - 62;

    const overlay = this.add
      .rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x101223, 0.75)
      .setScrollFactor(0)
      .setDepth(150);
    const painel = this.add
      .rectangle(cx, cy, 304, 124, UI.painel)
      .setScrollFactor(0)
      .setDepth(151)
      .setStrokeStyle(2, 0x2c3160);

    // Quarto do Rafitcho (parede, chão, poster de anime, estante, cama, mesa)
    const quarto = this.add.graphics().setScrollFactor(0).setDepth(152);

    // parede + chão de madeira + rodapé
    quarto.fillStyle(0x232045, 1);
    quarto.fillRect(px + 2, py + 2, 88, 118);
    quarto.fillStyle(0x3a2a20, 1);
    quarto.fillRect(px + 2, py + 90, 88, 30);
    quarto.fillStyle(0x2a1d16, 1);
    for (let fy = py + 96; fy < py + 120; fy += 6) quarto.fillRect(px + 2, fy, 88, 1);
    quarto.fillStyle(0x34305c, 1);
    quarto.fillRect(px + 2, py + 88, 88, 2);

    // poster de anime na parede
    quarto.fillStyle(0xe8e6f2, 1);
    quarto.fillRect(px + 7, py + 8, 18, 24);
    quarto.fillStyle(0x2a2432, 1);
    quarto.fillRect(px + 8, py + 9, 16, 22);
    quarto.fillStyle(0x4fd6c4, 1);
    quarto.fillRect(px + 8, py + 9, 16, 3); // logo do "anime"
    quarto.fillStyle(0xff7aa2, 1);
    quarto.fillRect(px + 12, py + 15, 8, 10); // personagem
    quarto.fillStyle(0xffffff, 1);
    quarto.fillRect(px + 14, py + 17, 2, 2); // olho
    quarto.fillRect(px + 18, py + 17, 2, 2);
    quarto.fillStyle(0xe9b44c, 1);
    quarto.fillRect(px + 9, py + 26, 2, 2); // estrelinha

    // estante de livros (com action figure em cima)
    quarto.fillStyle(0x4fd6c4, 1);
    quarto.fillRect(px + 68, py + 2, 3, 4); // action figure
    quarto.fillStyle(0x5a3a24, 1);
    quarto.fillRect(px + 60, py + 6, 28, 36);
    quarto.fillStyle(0x241812, 1);
    quarto.fillRect(px + 62, py + 8, 24, 14);
    quarto.fillRect(px + 62, py + 26, 24, 14);
    const coresLivros = [0xff7aa2, 0x4fd6c4, 0xe9b44c, 0xe8e6f2, 0xc14a5a, 0x7a5436, 0x4fd6c4];
    coresLivros.forEach((cor, i) => {
      const h = 10 + (i % 3);
      quarto.fillStyle(cor, 1);
      quarto.fillRect(px + 63 + i * 3, py + 22 - h, 2, h);
      quarto.fillRect(px + 63 + ((i * 5 + 2) % 21), py + 40 - h, 2, h);
    });

    // cama (colchão, travesseiro, cobertor teal)
    quarto.fillStyle(0x5a3a24, 1);
    quarto.fillRect(px + 4, py + 92, 3, 22); // cabeceira
    quarto.fillRect(px + 6, py + 106, 30, 3); // estrado
    quarto.fillRect(px + 34, py + 108, 2, 6); // pé
    quarto.fillRect(px + 7, py + 108, 2, 6);
    quarto.fillStyle(0xd8d4e4, 1);
    quarto.fillRect(px + 7, py + 100, 29, 6); // colchão
    quarto.fillStyle(0xf2f0f7, 1);
    quarto.fillRect(px + 8, py + 97, 8, 4); // travesseiro
    quarto.fillStyle(0x3aa6a0, 1);
    quarto.fillRect(px + 17, py + 99, 19, 7); // cobertor
    quarto.fillStyle(0x2c7f7a, 1);
    quarto.fillRect(px + 17, py + 99, 2, 7); // dobra

    // mesa do PC
    quarto.fillStyle(0x8a6240, 1);
    quarto.fillRect(cx - 129, cy + 6, 48, 1);
    quarto.fillStyle(0x5a3a24, 1);
    quarto.fillRect(cx - 129, cy + 7, 48, 2);
    quarto.fillRect(cx - 127, cy + 9, 2, 15); // pernas
    quarto.fillRect(cx - 83, cy + 9, 2, 15);

    // monitor com luz teal piscando
    const monitor = this.add
      .rectangle(cx - 105, cy - 6, 34, 24, 0x0b0d1a)
      .setScrollFactor(0)
      .setDepth(152)
      .setStrokeStyle(1, 0x4fd6c4);
    const luz = this.add
      .rectangle(cx - 105, cy - 6, 28, 18, 0x4fd6c4, 0.35)
      .setScrollFactor(0)
      .setDepth(152);
    this.tweens.add({ targets: luz, alpha: 0.1, duration: 300, yoyo: true, repeat: -1 });

    const rafitcho = this.add
      .image(cx - 105, cy + 26, "rafitcho")
      .setScale(1)
      .setScrollFactor(0)
      .setDepth(152);
    this.tweens.add({ targets: rafitcho, y: cy + 24, duration: 500, yoyo: true, repeat: -1 });

    // luz do monitor iluminando o rosto dele
    const luzRosto = this.add
      .rectangle(cx - 105, cy + 16, 28, 14, 0x4fd6c4, 0.16)
      .setScrollFactor(0)
      .setDepth(152);
    this.tweens.add({ targets: luzRosto, alpha: 0.05, duration: 300, yoyo: true, repeat: -1 });

    const texto = this.add
      .text(cx + 46, cy, "", {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
        align: "center",
        lineSpacing: 4,
        wordWrap: { width: 190 },
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
      [overlay, painel, quarto, monitor, luz, rafitcho, luzRosto, texto].forEach((o) =>
        o.destroy()
      );
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
        fontSize: FONT_SM,
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
      this.time.delayedCall(4000, ir); // avança sozinha se ela só assistir
    });
  }

  // ---------- cenário ----------

  private criarCenario(): void {
    this.criarCeu();
    this.criarMorros();
    this.criarChao();
    this.criarVilarejo();
    this.criarCidadeGrandeAoLonge();
    this.criarPassaros();
  }

  /** Deriva sombra/base/brilho/contorno de uma cor (luz de cima-esquerda). */
  private tons(cor: number): { claro: number; base: number; escuro: number; contorno: number } {
    const c = Phaser.Display.Color.ValueToColor(cor);
    return {
      claro: c.clone().brighten(12).color,
      base: cor,
      escuro: c.clone().darken(18).color,
      contorno: c.clone().darken(38).color,
    };
  }

  /** Céu de fim de tarde em 4 bandas + sol com halo duplo + nuvens com sombra. */
  private criarCeu(): void {
    const ceu = this.add.graphics().setDepth(-10).setScrollFactor(0);
    const bandas: Array<[number, number]> = [
      [0x5fb0d8, 34],
      [0x7ec8e3, 34],
      [0xa5d8e8, 30],
      [0xffd9a0, GAME_HEIGHT - 98], // horizonte quente atrás dos morros
    ];
    let y = 0;
    for (const [cor, altura] of bandas) {
      ceu.fillStyle(cor, 1);
      ceu.fillRect(0, y, GAME_WIDTH, altura);
      y += altura;
    }

    // Sol com halo em 2 círculos de alpha
    const halo2 = this.add.circle(48, 34, 19, 0xffe066, 0.12).setScrollFactor(0.05).setDepth(-9);
    const halo1 = this.add.circle(48, 34, 14, 0xffe066, 0.25).setScrollFactor(0.05).setDepth(-9);
    this.add.circle(48, 34, 10, 0xffe066).setScrollFactor(0.05).setDepth(-9);
    this.tweens.add({
      targets: [halo1, halo2],
      scale: 1.15,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Nuvens com sombra na base, deslizando devagar
    for (let i = 0; i < 7; i++) {
      const nuvem = this.add
        .image(Phaser.Math.Between(0, 520), 12 + (i % 3) * 15, "nuvem")
        .setScrollFactor(0.2)
        .setDepth(-9)
        .setAlpha(0.95)
        .setScale(Phaser.Math.Between(1, 2));
      this.tweens.add({
        targets: nuvem,
        x: nuvem.x + Phaser.Math.Between(30, 70),
        duration: Phaser.Math.Between(11000, 18000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  /** Fundo: morros em 2 camadas — distante azulado com silhuetas, próximo verde. */
  private criarMorros(): void {
    // Camada distante: clara/azulada, baixo contraste com o céu
    const dist = this.add.graphics().setScrollFactor(0.25).setDepth(-8);
    dist.fillStyle(0xa9cbc2, 1);
    for (let i = 0; i < 9; i++) {
      const mx = i * 84 - 20;
      const topo = 96 - ((i * 23) % 26);
      dist.fillEllipse(mx, 150, 176, (150 - topo) * 2);
    }
    dist.fillRect(0, 116, 680, GAME_HEIGHT - 116);

    // Silhuetas discretas na crista (tom só um pouco mais escuro)
    dist.fillStyle(0x8fb4aa, 1);
    // arvoredo distante
    for (const [ax, ay] of [[60, 92], [78, 96], [250, 84], [268, 88], [420, 94], [560, 88]]) {
      dist.fillCircle(ax, ay, 4);
      dist.fillRect(ax - 1, ay, 2, 8);
    }
    // caixa d'água no horizonte
    dist.fillEllipse(160, 78, 16, 10);
    dist.fillRect(155, 82, 2, 16);
    dist.fillRect(163, 82, 2, 16);
    dist.fillRect(159, 76, 2, 4);
    // igrejinha distante
    dist.fillRect(340, 86, 8, 14);
    dist.fillTriangle(338, 86, 350, 86, 344, 78);
    dist.fillRect(343, 74, 2, 5);

    // Camada próxima: campina verde com moitas em 2º tom
    const perto = this.add.graphics().setScrollFactor(0.45).setDepth(-7);
    perto.fillStyle(0x7fae64, 1);
    for (let i = 0; i < 10; i++) {
      const mx = i * 92 - 30;
      const topo = 122 - ((i * 17) % 20);
      perto.fillEllipse(mx, 168, 196, (168 - topo) * 2);
    }
    perto.fillRect(0, 136, 800, GAME_HEIGHT - 136);
    perto.fillStyle(0x639252, 1);
    perto.fillRect(0, 150, 800, GAME_HEIGHT - 150); // sombra na base da campina
    for (let i = 0; i < 22; i++) {
      const bx = (i * 71 + 13) % 800;
      const by = 122 + ((i * 19) % 24);
      perto.fillCircle(bx, by, 3 + (i % 3));
    }
  }

  /** Frente: grama em 2 tons + caminho de terra com pedrinhas + tufos + flores. */
  private criarChao(): void {
    const g = this.add.graphics().setDepth(-5);

    // grama base com linha de luz no topo
    g.fillStyle(0x4c8a3f, 1);
    g.fillRect(0, CHAO_Y - 6, MUNDO_LARGURA, GAME_HEIGHT - CHAO_Y + 6);
    g.fillStyle(0x5fa04c, 1);
    g.fillRect(0, CHAO_Y - 6, MUNDO_LARGURA, 2);

    // caminho de terra com borda clara em cima e escura embaixo
    g.fillStyle(0xb08d5f, 1);
    g.fillRect(0, CHAO_Y + 2, MUNDO_LARGURA, 12);
    g.fillStyle(0xc9a873, 1);
    g.fillRect(0, CHAO_Y + 2, MUNDO_LARGURA, 1);
    g.fillStyle(0x8a6a45, 1);
    g.fillRect(0, CHAO_Y + 13, MUNDO_LARGURA, 1);

    // pedrinhas e variação de tom
    for (let i = 0; i < MUNDO_LARGURA / 8; i++) {
      const px = (i * 37 + 11) % MUNDO_LARGURA;
      const py = CHAO_Y + 4 + ((i * 13) % 8);
      g.fillStyle(i % 3 === 0 ? 0x94764e : 0xc4a06c, 1);
      g.fillRect(px, py, i % 4 === 0 ? 2 : 1, 1);
    }

    // tufos de grama em 2 tons (acima e abaixo do caminho)
    for (let i = 0; i < MUNDO_LARGURA / 7; i++) {
      const tx = (i * 53 + 7) % MUNDO_LARGURA;
      const ty = i % 2 === 0 ? CHAO_Y - 5 : CHAO_Y + 16 + ((i * 11) % 5);
      g.fillStyle(i % 3 === 0 ? 0x6db558 : 0x3a6b30, 1);
      g.fillRect(tx, ty, 1, 3);
      g.fillRect(tx - 1, ty + 1, 1, 2);
      g.fillRect(tx + 1, ty + 1, 1, 2);
    }

    // flores de 1-2px com caule
    let flor = 0;
    for (let x = 40; x < MUNDO_LARGURA - 60; x += 30, flor++) {
      const fx = x + ((x * 7) % 18);
      const fy = flor % 2 === 0 ? CHAO_Y - 5 : CHAO_Y + 17;
      const cor = [0xff7aa2, 0xe9b44c, 0xffffff][flor % 3];
      g.fillStyle(0x2d5a1e, 1);
      g.fillRect(fx, fy, 1, 3);
      g.fillStyle(cor, 1);
      g.fillRect(fx - 1, fy - 2, 2, 2);
    }
  }

  /** Meio: casinhas reformadas, igreja, cercas, árvores e set dressing. */
  private criarVilarejo(): void {
    this.criarPontoOnibus(18);

    this.criarCasinha(85, 0xe8b4b8);
    this.criarCasinha(150, 0xa8c8e8, true); // a da chaminé fumegante
    this.criarIgrejinha(215);
    this.criarCasinha(275, 0xf0d8a8);

    // cerquinha de madeira entre as casas
    this.criarCerca(104, 132);
    this.criarCerca(168, 196);
    this.criarCerca(232, 258);
    this.criarCerca(292, 330);

    this.criarVaral(336);
    this.criarGalinha(120);

    // árvores pelo caminho (algumas grandes preenchendo o alto da tela)
    let n = 0;
    for (let x = 390; x < MUNDO_LARGURA - 200; x += 110) {
      const s = n % 3 === 2 ? 2 : 1 + (n % 2) * 0.4;
      this.criarArvore(x + ((n * 37) % 40) - 20, s);
      n++;
    }

    // Placa "SÃO PAULO →"
    const placaX = MUNDO_LARGURA - 260;
    const g = this.add.graphics().setDepth(-4);
    g.fillStyle(0x6b4a2f, 1);
    g.fillRect(placaX - 1, CHAO_Y - 25, 3, 25);
    g.fillStyle(0x4a3320, 1);
    g.fillRect(placaX + 2, CHAO_Y - 25, 1, 25);
    this.add
      .rectangle(placaX, CHAO_Y - 26, 100, 16, 0x3d6b35)
      .setDepth(-4)
      .setStrokeStyle(1, 0xffffff);
    this.add
      .text(placaX, CHAO_Y - 26, DIALOGOS.prologo.placa, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(-3);
  }

  /** Casinha com 3 tons, beiral, janela com reflexo e porta com batente. */
  private criarCasinha(x: number, cor: number, comChamine = false): void {
    const g = this.add.graphics().setDepth(-4);
    const base = CHAO_Y;
    const p = this.tons(cor);
    const telhado = this.tons(0x8a4a3a);
    const madeira = this.tons(0x5a3a24);

    // corpo: contorno + base + lado iluminado (esq) + lado sombreado (dir)
    g.fillStyle(p.contorno, 1);
    g.fillRect(x - 17, base - 27, 34, 27);
    g.fillStyle(p.base, 1);
    g.fillRect(x - 16, base - 26, 32, 26);
    g.fillStyle(p.claro, 1);
    g.fillRect(x - 16, base - 26, 5, 26);
    g.fillStyle(p.escuro, 1);
    g.fillRect(x + 11, base - 26, 5, 26);
    g.fillRect(x - 16, base - 26, 32, 3); // sombra do beiral na parede

    // telhado com beiral (triângulo escuro maior = contorno + beiral)
    g.fillStyle(telhado.contorno, 1);
    g.fillTriangle(x - 22, base - 25, x + 22, base - 25, x, base - 42);
    g.fillStyle(telhado.base, 1);
    g.fillTriangle(x - 19, base - 26, x + 19, base - 26, x, base - 40);
    g.fillStyle(telhado.claro, 1);
    g.fillTriangle(x - 19, base - 26, x, base - 26, x, base - 40); // água iluminada

    // chaminé de tijolo + fumacinha
    if (comChamine) {
      g.fillStyle(0x6e3f33, 1);
      g.fillRect(x + 7, base - 38, 5, 8);
      g.fillStyle(0x8a5a4a, 1);
      g.fillRect(x + 7, base - 38, 2, 8);
      g.fillStyle(0x4a2a22, 1);
      g.fillRect(x + 6, base - 40, 7, 2);
      this.criarFumaca(x + 9, base - 41);
    }

    // porta com batente + maçaneta
    g.fillStyle(madeira.contorno, 1);
    g.fillRect(x - 6, base - 15, 10, 15);
    g.fillStyle(madeira.base, 1);
    g.fillRect(x - 5, base - 13, 8, 13);
    g.fillStyle(madeira.claro, 1);
    g.fillRect(x - 5, base - 13, 1, 13);
    g.fillStyle(0xd9a441, 1);
    g.fillRect(x + 1, base - 8, 1, 1);

    // janela com moldura, 4 vidraças e reflexo de 1px
    g.fillStyle(0xf5f0e8, 1);
    g.fillRect(x + 5, base - 22, 9, 9);
    g.fillStyle(0x9fd4e8, 1);
    g.fillRect(x + 6, base - 21, 7, 7);
    g.fillStyle(0xf5f0e8, 1);
    g.fillRect(x + 9, base - 21, 1, 7);
    g.fillRect(x + 6, base - 18, 7, 1);
    g.fillStyle(0xffffff, 1);
    g.fillRect(x + 7, base - 20, 1, 1); // reflexo
    g.fillStyle(madeira.escuro, 1);
    g.fillRect(x + 4, base - 13, 11, 1); // peitoril
  }

  /** Igrejinha caiada com rosácea, cruz dourada e o mesmo jogo de luz. */
  private criarIgrejinha(x: number): void {
    const g = this.add.graphics().setDepth(-4);
    const base = CHAO_Y;
    const p = this.tons(0xe8e0cc);
    const telhado = this.tons(0x8a4a3a);
    const madeira = this.tons(0x5a3a24);

    // corpo
    g.fillStyle(p.contorno, 1);
    g.fillRect(x - 13, base - 35, 26, 35);
    g.fillStyle(p.base, 1);
    g.fillRect(x - 12, base - 34, 24, 34);
    g.fillStyle(p.claro, 1);
    g.fillRect(x - 12, base - 34, 4, 34);
    g.fillStyle(p.escuro, 1);
    g.fillRect(x + 8, base - 34, 4, 34);
    g.fillRect(x - 12, base - 34, 24, 3); // sombra do beiral

    // telhado
    g.fillStyle(telhado.contorno, 1);
    g.fillTriangle(x - 17, base - 33, x + 17, base - 33, x, base - 53);
    g.fillStyle(telhado.base, 1);
    g.fillTriangle(x - 14, base - 34, x + 14, base - 34, x, base - 51);
    g.fillStyle(telhado.claro, 1);
    g.fillTriangle(x - 14, base - 34, x, base - 34, x, base - 51);

    // cruz dourada com brilho
    g.fillStyle(0xd9a441, 1);
    g.fillRect(x - 1, base - 61, 2, 8);
    g.fillRect(x - 3, base - 59, 6, 2);
    g.fillStyle(0xf0cd7a, 1);
    g.fillRect(x - 1, base - 61, 1, 4);

    // rosácea
    g.fillStyle(madeira.base, 1);
    g.fillCircle(x, base - 26, 4);
    g.fillStyle(0x9fd4e8, 1);
    g.fillCircle(x, base - 26, 3);
    g.fillStyle(0xffffff, 1);
    g.fillRect(x - 1, base - 28, 1, 1);

    // porta com batente
    g.fillStyle(madeira.contorno, 1);
    g.fillRect(x - 5, base - 16, 10, 16);
    g.fillStyle(madeira.base, 1);
    g.fillRect(x - 4, base - 14, 8, 14);
    g.fillStyle(madeira.claro, 1);
    g.fillRect(x - 4, base - 14, 1, 14);
  }

  /** Árvore com copa em 2 tons de verde e tronco com sombra. */
  private criarArvore(x: number, s = 1): void {
    const g = this.add.graphics().setDepth(-4);
    const base = CHAO_Y;

    // tronco: brilho / base / sombra
    g.fillStyle(0x4a3320, 1);
    g.fillRect(x, base - 18 * s, 2 * s, 18 * s);
    g.fillStyle(0x6b4a2f, 1);
    g.fillRect(x - 2 * s, base - 18 * s, 2 * s, 18 * s);
    g.fillStyle(0x8a6240, 1);
    g.fillRect(x - 2 * s, base - 18 * s, 1, 12 * s);

    // copa: massa escura embaixo/direita, luz em cima/esquerda
    g.fillStyle(0x2d5a26, 1);
    g.fillCircle(x, base - 26 * s, 11 * s);
    g.fillCircle(x - 9 * s, base - 19 * s, 8 * s);
    g.fillCircle(x + 9 * s, base - 19 * s, 8 * s);
    g.fillStyle(0x468a38, 1);
    g.fillCircle(x - 4 * s, base - 29 * s, 7 * s);
    g.fillCircle(x - 10 * s, base - 21 * s, 5 * s);
    g.fillCircle(x + 3 * s, base - 24 * s, 5 * s);
  }

  /** Cerquinha de madeira baixa: mourões + 2 ripas em 2 tons. */
  private criarCerca(x1: number, x2: number): void {
    const g = this.add.graphics().setDepth(-4);
    const base = CHAO_Y;
    for (const ry of [base - 7, base - 3]) {
      g.fillStyle(0xb08d5f, 1);
      g.fillRect(x1, ry, x2 - x1, 1);
      g.fillStyle(0x8a6a45, 1);
      g.fillRect(x1, ry + 1, x2 - x1, 1);
    }
    for (let px = x1; px <= x2 - 2; px += 9) {
      g.fillStyle(0x8a6240, 1);
      g.fillRect(px, base - 9, 2, 9);
      g.fillStyle(0x5a3a24, 1);
      g.fillRect(px + 2, base - 9, 1, 9);
      g.fillStyle(0xc49a66, 1);
      g.fillRect(px, base - 9, 1, 1);
    }
  }

  /** Varal entre dois postes com roupinhas balançando. */
  private criarVaral(x: number): void {
    const base = CHAO_Y;
    const g = this.add.graphics().setDepth(-4);
    for (const px of [x, x + 38]) {
      g.fillStyle(0x6b4a2f, 1);
      g.fillRect(px, base - 18, 2, 18);
      g.fillStyle(0x4a3320, 1);
      g.fillRect(px + 2, base - 18, 1, 18);
      g.fillStyle(0x8a6240, 1);
      g.fillRect(px, base - 18, 2, 1);
    }
    g.fillStyle(0x3a3a44, 1);
    g.fillRect(x + 2, base - 16, 36, 1);

    const cores = [0xff7aa2, 0x4fd6c4, 0xe9b44c];
    [7, 17, 28].forEach((dx, i) => {
      const roupa = this.add
        .rectangle(x + 2 + dx, base - 15, 5, 6 + (i % 2), cores[i])
        .setOrigin(0.5, 0)
        .setDepth(-4);
      this.tweens.add({
        targets: roupa,
        angle: { from: -4, to: 4 },
        duration: 1300 + i * 250,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
  }

  /** Galinha parada que bica o chão de tempos em tempos. */
  private criarGalinha(x: number): void {
    const gal = this.add.image(x, CHAO_Y - 4, "galinha").setDepth(-3);
    this.tweens.add({
      targets: gal,
      angle: -16,
      y: CHAO_Y - 3,
      duration: 240,
      yoyo: true,
      repeat: -1,
      repeatDelay: 1700,
      ease: "Quad.easeIn",
    });
  }

  /** Ponto de ônibus onde a Gabitcha começa (ela está PARTINDO). */
  private criarPontoOnibus(x: number): void {
    const base = CHAO_Y;
    const g = this.add.graphics().setDepth(-4);

    // poste da placa
    g.fillStyle(0x6b4a2f, 1);
    g.fillRect(x - 1, base - 30, 3, 30);
    g.fillStyle(0x4a3320, 1);
    g.fillRect(x + 2, base - 30, 1, 30);

    this.add
      .rectangle(x, base - 36, 52, 13, 0x3d6b35)
      .setDepth(-4)
      .setStrokeStyle(1, 0xffffff);
    this.add
      .text(x, base - 36, DIALOGOS.prologo.pontoOnibus, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(-3);

    // banquinho de madeira
    g.fillStyle(0x8a6240, 1);
    g.fillRect(x + 14, base - 8, 20, 3);
    g.fillStyle(0xa87f4e, 1);
    g.fillRect(x + 14, base - 8, 20, 1);
    g.fillStyle(0x5a3a24, 1);
    g.fillRect(x + 15, base - 5, 2, 5);
    g.fillRect(x + 31, base - 5, 2, 5);
  }

  /** Fumacinha subindo da chaminé, em loop. */
  private criarFumaca(x: number, y: number): void {
    this.time.addEvent({
      delay: 1100,
      loop: true,
      callback: () => {
        const p = this.add.rectangle(x, y, 2, 2, 0xf2f0f7, 0.8).setDepth(-3);
        this.tweens.add({
          targets: p,
          y: y - 14 - Phaser.Math.Between(0, 6),
          x: x + Phaser.Math.Between(2, 8),
          scale: 2.5,
          alpha: 0,
          duration: 2600,
          ease: "Sine.easeOut",
          onComplete: () => p.destroy(),
        });
      },
    });
  }

  /** Silhueta azulada (haze) da cidade grande no fim do caminho. */
  private criarCidadeGrandeAoLonge(): void {
    const cidade = this.add.graphics().setDepth(-6);
    let cx = MUNDO_LARGURA - 190;
    let i = 0;
    while (cx < MUNDO_LARGURA) {
      const largura = 20 + ((i * 13) % 14);
      const altura = 45 + ((i * 27) % 55);
      cidade.fillStyle(0x8ba0c0, 1);
      cidade.fillRect(cx, CHAO_Y - altura, largura, altura);
      cidade.fillStyle(0x6d82a4, 1);
      cidade.fillRect(cx + largura - 3, CHAO_Y - altura, 3, altura); // lado sombreado
      cidade.fillStyle(0xdfe8f4, 0.8);
      for (let wy = CHAO_Y - altura + 4; wy < CHAO_Y - 6; wy += 8) {
        for (let wx = cx + 3; wx < cx + largura - 4; wx += 7) {
          if ((wx + wy + i) % 3 === 0) cidade.fillRect(wx, wy, 2, 3);
        }
      }
      cx += largura + 4;
      i++;
    }
  }

  /** Um pássaro cruza o céu a cada ~20s (batendo as asas). */
  private criarPassaros(): void {
    const soltar = () => {
      const y = Phaser.Math.Between(24, 60);
      const p = this.add.image(GAME_WIDTH + 12, y, "passaro").setScrollFactor(0).setDepth(-8);
      this.tweens.add({ targets: p, scaleY: 0.5, duration: 160, yoyo: true, repeat: -1 });
      this.tweens.add({
        targets: p,
        x: -12,
        y: y + Phaser.Math.Between(-10, 10),
        duration: Phaser.Math.Between(6000, 9000),
        onComplete: () => p.destroy(),
      });
    };
    this.time.delayedCall(2500, soltar);
    this.time.addEvent({ delay: 19000, loop: true, callback: soltar });
  }
}
