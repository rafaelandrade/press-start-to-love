import Phaser from "phaser";
import { UI, GAME_WIDTH, GAME_HEIGHT, FONT_SM } from "./constants";

/**
 * Título de fase em forma de janela de atualização de sistema (estilo
 * update de OS em pixel art): barra de título azul, botões fake, sombra
 * dura e barra de progresso que enche em BLOCOS (nunca gradiente).
 * Mesmo contrato do Marquee: overlay escuro atrás, o gameplay só começa
 * no callback — a janela "minimiza" para o canto ao concluir.
 */
export class UpdateWindow {
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  mostrar(textoInstalando: string, textoConcluido: string, aoTerminar?: () => void): void {
    const scene = this.scene;

    const overlay = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x101223, 0.5)
      .setDepth(190);

    const W = 208;
    const H = 64;
    const g = scene.add.graphics();

    // sombra dura de 2px
    g.fillStyle(0x0b0d1a, 0.6);
    g.fillRect(-W / 2 + 2, -H / 2 + 2, W, H);
    // janela cinza-clara com borda
    g.fillStyle(0x8a8fa8, 1);
    g.fillRect(-W / 2, -H / 2, W, H);
    g.fillStyle(0xd8dce4, 1);
    g.fillRect(-W / 2 + 1, -H / 2 + 1, W - 2, H - 2);
    // barra de título azul com brilho de 1px
    g.fillStyle(0x2c5aa8, 1);
    g.fillRect(-W / 2 + 1, -H / 2 + 1, W - 2, 12);
    g.fillStyle(0x4a7ac8, 1);
    g.fillRect(-W / 2 + 1, -H / 2 + 1, W - 2, 1);
    // botões fake: minimizar, maximizar, fechar
    for (let b = 0; b < 3; b++) {
      const bx = W / 2 - 10 - b * 9;
      g.fillStyle(0xd8dce4, 1);
      g.fillRect(bx - 3, -H / 2 + 4, 6, 6);
      g.fillStyle(0x2c3160, 1);
      if (b === 0) {
        g.fillRect(bx - 1, -H / 2 + 5, 2, 1); // "x" simplificado
        g.fillRect(bx - 2, -H / 2 + 7, 1, 1);
        g.fillRect(bx + 1, -H / 2 + 7, 1, 1);
      } else if (b === 1) {
        g.fillRect(bx - 2, -H / 2 + 5, 4, 1); // "□"
        g.fillRect(bx - 2, -H / 2 + 8, 4, 1);
        g.fillRect(bx - 2, -H / 2 + 5, 1, 4);
        g.fillRect(bx + 1, -H / 2 + 5, 1, 4);
      } else {
        g.fillRect(bx - 2, -H / 2 + 8, 4, 1); // "_"
      }
    }

    // inset da barra de progresso
    const barX = -W / 2 + 12;
    const barY = 6;
    const barW = W - 24;
    const barH = 14;
    g.fillStyle(0x8a8fa8, 1);
    g.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    g.fillStyle(0xf2f0f7, 1);
    g.fillRect(barX, barY, barW, barH);

    const titulo = scene.add
      .text(0, -10, textoInstalando, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: "#1d2140",
      })
      .setOrigin(0.5);
    const blocos = scene.add.graphics();
    const cont = scene.add
      .container(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 6, [g, blocos, titulo])
      .setDepth(191);

    // barra enche em blocos de 8px (~2s no total)
    const totalBlocos = Math.floor((barW - 2) / 9);
    let atual = 0;
    scene.time.addEvent({
      delay: Math.floor(2000 / totalBlocos),
      repeat: totalBlocos - 1,
      callback: () => {
        blocos.fillStyle(0x2c5aa8, 1);
        blocos.fillRect(barX + 2 + atual * 9, barY + 2, 8, barH - 4);
        atual++;
        if (atual >= totalBlocos) {
          titulo.setText(textoConcluido);
          scene.time.delayedCall(700, () => {
            // "minimiza": encolhe pro canto (tween transitório de animação)
            scene.tweens.add({
              targets: cont,
              x: 22,
              y: GAME_HEIGHT - 8,
              scaleX: 0.1,
              scaleY: 0.1,
              alpha: 0,
              duration: 400,
              ease: "Sine.easeIn",
              onComplete: () => cont.destroy(),
            });
            scene.tweens.add({
              targets: overlay,
              alpha: 0,
              duration: 400,
              onComplete: () => {
                overlay.destroy();
                aoTerminar?.();
              },
            });
          });
        }
      },
    });
  }
}
