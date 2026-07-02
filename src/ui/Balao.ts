import Phaser from "phaser";
import { UI, GAME_WIDTH } from "./constants";

/**
 * Balão de fala pixel-art com animação typewriter.
 * - toque/espaço durante a digitação: completa o texto na hora
 * - toque/espaço depois: fecha e chama o callback
 */
export class Balao {
  private readonly scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;
  private textoObj: Phaser.GameObjects.Text | null = null;
  private seta: Phaser.GameObjects.Text | null = null;
  private timer: Phaser.Time.TimerEvent | null = null;
  private textoCompleto = "";
  private completo = false;
  private aoFechar: (() => void) | undefined;
  private readonly onInput: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.onInput = () => this.avancar();
  }

  get ativo(): boolean {
    return this.container !== null;
  }

  /** Mostra o balão com a "pontinha" apontando para (x, y) — topo da cabeça do personagem. */
  falar(x: number, y: number, fala: string, aoFechar?: () => void): void {
    this.fechar(false);
    this.textoCompleto = fala;
    this.completo = false;
    this.aoFechar = aoFechar;

    const estilo: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: UI.fonte,
      fontSize: "6px",
      color: "#1d2140",
      lineSpacing: 4,
    };

    // Mede o texto completo pra dimensionar o balão
    const medida = this.scene.make.text({ x: 0, y: 0, text: fala, style: estilo });
    const larguraTexto = Math.min(medida.width, 200);
    const alturaTexto = medida.height;
    medida.destroy();

    const largura = larguraTexto + 14;
    const altura = alturaTexto + 12;

    // Mantém o balão dentro da tela (considerando câmera com scroll)
    const cam = this.scene.cameras.main;
    const cx = Phaser.Math.Clamp(
      x,
      cam.scrollX + largura / 2 + 3,
      cam.scrollX + GAME_WIDTH - largura / 2 - 3
    );

    const g = this.scene.add.graphics();
    // sombra
    g.fillStyle(0x000000, 0.25);
    g.fillRect(-largura / 2 + 2, -altura - 8 + 2, largura, altura);
    // corpo
    g.fillStyle(0xffffff, 1);
    g.fillRect(-largura / 2, -altura - 8, largura, altura);
    // borda pixelada
    g.lineStyle(1, 0x1d2140, 1);
    g.strokeRect(-largura / 2 + 0.5, -altura - 8 + 0.5, largura - 1, altura - 1);
    // pontinha (triângulo em degraus, estilo pixel)
    g.fillStyle(0xffffff, 1);
    g.fillRect(x - cx - 3, -8, 6, 3);
    g.fillRect(x - cx - 1, -5, 3, 3);
    g.fillRect(x - cx, -2, 1, 2);

    this.textoObj = this.scene.add.text(-largura / 2 + 7, -altura - 8 + 6, "", estilo);
    this.seta = this.scene.add
      .text(largura / 2 - 9, -14, "▼", { fontFamily: UI.fonte, fontSize: "5px", color: "#ff7aa2" })
      .setVisible(false);

    this.container = this.scene.add
      .container(cx, y, [g, this.textoObj, this.seta])
      .setDepth(200);

    // entrada com "pop"
    this.container.setScale(0.6).setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      scale: 1,
      alpha: 1,
      duration: 140,
      ease: "Back.easeOut",
    });

    // typewriter
    let i = 0;
    this.timer = this.scene.time.addEvent({
      delay: 28,
      repeat: fala.length - 1,
      callback: () => {
        i++;
        this.textoObj?.setText(fala.slice(0, i));
        if (i >= fala.length) this.marcarCompleto();
      },
    });

    this.scene.input.on("pointerdown", this.onInput);
    this.scene.input.keyboard?.on("keydown-SPACE", this.onInput);
  }

  private marcarCompleto(): void {
    this.completo = true;
    this.timer?.remove();
    this.timer = null;
    if (this.seta) {
      this.seta.setVisible(true);
      this.scene.tweens.add({
        targets: this.seta,
        alpha: 0.2,
        duration: 350,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private avancar(): void {
    if (!this.container) return;
    if (!this.completo) {
      this.textoObj?.setText(this.textoCompleto);
      this.marcarCompleto();
      return;
    }
    this.fechar(true);
  }

  fechar(chamarCallback: boolean): void {
    this.scene.input.off("pointerdown", this.onInput);
    this.scene.input.keyboard?.off("keydown-SPACE", this.onInput);
    this.timer?.remove();
    this.timer = null;
    this.container?.destroy();
    this.container = null;
    this.textoObj = null;
    this.seta = null;
    if (chamarCallback) {
      const cb = this.aoFechar;
      this.aoFechar = undefined;
      cb?.();
    }
  }
}
