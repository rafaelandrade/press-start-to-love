import Phaser from "phaser";
import { SpriteData, GABITCHA, RAFITCHO, YUUMITCHA } from "./data";

/** Gera uma textura no cache do Phaser a partir de uma matriz de pixels. */
export function createTextureFromData(
  scene: Phaser.Scene,
  key: string,
  data: SpriteData
): void {
  if (scene.textures.exists(key)) return;

  const width = data.grid[0].length;
  const height = data.grid.length;
  const canvas = scene.textures.createCanvas(key, width, height);
  if (!canvas) return;
  const ctx = canvas.getContext();

  data.grid.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === ".") return;
      const color = data.palette[ch];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    });
  });

  canvas.refresh();
}

/** Registra as texturas dos 3 personagens. Chamar uma vez no Boot. */
export function createCharacterTextures(scene: Phaser.Scene): void {
  createTextureFromData(scene, "gabitcha", GABITCHA);
  createTextureFromData(scene, "rafitcho", RAFITCHO);
  createTextureFromData(scene, "yuumitcha", YUUMITCHA);
}
