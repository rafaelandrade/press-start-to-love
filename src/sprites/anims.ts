import Phaser from "phaser";
import { createTextureFromData } from "./factory";
import {
  GABITCHA_ANDAR_FRAMES,
  GABITCHA_IDLE_FRAME,
  RAFITCHO_ANDAR_FRAMES,
  RAFITCHO_IDLE_FRAME,
  YUUMITCHA_TROTE_FRAMES,
} from "./data";

/**
 * Animações compartilhadas de caminhada/idle/trote.
 * Registradas UMA vez (o Boot chama; texturas e anims são globais).
 * Ciclo de andar: contato → passagem → contato invertido → passagem
 * (o frame de passagem embute o 1px "mais alto" do passo).
 * Uso por frame: `atualizarAndar(sprite, "gabitcha", velocity !== 0)`.
 */

export type Personagem = "gabitcha" | "rafitcho";

export function registrarAnimacoes(scene: Phaser.Scene): void {
  GABITCHA_ANDAR_FRAMES.forEach((d, i) => createTextureFromData(scene, `gabitcha-andar-${i}`, d));
  createTextureFromData(scene, "gabitcha-idle-1", GABITCHA_IDLE_FRAME);
  RAFITCHO_ANDAR_FRAMES.forEach((d, i) => createTextureFromData(scene, `rafitcho-andar-${i}`, d));
  createTextureFromData(scene, "rafitcho-idle-1", RAFITCHO_IDLE_FRAME);
  YUUMITCHA_TROTE_FRAMES.forEach((d, i) => createTextureFromData(scene, `yuumi-trote-${i}`, d));

  const criar = (key: string, texturas: string[], frameRate: number) => {
    if (scene.anims.exists(key)) return;
    scene.anims.create({
      key,
      frames: texturas.map((k) => ({ key: k })),
      frameRate,
      repeat: -1,
    });
  };

  for (const quem of ["gabitcha", "rafitcho"] as const) {
    criar(
      `${quem}-andar`,
      [`${quem}-andar-0`, `${quem}-andar-1`, `${quem}-andar-2`, `${quem}-andar-1`],
      8
    );
    criar(`${quem}-idle`, [quem, `${quem}-idle-1`], 2);
  }
  criar("yuumi-trote", ["yuumi-trote-0", "yuumi-trote-1", "yuumi-trote-2", "yuumi-trote-1"], 10);
}

/**
 * Alterna andar/idle automaticamente — chamar por frame no update
 * (e no início de cutscenes de caminhada com `andando: true`).
 */
export function atualizarAndar(
  sprite: Phaser.GameObjects.Sprite,
  quem: Personagem,
  andando: boolean
): void {
  sprite.play(`${quem}-${andando ? "andar" : "idle"}`, true);
}

/** Trote da Yuumitcha (chamar por frame enquanto ela corre). */
export function trotar(sprite: Phaser.GameObjects.Sprite): void {
  sprite.play("yuumi-trote", true);
}

/** Para a animação e fixa uma textura de pose (sentado, abraço...). */
export function pose(sprite: Phaser.GameObjects.Sprite, textura: string): void {
  sprite.anims.stop();
  sprite.setTexture(textura);
}
