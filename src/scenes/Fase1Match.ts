import Phaser from "phaser";
import { DIALOGOS } from "../dialogos";
import { UI, GAME_WIDTH, GAME_HEIGHT, FONT_SM, FONT_MD } from "../ui/constants";
import { fadeIn, fadeToScene } from "../ui/transitions";
import { TouchControls } from "../ui/TouchControls";
import { Balao } from "../ui/Balao";
import { ceuGradiente, estrelasCintilantes, criarTexturaCoracao } from "../ui/effects";
import { createTextureFromData } from "../sprites/factory";
import { atualizarAndar } from "../sprites/anims";
import type { SpriteData } from "../sprites/data";

/**
 * Fase 1 — "Match!" (INTOCÁVEL — GAME_DESIGN.md seção 5)
 * Mecânica: dodge. Perfis ruins caem do céu; a Gabitcha desvia deles e
 * coleta a ESTRELA dourada ("ELE"). Clímax roteirizado: câmera lenta na
 * aparição, vitória com o Rafitcho entrando em cena, derrota com choro.
 * TODO(seção 7): expandir DIALOGOS.fase1.perfisRuins com piadas internas.
 */

const VELOCIDADE_GABITCHA = 150;
const INTERVALO_SPAWN_MS = 1000;
const PERFIS_ATE_O_MATCH = 10; // depois disso, cai a estrela
const VIDAS_INICIAIS = 3;

const CARD_LARGURA = 104;
const CARD_ALTURA = 32;
const CALCADA_Y = GAME_HEIGHT - 12; // topo da faixa de calçada

// Estrela lendária 16x16 — 3 tons de dourado + contorno, brilho no
// canto superior-esquerdo (mesma regra de luz dos sprites)
const ESTRELA: SpriteData = {
  palette: {
    o: "#7a4a14", // contorno
    s: "#b8801f", // dourado sombra
    b: "#e9b44c", // dourado base
    h: "#f6d47c", // dourado brilho
    w: "#fff8e0", // sparkle
  },
  grid: [
    ".......oo.......",
    "......ohbo......",
    "......ohbo......",
    ".....ohhbso.....",
    ".....ohhbso.....",
    "ooooohhhbbsooooo",
    "ohhhhhhwbbbbbsso",
    ".ohhhhwwbbbbbso.",
    "..ohhhbbbbbbso..",
    "...ohhbbbbbso...",
    "...ohbbbbbbso...",
    "..ohbbbssbbbso..",
    "..ohbbso.obbso..",
    ".ohbso....obbso.",
    ".obo........oso.",
    "..o..........o..",
  ],
};

