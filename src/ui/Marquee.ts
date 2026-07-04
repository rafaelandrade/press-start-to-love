import Phaser from "phaser";
import { UI, GAME_WIDTH, GAME_HEIGHT, FONT_MD } from "./constants";

/**
 * Letreiro de fase estilo marquee de cinema antigo: painel claro de letras
 * móveis, moldura vermelha com lâmpadas em efeito "chase" e marquise com
 * estrelas douradas. Tudo em pixels duros — brilho por cor e alternância,
 * nunca blur.
 *
 * Uso: `new Marquee(scene).mostrar(titulo, () => iniciarFase())`.
 * Desce com bounce, fica ~2.5s (gameplay parado, overlay escuro atrás),
 * sobe com fade e chama o callback.
 */
export class Marquee {
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  mostrar(titulo: string, aoTerminar?: () => void): void {
    const scene = this.scene;
    this.criarTexturas();
    const texto = this.quebrar(titulo.toUpperCase());

    // o cenário não compete enquanto o letreiro está na tela
    const overlay = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x101223, 0.5)
      .setDepth(190);

    // título com relevo de letra encaixada (cópia clara deslocada 1px)
    const estilo: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: UI.fonte,
      fontSize: FONT_MD,
      color: "#3a2a20",
      align: "center",
      lineSpacing: 6,
    };
    const relevo = scene.add.text(1, 1, texto, { ...estilo, color: "#fffbef" }).setOrigin(0.5);
    const principal = scene.add.text(0, 0, texto, estilo).setOrigin(0.5);

    const pw = Math.ceil(principal.width) + 24; // painel
    const ph = Math.ceil(principal.height) + 16;
    const meiaW = pw / 2 + 10; // meia-largura incluindo a banda da moldura
    const meiaH = ph / 2 + 10;

    const g = scene.add.graphics();

    // marquise triangular escura (atrás da moldura)
    g.fillStyle(0x241a20, 1);
    g.fillTriangle(-meiaW - 6, -meiaH + 1, meiaW + 6, -meiaH + 1, 0, -meiaH - 22);
    g.fillStyle(0x3a2a3e, 1);
    g.fillTriangle(-meiaW, -meiaH + 1, meiaW, -meiaH + 1, 0, -meiaH - 18);

    // moldura vermelha em 3 tons (luz de cima-esquerda)
    g.fillStyle(0x8a2431, 1);
    g.fillRect(-meiaW, -meiaH, pw + 20, ph + 20);
    g.fillStyle(0xc0392b, 1);
    g.fillRect(-meiaW + 2, -meiaH + 2, pw + 16, ph + 16);
    g.fillStyle(0xe05c4a, 1);
    g.fillRect(-meiaW + 2, -meiaH + 2, pw + 16, 2);
    g.fillRect(-meiaW + 2, -meiaH + 2, 2, ph + 16);

    // painel claro de letras móveis com grid de 1px
    g.fillStyle(0xf2ead8, 1);
    g.fillRect(-pw / 2, -ph / 2, pw, ph);
    g.fillStyle(0xe0d6bc, 1);
    for (let gx = -pw / 2 + 8; gx < pw / 2; gx += 8) g.fillRect(gx, -ph / 2, 1, ph);
    for (let gy = -ph / 2 + 8; gy < ph / 2; gy += 8) g.fillRect(-pw / 2, gy, pw, 1);

    // cantos "arredondados" de 2px (chanfro na cor da moldura)
    g.fillStyle(0xc0392b, 1);
    g.fillRect(-pw / 2, -ph / 2, 2, 1);
    g.fillRect(-pw / 2, -ph / 2, 1, 2);
    g.fillRect(pw / 2 - 2, -ph / 2, 2, 1);
    g.fillRect(pw / 2 - 1, -ph / 2, 1, 2);
    g.fillRect(-pw / 2, ph / 2 - 1, 2, 1);
    g.fillRect(-pw / 2, ph / 2 - 2, 1, 2);
    g.fillRect(pw / 2 - 2, ph / 2 - 1, 2, 1);
    g.fillRect(pw / 2 - 1, ph / 2 - 2, 1, 2);

    // lâmpadas ao redor da moldura (perímetro em ordem, pro chase girar)
    const lampadas: Array<{ img: Phaser.GameObjects.Image; canto: boolean }> = [];
    const L = pw / 2 + 5;
    const T = ph / 2 + 5;
    const posicoes: Array<[number, number]> = [];
    const passosTopo = Math.max(2, Math.round((2 * L) / 12));
    for (let i = 0; i <= passosTopo; i++) posicoes.push([Math.round(-L + (2 * L * i) / passosTopo), -T]);
    const passosLado = Math.max(1, Math.round((2 * T) / 12));
    for (let i = 1; i < passosLado; i++) posicoes.push([L, Math.round(-T + (2 * T * i) / passosLado)]);
    for (let i = passosTopo; i >= 0; i--) posicoes.push([Math.round(-L + (2 * L * i) / passosTopo), T]);
    for (let i = passosLado - 1; i >= 1; i--) posicoes.push([-L, Math.round(-T + (2 * T * i) / passosLado)]);
    for (const [lx, ly] of posicoes) {
      const canto = Math.abs(lx) === L && Math.abs(ly) === T;
      lampadas.push({ img: scene.add.image(lx, ly, "marqueeLampAcesa"), canto });
    }

    // estrelas douradas na marquise (a central maior)
    const estrelas: Phaser.GameObjects.Image[] = [
      scene.add.image(0, -meiaH - 10, "marqueeEstrela7"),
      scene.add.image(-15, -meiaH - 6, "marqueeEstrela5"),
      scene.add.image(15, -meiaH - 6, "marqueeEstrela5"),
      scene.add.image(-28, -meiaH - 3, "marqueeEstrela5"),
      scene.add.image(28, -meiaH - 3, "marqueeEstrela5"),
    ];

    const cont = scene.add
      .container(GAME_WIDTH / 2, -90, [
        g,
        relevo,
        principal,
        ...lampadas.map((l) => l.img),
        ...estrelas,
      ])
      .setDepth(191);

    // chase clássico: o padrão gira uma posição a cada ~150ms;
    // as lâmpadas dos 4 cantos piscam em conjunto
    let passo = 0;
    const pintar = () => {
      lampadas.forEach((l, i) => {
        const acesa = l.canto ? passo % 2 === 0 : (i + passo) % 3 !== 0;
        l.img.setTexture(acesa ? "marqueeLampAcesa" : "marqueeLampApagada");
      });
      estrelas.forEach((e, i) => e.setTint((i + passo) % 2 === 0 ? 0xe9b44c : 0xf0cd7a));
    };
    pintar();
    const chase = scene.time.addEvent({
      delay: 150,
      loop: true,
      callback: () => {
        passo++;
        pintar();
      },
    });

    // entrada com bounce → espera → sobe e some
    scene.tweens.add({ targets: cont, y: 78, duration: 700, ease: "Back.easeOut" });
    scene.time.delayedCall(3200, () => {
      scene.tweens.add({ targets: cont, y: -90, alpha: 0, duration: 600, ease: "Sine.easeIn" });
      scene.tweens.add({ targets: overlay, alpha: 0, duration: 600 });
      scene.time.delayedCall(600, () => {
        chase.remove();
        cont.destroy();
        overlay.destroy();
        aoTerminar?.();
      });
    });
  }

  /** Quebra títulos longos no espaço mais próximo do meio (máx 2 linhas). */
  private quebrar(titulo: string): string {
    if (titulo.includes("\n") || titulo.length <= 11) return titulo;
    const meio = titulo.length / 2;
    let melhor = -1;
    for (let i = 0; i < titulo.length; i++) {
      if (titulo[i] === " " && (melhor === -1 || Math.abs(i - meio) < Math.abs(melhor - meio))) {
        melhor = i;
      }
    }
    if (melhor === -1) return titulo;
    return `${titulo.slice(0, melhor)}\n${titulo.slice(melhor + 1)}`;
  }

  private criarTexturas(): void {
    const scene = this.scene;
    if (!scene.textures.exists("marqueeLampAcesa")) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xfff6c9, 1);
      g.fillRect(0, 0, 3, 3);
      g.fillStyle(0xffffff, 1);
      g.fillRect(1, 1, 1, 1);
      g.generateTexture("marqueeLampAcesa", 3, 3);
      g.destroy();
    }
    if (!scene.textures.exists("marqueeLampApagada")) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x8a6a30, 1);
      g.fillRect(0, 0, 3, 3);
      g.fillStyle(0x6b521f, 1);
      g.fillRect(1, 1, 1, 1);
      g.generateTexture("marqueeLampApagada", 3, 3);
      g.destroy();
    }
    const estrela = (key: string, grid: string[]) => {
      if (scene.textures.exists(key)) return;
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xffffff, 1); // branca; o tom dourado vem por tint alternado
      grid.forEach((row, y) => {
        [...row].forEach((ch, x) => {
          if (ch === "X") g.fillRect(x, y, 1, 1);
        });
      });
      g.generateTexture(key, grid[0].length, grid.length);
      g.destroy();
    };
    estrela("marqueeEstrela5", ["..X..", ".XXX.", "XXXXX", ".XXX.", "..X.."]);
    estrela("marqueeEstrela7", [
      "...X...",
      "..XXX..",
      ".XXXXX.",
      "XXXXXXX",
      ".XXXXX.",
      "..XXX..",
      "...X...",
    ]);
  }
}
