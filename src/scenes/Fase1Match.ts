import Phaser from "phaser";
import { DIALOGOS } from "../dialogos";
import { UI, GAME_WIDTH, GAME_HEIGHT } from "../ui/constants";
import { fadeIn, fadeToScene } from "../ui/transitions";
import { TouchControls } from "../ui/TouchControls";
import { DialogBox } from "../ui/DialogBox";

/**
 * Fase 1 — "Match!" (INTOCÁVEL — GAME_DESIGN.md seção 5)
 * Mecânica: dodge. Perfis ruins caem do céu; a Gabitcha desvia deles e
 * coleta o único perfil brilhante: Rafitcho. Final: café + corações.
 * TODO(seção 7): expandir DIALOGOS.fase1.perfisRuins com piadas internas.
 */

const VELOCIDADE_GABITCHA = 150;
const INTERVALO_SPAWN_MS = 1000;
const PERFIS_ATE_O_MATCH = 10; // depois disso, cai o perfil brilhante
const VIDAS_INICIAIS = 3;

export class Fase1Match extends Phaser.Scene {
  private gabitcha!: Phaser.Physics.Arcade.Sprite;
  private perfisRuins!: Phaser.Physics.Arcade.Group;
  private perfilBrilhante: Phaser.GameObjects.Container | null = null;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private touch!: TouchControls;
  private dialogBox!: DialogBox;
  private vidasTexto!: Phaser.GameObjects.Text;
  private spawnTimer!: Phaser.Time.TimerEvent;

  private vidas = VIDAS_INICIAIS;
  private perfisSpawnados = 0;
  private terminou = false;

  constructor() {
    super("Fase1Match");
  }

