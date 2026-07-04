import Phaser from "phaser";
import { createCharacterTextures } from "../sprites/factory";
import { registrarAnimacoes } from "../sprites/anims";
import { UI, GAME_WIDTH, GAME_HEIGHT, FONT_SM, FONT_XL } from "../ui/constants";
import { fadeToScene } from "../ui/transitions";
import { DIALOGOS } from "../dialogos";
import { chuvaDeCoracoes, confete, estrelasCintilantes, ceuGradiente } from "../ui/effects";

/**
 * Tela-título em composição de pôster: os três juntos num telhado,
 * título grande com sombra dura e PRESS START em área limpa.
 * Nitidez: nada de setShadow/blur, escala sempre inteira.
 */

const TOPO_PLATAFORMA = 146; // onde os três ficam em pé

export class Boot extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    createCharacterTextures(this);
    registrarAnimacoes(this);

    // Céu noturno + estrelas + lua + cidade
    ceuGradiente(this, 0x101223, 0x3a1d4d);
    estrelasCintilantes(this, 36, 110, -9);
    this.criarLua();
    this.criarCidade();

    // Efeitos contínuos, densidade baixa pra não competir com o título
    chuvaDeCoracoes(this, { intervalo: 600, depth: 1 });
    confete(this, [0xff7aa2, 0x4fd6c4, 0xe9b44c, 0xffffff], 450);

    // ---------- título ----------
    const t = DIALOGOS.telaInicial;
    const cx = GAME_WIDTH / 2;

    // sombra dura: segundo texto idêntico deslocado 2px (sem blur)
    this.add
      .text(cx + 2, 46, t.titulo, {
        fontFamily: UI.fonte,
        fontSize: FONT_XL,
        color: "#3a1d4d",
      })
      .setOrigin(0.5)
      .setDepth(9);
    this.add
      .text(cx, 44, t.titulo, {
        fontFamily: UI.fonte,
        fontSize: FONT_XL,
        color: UI.rosaGabitcha,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(cx, 68, t.subtitulo, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
      })
      .setOrigin(0.5)
      .setDepth(10);

    // ---------- personagens (pôster: os três juntos no telhado) ----------
    const chaoHumanos = TOPO_PLATAFORMA - 24; // sprites 32x48
    const chaoPug = TOPO_PLATAFORMA - 8; // sprite 24x16
    const gabitcha = this.add.image(cx - 32, chaoHumanos, "gabitcha").setDepth(10);
    const rafitcho = this.add.image(cx + 32, chaoHumanos, "rafitcho").setDepth(10);
    const yuumitcha = this.add.image(cx, chaoPug, "yuumitcha").setDepth(10);

    // Bounce alternado (só em y — nada de rotação/escala quebrada)
    this.tweens.add({
      targets: gabitcha,
      y: chaoHumanos - 4,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.tweens.add({
      targets: rafitcho,
      y: chaoHumanos - 4,
      duration: 400,
      yoyo: true,
      repeat: -1,
      delay: 200,
      ease: "Sine.easeInOut",
    });
    this.tweens.add({
      targets: yuumitcha,
      y: chaoPug - 6,
      duration: 280,
      yoyo: true,
      repeat: -1,
      ease: "Quad.easeOut",
    });

    // ---------- press start (área limpa na fachada) ----------
    const start = this.add
      .text(cx, 166, t.start, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.rosaGabitcha,
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({ targets: start, alpha: 0.15, duration: 500, yoyo: true, repeat: -1 });

    const iniciar = () => fadeToScene(this, "Prologo");
    this.input.once("pointerdown", iniciar);
    this.input.keyboard?.once("keydown-SPACE", iniciar);
  }

  /** Lua com halo em círculos concêntricos de alpha escalonado (bordas duras). */
  private criarLua(): void {
    const luaX = GAME_WIDTH - 40;
    const luaY = 26;
    this.add.circle(luaX, luaY, 13, 0xfff3cf, 0.07).setDepth(-9);
    const halo = this.add.circle(luaX, luaY, 10, 0xfff3cf, 0.16).setDepth(-9);
    this.add.circle(luaX, luaY, 7, 0xfff3cf).setDepth(-9);
    this.add.circle(luaX - 2, luaY - 2, 2, 0xe8dcb8).setDepth(-9).setAlpha(0.6); // cratera
    this.add.circle(luaX + 2, luaY + 3, 1, 0xe8dcb8).setDepth(-9).setAlpha(0.5);
    this.tweens.add({ targets: halo, alpha: 0.32, duration: 2200, yoyo: true, repeat: -1 });
  }

  /** Skyline em 2 camadas + telhado contínuo onde os três ficam em pé. */
  private criarCidade(): void {
    // Camada de trás: silhuetas quase da cor do céu, sem detalhe
    const tras = this.add.graphics().setDepth(-8);
    tras.fillStyle(0x2a1a3e, 1);
    let x = -6;
    let i = 0;
    while (x < GAME_WIDTH) {
      const largura = 26 + ((i * 19) % 22);
      const altura = 52 + ((i * 31) % 28);
      tras.fillRect(x, TOPO_PLATAFORMA - altura, largura, altura);
      // topo ocasional: caixa d'água/antena em silhueta
      if (i % 3 === 1) tras.fillRect(x + largura / 2, TOPO_PLATAFORMA - altura - 6, 1, 6);
      x += largura + 3;
      i++;
    }

    // Camada da frente: 2 tons + janelas em 2 cores + detalhes de topo
    const frente = this.add.graphics().setDepth(-7);
    x = -8;
    i = 0;
    while (x < GAME_WIDTH) {
      const largura = 24 + ((i * 17) % 18);
      const altura = 28 + ((i * 23) % 20);
      const topo = TOPO_PLATAFORMA - altura;
      frente.fillStyle(0x161930, 1);
      frente.fillRect(x, topo, largura, altura);
      frente.fillStyle(0x252a52, 1); // lado iluminado pela lua
      frente.fillRect(x, topo, 2, altura);

      // detalhes de topo alternados: antena, caixa d'água, para-raios
      frente.fillStyle(0x161930, 1);
      if (i % 3 === 0) {
        frente.fillRect(x + 5, topo - 8, 1, 8); // antena
        frente.fillRect(x + 4, topo - 8, 3, 1);
      } else if (i % 3 === 1) {
        frente.fillRect(x + largura - 12, topo - 6, 8, 6); // caixa d'água
        frente.fillStyle(0x252a52, 1);
        frente.fillRect(x + largura - 12, topo - 6, 8, 1);
        frente.fillStyle(0x161930, 1);
        frente.fillRect(x + largura - 11, topo - 8, 6, 2); // tampa
      } else {
        frente.fillRect(x + largura / 2, topo - 10, 1, 10); // para-raios
        frente.fillStyle(0xe8e6f2, 1);
        frente.fillRect(x + largura / 2, topo - 11, 1, 1);
        frente.fillStyle(0x161930, 1);
      }

      // janelas em 2 cores (acesa dourada / apagada azul)
      for (let wy = topo + 4; wy < TOPO_PLATAFORMA - 4; wy += 7) {
        for (let wx = x + 4; wx < x + largura - 3; wx += 6) {
          const acesa = (wx * 3 + wy + i) % 5 < 2;
          frente.fillStyle(acesa ? 0xe9b44c : 0x232852, acesa ? 0.9 : 1);
          frente.fillRect(wx, wy, 2, 3);
        }
      }
      x += largura + 4;
      i++;
    }

    // janelas que acendem/apagam (vida ambiente)
    for (const [jx, jy, delay] of [
      [46, TOPO_PLATAFORMA - 22, 3200],
      [236, TOPO_PLATAFORMA - 30, 4600],
    ]) {
      const janela = this.add.rectangle(jx, jy, 2, 3, 0xe9b44c, 0.9).setOrigin(0).setDepth(-7);
      this.time.addEvent({
        delay,
        loop: true,
        callback: () => janela.setVisible(!janela.visible),
      });
    }

    // Telhado/plataforma contínua (base do pôster)
    const g = this.add.graphics().setDepth(-6);
    g.fillStyle(0x3a4070, 1); // borda do parapeito iluminada pela lua
    g.fillRect(0, TOPO_PLATAFORMA, GAME_WIDTH, 1);
    g.fillStyle(0x232852, 1); // parapeito
    g.fillRect(0, TOPO_PLATAFORMA + 1, GAME_WIDTH, 4);
    g.fillStyle(0x151834, 1); // sombra sob o beiral
    g.fillRect(0, TOPO_PLATAFORMA + 5, GAME_WIDTH, 2);
    g.fillStyle(0x0b0d1a, 1); // fachada (área limpa pro PRESS START)
    g.fillRect(0, TOPO_PLATAFORMA + 7, GAME_WIDTH, GAME_HEIGHT - TOPO_PLATAFORMA - 7);

    // Props no telhado, nas laterais (longe do título e dos sprites)
    // antena com luzinha vermelha piscando
    g.fillStyle(0x232852, 1);
    g.fillRect(26, TOPO_PLATAFORMA - 26, 1, 26);
    g.fillRect(22, TOPO_PLATAFORMA - 16, 9, 1);
    g.fillRect(24, TOPO_PLATAFORMA - 8, 5, 1);
    const luzAntena = this.add.rectangle(26, TOPO_PLATAFORMA - 27, 1, 1, 0xff4a5a).setOrigin(0).setDepth(-6);
    this.tweens.add({ targets: luzAntena, alpha: 0.1, duration: 700, yoyo: true, repeat: -1 });

    // caixa d'água à direita
    g.fillStyle(0x1d2140, 1);
    g.fillRect(282, TOPO_PLATAFORMA - 14, 12, 10);
    g.fillStyle(0x2c3160, 1);
    g.fillRect(282, TOPO_PLATAFORMA - 14, 12, 2); // topo iluminado
    g.fillRect(283, TOPO_PLATAFORMA - 16, 10, 2); // tampa
    g.fillStyle(0x151834, 1);
    g.fillRect(284, TOPO_PLATAFORMA - 4, 2, 4); // pernas
    g.fillRect(290, TOPO_PLATAFORMA - 4, 2, 4);

    // dutos de ar-condicionado
    g.fillStyle(0x1d2140, 1);
    g.fillRect(60, TOPO_PLATAFORMA - 6, 10, 6);
    g.fillStyle(0x2c3160, 1);
    g.fillRect(60, TOPO_PLATAFORMA - 6, 10, 1);
    g.fillStyle(0x1d2140, 1);
    g.fillRect(252, TOPO_PLATAFORMA - 5, 8, 5);
    g.fillStyle(0x2c3160, 1);
    g.fillRect(252, TOPO_PLATAFORMA - 5, 8, 1);
  }
}
