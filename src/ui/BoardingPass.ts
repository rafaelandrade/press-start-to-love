import Phaser from "phaser";
import { UI, GAME_WIDTH, GAME_HEIGHT, FONT_SM, FONT_MD } from "./constants";

/**
 * Título de fase em forma de CARTÃO DE EMBARQUE + CARIMBO:
 * o cartão desliza da direita como se fosse colocado numa mesa e,
 * meio segundo depois, o carimbo vermelho com o nome da fase cai
 * com impacto (scale 2→1 + shake + partículas). Pixels duros.
 * Mesmo contrato do Marquee: overlay escuro, gameplay só no callback.
 */
export class BoardingPass {
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  mostrar(
    textos: { embarque: string; rota: string; passageiros: string; carimbo: string },
    aoTerminar?: () => void
  ): void {
    const scene = this.scene;
    this.criarTexturaAnel();

    const overlay = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x101223, 0.55)
      .setDepth(190);

    // ---------- cartão ----------
    const W = 200;
    const H = 80;
    const g = scene.add.graphics();
    // sombra dura na "mesa"
    g.fillStyle(0x0b0d1a, 0.6);
    g.fillRect(-W / 2 + 2, -H / 2 + 2, W, H);
    // corpo do cartão
    g.fillStyle(0xb9b3a8, 1);
    g.fillRect(-W / 2, -H / 2, W, H);
    g.fillStyle(0xf2ead8, 1);
    g.fillRect(-W / 2 + 1, -H / 2 + 1, W - 2, H - 2);
    // faixa lateral teal com picote
    g.fillStyle(0x2c7f7a, 1);
    g.fillRect(-W / 2 + 1, -H / 2 + 1, 14, H - 2);
    g.fillStyle(0x4fd6c4, 1);
    g.fillRect(-W / 2 + 1, -H / 2 + 1, 2, H - 2);
    g.fillStyle(0xf2ead8, 1);
    for (let py = -H / 2 + 4; py < H / 2 - 2; py += 6) g.fillRect(-W / 2 + 14, py, 1, 3); // picote
    // linha de recorte pontilhada
    g.fillStyle(0xb9b3a8, 1);
    for (let py = -H / 2 + 3; py < H / 2 - 2; py += 4) g.fillRect(W / 2 - 34, py, 1, 2);
    // código de barras fake (linhas de 1px)
    g.fillStyle(0x1d2140, 1);
    let bx = W / 2 - 28;
    let semente = 7;
    while (bx < W / 2 - 6) {
      const largura = 1 + (semente % 2);
      g.fillRect(bx, H / 2 - 30, largura, 24);
      semente = (semente * 13 + 5) % 11;
      bx += largura + 1 + (semente % 2);
    }

    const embarque = scene.add
      .text(-W / 2 + 22, -H / 2 + 8, textos.embarque, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: "#2c7f7a",
      })
      .setOrigin(0, 0);
    const rota = scene.add
      .text(-W / 2 + 22, -4, textos.rota, {
        fontFamily: UI.fonte,
        fontSize: FONT_MD,
        color: "#1d2140",
      })
      .setOrigin(0, 0.5);
    const passageiros = scene.add
      .text(-W / 2 + 22, H / 2 - 14, textos.passageiros, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: "#5a5a66",
      })
      .setOrigin(0, 0.5);

    const cartao = scene.add
      .container(GAME_WIDTH + 130, 86, [g, embarque, rota, passageiros])
      .setDepth(191);

    // desliza da direita, como colocado numa mesa
    scene.tweens.add({
      targets: cartao,
      x: GAME_WIDTH / 2,
      duration: 500,
      ease: "Sine.easeOut",
    });

    // ---------- carimbo ----------
    const anel = scene.add.image(0, 0, "carimboAnel");
    const titulo = scene.add
      .text(0, 0, textos.carimbo, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: "#c0392b",
        align: "center",
        lineSpacing: 4,
      })
      .setOrigin(0.5);
    const carimbo = scene.add
      .container(GAME_WIDTH / 2 + 26, 82, [anel, titulo])
      .setDepth(192)
      .setVisible(false)
      .setAlpha(0.92);

    scene.time.delayedCall(1000, () => {
      carimbo.setVisible(true).setScale(2).setAlpha(0.3);
      scene.tweens.add({
        targets: carimbo,
        scaleX: 1, // tween transitório de animação (impacto)
        scaleY: 1,
        alpha: 0.92,
        duration: 150,
        ease: "Quad.easeIn",
        onComplete: () => {
          scene.cameras.main.shake(90, 0.004); // impacto de ~2px
          for (let i = 0; i < 8; i++) {
            const p = scene.add
              .rectangle(
                carimbo.x + Phaser.Math.Between(-30, 30),
                carimbo.y + Phaser.Math.Between(-20, 20),
                2,
                2,
                0xc0392b
              )
              .setDepth(193);
            scene.tweens.add({
              targets: p,
              x: p.x + Phaser.Math.Between(-10, 10),
              y: p.y + Phaser.Math.Between(-10, 10),
              alpha: 0,
              duration: 320,
              onComplete: () => p.destroy(),
            });
          }
        },
      });
    });

    // ---------- saída ----------
    scene.time.delayedCall(3600, () => {
      scene.tweens.add({
        targets: [cartao, carimbo],
        y: "+=8",
        alpha: 0,
        duration: 500,
        ease: "Sine.easeIn",
      });
      scene.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          cartao.destroy();
          carimbo.destroy();
          overlay.destroy();
          aoTerminar?.();
        },
      });
    });
  }

  /** Anel do carimbo desenhado por varredura de linhas (círculo em pixels). */
  private criarTexturaAnel(): void {
    if (this.scene.textures.exists("carimboAnel")) return;
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    const centro = 48;
    const externo = 46;
    const interno = 40;
    g.fillStyle(0xc0392b, 1);
    for (let dy = -externo; dy <= externo; dy++) {
      const wFora = Math.floor(Math.sqrt(externo * externo - dy * dy));
      const wDentro =
        Math.abs(dy) <= interno
          ? Math.floor(Math.sqrt(interno * interno - dy * dy))
          : -1;
      if (wDentro < 0) {
        g.fillRect(centro - wFora, centro + dy, wFora * 2 + 1, 1);
      } else {
        g.fillRect(centro - wFora, centro + dy, wFora - wDentro, 1);
        g.fillRect(centro + wDentro + 1, centro + dy, wFora - wDentro, 1);
      }
    }
    g.generateTexture("carimboAnel", 96, 96);
    g.destroy();
  }
}