export class Fase1Match extends Phaser.Scene {
  private gabitcha!: Phaser.Physics.Arcade.Sprite;
  private perfisRuins!: Phaser.Physics.Arcade.Group;
  private estrela: Phaser.GameObjects.Container | null = null;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private teclasAD!: { A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private touch!: TouchControls;
  private balao!: Balao;
  private vidasTexto!: Phaser.GameObjects.Text;
  private spawnTimer!: Phaser.Time.TimerEvent;

  private vidas = VIDAS_INICIAIS;
  private perfisSpawnados = 0;
  private terminou = false;
  private jogando = false;
  private ultimaDirecao = 0; // -1 esquerda, 1 direita, 0 parada (pro squash/stretch)

  constructor() {
    super("Fase1Match");
  }

  create(): void {
    this.vidas = VIDAS_INICIAIS;
    this.perfisSpawnados = 0;
    this.terminou = false;
    this.jogando = false;
    this.estrela = null;
    this.ultimaDirecao = 0;
    this.physics.world.timeScale = 1; // garante reset após derrota em câmera lenta

    fadeIn(this);
    this.cameras.main.setBackgroundColor(UI.fundoNoite);
    this.criarCeuNoturno();
    this.criarCidadeNoturna();
    this.criarTexturasDaFase();

    this.add
      .text(GAME_WIDTH / 2, 14, DIALOGOS.fase1.titulo, {
        fontFamily: UI.fonte,
        fontSize: FONT_MD,
        color: UI.rosaGabitcha,
      })
      .setOrigin(0.5)
      .setDepth(50);

    this.vidasTexto = this.add
      .text(6, 6, "", {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.rosaGabitcha,
      })
      .setDepth(50);
    this.atualizarVidas();

    // Gabitcha na calçada (base do sprite em y+24 = topo da calçada + 4)
    this.gabitcha = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 32, "gabitcha");
    this.gabitcha.setScale(1);
    (this.gabitcha.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.gabitcha.setCollideWorldBounds(true);

    // Bob de idle (em y, deixando a escala livre pro squash/stretch)
    this.tweens.add({
      targets: this.gabitcha,
      y: this.gabitcha.y - 2,
      duration: 350,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.perfisRuins = this.physics.add.group({ allowGravity: false });

    this.physics.add.overlap(this.gabitcha, this.perfisRuins, (_g, card) => {
      this.acertadaPorPerfilRuim(card as Phaser.GameObjects.GameObject);
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.teclasAD = this.input.keyboard!.addKeys("A,D") as {
      A: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
    };
    this.touch = new TouchControls(this);
    this.balao = new Balao(this);

    // Intro com contexto antes do dodge começar
    this.time.delayedCall(600, () => this.rodarIntro(0));
  }

  /** Balão ancorado no topo do sprite (offset -8px) — nunca na frente dele. */
  private falarAcima(
    alvo: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
    fala: string,
    aoFechar?: () => void
  ): void {
    this.balao.falar(alvo.x, alvo.y - alvo.displayHeight / 2 - 8, fala, aoFechar);
  }

  /** Balões de contexto → instrução → começa o jogo. */
  private rodarIntro(i: number): void {
    const falas = DIALOGOS.fase1.intro;
    if (i < falas.length) {
      this.falarAcima(this.gabitcha, falas[i], () => this.rodarIntro(i + 1));
      return;
    }

    // Painel escuro semi-transparente atrás das instruções
    const painel = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 4, 272, 72, 0x0b0d1a, 0.82)
      .setStrokeStyle(1, UI.linha)
      .setDepth(59);

    const instrucao = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 22, DIALOGOS.fase1.instrucao, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.douradoYuumitcha,
        align: "center",
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setDepth(60);

    const controles = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, DIALOGOS.fase1.controles, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(60);

    const comecar = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, DIALOGOS.fase1.comecar, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setAlpha(0.7);
    this.tweens.add({ targets: comecar, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });

    const iniciar = () => {
      [painel, instrucao, controles, comecar].forEach((o) => o.destroy());
      this.jogando = true;
      this.spawnTimer = this.time.addEvent({
        delay: INTERVALO_SPAWN_MS,
        loop: true,
        callback: () => this.spawnPerfil(),
      });
    };
    this.input.once("pointerdown", iniciar);
    this.input.keyboard?.once("keydown-SPACE", iniciar);
  }

  update(time: number): void {
    if (!this.jogando || this.terminou) return;

    const esquerda = this.cursors.left.isDown || this.teclasAD.A.isDown || this.touch.esquerda;
    const direita = this.cursors.right.isDown || this.teclasAD.D.isDown || this.touch.direita;
    const direcao = esquerda ? -1 : direita ? 1 : 0;

    if (esquerda) {
      this.gabitcha.setVelocityX(-VELOCIDADE_GABITCHA);
      this.gabitcha.setFlipX(true);
    } else if (direita) {
      this.gabitcha.setVelocityX(VELOCIDADE_GABITCHA);
      this.gabitcha.setFlipX(false);
    } else {
      this.gabitcha.setVelocityX(0);
    }

    // Squash/stretch sutil ao trocar de direção
    if (direcao !== 0 && direcao !== this.ultimaDirecao) this.aplicarSquash();
    this.ultimaDirecao = direcao;
    atualizarAndar(this.gabitcha, "gabitcha", direcao !== 0);

    // Balanço lateral dos cards enquanto caem
    const balancar = (card: Phaser.GameObjects.Container) => {
      const fase = card.getData("swayFase") as number;
      (card.body as Phaser.Physics.Arcade.Body).setVelocityX(Math.sin(time / 350 + fase) * 14);
      card.setAngle(Math.sin(time / 350 + fase) * 3);
    };
    this.perfisRuins.getChildren().forEach((card) => {
      const c = card as Phaser.GameObjects.Container;
      balancar(c);
      // Card que saiu da tela = perfil ruim desviado = ponto pro amor
      if (c.y > GAME_HEIGHT + 20) c.destroy();
    });
    if (this.estrela?.body) {
      balancar(this.estrela);
      // Errou a estrela: ela sai da tela → pausa dramática → derrota
      if (this.estrela.y > GAME_HEIGHT + 24) this.perdeuEstrela();
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

  // ---------- spawn ----------

  private spawnPerfil(): void {
    if (this.terminou) return;
    this.perfisSpawnados++;

    if (this.perfisSpawnados > PERFIS_ATE_O_MATCH && !this.estrela) {
      this.spawnEstrela();
      return;
    }

    const textos = DIALOGOS.fase1.perfisRuins;
    const texto = textos[(this.perfisSpawnados - 1) % textos.length];
    const card = this.criarCard(texto);
    this.perfisRuins.add(card);
    (card.body as Phaser.Physics.Arcade.Body).setVelocityY(
      Phaser.Math.Between(55, 85)
    );
  }

  /** A estrela dourada "ELE" entra em cena — câmera lenta + brilho lendário. */
  private spawnEstrela(): void {
    this.spawnTimer.paused = true; // os outros perfis param de spawnar

    const x = Phaser.Math.Between(40, GAME_WIDTH - 40);
    const container = this.add.container(x, 4);

    // Glow em losangos concêntricos de alpha escalonado (pixels duros, sem blur)
    const glow = this.add.image(0, 0, "estrelaGlow");
    container.add(glow);
    this.tweens.add({ targets: glow, alpha: 0.35, duration: 260, yoyo: true, repeat: -1 });

    // Raios de 1px piscando ao redor ("item lendário")
    const raios: Array<[number, number, number, number]> = [
      [0, -15, 1, 5],
      [0, 15, 1, 5],
      [-15, 0, 5, 1],
      [15, 0, 5, 1],
      [-11, -11, 2, 2],
      [11, -11, 2, 2],
      [-11, 11, 2, 2],
      [11, 11, 2, 2],
    ];
    raios.forEach(([rx, ry, w, h], i) => {
      const raio = this.add.rectangle(rx, ry, w, h, 0xfff8e0);
      container.add(raio);
      this.tweens.add({
        targets: raio,
        alpha: 0.1,
        duration: 170,
        yoyo: true,
        repeat: -1,
        delay: i * 80,
      });
    });

    const img = this.add.image(0, 0, "estrela");
    const rotulo = this.add
      .text(0, 16, DIALOGOS.fase1.estrela, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.douradoYuumitcha,
      })
      .setOrigin(0.5, 0);
    container.add([img, rotulo]);

    container.setSize(20, 20);
    container.setData("swayFase", Math.random() * Math.PI * 2);
    this.physics.add.existing(container);
    const body = container.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityY(46); // cai devagar: essa é pra pegar!

    this.estrela = container;
    this.physics.add.overlap(this.gabitcha, container, () => this.deuMatch());

    // Câmera lenta de ~1.2s (timeScale 4 = física a ~0.25x) + reação dela
    this.physics.world.timeScale = 4;
    this.falarAcima(this.gabitcha, DIALOGOS.fase1.eleAparece);
    this.time.delayedCall(1200, () => {
      if (this.terminou) return;
      this.physics.world.timeScale = 1;
      this.balao.fechar(false);
    });
  }

  /** Mini-card de app de namoro: retângulo claro arredondado + avatar + nome. */
  private criarCard(texto: string): Phaser.GameObjects.Container {
    const x = Phaser.Math.Between(56, GAME_WIDTH - 56);
    const fundo = this.add.image(0, 0, "cardRuim");
    const foto = this.add.image(-CARD_LARGURA / 2 + 12, 0, "avatarAnonimo");
    const nome = this.add
      .text(-CARD_LARGURA / 2 + 24, 0, texto, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: "#1d2140",
        align: "left",
        lineSpacing: 1,
        wordWrap: { width: 76 },
      })
      .setOrigin(0, 0.5);

    const card = this.add.container(x, -20, [fundo, foto, nome]);
    card.setSize(CARD_LARGURA, CARD_ALTURA);
    card.setData("swayFase", Math.random() * Math.PI * 2);
    this.physics.add.existing(card);
    return card;
  }

  // ---------- colisões / rotas do clímax ----------

  private acertadaPorPerfilRuim(card: Phaser.GameObjects.GameObject): void {
    if (this.terminou) return;
    card.destroy();
    this.vidas--;
    this.atualizarVidas();
    // Shake de ~2px + flash vermelho curto
    this.cameras.main.shake(110, 0.006);
    this.cameras.main.flash(140, 255, 56, 72);
    this.gabitcha.setTintFill(0xff4a5a);
    this.time.delayedCall(120, () => this.gabitcha.clearTint());

    if (this.vidas <= 0) {
      this.terminou = true;
      this.jogando = false;
      this.spawnTimer.paused = true;
      this.gabitcha.setVelocityX(0);
      this.time.delayedCall(500, () => this.derrota());
    }
  }

  /** Errou a estrela: breve pausa dramática antes da derrota (não corta seco). */
  private perdeuEstrela(): void {
    if (this.terminou) return;
    this.terminou = true;
    this.jogando = false;
    this.estrela?.destroy();
    this.estrela = null;
    this.gabitcha.setVelocityX(0);
    this.time.delayedCall(900, () => this.derrota());
  }

  /** Perfis restantes somem com fade rápido. */
  private limparPerfis(): void {
    this.perfisRuins.getChildren().slice().forEach((obj) => {
      const card = obj as Phaser.GameObjects.Container;
      (card.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      this.tweens.add({
        targets: card,
        alpha: 0,
        duration: 200,
        onComplete: () => card.destroy(),
      });
    });
  }

  // ---------- vitória ----------

  private deuMatch(): void {
    if (this.terminou) return;
    this.terminou = true;
    this.jogando = false;
    this.spawnTimer.paused = true;
    this.physics.world.timeScale = 1;
    this.balao.fechar(false);

    // congela a Gabitcha
    this.gabitcha.setVelocityX(0);
    this.tweens.killTweensOf(this.gabitcha);
    this.gabitcha.setScale(1).setAngle(0).setFlipX(false);

    const ponto = { x: this.gabitcha.x, y: this.gabitcha.y - 24 };
    this.estrela?.destroy();
    this.estrela = null;
    this.limparPerfis();

    // explosão de corações + flash branco curto (~2 frames)
    this.explodirCoracoes(ponto.x, ponto.y);
    this.cameras.main.flash(100, 255, 255, 255);
    this.time.addEvent({ delay: 180, repeat: 14, callback: () => this.soltarCoracao() });

    // se ela estiver colada na borda direita, recua um passo pro Rafitcho caber
    atualizarAndar(this.gabitcha, "gabitcha", false);
    const alvoX = Math.min(this.gabitcha.x, GAME_WIDTH - 96);
    if (alvoX < this.gabitcha.x) {
      this.tweens.add({ targets: this.gabitcha, x: alvoX, duration: 400, ease: "Sine.easeOut" });
    }

    // Rafitcho entra andando pela direita e para ao lado dela
    const rafitcho = this.add
      .sprite(GAME_WIDTH + 24, GAME_HEIGHT - 32, "rafitcho")
      .setFlipX(true);
    this.time.delayedCall(500, () => atualizarAndar(rafitcho, "rafitcho", true));
    this.tweens.add({
      targets: rafitcho,
      x: alvoX + 44,
      duration: 1400,
      ease: "Linear",
      delay: 500,
      onComplete: () => {
        atualizarAndar(rafitcho, "rafitcho", false);
        // troca curta de balões acima das cabeças, seta em quem fala
        this.falarAcima(this.gabitcha, DIALOGOS.fase1.vitoria.ela, () =>
          this.falarAcima(rafitcho, DIALOGOS.fase1.vitoria.ele, () =>
            this.cutsceneFinal(rafitcho)
          )
        );
      },
    });
  }

  /** Narração + os dois andando juntos pra direita, com fade-out lento. */
  private cutsceneFinal(rafitcho: Phaser.GameObjects.Sprite): void {
    const narracao = this.add
      .text(GAME_WIDTH / 2, 34, DIALOGOS.fase1.narracao, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setAlpha(0);
    this.tweens.add({ targets: narracao, alpha: 1, duration: 700 });

    // caminhada sem input, câmera parada (corpo desligado pra sair da tela)
    (this.gabitcha.body as Phaser.Physics.Arcade.Body).enable = false;
    this.gabitcha.setFlipX(false);
    rafitcho.setFlipX(false);
    atualizarAndar(this.gabitcha, "gabitcha", true);
    atualizarAndar(rafitcho, "rafitcho", true);
    for (const alvo of [this.gabitcha, rafitcho]) {
      this.tweens.add({ targets: alvo, x: "+=110", duration: 3000, ease: "Linear" });
    }
    this.time.delayedCall(900, () => fadeToScene(this, "Fase2Shopping", 2000));
  }

  // ---------- derrota ----------

  private derrota(): void {
    this.spawnTimer.paused = true;
    this.physics.world.timeScale = 1;
    this.balao.fechar(false);
    this.estrela?.destroy();
    this.estrela = null;

    this.gabitcha.setVelocityX(0);
    this.tweens.killTweensOf(this.gabitcha);
    this.gabitcha.setScale(1).setAngle(0).setDepth(85); // acima do overlay
    this.limparPerfis();

    // tela escurece levemente
    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x101223, 0.4)
      .setDepth(80)
      .setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 1, duration: 400 });

    this.iniciarChoro();

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 12, DIALOGOS.fase1.derrota, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.rosaGabitcha,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(90);

    const prompt = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, DIALOGOS.fase1.tentarDeNovo, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
      })
      .setOrigin(0.5)
      .setDepth(90);
    this.tweens.add({ targets: prompt, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });

    // reinicia a fase (sem voltar ao Prólogo)
    this.time.delayedCall(400, () => {
      let reiniciou = false;
      const reiniciar = () => {
        if (reiniciou) return;
        reiniciou = true;
        this.scene.restart();
      };
      this.input.keyboard?.once("keydown-SPACE", reiniciar);
      this.input.once("pointerdown", reiniciar);
    });
  }

  /** Choro em 2 frames (olhos fechados em arco) + lágrimas de 1-2px em loop. */
  private iniciarChoro(): void {
    this.criarTexturasChoro();

    // overlay de pixels sobre a região dos olhos do sprite (linhas 12-14)
    const rosto = this.add
      .image(this.gabitcha.x, this.gabitcha.y - 10, "gabiChoro0")
      .setDepth(86);
    let frame = 0;
    this.time.addEvent({
      delay: 300,
      loop: true,
      callback: () => {
        frame = 1 - frame;
        rosto.setTexture(frame === 0 ? "gabiChoro0" : "gabiChoro1");
      },
    });

    // lágrimas alternando de lado
    let lado = -1;
    this.time.addEvent({
      delay: 340,
      loop: true,
      callback: () => {
        lado = -lado;
        const lagrima = this.add
          .rectangle(this.gabitcha.x + lado * 6, this.gabitcha.y - 8, 1, 2, 0x9fd4e8)
          .setDepth(86);
        this.tweens.add({
          targets: lagrima,
          y: "+=12",
          alpha: 0,
          duration: 550,
          ease: "Quad.easeIn",
          onComplete: () => lagrima.destroy(),
        });
      },
    });
  }

  // ---------- efeitos ----------

  /** Burst de coraçõezinhos espalhando a partir do ponto do match. */
  private explodirCoracoes(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const anguloRad = (Math.PI * 2 * i) / 12 + Math.random() * 0.4;
      const distancia = Phaser.Math.Between(24, 48);
      const coracao = this.add
        .image(x, y, "coracao")
        .setScale(Phaser.Math.Between(1, 2))
        .setDepth(55);
      this.tweens.add({
        targets: coracao,
        x: x + Math.cos(anguloRad) * distancia,
        y: y + Math.sin(anguloRad) * distancia - 16,
        alpha: 0,
        angle: Phaser.Math.Between(-40, 40),
        duration: Phaser.Math.Between(500, 800),
        ease: "Quad.easeOut",
        onComplete: () => coracao.destroy(),
      });
    }
  }

