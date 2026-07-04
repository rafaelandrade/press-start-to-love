import Phaser from "phaser";
import { DIALOGOS, falaSegura } from "../dialogos";
import { UI, GAME_WIDTH, GAME_HEIGHT, FONT_SM, FONT_MD, FONT_LG } from "../ui/constants";
import { fadeIn, fadeToScene } from "../ui/transitions";
import { ceuGradiente, estrelasCintilantes, chuvaDeCoracoes } from "../ui/effects";
import { createTextureFromData } from "../sprites/factory";

/**
 * Final — "A Carta" (INTOCÁVEL)
 * Céu estrelado, os três de costas no telhado olhando o céu.
 * A carta sobe em crawl estilo Star Wars — ELA controla o ritmo
 * (↓ ou segurar o toque acelera 2x, ESPAÇO pausa). Depois: fogos,
 * "Feliz aniversário, Gabitcha." e a tela que fica para sempre.
 * O timing desta cena é sagrado: nada apressado.
 */

const VELOCIDADE_CRAWL = 10; // px/s — leitura confortável em voz baixa
const ESPACAMENTO = 14; // px por linha (espaço generoso)
const TELHADO_Y = 152;

type Etapa =
  | "crawl"
  | "silencio"
  | "fogos"
  | "mensagem"
  | "botao"
  | "mural"
  | "foco"
  | "telaFinal";

// molduras de polaroid do mural (borda inferior grossa, como na Fase 4)
interface PresetPolaroid {
  w: number;
  h: number;
  jh: number; // altura da janela da foto (largura = w - 8)
}
const PRESETS_POLAROID: PresetPolaroid[] = [
  { w: 46, h: 56, jh: 36 },
  { w: 54, h: 64, jh: 42 },
  { w: 50, h: 60, jh: 39 },
];

// silhuetas de costas (2 tons), sentados no telhado
const SIL_PALETTE = { k: "#14121f", h: "#2c3160" };
const GAB_COSTAS = [
  "....kkkkkk....",
  "..khkkkkkkkk..",
  ".khkkkkkkkkkk.",
  ".kkkkkkkkkkkk.",
  ".kkkkkkkkkkkk.",
  ".khkkkkkkkkkk.",
  ".kkkkkkkkkkkk.",
  ".kkkkkkkkkkkk.",
  ".khkkkkkkkkkk.",
  ".kkkkkkkkkkkk.",
  ".kkkkkkkkkkkk.",
  ".kkkkkkkkkkkk.",
  "kkkkkkkkkkkkkk",
  "kkkkkkkkkkkkkk",
  "kkkkkkkkkkkkkk",
  "kkkkkkkkkkkkkk",
  "kkkkkkkkkkkkkk",
  "kkkkkkkkkkkkkk",
];
const RAF_COSTAS = [
  "...kkkkkk...",
  "..khkkkkkk..",
  ".kkkkkkkkkk.",
  ".khkkkkkkkk.",
  ".hkkkkkkkkh.",
  ".kkkkkkkkkk.",
  "..kkkkkkkk..",
  "..kkkkkkkk..",
  ".kkkkkkkkkk.",
  "kkkkkkkkkkkk",
  "kkkkkkkkkkkk",
  "kkkkkkkkkkkk",
  "kkkkkkkkkkkk",
  "kkkkkkkkkkkk",
  "kkkkkkkkkkkk",
  "kkkkkkkkkkkk",
];
const YUUMI_COSTAS = [
  ".k.....k.",
  ".kk...kk.",
  ".kkkkkkk.",
  "kkkkkkkkk",
  "kkkkkkkkk",
  "kkkkkkkhh",
  ".kkkkkkh.",
  ".kkkkkk..",
];

interface LinhaCrawl {
  obj: Phaser.GameObjects.Text;
  yLocal: number;
}

export class FinalCarta extends Phaser.Scene {
  private etapa: Etapa = "crawl";
  private cartaCont!: Phaser.GameObjects.Container;
  private linhas: LinhaCrawl[] = [];
  private alturaTotal = 0;
  private pausado = false;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private silhuetas: Phaser.GameObjects.Image[] = [];