  create(): void {
    this.vidas = VIDAS_INICIAIS;
    this.perfisSpawnados = 0;
    this.terminou = false;
    this.perfilBrilhante = null;

    fadeIn(this);
    this.cameras.main.setBackgroundColor(UI.fundoNoite);
    this.criarCidadeNoturna();
    this.criarTexturasDosCards();

    this.add
      .text(GAME_WIDTH / 2, 14, DIALOGOS.fase1.titulo, {
        fontFamily: UI.fonte,
        fontSize: "10px",
        color: UI.rosaGabitcha,
      })
      .setOrigin(0.5)
      .setDepth(50);

    this.vidasTexto = this.add
      .text(6, 6, "", {
        fontFamily: UI.fonte,
        fontSize: "8px",
        color: UI.rosaGabitcha,
      })
      .setDepth(50);
    this.atualizarVidas();

    // Gabitcha no "chão" da cidade
    this.gabitcha = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 26, "gabitcha");
    this.gabitcha.setScale(1.5);
    (this.gabitcha.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.gabitcha.setCollideWorldBounds(true);

    // Bounce de idle
    this.tweens.add({
      targets: this.gabitcha,
      scaleY: 1.42,
      duration: 350,
      yoyo: true,
      repeat: -1,
    });

    this.perfisRuins = this.physics.add.group({ allowGravity: false });

    this.physics.add.overlap(this.gabitcha, this.perfisRuins, (_g, card) => {
      this.acertadaPorPerfilRuim(card as Phaser.GameObjects.GameObject);
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.touch = new TouchControls(this);
    this.dialogBox = new DialogBox(this);

    this.spawnTimer = this.time.addEvent({
      delay: INTERVALO_SPAWN_MS,
      loop: true,
      callback: () => this.spawnPerfil(),
    });
  }

  update(): void {
    if (this.terminou) return;

    const esquerda = this.cursors.left.isDown || this.touch.esquerda;
    const direita = this.cursors.right.isDown || this.touch.direita;

    if (esquerda) {
      this.gabitcha.setVelocityX(-VELOCIDADE_GABITCHA);
      this.gabitcha.setFlipX(true);
    } else if (direita) {
      this.gabitcha.setVelocityX(VELOCIDADE_GABITCHA);
      this.gabitcha.setFlipX(false);
    } else {
      this.gabitcha.setVelocityX(0);
    }

    // Limpa cards que saíram da tela (perfil ruim desviado = ponto pro amor)
    this.perfisRuins.getChildren().forEach((card) => {
      const c = card as Phaser.GameObjects.Container;
      if (c.y > GAME_HEIGHT + 20) c.destroy();
    });
  }

  // ---------- spawn ----------

  private spawnPerfil(): void {
    if (this.terminou) return;
    this.perfisSpawnados++;

    if (this.perfisSpawnados > PERFIS_ATE_O_MATCH && !this.perfilBrilhante) {
      this.spawnPerfilBrilhante();
      return;
    }

    const textos = DIALOGOS.fase1.perfisRuins;
    const texto = textos[(this.perfisSpawnados - 1) % textos.length];
    const card = this.criarCard(texto, "cardRuim", "#e8e6f2");
    this.perfisRuins.add(card);
    (card.body as Phaser.Physics.Arcade.Body).setVelocityY(
      Phaser.Math.Between(55, 85)
    );
  }

  private spawnPerfilBrilhante(): void {
    this.spawnTimer.paused = true;

    const card = this.criarCard(DIALOGOS.fase1.perfilBrilhante, "cardBrilhante", "#101223");
    this.perfilBrilhante = card;
    this.physics.add.existing(card);
    const body = card.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityY(40); // cai devagar: esse é pra pegar!

    // Glow pulsante
    this.tweens.add({
      targets: card,
      alpha: 0.75,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    this.physics.add.overlap(this.gabitcha, card, () => this.deuMatch());
  }

  private criarCard(
    texto: string,
    textura: "cardRuim" | "cardBrilhante",
    corTexto: string
  ): Phaser.GameObjects.Container {
    const x = Phaser.Math.Between(30, GAME_WIDTH - 30);
    const fundo = this.add.image(0, 0, textura);
    const label = this.add
      .text(0, 0, texto, {
        fontFamily: UI.fonte,
        fontSize: "5px",
        color: corTexto,
        align: "center",
        wordWrap: { width: 52 },
      })
      .setOrigin(0.5);

    const card = this.add.container(x, -16, [fundo, label]);
    card.setSize(58, 20);
    this.physics.add.existing(card);
    return card;
  }

  // ---------- colisões ----------

  private acertadaPorPerfilRuim(card: Phaser.GameObjects.GameObject): void {
    if (this.terminou) return;
    card.destroy();
    this.vidas--;
    this.atualizarVidas();
    this.cameras.main.shake(120, 0.008);
    this.gabitcha.setTintFill(0xff7aa2);
    this.time.delayedCall(120, () => this.gabitcha.clearTint());

    if (this.vidas <= 0) {
      this.terminou = true;
      this.spawnTimer.paused = true;
      this.dialogBox.mostrar("Match errado! Bora tentar de novo...");
      this.time.delayedCall(1500, () => this.scene.restart());
    }
  }

  private deuMatch(): void {
    if (this.terminou) return;
    this.terminou = true;
    this.spawnTimer.paused = true;

    this.gabitcha.setVelocityX(0);
    this.perfilBrilhante?.destroy();
    this.perfisRuins.clear(true, true);

    // Rafitcho aparece pro encontro no café
    const rafitcho = this.add
      .image(this.gabitcha.x + 60, GAME_HEIGHT - 26, "rafitcho")
      .setScale(1.5)
      .setFlipX(true)
      .setAlpha(0);
    this.tweens.add({ targets: rafitcho, alpha: 1, duration: 600 });

    // Corações em pixel art sobem pela tela
    this.time.addEvent({
      delay: 180,
      repeat: 14,
      callback: () => this.soltarCoracao(),
    });

    this.dialogBox.mostrar(DIALOGOS.fase1.finalFase);
    this.time.delayedCall(3500, () => fadeToScene(this, "Fase2Shopping"));
  }

  private soltarCoracao(): void {
    const x = Phaser.Math.Between(this.gabitcha.x - 40, this.gabitcha.x + 100);
    const coracao = this.add
      .text(x, GAME_HEIGHT - 40, "♥", {
        fontFamily: UI.fonte,
        fontSize: Phaser.Math.Between(6, 10) + "px",
        color: UI.rosaGabitcha,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: coracao,
      y: Phaser.Math.Between(20, 60),
      alpha: 0,
      duration: 1800,
      ease: "Sine.easeOut",
      onComplete: () => coracao.destroy(),
    });
  }

  // ---------- visual ----------

  private atualizarVidas(): void {
    this.vidasTexto.setText("♥".repeat(Math.max(this.vidas, 0)));
  }

  /** Cidade grande à noite: prédios com janelas acesas + letreiro neon. */
  private criarCidadeNoturna(): void {
    const g = this.add.graphics().setDepth(0);
    let x = 0;
    let i = 0;
    while (x < GAME_WIDTH) {
      const largura = 26 + ((i * 13) % 18);
      const altura = 50 + ((i * 29) % 60);
      g.fillStyle(UI.painel, 1);
      g.fillRect(x, GAME_HEIGHT - altura, largura, altura);
      // Janelas
      g.fillStyle(0xe9b44c, 0.9);
      for (let wy = GAME_HEIGHT - altura + 6; wy < GAME_HEIGHT - 10; wy += 10) {
        for (let wx = x + 4; wx < x + largura - 4; wx += 8) {
          if ((wx + wy + i) % 3 !== 0) g.fillRect(wx, wy, 3, 4);
        }
      }
      x += largura + 6;
      i++;
    }
    // Chão
    g.fillStyle(UI.linha, 1);
    g.fillRect(0, GAME_HEIGHT - 8, GAME_WIDTH, 8);

    // Letreiro neon
    const neon = this.add
      .text(GAME_WIDTH - 60, 34, "❤ MATCH", {
        fontFamily: UI.fonte,
        fontSize: "7px",
        color: UI.tealRafitcho,
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: neon,
      alpha: 0.3,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });
  }

  /** Texturas dos cards de perfil (geradas uma vez). */
  private criarTexturasDosCards(): void {
    if (!this.textures.exists("cardRuim")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(UI.painel, 1);
      g.fillRect(0, 0, 58, 20);
      g.lineStyle(1, UI.linha, 1);
      g.strokeRect(0, 0, 58, 20);
      g.generateTexture("cardRuim", 58, 20);
      g.destroy();
    }
    if (!this.textures.exists("cardBrilhante")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xe9b44c, 1);
      g.fillRect(0, 0, 58, 20);
      g.lineStyle(1, 0xffffff, 1);
      g.strokeRect(0, 0, 58, 20);
      g.generateTexture("cardBrilhante", 58, 20);
      g.destroy();
    }
  }
}
