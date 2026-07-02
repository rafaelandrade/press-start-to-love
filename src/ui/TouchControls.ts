import Phaser from "phaser";
import { GAME_WIDTH } from "./constants";

/**
 * Controles touch simples: tap/segurar nas metades da tela = esquerda/direita.
 * (GAME_DESIGN.md seção 4 — testar em mobile.)
 */
export class TouchControls {
  esquerda = false;
  direita = false;

  constructor(scene: Phaser.Scene) {
    scene.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.atualizar(p, true));
    scene.input.on("pointerup", () => this.soltar());
    scene.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (p.isDown) this.atualizar(p, true);
    });
  }

  private atualizar(p: Phaser.Input.Pointer, down: boolean): void {
    const metade = p.x < GAME_WIDTH / 2;
    this.esquerda = down && metade;
    this.direita = down && !metade;
  }

  private soltar(): void {
    this.esquerda = false;
    this.direita = false;
  }
}
