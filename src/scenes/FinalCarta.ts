import Phaser from "phaser";
import { BaseFase } from "./BaseFase";
import { DIALOGOS } from "../dialogos";
import { UI, GAME_WIDTH, FONT_SM } from "../ui/constants";

/**
 * Final — "A Carta" (INTOCÁVEL)
 * Céu estrelado, os três no telhado. Carta linha por linha, estilo final de RPG.
 * "Rafitcho ama muito a Gabitcha" + fogos.
 * TODO: fogos em pixel art + easter egg do replay (foto real pixelizada).
 */
export class FinalCarta extends BaseFase {
  constructor() {
    super("FinalCarta");
  }

  protected readonly titulo = DIALOGOS.final.titulo;
  protected readonly proximaCena = null;

  protected override montar(): void {
    // Estrelinhas
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(4, GAME_WIDTH - 4);
      const y = Phaser.Math.Between(4, 70);
      const s = this.add.rectangle(x, y, 1, 1, 0xffffff).setAlpha(Math.random());
      this.tweens.add({
        targets: s,
        alpha: 0.1,
        duration: Phaser.Math.Between(500, 1500),
        yoyo: true,
        repeat: -1,
      });
    }

    // Os três no "telhado"
    this.add.image(GAME_WIDTH / 2 - 26, 60, "gabitcha").setScale(2);
    this.add.image(GAME_WIDTH / 2 + 26, 60, "rafitcho").setScale(2);
    this.add.image(GAME_WIDTH / 2, 72, "yuumitcha").setScale(2);

    // Carta linha por linha
    const linhas = DIALOGOS.final.carta;
    const texto = this.add
      .text(GAME_WIDTH / 2, 92, "", {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
        align: "center",
        lineSpacing: 3,
        wordWrap: { width: 304 },
      })
      .setOrigin(0.5, 0);

    let i = 0;
    this.time.addEvent({
      delay: 1200,
      repeat: linhas.length - 1,
      callback: () => {
        texto.setText(linhas.slice(0, ++i).join("\n"));
      },
    });
  }
}
