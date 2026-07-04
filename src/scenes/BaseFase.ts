import Phaser from "phaser";
import { UI, GAME_WIDTH, GAME_HEIGHT, FONT_SM } from "../ui/constants";
import { fadeIn, fadeToScene } from "../ui/transitions";
import { Marquee } from "../ui/Marquee";

/**
 * Cena-base placeholder: anuncia a fase com o letreiro marquee e avança
 * pra próxima com qualquer input. Cada fase real substitui `montar()`
 * pela mecânica própria (que só começa depois do letreiro sair).
 */
export abstract class BaseFase extends Phaser.Scene {
  protected abstract readonly titulo: string;
  protected abstract readonly proximaCena: string | null;

  create(): void {
    fadeIn(this);
    this.cameras.main.setBackgroundColor(UI.fundoNoite);

    new Marquee(this).mostrar(this.titulo, () => {
      this.montar();

      if (this.proximaCena) {
        const dica = this.add
          .text(GAME_WIDTH / 2, GAME_HEIGHT - 12, "toque / espaço para continuar", {
            fontFamily: UI.fonte,
            fontSize: FONT_SM,
            color: UI.texto,
          })
          .setOrigin(0.5)
          .setAlpha(0.6);

        this.tweens.add({ targets: dica, alpha: 1, duration: 600, yoyo: true, repeat: -1 });

        const avancar = () => fadeToScene(this, this.proximaCena!);
        this.input.once("pointerdown", avancar);
        this.input.keyboard?.once("keydown-SPACE", avancar);
      }
    });
  }

  /** Conteúdo da fase (placeholder até a mecânica real ser implementada). */
  protected montar(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "[ em construção ]", {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.tealRafitcho,
      })
      .setOrigin(0.5);
  }
}
