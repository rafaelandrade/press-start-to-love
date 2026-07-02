import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "./constants";

// ------------------------------------------------------------
// Texturas pixel-art geradas em runtime (corações, nuvem, mala)
// ------------------------------------------------------------

const CORACAO_GRID = [
  ".XX.XX.",
  "XXXXXXX",
  "XXXXXXX",
  ".XXXXX.",
  "..XXX..",
  "...X...",
];

export function criarTexturaCoracao(
  scene: Phaser.Scene,
  key = "coracao",
  cor = 0xff7aa2
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(cor, 1);
  CORACAO_GRID.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === "X") g.fillRect(x, y, 1, 1);
    });
  });
  g.generateTexture(key, 7, 6);
  g.destroy();
}

export function criarTexturaNuvem(scene: Phaser.Scene, key = "nuvem"): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0xffffff, 1);
  g.fillRect(4, 4, 22, 6);
  g.fillRect(8, 1, 10, 4);
  g.fillRect(2, 6, 26, 4);
  g.generateTexture(key, 30, 12);
  g.destroy();
}

export function criarTexturaMala(scene: Phaser.Scene, key = "mala"): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0x6b4a2f, 1); // corpo
  g.fillRect(0, 3, 10, 8);
  g.fillStyle(0x8a6240, 1); // faixa
  g.fillRect(0, 6, 10, 2);
  g.fillStyle(0x3d2a1a, 1); // alça
  g.fillRect(3, 0, 4, 3);
  g.fillRect(4, 1, 2, 2);
  g.generateTexture(key, 10, 11);
  g.destroy();
}

// ------------------------------------------------------------
// Efeitos animados
// ------------------------------------------------------------

/** Corações que sobem flutuando pela tela, em loop. */
export function chuvaDeCoracoes(
  scene: Phaser.Scene,
  opts: { intervalo?: number; depth?: number } = {}
): Phaser.Time.TimerEvent {
  criarTexturaCoracao(scene);
  return scene.time.addEvent({
    delay: opts.intervalo ?? 350,
    loop: true,
    callback: () => {
      const x = Phaser.Math.Between(6, GAME_WIDTH - 6);
      const escala = Phaser.Math.FloatBetween(0.8, 2.2);
      const coracao = scene.add
        .image(x, GAME_HEIGHT + 8, "coracao")
        .setScale(escala)
        .setAlpha(0.9)
        .setDepth(opts.depth ?? 1)
        .setScrollFactor(0);

      scene.tweens.add({
        targets: coracao,
        y: -10,
        alpha: 0,
        duration: Phaser.Math.Between(3500, 6000),
        ease: "Sine.easeIn",
        onComplete: () => coracao.destroy(),
      });
      scene.tweens.add({
        targets: coracao,
        x: x + Phaser.Math.Between(-18, 18),
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    },
  });
}

/** Estrelas que piscam numa área. */
export function estrelasCintilantes(
  scene: Phaser.Scene,
  quantidade: number,
  areaAltura: number,
  depth = 0
): void {
  for (let i = 0; i < quantidade; i++) {
    const x = Phaser.Math.Between(2, GAME_WIDTH - 2);
    const y = Phaser.Math.Between(2, areaAltura);
    const tamanho = Math.random() < 0.2 ? 2 : 1;
    const estrela = scene.add
      .rectangle(x, y, tamanho, tamanho, 0xffffff)
      .setAlpha(Math.random())
      .setDepth(depth)
      .setScrollFactor(0);
    scene.tweens.add({
      targets: estrela,
      alpha: 0.1,
      duration: Phaser.Math.Between(400, 1600),
      yoyo: true,
      repeat: -1,
      delay: Math.random() * 1000,
    });
  }
}

/** Confetes coloridos caindo, em loop. */
export function confete(
  scene: Phaser.Scene,
  cores: number[],
  intervalo = 220
): Phaser.Time.TimerEvent {
  return scene.time.addEvent({
    delay: intervalo,
    loop: true,
    callback: () => {
      const cor = cores[Phaser.Math.Between(0, cores.length - 1)];
      const c = scene.add
        .rectangle(Phaser.Math.Between(0, GAME_WIDTH), -4, 2, 2, cor)
        .setDepth(2)
        .setScrollFactor(0);
      scene.tweens.add({
        targets: c,
        y: GAME_HEIGHT + 6,
        x: c.x + Phaser.Math.Between(-25, 25),
        angle: Phaser.Math.Between(90, 360),
        duration: Phaser.Math.Between(2500, 4500),
        onComplete: () => c.destroy(),
      });
    },
  });
}

/** Céu em gradiente vertical desenhado em faixas (pixel-art friendly). */
export function ceuGradiente(
  scene: Phaser.Scene,
  corTopo: number,
  corBase: number,
  altura = GAME_HEIGHT
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(-10).setScrollFactor(0);
  const topo = Phaser.Display.Color.ValueToColor(corTopo);
  const base = Phaser.Display.Color.ValueToColor(corBase);
  const faixa = 4;
  for (let y = 0; y < altura; y += faixa) {
    const t = y / altura;
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(topo, base, 100, t * 100);
    g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
    g.fillRect(0, y, GAME_WIDTH, faixa);
  }
  return g;
}