  // mural de fotos reais
  private fotoKeys: string[] = [];
  private muralObjs: Phaser.GameObjects.GameObject[] = [];
  private muralLimpeza: Array<() => void> = [];
  private dragMoveu = 0;
  private inercia = 0;
  private focoObjs: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super("FinalCarta");
  }

  create(): void {
    this.etapa = "crawl";
    this.pausado = false;
    this.linhas = [];
    this.fotoKeys = [];
    this.muralObjs = [];
    this.muralLimpeza = [];
    this.focoObjs = [];
    this.inercia = 0;

    fadeIn(this, 900);
    this.criarTexturas();
    this.carregarFotosReais(); // carrega em paralelo, durante o crawl

    // céu estrelado total + lua
    ceuGradiente(this, 0x101223, 0x2a1a3e);
    estrelasCintilantes(this, 46, 150, -9);
    this.criarLua();

    // telhado com os três de costas, olhando o céu
    const telhado = this.add.graphics().setDepth(5);
    telhado.fillStyle(0x1d2140, 1);
    telhado.fillRect(0, TELHADO_Y, GAME_WIDTH, 1); // borda iluminada pela lua
    telhado.fillStyle(0x0b0d1a, 1);
    telhado.fillRect(0, TELHADO_Y + 1, GAME_WIDTH, GAME_HEIGHT - TELHADO_Y - 1);
    const cx = GAME_WIDTH / 2;
    this.silhuetas = [
      this.add.image(cx - 17, TELHADO_Y - 8, "silGab").setDepth(6),
      this.add.image(cx + 16, TELHADO_Y - 7, "silRaf").setDepth(6),
      this.add.image(cx - 1, TELHADO_Y - 3, "silYuumi").setDepth(6), // a pug entre os dois
    ];

    // o crawl: cada linha é um texto (pra faixa de alpha por altura);
    // fica ATRÁS do telhado — as palavras nascem do horizonte
    this.cartaCont = this.add.container(cx, GAME_HEIGHT + 12).setDepth(4);
    const carta = DIALOGOS.final.carta;
    carta.forEach((linha, i) => {
      if (linha === "") return; // linha vazia só ocupa o espaçamento
      const t = this.add
        .text(0, i * ESPACAMENTO, falaSegura(linha), {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: "#f0e6c8",
        })
        .setOrigin(0.5, 0);
      this.cartaCont.add(t);
      this.linhas.push({ obj: t, yLocal: i * ESPACAMENTO });
    });
    this.alturaTotal = carta.length * ESPACAMENTO;

    // ELA controla o ritmo do momento
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard?.on("keydown-SPACE", () => {
      if (this.etapa === "crawl") this.pausado = !this.pausado;
    });
  }

  update(_time: number, delta: number): void {
    if (this.etapa === "mural") {
      const cam = this.cameras.main;
      // setas também funcionam
      if (this.cursors.left.isDown) cam.scrollX -= (170 * delta) / 1000;
      else if (this.cursors.right.isDown) cam.scrollX += (170 * delta) / 1000;
      // inércia suave após soltar o arrasto
      if (!this.input.activePointer.isDown && Math.abs(this.inercia) > 2) {
        cam.scrollX += (this.inercia * delta) / 1000;
        this.inercia *= 0.92;
      }
      return;
    }
    if (this.etapa !== "crawl") return;

    if (!this.pausado) {
      const acelerado = this.cursors.down.isDown || this.input.activePointer.isDown;
      this.cartaCont.y -= (VELOCIDADE_CRAWL * (acelerado ? 2 : 1) * delta) / 1000;
    }

    // perspectiva pixel-friendly: 3 faixas de alpha conforme sobe
    for (const linha of this.linhas) {
      const y = this.cartaCont.y + linha.yLocal;
      if (y < 22) linha.obj.setAlpha(0);
      else if (y < 58) linha.obj.setAlpha(0.4);
      else if (y < 116) linha.obj.setAlpha(0.7);
      else linha.obj.setAlpha(1);
    }

    if (this.cartaCont.y + this.alturaTotal < 16) this.fimDoCrawl();
  }

  // ---------- depois do crawl ----------

  private fimDoCrawl(): void {
    this.etapa = "silencio";
    this.cartaCont.destroy();
    // 2 segundos de silêncio, só com o céu
    this.time.delayedCall(2000, () => this.fogos());
  }

  private fogos(): void {
    this.etapa = "fogos";
    const explosoes: Array<[number, number, number]> = [
      [92, 52, 0xff7aa2],
      [228, 40, 0x4fd6c4],
      [160, 68, 0xe9b44c],
      [66, 84, 0xff7aa2],
      [258, 78, 0xf2f0f7],
    ];
    explosoes.forEach(([x, y, cor], i) => {
      this.time.delayedCall(i * 750, () => this.explosao(x, y, cor));
    });
    this.time.delayedCall(explosoes.length * 750 + 900, () => this.mensagem());
  }

  /** Círculo de partículas expandindo — fogos em pixels duros. */
  private explosao(x: number, y: number, cor: number): void {
    const clarao = this.add.rectangle(x, y, 3, 3, 0xffffff).setDepth(8);
    this.tweens.add({ targets: clarao, alpha: 0, duration: 200, onComplete: () => clarao.destroy() });
    const N = 14;
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * Math.PI * 2;
      const dist = Phaser.Math.Between(18, 26);
      const p = this.add.rectangle(x, y, 2, 2, cor).setDepth(8);
      this.tweens.add({
        targets: p,
        x: x + Math.round(Math.cos(ang) * dist),
        y: y + Math.round(Math.sin(ang) * dist) + 5, // caem um pouco
        alpha: 0,
        duration: Phaser.Math.Between(650, 850),
        ease: "Quad.easeOut",
        onComplete: () => p.destroy(),
      });
    }
  }

  private mensagem(): void {
    this.etapa = "mensagem";
    const fim1 = this.add
      .text(GAME_WIDTH / 2, 72, falaSegura(DIALOGOS.final.fim1), {
        fontFamily: UI.fonte,
        fontSize: FONT_MD,
        color: "#f2f0f7",
        align: "center",
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(0);
    const fim2 = this.add
      .text(GAME_WIDTH / 2, 106, falaSegura(DIALOGOS.final.fim2), {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.rosaGabitcha,
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(0);
    this.tweens.add({ targets: fim1, alpha: 1, duration: 900 });
    this.tweens.add({ targets: fim2, alpha: 1, duration: 900, delay: 900 });

    this.time.delayedCall(4000, () => this.botao([fim1, fim2]));
  }

  private botao(mensagens: Phaser.GameObjects.Text[]): void {
    this.etapa = "botao";
    const botao = this.add
      .text(GAME_WIDTH / 2, 138, DIALOGOS.final.botao, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.rosaGabitcha,
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({ targets: botao, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });

    const avancar = () => {
      this.input.keyboard?.off("keydown-SPACE", avancar);
      this.input.off("pointerdown", avancar);
      // com fotos carregadas, o ESPAÇO leva ao MURAL; sem, direto ao fim
      if (this.fotoKeys.length > 0) this.irParaMural([...mensagens, botao]);
      else this.telaFinal([...mensagens, botao]);
    };
    this.input.keyboard?.once("keydown-SPACE", avancar);
    this.input.once("pointerdown", avancar);
  }

  // ---------- mural de fotos reais ----------

  /** Busca o manifest e carrega as fotos com filtro LINEAR (só nelas). */
  private carregarFotosReais(): void {
    fetch("us/manifest.json")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((nomes: unknown) => {
        if (!Array.isArray(nomes) || nomes.length === 0) return;
        nomes.forEach((nome, i) =>
          this.load.image(`fotoReal-${i}`, `us/${encodeURIComponent(String(nome))}`)
        );
        this.load.once(Phaser.Loader.Events.COMPLETE, () => {
          nomes.forEach((_, i) => {
            const key = `fotoReal-${i}`;
            if (!this.textures.exists(key)) return;
            // as fotos reais ficam SUAVES dentro das molduras pixeladas
            this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
            this.fotoKeys.push(key);
          });
        });
        this.load.start();
      });
  }

  private irParaMural(remover: Phaser.GameObjects.GameObject[]): void {
    this.etapa = "mural";
    this.cameras.main.fadeOut(450, 16, 18, 35);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      remover.forEach((o) => o.destroy());
      this.silhuetas.forEach((o) => o.destroy());
      this.silhuetas = [];
      this.montarMural();
      this.cameras.main.fadeIn(500, 16, 18, 35);
    });
  }

  private montarMural(): void {
    const n = this.fotoKeys.length;
    const colunas = Math.ceil(n / 2);
    const largura = Math.max(GAME_WIDTH, 64 + colunas * 74 + 56);
    const cam = this.cameras.main;
    cam.setBounds(0, 0, largura, GAME_HEIGHT);
    cam.setScroll(0, 0);

    // parede aconchegante com textura sutil de 1px
    const parede = this.add.graphics().setDepth(15);
    parede.fillStyle(0x5a4050, 1);
    parede.fillRect(0, 0, largura, GAME_HEIGHT);
    parede.fillStyle(0x64485a, 1);
    for (let px = 0; px < largura; px += 7) {
      for (let py = 3; py < GAME_HEIGHT - 14; py += 9) {
        if ((px * 5 + py * 3) % 4 === 0) parede.fillRect(px + ((py * 7) % 5), py, 1, 1);
      }
    }
    parede.fillStyle(0x3a2a30, 1);
    parede.fillRect(0, GAME_HEIGHT - 12, largura, 12); // rodapé
    parede.fillStyle(0x6a4e5c, 1);
    parede.fillRect(0, GAME_HEIGHT - 13, largura, 1);
    this.muralObjs.push(parede);

    // varal de luzinhas fada no topo
    const fio = this.add.graphics().setDepth(16);
    fio.fillStyle(0x2a1a22, 1);
    for (let px = 0; px < largura; px += 12) {
      fio.fillRect(px, 10 + (Math.floor(px / 12) % 2), 12, 1); // fio com quedinha
    }
    this.muralObjs.push(fio);
    const lampadas: Phaser.GameObjects.Rectangle[] = [];
    const coresLuz = [0xe9b44c, 0xff7aa2, 0x4fd6c4];
    for (let px = 16; px < largura - 8; px += 24) {
      const luz = this.add
        .rectangle(px, 15, 3, 3, coresLuz[(px / 24) % coresLuz.length | 0])
        .setDepth(16);
      lampadas.push(luz);
      this.muralObjs.push(luz);
    }
    let fase = 0;
    const piscar = this.time.addEvent({
      delay: 600,
      loop: true,
      callback: () => {
        fase++;
        lampadas.forEach((l, i) => l.setAlpha((i + fase) % 2 === 0 ? 1 : 0.25));
      },
    });
    this.muralLimpeza.push(() => piscar.remove());

    // as polaroids "penduram" uma a uma (a parede se monta na frente dela)
    this.fotoKeys.forEach((key, i) => {
      const preset = PRESETS_POLAROID[i % PRESETS_POLAROID.length];
      const col = Math.floor(i / 2);
      const linha = i % 2;
      const x = 64 + col * 74 + ((i * 13) % 9) - 4;
      const y =
        (linha === 0 ? 62 : 126) + ((i * 7) % 7) - 3 + (i % 2 === 0 ? -2 : 2); // inclinação simulada
      const cont = this.criarPolaroid(key, preset, 1);
      cont.setPosition(x, y - 8).setDepth(20 + i).setAlpha(0);
      this.muralObjs.push(cont);

      this.time.delayedCall(400 + i * 80, () => {
        cont.setAlpha(1);
        this.tweens.add({ targets: cont, y: y, duration: 170, ease: "Back.easeOut" }); // cai 4px + settle
      });

      // hover: cresce para escala 2 (inteira) e vem pra frente
      cont.setSize(preset.w, preset.h);
      cont.setInteractive({ useHandCursor: true });
      cont.on("pointerover", () => {
        if (this.etapa !== "mural" || this.input.activePointer.isDown) return;
        this.tweens.add({ targets: cont, scale: 2, duration: 120 }); // transitório
        cont.setDepth(48);
      });
      cont.on("pointerout", () => {
        this.tweens.add({ targets: cont, scale: 1, duration: 120 });
        cont.setDepth(20 + i);
      });
      cont.on("pointerup", () => {
        if (this.etapa === "mural" && this.dragMoveu < 8) this.focar(key, preset);
      });
    });

    // HUD do mural
    const titulo = this.add
      .text(GAME_WIDTH / 2, 26, falaSegura(DIALOGOS.final.mural.titulo), {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: "#f0e6c8",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(60)
      .setAlpha(0);
    this.time.delayedCall(400 + n * 80 + 300, () => {
      this.tweens.add({ targets: titulo, alpha: 0.9, duration: 600 });
    });
    const contador = this.add
      .text(6, GAME_HEIGHT - 10, `${n} ${falaSegura(DIALOGOS.final.mural.memorias)}`, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.rosaGabitcha,
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(60);
    const sair = this.add
      .text(GAME_WIDTH - 6, GAME_HEIGHT - 10, DIALOGOS.final.mural.sair, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
      })
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(60)
      .setAlpha(0.75)
      .setInteractive({ useHandCursor: true });
    sair.on("pointerup", () => {
      if (this.etapa === "mural" && this.dragMoveu < 8) this.encerrarMural();
    });
    this.muralObjs.push(titulo, contador, sair);

    // ARRASTAR desloca a câmera (com inércia); clique curto = foco
    const aoMover = (p: Phaser.Input.Pointer) => {
      if (this.etapa !== "mural" || !p.isDown) return;
      const dx = p.position.x - p.prevPosition.x;
      this.cameras.main.scrollX -= dx;
      this.dragMoveu += Math.abs(dx);
      this.inercia = -dx * 55; // px/s aproximado, decai no update
    };
    const aoDescer = () => {
      this.dragMoveu = 0;
      this.inercia = 0;
    };
    this.input.on("pointermove", aoMover);
    this.input.on("pointerdown", aoDescer);
    this.muralLimpeza.push(() => {
      this.input.off("pointermove", aoMover);
      this.input.off("pointerdown", aoDescer);
    });

    // ESC: sai do foco, ou encerra o mural
    const aoEsc = () => {
      if (this.etapa === "foco") this.sairDoFoco();
      else if (this.etapa === "mural") this.encerrarMural();
    };
    this.input.keyboard?.on("keydown-ESC", aoEsc);
    this.muralLimpeza.push(() => this.input.keyboard?.off("keydown-ESC", aoEsc));
  }

  /** Polaroid pixelada com foto real "cover" na janela (escala inteira). */
  private criarPolaroid(key: string, preset: PresetPolaroid, escala: number): Phaser.GameObjects.Container {
    const w = preset.w * escala;
    const h = preset.h * escala;
    const jw = (preset.w - 8) * escala;
    const jh = preset.jh * escala;
    const jy = -h / 2 + 4 * escala + jh / 2; // janela no topo, borda inferior grossa

    const g = this.add.graphics();
    g.fillStyle(0x2a1a22, 0.6);
    g.fillRect(-w / 2 + 2, -h / 2 + 2, w, h); // sombra dura de 2px
    g.fillStyle(0xb9b3a8, 1);
    g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle(0xf6f2e8, 1);
    g.fillRect(-w / 2 + escala, -h / 2 + escala, w - 2 * escala, h - 2 * escala);
    g.fillStyle(0x1d2140, 1);
    g.fillRect(-jw / 2, jy - jh / 2, jw, jh); // fundo da janela

    // foto em "cover" (crop central) — conteúdo LINEAR, moldura pixelada
    const img = this.add.image(0, jy, key);
    const fonte = this.textures.get(key).getSourceImage() as { width: number; height: number };
    const escalaFoto = Math.max(jw / fonte.width, jh / fonte.height);
    img.setScale(escalaFoto);
    const cw = jw / escalaFoto;
    const ch = jh / escalaFoto;
    img.setCrop((fonte.width - cw) / 2, (fonte.height - ch) / 2, cw, ch);

    return this.add.container(0, 0, [g, img]);
  }

  /** Modo foco: a polaroid centraliza AMPLIADA com fundo escurecido. */
  private focar(key: string, preset: PresetPolaroid): void {
    this.etapa = "foco";
    this.inercia = 0;
    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x06070f, 0.85)
      .setScrollFactor(0)
      .setDepth(80)
      .setInteractive();
    overlay.on("pointerup", () => this.sairDoFoco()); // clique fora volta

    const escala = Math.max(2, Math.floor(168 / preset.h)); // maior escala inteira que couber
    const grande = this.criarPolaroid(key, preset, escala);
    grande.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2).setScrollFactor(0).setDepth(85).setAlpha(0);
    grande.setSize(preset.w * escala, preset.h * escala);
    grande.setInteractive(); // absorve o clique em cima da foto (não fecha)
    this.tweens.add({ targets: grande, alpha: 1, duration: 160 });

    this.focoObjs = [overlay, grande];
  }

  private sairDoFoco(): void {
    this.focoObjs.forEach((o) => o.destroy());
    this.focoObjs = [];
    this.dragMoveu = 0;
    this.etapa = "mural";
  }

  /** Encerramento do mural → a tela de OBRIGADO POR JOGAR. */
  private encerrarMural(): void {
    this.muralLimpeza.forEach((f) => f());
    this.muralLimpeza = [];
    this.telaFinal(this.muralObjs);
  }

  /** A tela que fica para sempre (ESC volta ao título, se quiser rejogar). */
  private telaFinal(remover: Phaser.GameObjects.GameObject[]): void {
    this.etapa = "telaFinal";
    this.cameras.main.fadeOut(500, 16, 18, 35);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      remover.forEach((o) => o.destroy());
      this.silhuetas.forEach((o) => o.destroy());
      this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.cameras.main.setScroll(0, 0);
      const cx = GAME_WIDTH / 2;

      // título como na tela inicial (sombra dura, sem blur)
      this.add
        .text(cx + 2, 36, DIALOGOS.telaInicial.titulo, {
          fontFamily: UI.fonte,
          fontSize: FONT_LG,
          color: "#3a1d4d",
        })
        .setOrigin(0.5)
        .setDepth(10);
      this.add
        .text(cx, 34, DIALOGOS.telaInicial.titulo, {
          fontFamily: UI.fonte,
          fontSize: FONT_LG,
          color: UI.rosaGabitcha,
        })
        .setOrigin(0.5)
        .setDepth(10);
      this.add
        .text(cx, 54, DIALOGOS.telaInicial.subtitulo, {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: UI.texto,
        })
        .setOrigin(0.5)
        .setDepth(10);

      // os três, grandes (escala inteira 2x)
      const gab = this.add.image(cx - 56, 104, "gabitcha").setScale(2).setDepth(10);
      const raf = this.add.image(cx + 56, 104, "rafitcho").setScale(2).setDepth(10);
      const pug = this.add.image(cx, 122, "yuumitcha").setScale(2).setDepth(10);
      this.tweens.add({
        targets: gab,
        y: 100,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.tweens.add({
        targets: raf,
        y: 100,
        duration: 500,
        yoyo: true,
        repeat: -1,
        delay: 250,
        ease: "Sine.easeInOut",
      });
      this.tweens.add({
        targets: pug,
        y: 116,
        duration: 320,
        yoyo: true,
        repeat: -1,
        ease: "Quad.easeOut",
      });

      const obrigado = this.add
        .text(cx, 166, DIALOGOS.final.obrigado, {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: UI.douradoYuumitcha,
        })
        .setOrigin(0.5)
        .setDepth(10);
      this.tweens.add({ targets: obrigado, alpha: 0.4, duration: 900, yoyo: true, repeat: -1 });

      chuvaDeCoracoes(this, { intervalo: 800, depth: 1 });

      this.input.keyboard?.on("keydown-ESC", () => fadeToScene(this, "Boot"));
      this.cameras.main.fadeIn(600, 16, 18, 35);
    });
  }

  /** Lua com halo em círculos concêntricos (bordas duras, como no Boot). */
  private criarLua(): void {
    const luaX = GAME_WIDTH - 38;
    const luaY = 26;
    this.add.circle(luaX, luaY, 13, 0xfff3cf, 0.07).setDepth(-9);
    const halo = this.add.circle(luaX, luaY, 10, 0xfff3cf, 0.16).setDepth(-9);
    this.add.circle(luaX, luaY, 7, 0xfff3cf).setDepth(-9);
    this.add.circle(luaX - 2, luaY - 2, 2, 0xe8dcb8).setDepth(-9).setAlpha(0.6);
    this.add.circle(luaX + 2, luaY + 3, 1, 0xe8dcb8).setDepth(-9).setAlpha(0.5);
    this.tweens.add({ targets: halo, alpha: 0.32, duration: 2200, yoyo: true, repeat: -1 });
  }

  private criarTexturas(): void {
    createTextureFromData(this, "silGab", { palette: SIL_PALETTE, grid: GAB_COSTAS });
    createTextureFromData(this, "silRaf", { palette: SIL_PALETTE, grid: RAF_COSTAS });
    createTextureFromData(this, "silYuumi", { palette: SIL_PALETTE, grid: YUUMI_COSTAS });
  }
}
