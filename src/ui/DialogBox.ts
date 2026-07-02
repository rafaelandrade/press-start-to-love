import Phaser from "phaser";
import { UI, GAME_WIDTH, GAME_HEIGHT, FONT_SM } from "./constants";

/**
 * Caixa de diálogo pixel-art simples, fixa na base da tela.
 * Uso: const box = new DialogBox(this); box.mostrar("texto");
 */
export class DialogBox {
  private readonly scene: Phaser.Scene;
  private readonly painel: Phaser.GameObjects.Rectangle;
  private readonly borda: Phaser.GameObjects.Rectangle;
  private readonly texto: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const h = 44;
    const y = GAME_HEIGHT - h / 2 - 4;

    this.borda = scene.add
      .rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 8, h, UI.linha)
      .setScrollFactor(0)
      .setDepth(100);
    this.painel = scene.add
      .rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 12, h - 4, UI.painel)
      .setScrollFactor(0)
      .setDepth(100);
    this.texto = scene.add
      .text(10, y - h / 2 + 8, "", {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
        wordWrap: { width: GAME_WIDTH - 24 },
        lineSpacing: 4,
      })
      .setScrollFactor(0)
      .setDepth(101);

    this.esconder();
  }

  mostrar(fala: string): void {
    this.texto.setText(fala);
    this.borda.setVisible(true);
    this.painel.setVisible(true);
    this.texto.setVisible(true);
  }

  esconder(): void {
    this.borda.setVisible(false);
    this.painel.setVisible(false);
    this.texto.setVisible(false);
  }

  destruir(): void {
    this.borda.destroy();
    this.painel.destroy();
    this.texto.destroy();
    void this.scene;
  }
}
