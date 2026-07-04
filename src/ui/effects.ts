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

// Variedade de tamanho vem de texturas diferentes, nunca de escala fracionada
const CORACAO_MINI_GRID = [
  ".X.X.",
  "XXXXX",
  "XXXXX",
  ".XXX.",
  "..X..",
];

const CORACAO_GRANDE_GRID = [
  "..XX.XX..",
  ".XXXXXXX.",
  "XXXXXXXXX",
  "XXXXXXXXX",
  "XXXXXXXXX",
  ".XXXXXXX.",
  "..XXXXX..",
  "...XXX...",
  "....X....",
];

function criarTexturaDeGrid(
  scene: Phaser.Scene,
  key: string,
  grid: string[],
  cor: number
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(cor, 1);
  grid.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === "X") g.fillRect(x, y, 1, 1);
    });
  });
  g.generateTexture(key, grid[0].length, grid.length);
  g.destroy();
}

export function criarTexturaCoracao(
  scene: Phaser.Scene,
  key = "coracao",
  cor = 0xff7aa2
): void {
  criarTexturaDeGrid(scene, key, CORACAO_GRID, cor);
}

/** Registra os 3 tamanhos de coração (5x5, 7x6, 9x9). */
export function criarTexturasCoracoes(scene: Phaser.Scene, cor = 0xff7aa2): void {
  criarTexturaDeGrid(scene, "coracaoMini", CORACAO_MINI_GRID, cor);
  criarTexturaDeGrid(scene, "coracao", CORACAO_GRID, cor);
  criarTexturaDeGrid(scene, "coracaoGrande", CORACAO_GRANDE_GRID, cor);
}

export function criarTexturaNuvem(scene: Phaser.Scene, key = "nuvem"): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  // topo iluminado
  g.fillStyle(0xffffff, 1);
  g.fillRect(9, 1, 11, 3);
  g.fillRect(4, 3, 20, 4);
  g.fillRect(2, 6, 26, 3);
  // sombra na base (2º tom)
  g.fillStyle(0xc9dcea, 1);
  g.fillRect(3, 9, 24, 2);
  g.fillRect(7, 11, 15, 1);
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
  criarTexturasCoracoes(scene);
  const texturas = ["coracaoMini", "coracao", "coracaoGrande"];
  return scene.time.addEvent({
    delay: opts.intervalo ?? 350,
    loop: true,
    callback: () => {
      const x = Phaser.Math.Between(6, GAME_WIDTH - 6);
      const coracao = scene.add
        .image(x, GAME_HEIGHT + 8, texturas[Phaser.Math.Between(0, 2)])
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
      // sem rotação: quadradinho girado vira borda serrilhada fora do grid
      scene.tweens.add({
        targets: c,
        y: GAME_HEIGHT + 6,
        x: c.x + Phaser.Math.Between(-25, 25),
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