  private soltarCoracao(): void {
    const x = Phaser.Math.Between(this.gabitcha.x - 40, this.gabitcha.x + 100);
    const coracao = this.add
      .text(x, GAME_HEIGHT - 40, "♥", {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
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

  /** Céu noturno: gradiente azul-profundo → roxo, lua com brilho, estrelas. */
  private criarCeuNoturno(): void {
    ceuGradiente(this, 0x0a0c20, 0x2f1b45);
    estrelasCintilantes(this, 42, 88, -9);

    const luaX = GAME_WIDTH - 52;
    const luaY = 30;
    this.add.circle(luaX, luaY, 13, 0xfff3cf, 0.07).setDepth(-9);
    const halo = this.add.circle(luaX, luaY, 10, 0xfff3cf, 0.16).setDepth(-9);
    this.add.circle(luaX, luaY, 7, 0xfff3cf).setDepth(-9);
    this.add.circle(luaX - 2, luaY - 2, 2, 0xe8dcb8).setDepth(-9).setAlpha(0.6); // cratera
    this.tweens.add({ targets: halo, alpha: 0.32, duration: 2200, yoyo: true, repeat: -1 });
  }

  /** Skyline em 3 camadas (profundidade por contraste) + calçada texturizada. */
  private criarCidadeNoturna(): void {
    // Camada de fundo: quase preta, sem detalhe
    const fundo = this.add.graphics().setDepth(-8);
    fundo.fillStyle(0x0d0f20, 1);
    let x = -6;
    let i = 0;
    while (x < GAME_WIDTH) {
      const largura = 24 + ((i * 17) % 20);
      const altura = 74 + ((i * 31) % 40);
      fundo.fillRect(x, CALCADA_Y - altura, largura, altura);
      x += largura + 2;
      i++;
    }

    // Camada do meio: painel, silhueta simples
    const meio = this.add.graphics().setDepth(-7);
    meio.fillStyle(UI.painel, 1);
    x = -10;
    i = 0;
    while (x < GAME_WIDTH) {
      const largura = 26 + ((i * 13) % 18);
      const altura = 48 + ((i * 23) % 32);
      meio.fillRect(x, CALCADA_Y - altura, largura, altura);
      // Antena ocasional
      if (i % 3 === 0) meio.fillRect(x + largura / 2, CALCADA_Y - altura - 7, 1, 7);
      x += largura + 5;
      i++;
    }

    // Camada da frente: mais clara, com janelas acesas
    const frente = this.add.graphics().setDepth(-6);
    x = -8;
    i = 0;
    while (x < GAME_WIDTH) {
      const largura = 30 + ((i * 19) % 16);
      const altura = 26 + ((i * 27) % 22);
      frente.fillStyle(UI.linha, 1);
      frente.fillRect(x, CALCADA_Y - altura, largura, altura);
      frente.fillStyle(0xe9b44c, 0.9);
      for (let wy = CALCADA_Y - altura + 5; wy < CALCADA_Y - 6; wy += 9) {
        for (let wx = x + 4; wx < x + largura - 4; wx += 8) {
          if ((wx + wy + i) % 3 !== 0) frente.fillRect(wx, wy, 3, 4);
        }
      }
      x += largura + 4;
      i++;
    }

    // Calçada: faixa com meio-fio e juntas de 1px
    const chao = this.add.graphics().setDepth(-5);
    chao.fillStyle(0x141731, 1);
    chao.fillRect(0, CALCADA_Y, GAME_WIDTH, GAME_HEIGHT - CALCADA_Y);
    chao.fillStyle(0x3a4070, 1);
    chao.fillRect(0, CALCADA_Y, GAME_WIDTH, 1); // meio-fio
    chao.fillStyle(0x232852, 1);
    for (let jx = 10; jx < GAME_WIDTH; jx += 20) chao.fillRect(jx, CALCADA_Y + 1, 1, 11);
    for (let s = 0; s < 26; s++) {
      chao.fillRect((s * 37 + 9) % GAME_WIDTH, CALCADA_Y + 3 + ((s * 13) % 7), 1, 1);
    }

    // Letreiro neon
    const neon = this.add
      .text(GAME_WIDTH - 60, 52, "❤ MATCH", {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.tealRafitcho,
      })
      .setOrigin(0.5)
      .setDepth(-6);
    this.tweens.add({
      targets: neon,
      alpha: 0.3,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });
  }

  /** Texturas dos cards, avatar, estrela e glow (geradas uma vez). */
  private criarTexturasDaFase(): void {
    criarTexturaCoracao(this);
    createTextureFromData(this, "estrela", ESTRELA);

    if (!this.textures.exists("cardRuim")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xb9b3cc, 1); // borda
      g.fillRoundedRect(0, 0, CARD_LARGURA, CARD_ALTURA, 4);
      g.fillStyle(0xf2f0f7, 1);
      g.fillRoundedRect(1, 1, CARD_LARGURA - 2, CARD_ALTURA - 2, 4);
      g.generateTexture("cardRuim", CARD_LARGURA, CARD_ALTURA);
      g.destroy();
    }
    // Avatar padrão cinza (a silhueta genérica de app de namoro)
    if (!this.textures.exists("avatarAnonimo")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xd8d4e4, 1);
      g.fillRoundedRect(0, 0, 16, 16, 2);
      g.fillStyle(0x9a94b0, 1);
      g.fillCircle(8, 6, 3);
      g.fillRoundedRect(3, 10, 10, 5, 2);
      g.generateTexture("avatarAnonimo", 16, 16);
      g.destroy();
    }
    // Glow da estrela: losangos concêntricos com alpha em degraus (nada de blur)
    if (!this.textures.exists("estrelaGlow")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      const centro = 20;
      const camadas: Array<[number, number]> = [
        [19, 0.1],
        [15, 0.18],
        [11, 0.3],
      ];
      for (const [r, a] of camadas) {
        g.fillStyle(0xf0cd7a, a);
        for (let dy = -r; dy <= r; dy++) {
          const w = (r - Math.abs(dy)) * 2 + 1;
          g.fillRect(centro - (w - 1) / 2, centro + dy, w, 1);
        }
      }
      g.generateTexture("estrelaGlow", 40, 40);
      g.destroy();
    }
  }

  /** 2 frames de olhos fechados em arco (overlay sobre a região dos olhos). */
  private criarTexturasChoro(): void {
    const desenhar = (key: string, frame: number) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0 });
      // pele cobrindo os olhos abertos do sprite (cols 9-13 e 18-22)
      g.fillStyle(0xe0a87c, 1);
      g.fillRect(9, 0, 5, 3);
      g.fillRect(18, 0, 5, 3);
      g.fillStyle(0x241417, 1);
      if (frame === 0) {
        // arco fechado (∩)
        g.fillRect(10, 1, 3, 1);
        g.fillRect(9, 2, 1, 1);
        g.fillRect(13, 2, 1, 1);
        g.fillRect(19, 1, 3, 1);
        g.fillRect(18, 2, 1, 1);
        g.fillRect(22, 2, 1, 1);
      } else {
        // arco apertado (soluço)
        g.fillRect(9, 1, 1, 1);
        g.fillRect(13, 1, 1, 1);
        g.fillRect(10, 2, 3, 1);
        g.fillRect(18, 1, 1, 1);
        g.fillRect(22, 1, 1, 1);
        g.fillRect(19, 2, 3, 1);
      }
      g.generateTexture(key, 32, 4);
      g.destroy();
    };
    desenhar("gabiChoro0", 0);
    desenhar("gabiChoro1", 1);
  }
}
