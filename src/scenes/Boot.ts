import Phaser from "phaser";
import { createCharacterTextures } from "../sprites/factory";
import { UI, GAME_WIDTH, GAME_HEIGHT } from "../ui/constants";
import { fadeToScene } from "../ui/transitions";
import { DIALOGOS } from "../dialogos";
import {
  chuvaDeCoracoes,
  confete,
  estrelasCintilantes,
  ceuGradiente,
  criarTexturaCoracao,
} from "../ui/effects";

/** Tela-título: aniversário explícito, céu animado, corações e confete. */
export class Boot extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    createCharacterTextures(this);
    criarTexturaCoracao(this);
    criarTexturaCoracao(this, "coracaoDourado", 0xe9b44c);

    // Céu noturno em gradiente + estrelas + skyline
    ceuGradiente(this, 0x101223, 0x3a1d4d);
    estrelasCintilantes(this, 45, 120);
    this.criarSkyline();

    // Lua
    const lua = this.add.circle(GAME_WIDTH - 40, 26, 9, 0xfff3cf).setDepth(0);
    this.add.circle(GAME_WIDTH - 43, 24, 7, 0x2a1a3a).setDepth(0).setAlpha(0.35);
    this.tweens.add({ targets: lua, alpha: 0.75, duration: 2200, yoyo: true, repeat: -1 });

    // Efeitos contínuos
    chuvaDeCoracoes(this, { intervalo: 300 });
    confete(this, [0xff7aa2, 0x4fd6c4, 0xe9b44c, 0xffffff]);

    // ---------- título ----------
    const t = DIALOGOS.telaInicial;

    const chapeu = this.add
      .text(GAME_WIDTH / 2, 26, t.chapeu, {
        fontFamily: UI.fonte,
        fontSize: "8px",
        color: UI.douradoYuumitcha,
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({ targets: chapeu, alpha: 0.55, duration: 800, yoyo: true, repeat: -1 });

    const titulo = this.add
      .text(GAME_WIDTH / 2, 50, t.titulo, {
        fontFamily: UI.fonte,
        fontSize: "22px",
        color: UI.rosaGabitcha,
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setShadow(2, 2, "#3a1d4d", 0, false, true);
    this.tweens.add({
      targets: titulo,
      scale: 1.06,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.add
      .text(GAME_WIDTH / 2, 70, t.subtitulo, {
        fontFamily: UI.fonte,
        fontSize: "7px",
        color: UI.texto,
      })
      .setOrigin(0.5)
      .setDepth(10);

    const assinatura = this.add
      .text(GAME_WIDTH / 2, 82, t.assinatura, {
        fontFamily: UI.fonte,
        fontSize: "6px",
        color: UI.tealRafitcho,
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({ targets: assinatura, alpha: 0.6, duration: 1100, yoyo: true, repeat: -1 });

    // Coraçõezinhos dourados girando ao redor do título
    for (const lado of [-1, 1]) {
      const c = this.add
        .image(GAME_WIDTH / 2 + lado * 108, 50, "coracaoDourado")
        .setScale(1.5)
        .setDepth(10);
      this.tweens.add({
        targets: c,
        y: 44,
        scale: 2,
        duration: 600,
        yoyo: true,
        repeat: -1,
        delay: lado === 1 ? 300 : 0,
      });
    }

    // ---------- personagens ----------
    const chao = GAME_HEIGHT - 46;
    const gabitcha = this.add.image(GAME_WIDTH / 2 - 34, chao, "gabitcha").setScale(2).setDepth(10);
    const rafitcho = this.add.image(GAME_WIDTH / 2 + 34, chao, "rafitcho").setScale(2).setDepth(10);
    const yuumitcha = this.add.image(GAME_WIDTH / 2, chao + 14, "yuumitcha").setScale(2).setDepth(10);

    // Bounce alternado
    this.tweens.add({ targets: gabitcha, y: chao - 4, duration: 400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: rafitcho, y: chao - 4, duration: 400, yoyo: true, repeat: -1, delay: 200, ease: "Sine.easeInOut" });
    // Pug pula animada + balança
    this.tweens.add({ targets: yuumitcha, y: chao + 8, duration: 280, yoyo: true, repeat: -1, ease: "Quad.easeOut" });
    this.tweens.add({ targets: yuumitcha, angle: 8, duration: 280, yoyo: true, repeat: -1 });

    // ---------- press start ----------
    const start = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 14, t.start, {
        fontFamily: UI.fonte,
        fontSize: "8px",
        color: UI.rosaGabitcha,
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({ targets: start, alpha: 0.15, duration: 500, yoyo: true, repeat: -1 });

    const iniciar = () => fadeToScene(this, "Prologo");
    this.input.once("pointerdown", iniciar);
    this.input.keyboard?.once("keydown-SPACE", iniciar);
  }

  /** Silhueta da cidade no rodapé com janelinhas acesas. */
  private criarSkyline(): void {
    const g = this.add.graphics().setDepth(0);
    let x = -4;
    let i = 0;
    while (x < GAME_WIDTH) {
      const largura = 20 + ((i * 17) % 16);
      const altura = 22 + ((i * 31) % 26);
      g.fillStyle(0x0b0d1a, 1);
      g.fillRect(x, GAME_HEIGHT - altura, largura, altura);
      g.fillStyle(0xe9b44c, 0.7);
      for (let wy = GAME_HEIGHT - altura + 4; wy < GAME_HEIGHT - 4; wy += 7) {
        for (let wx = x + 3; wx < x + largura - 3; wx += 6) {
          if ((wx * 3 + wy + i) % 4 === 0) g.fillRect(wx, wy, 2, 2);
        }
      }
      x += largura + 3;
      i++;
    }
  }
}
