import Phaser from "phaser";
import { UI, GAME_WIDTH, GAME_HEIGHT, FONT_SM } from "./constants";

/**
 * Título de fase em forma de CAIXA DE ENCOMENDA com etiqueta gigante:
 * a caixa de papelão desliza da direita, o carimbo FRÁGIL cai com
 * impacto (como o carimbo do BoardingPass) e a caixa BALANÇA sutilmente
 * — tem algo vivo aí dentro (foreshadowing da Yuumitcha).
 * Mesmo contrato do BoardingPass/Marquee: overlay escuro, gameplay
 * só no callback. Pixels duros.
 */
export class ShippingLabel {
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  mostrar(
    textos: {
      remetente: string;
      destinatario: string;
      conteudo: string;
      rastreio: string;
      fragil: string;
    },
    aoTerminar?: () => void
  ): void {
    const scene = this.scene;

    const overlay = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x101223, 0.55)
      .setDepth(190);

    // ---------- caixa de papelão ----------
    const W = 208;
    const H = 118;
    const g = scene.add.graphics();
    // sombra dura no "chão"
    g.fillStyle(0x0b0d1a, 0.6);
    g.fillRect(-W / 2 + 3, -H / 2 + 3, W, H);
    // corpo de papelão
    g.fillStyle(0x8a6240, 1);
    g.fillRect(-W / 2, -H / 2, W, H);
    g.fillStyle(0xb8894f, 1);
    g.fillRect(-W / 2 + 2, -H / 2 + 2, W - 4, H - 4);
    // abas do topo (vincos)
    g.fillStyle(0x8a6240, 1);
    g.fillRect(-W / 2 + 2, -H / 2 + 12, W - 4, 2);
    g.fillRect(-2, -H / 2 + 2, 4, 12);
    // fita adesiva vertical
    g.fillStyle(0xd8c8a8, 0.9);
    g.fillRect(-7, -H / 2 + 2, 14, H - 4);
    g.fillStyle(0xe8dcc0, 0.9);
    g.fillRect(-7, -H / 2 + 2, 2, H - 4);

    // ---------- a etiqueta (ela É o título) ----------
    const LW = 184;
    const LH = 78;
    g.fillStyle(0xb9b3a8, 1);
    g.fillRect(-LW / 2 - 1, -LH / 2 + 3, LW + 2, LH + 2);
    g.fillStyle(0xf6f2e8, 1);
    g.fillRect(-LW / 2, -LH / 2 + 4, LW, LH);
    // linha divisória pontilhada
    g.fillStyle(0xb9b3a8, 1);
    for (let px = -LW / 2 + 4; px < LW / 2 - 4; px += 4) g.fillRect(px, -LH / 2 + 34, 2, 1);

    const estilo = (cor: string): Phaser.Types.GameObjects.Text.TextStyle => ({
      fontFamily: UI.fonte,
      fontSize: FONT_SM,
      color: cor,
      lineSpacing: 2,
    });
    const remetente = scene.add
      .text(-LW / 2 + 6, -LH / 2 + 10, textos.remetente, estilo("#2c7f7a"))
      .setOrigin(0, 0);
    const destinatario = scene.add
      .text(-LW / 2 + 6, -LH / 2 + 22, textos.destinatario, estilo("#1d2140"))
      .setOrigin(0, 0);
    const conteudo = scene.add
      .text(-LW / 2 + 6, -LH / 2 + 46, textos.conteudo, estilo("#5a5a66"))
      .setOrigin(0, 0);
    const rastreio = scene.add
      .text(-LW / 2 + 6, -LH / 2 + 60, textos.rastreio, estilo("#5a5a66"))
      .setOrigin(0, 0);
    // código de barras do rastreio
    g.fillStyle(0x1d2140, 1);
    let bx = LW / 2 - 60;
    let semente = 5;
    while (bx < LW / 2 - 10) {
      const largura = 1 + (semente % 2);
      g.fillRect(bx, LH / 2 - 16, largura, 12);
      semente = (semente * 13 + 7) % 11;
      bx += largura + 1 + (semente % 2);
    }

    const caixa = scene.add
      .container(GAME_WIDTH + 140, 88, [g, remetente, destinatario, conteudo, rastreio])
      .setDepth(191);

    // desliza da direita, como entregue na porta
    scene.tweens.add({
      targets: caixa,
      x: GAME_WIDTH / 2,
      duration: 500,
      ease: "Sine.easeOut",
    });

    // a caixa balança sutilmente: tem algo VIVO aí dentro
    const wobble = scene.time.addEvent({
      delay: 1400,
      startAt: 800,
      loop: true,
      callback: () => {
        scene.tweens.add({
          targets: caixa,
          y: caixa.y - 3,
          duration: 90,
          yoyo: true,
          repeat: 1,
          ease: "Quad.easeOut",
        });
      },
    });

    // ---------- carimbo FRÁGIL (cai com impacto) ----------
    const cg = scene.add.graphics();
    cg.lineStyle(2, 0xc0392b, 1);
    cg.strokeRect(-32, -11, 64, 22);
    cg.lineStyle(1, 0xc0392b, 1);
    cg.strokeRect(-28, -8, 56, 16);
    const fragilTexto = scene.add
      .text(0, 0, textos.fragil, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: "#c0392b",
      })
      .setOrigin(0.5);
    const carimbo = scene.add
      .container(GAME_WIDTH / 2 + 62, 122, [cg, fragilTexto])
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
          scene.cameras.main.shake(90, 0.004);
          for (let i = 0; i < 8; i++) {
            const p = scene.add
              .rectangle(
                carimbo.x + Phaser.Math.Between(-26, 26),
                carimbo.y + Phaser.Math.Between(-12, 12),
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
    scene.time.delayedCall(4400, () => {
      wobble.remove();
      scene.tweens.add({
        targets: [caixa, carimbo],
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
          caixa.destroy();
          carimbo.destroy();
          overlay.destroy();
          aoTerminar?.();
        },
      });
    });
  }
}
