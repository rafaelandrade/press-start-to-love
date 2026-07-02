import Phaser from "phaser";

/** Fade out e troca de cena (GAME_DESIGN.md: transição entre cenas com fade). */
export function fadeToScene(
  scene: Phaser.Scene,
  target: string,
  duration = 500
): void {
  scene.cameras.main.fadeOut(duration, 16, 18, 35);
  scene.cameras.main.once(
    Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
    () => scene.scene.start(target)
  );
}

/** Fade in ao entrar na cena. Chamar no create(). */
export function fadeIn(scene: Phaser.Scene, duration = 500): void {
  scene.cameras.main.fadeIn(duration, 16, 18, 35);
}
