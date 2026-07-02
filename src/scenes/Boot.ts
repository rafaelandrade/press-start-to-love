import Phaser from "phaser";
import { createCharacterTextures } from "../sprites/factory";
import { UI, GAME_WIDTH, GAME_HEIGHT } from "../ui/constants";
import { fadeToScene } from "../ui/transitions";

/** Gera texturas dos personagens e mostra a tela-título. */
export class Boot extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    createCharacterTextures(this);
    this.cameras.main.setBackgroundColor(UI.fundoNoite);

    this.add
      .text(GAME_WIDTH / 2, 50, "A ENCOMENDA\nDO FUTURO", {
        fontFamily: UI.fonte,
        fontSize: "14px",
        color: UI.douradoYuumitcha,
        align: "center",
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    // Os três posando na tela-título
    this.add.image(GAME_WIDTH / 2 - 30, 110, "gabitcha").setScale(2);
    this.add.image(GAME_WIDTH / 2 + 30, 110, "rafitcho").setScale(2);
    this.add.image(GAME_WIDTH / 2, 125, "yuumitcha").setScale(2);

    const start = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 20, "PRESS START", {
        fontFamily: UI.fonte,
        fontSize: "8px",
        color: UI.rosaGabitcha,
      })
      .setOrigin(0.5);

    this.tweens.add({ targets: start, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });

    const iniciar = () => fadeToScene(this, "Prologo");
    this.input.once("pointerdown", iniciar);
    this.input.keyboard?.once("keydown-SPACE", iniciar);
  }
}
