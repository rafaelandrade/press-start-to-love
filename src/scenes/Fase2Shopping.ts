import Phaser from "phaser";
import { DIALOGOS, falaSegura } from "../dialogos";
import { UI, GAME_WIDTH, GAME_HEIGHT, FONT_SM, FONT_MD } from "../ui/constants";
import { fadeIn, fadeToScene } from "../ui/transitions";
import { TouchControls } from "../ui/TouchControls";
import { Balao } from "../ui/Balao";
import { Marquee } from "../ui/Marquee";
import { createTextureFromData } from "../sprites/factory";
import { RAFITCHO } from "../sprites/data";
import { atualizarAndar } from "../sprites/anims";
import type { SpriteData } from "../sprites/data";

/**
 * Fase 2 — "O Shopping do Caos"
 * Clientes pedem uma estação via MINI-BALÃO DE ÍCONE (cabide/cifrão/cortina)
 * cuja borda é o timer de paciência (branca → amarela → vermelha piscando).
 * Balão de texto: no máximo UM na tela (atendido > chefe > colega).
 * Colegas de uniforme teal-água + crachá enrolam nas estações (zZz) e
 * bloqueiam com a placa OCUPADO. 3 corações perdidos = DEMISSÃO (game over).
 */

const VELOCIDADE_GABITCHA = 160;
const GABITCHA_Y = GAME_HEIGHT - 32;

const ESTACOES_X = [56, 160, 264];
const CORES_ESTACOES = [0xff7aa2, 0xe9b44c, 0x4fd6c4]; // arara, caixa, provador
const ZONA_ESTACAO = 18;
const TEMPO_ATENDIMENTO = 1000;

const META_CLIENTES = 12;
const TEMPO_MAXIMO_MS = 90000;
// densidade menor; dificuldade vem de paciência curta + spawn rápido
const INTERVALO_SPAWN_INICIAL = 2800;
const INTERVALO_SPAWN_MINIMO = 1100;
const MAX_CLIENTES = 4;
const MAX_FILA = 2;
const ESPACO_FILA = 24; // espaçamento mínimo entre clientes
const PACIENCIA_MS = 9000;

// cor exclusiva do uniforme dos colegas (nenhum cliente usa)
const UNIFORME_LOJA = { escuro: 0x1f5a54, base: 0x3a9c92, claro: 0x5cc4b8 };

// ------------------------------------------------------------
// NPCs 32x48 derivados do grid do Rafitcho (óculos vira sobrancelha,
// sem estampa/tatuagem); variações são recolor de paleta.
// ------------------------------------------------------------

function sobrepor(linha: string, col: number, trecho: string): string {
  return linha.slice(0, col) + trecho + linha.slice(col + trecho.length);
}

const PESSOA_GRID = RAFITCHO.grid.map((linha, i) => {
  if (i === 11) return linha.replace(/G/g, "k");
  return linha.replace(/G/g, "s").replace(/P/g, "t").replace(/T/g, "t");
});

// 1 frame de impaciência: pé esquerdo levantado 1px (batendo o pé)
const PESSOA_IMPACIENTE_GRID = (() => {
  const g = [...PESSOA_GRID];
  g[43] = sobrepor(g[43], 9, "vWWWwv");
  g[45] = sobrepor(g[45], 8, "vWWWWwv");
  g[46] = sobrepor(g[46], 8, "vvvvvvv");
  g[47] = sobrepor(g[47], 8, ".......");
  return g;
})();

// Colega: mesmo grid + crachá branco 2x3 no peito
const COLEGA_GRID = (() => {
  const g = [...PESSOA_GRID];
  for (const r of [24, 25, 26]) g[r] = sobrepor(g[r], 10, "cc");
  return g;
})();

// A chefe: coque, sobrancelha em V, boca séria, blazer e prancheta
const CHEFE_GRID = (() => {
  const g = [...PESSOA_GRID];
  g[0] = ".".repeat(14) + "khhk" + ".".repeat(14);
  g[1] = ".".repeat(13) + "khhhhk" + ".".repeat(13);
  g[12] = sobrepor(sobrepor(g[12], 14, "k"), 17, "k");
  g[17] = sobrepor(g[17], 12, "ssMMMMss");
  g[18] = sobrepor(g[18], 13, "ssssss");
  g[26] = sobrepor(g[26], 27, "vvv");
  for (let r = 27; r <= 33; r++) g[r] = sobrepor(g[r], 26, "accca");
  g[34] = sobrepor(g[34], 26, "aaaaa");
  return g;
})();

const PELE_CLARA = { d: "#c68a62", s: "#e0a87c", S: "#f0c49a" };
const PELE_MORENA = { d: "#7d5430", s: "#a5713f", S: "#c08d55" };

function palettePessoa(
  cabelo: [string, string, string],
  pele: { d: string; s: string; S: string },
  camisa: [string, string, string]
): Record<string, string> {
  return {
    k: cabelo[0],
    h: cabelo[1],
    H: cabelo[2],
    ...pele,
    W: "#ffffff",
    I: "#5a3a22",
    p: "#1a0f08",
    M: "#5a2a2a",
    R: "#c96a55",
    o: camisa[0],
    t: camisa[1],
    u: camisa[2],
    j: "#1c2236",
    J: "#2c3854",
    y: "#40507a",
    v: "#6b7080",
    w: "#c2c6d0",
  };
}

// Clientes NUNCA usam o teal-água do uniforme da loja
const VARIACOES_CLIENTE: Record<string, string>[] = [
  palettePessoa(["#1a1114", "#2e1d22", "#4a3038"], PELE_CLARA, ["#5a1f28", "#a03448", "#c14a5a"]),
  palettePessoa(["#241812", "#4a3020", "#6b4a2f"], PELE_MORENA, ["#1a2a5a", "#31479c", "#4a63c4"]),
  palettePessoa(["#5a4318", "#8a6a2f", "#b08d3f"], PELE_CLARA, ["#2a1f4a", "#4a3a80", "#6a55a8"]),
  palettePessoa(["#3f3f4c", "#6a6a78", "#8a8a98"], PELE_MORENA, ["#6b4a14", "#b8801f", "#d9a441"]),
];

const PALETTE_COLEGA: Record<string, string> = {
  ...palettePessoa(["#1a1114", "#2e1d22", "#4a3038"], PELE_MORENA, [
    "#1f5a54",
    "#3a9c92",
    "#5cc4b8",
  ]),
  c: "#f2f0f7", // crachá
};

const CHEFE_DATA: SpriteData = {
  palette: {
    k: "#141014",
    h: "#241c22",
    H: "#3a2e38",
    ...PELE_CLARA,
    W: "#ffffff",
    I: "#4a2a30",
    p: "#1a0f08",
    M: "#5a2a2a",
    R: "#c96a55",
    o: "#101018",
    t: "#232538",
    u: "#3a3d5c",
    j: "#1a1526",
    J: "#2a2338",
    y: "#3a3350",
    v: "#3f4560",
    w: "#9aa0b8",
    a: "#c9a873",
    c: "#f2f0f7",
  },
  grid: CHEFE_GRID,
};

// Ícones dos pedidos (mesmas cores dos letreiros das estações)
const ICONE_CABIDE = ["...XX...", "...X....", "..XXX...", ".X...X..", "X.....X.", "XXXXXXXX"];
const ICONE_CIFRAO = ["..X..", ".XXXX", "X.X..", ".XXX.", "..X.X", "XXXX.", "..X.."];
const ICONE_CORTINA = ["XXXXXXXX", "X.X..X.X", "X.X..X.X", "X.X..X.X", "X.X..X.X"];
const ICONES_ESTACOES = ["iconeArara", "iconeCaixa", "iconeProvador"];

// Ponteiro do relógio (12px) — 8 direções em pixels duros
const PONTEIRO_DIRECOES: number[][][] = [
  [[0, -2], [0, -3], [0, -4]],
  [[1, -1], [2, -2], [3, -3]],
  [[2, 0], [3, 0], [4, 0]],
  [[1, 1], [2, 2], [3, 3]],
  [[0, 2], [0, 3]],
  [[-1, 1], [-2, 2]],
  [[-2, 0], [-3, 0], [-4, 0]],
  [[-1, -1], [-2, -2]],
];

interface Pedido {
  cont: Phaser.GameObjects.Container;
  borda: Phaser.GameObjects.Rectangle;
  rabinho: Phaser.GameObjects.Rectangle;
}

interface Cliente {
  sprite: Phaser.GameObjects.Image;
  pedido: Pedido | null;
  estagio: "branca" | "amarela" | "vermelha";
  variante: number;
  falou: boolean;
  estacao: number;
  baseX: number;
  espera: number;
  estado: "entrando" | "esperando" | "saindo";
}

type DonoBalao = "atendimento" | "chefe" | "colega";
const PRIORIDADE_BALAO: Record<DonoBalao, number> = { atendimento: 3, chefe: 2, colega: 1 };

export class Fase2Shopping extends Phaser.Scene {
  private gabitcha!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private teclasAD!: { A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private espaco!: Phaser.Input.Keyboard.Key;
  private touch!: TouchControls;
  private balao!: Balao;

  private clientes: Cliente[] = [];
  private filas: Cliente[][] = [[], [], []];
  private estacaoOcupadaPor: (Phaser.GameObjects.Image | null)[] = [null, null, null];
  private placasOcupado: Phaser.GameObjects.Container[] = [];
  private colegas: Phaser.GameObjects.Image[] = [];

  private balaoAtual: {
    cont: Phaser.GameObjects.Container;
    prioridade: number;
    timer: Phaser.Time.TimerEvent;
  } | null = null;

  private vidasTexto!: Phaser.GameObjects.Text;
  private clientesTexto!: Phaser.GameObjects.Text;
  private barraAtendimento!: Phaser.GameObjects.Graphics;
  private ponteiro!: Phaser.GameObjects.Graphics;
  private relogio!: Phaser.GameObjects.Container;
  private passoRelogio = 0;

  private vidas = 3;
  private atendidos = 0;
  private intervaloSpawn = INTERVALO_SPAWN_INICIAL;
  private progresso = 0;
  private estacaoAnterior = -1;
  private jogando = false;
  private emCena = false;
  private terminando = false;
  private chefeAtiva = false;
  private ultimaDirecao = 0;

  constructor() {
    super("Fase2Shopping");
  }

  create(): void {
    this.clientes = [];
    this.filas = [[], [], []];
    this.estacaoOcupadaPor = [null, null, null];
    this.placasOcupado = [];
    this.colegas = [];
    this.balaoAtual = null;
    this.vidas = 3;
    this.atendidos = 0;
    this.intervaloSpawn = INTERVALO_SPAWN_INICIAL;
    this.progresso = 0;
    this.estacaoAnterior = -1;
    this.jogando = false;
    this.emCena = false;
    this.terminando = false;
    this.chefeAtiva = false;
    this.ultimaDirecao = 0;
    this.passoRelogio = 0;

    fadeIn(this);
    this.cameras.main.setBackgroundColor(0x30354e);
    this.criarTexturas();
    this.criarCenario();
    this.criarHud();

    this.gabitcha = this.physics.add.sprite(GAME_WIDTH / 2, GABITCHA_Y, "gabitcha");
    (this.gabitcha.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.gabitcha.setCollideWorldBounds(true);
    this.gabitcha.setDepth(10);
    this.retomarBob();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.teclasAD = this.input.keyboard!.addKeys("A,D") as {
      A: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
    };
    this.espaco = this.input.keyboard!.addKey("SPACE");
    this.touch = new TouchControls(this);
    this.balao = new Balao(this);
    this.barraAtendimento = this.add.graphics().setDepth(30);

    // letreiro marquee anuncia a fase; instruções só depois dele sair
    new Marquee(this).mostrar(DIALOGOS.fase2.titulo, () => this.mostrarInstrucoes());
  }

  private pararBob(): void {
    this.tweens.killTweensOf(this.gabitcha);
    this.gabitcha.setScale(1).setY(GABITCHA_Y);
  }

  private retomarBob(): void {
    this.tweens.add({
      targets: this.gabitcha,
      y: GABITCHA_Y - 2,
      duration: 350,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  // ---------- fluxo ----------

  private mostrarInstrucoes(): void {
    const painel = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 4, 272, 76, 0x0b0d1a, 0.82)
      .setStrokeStyle(1, UI.linha)
      .setDepth(59);
    const instrucao = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 22, DIALOGOS.fase2.instrucao, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.douradoYuumitcha,
        align: "center",
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setDepth(60);
    const controles = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 2, DIALOGOS.fase2.controles, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
        align: "center",
        lineSpacing: 4,
      })
      .setOrigin(0.5)
      .setDepth(60);
    const comecar = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 24, DIALOGOS.fase2.comecar, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setAlpha(0.7);
    this.tweens.add({ targets: comecar, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });

    const iniciar = () => {
      [painel, instrucao, controles, comecar].forEach((o) => o.destroy());
      this.jogando = true;
      this.agendarSpawn();
      this.iniciarRelogio();
      this.iniciarChefe();
      this.iniciarSuor();
      this.criarColegas();
      this.time.addEvent({
        delay: 15000,
        loop: true,
        callback: () => {
          if (!this.terminando) {
            this.intervaloSpawn = Math.max(INTERVALO_SPAWN_MINIMO, this.intervaloSpawn - 450);
          }
        },
      });
      this.time.delayedCall(TEMPO_MAXIMO_MS, () => this.finalizarFase());
    };
    this.input.once("pointerdown", iniciar);
    this.input.keyboard?.once("keydown-SPACE", iniciar);
  }

  update(time: number, delta: number): void {
    if (!this.jogando || this.terminando) return;

    let direcao = 0;
    if (this.emCena) {
      this.gabitcha.setVelocityX(0);
      atualizarAndar(this.gabitcha, "gabitcha", false);
    } else {
      const esquerda = this.cursors.left.isDown || this.teclasAD.A.isDown || this.touch.esquerda;
      const direita = this.cursors.right.isDown || this.teclasAD.D.isDown || this.touch.direita;
      direcao = esquerda ? -1 : direita ? 1 : 0;
      if (esquerda) {
        this.gabitcha.setVelocityX(-VELOCIDADE_GABITCHA);
        this.gabitcha.setFlipX(true);
      } else if (direita) {
        this.gabitcha.setVelocityX(VELOCIDADE_GABITCHA);
        this.gabitcha.setFlipX(false);
      } else {
        this.gabitcha.setVelocityX(0);
      }
      if (direcao !== 0 && direcao !== this.ultimaDirecao) this.aplicarSquash();
      this.ultimaDirecao = direcao;
      atualizarAndar(this.gabitcha, "gabitcha", direcao !== 0);
    }

    // atendimento
    const estacao = ESTACOES_X.findIndex((ex) => Math.abs(this.gabitcha.x - ex) <= ZONA_ESTACAO);
    const ocupada = estacao >= 0 && this.estacaoOcupadaPor[estacao] !== null;
    const alvo = estacao >= 0 ? this.filas[estacao][0] : undefined;
    const atendendo =
      !this.emCena &&
      !ocupada &&
      alvo !== undefined &&
      alvo.estado === "esperando" &&
      (this.espaco.isDown || direcao === 0);

    if (estacao !== this.estacaoAnterior) this.progresso = 0;
    this.estacaoAnterior = estacao;

    if (atendendo) {
      // o cliente solta a fala engraçada quando o atendimento começa
      if (!alvo.falou) {
        alvo.falou = true;
        const falas = DIALOGOS.fase2.clientes;
        this.mostrarBalaoTexto(
          alvo.sprite.x,
          alvo.sprite.y - 24,
          falaSegura(falas[Phaser.Math.Between(0, falas.length - 1)]),
          "atendimento",
          2400
        );
      }
      this.progresso += delta;
      if (this.progresso >= TEMPO_ATENDIMENTO) {
        this.progresso = 0;
        this.atenderCliente(estacao);
      }
    } else {
      this.progresso = 0;
    }
    this.desenharBarra(estacao, atendendo);

    // paciência: a borda do ícone é o timer (branca → amarela → vermelha)
    for (const c of [...this.clientes]) {
      if (c.estado !== "esperando") continue;
      if (c === alvo && atendendo) continue;
      c.espera += delta;
      this.atualizarEstagio(c);
      if (c.estagio === "vermelha") {
        // 1 frame de impaciência: batendo o pé
        const chave =
          Math.floor(time / 180) % 2 === 0
            ? `cliente32_${c.variante}_imp`
            : `cliente32_${c.variante}`;
        if (c.sprite.texture.key !== chave) c.sprite.setTexture(chave);
      }
      if (c.espera > PACIENCIA_MS) this.explodirCliente(c);
    }
  }

  private atualizarEstagio(c: Cliente): void {
    const frac = c.espera / PACIENCIA_MS;
    if (frac >= 0.7 && c.estagio !== "vermelha") {
      c.estagio = "vermelha";
      if (c.pedido) {
        c.pedido.borda.setFillStyle(0xff4a5a);
        c.pedido.rabinho.setFillStyle(0xff4a5a);
        this.tweens.add({
          targets: [c.pedido.borda, c.pedido.rabinho],
          alpha: 0.25,
          duration: 200,
          yoyo: true,
          repeat: -1,
        });
      }
    } else if (frac >= 0.4 && c.estagio === "branca") {
      c.estagio = "amarela";
      c.pedido?.borda.setFillStyle(0xe9b44c);
      c.pedido?.rabinho.setFillStyle(0xe9b44c);
    }
  }

  private aplicarSquash(): void {
    this.gabitcha.setScale(1);
    this.tweens.add({
      targets: this.gabitcha,
      scaleX: 1.15, // tween transitório de animação (exceção permitida)
      scaleY: 0.85,
      duration: 70,
      yoyo: true,
      onComplete: () => this.gabitcha.setScale(1),
    });
  }

  // ---------- clientes ----------

  private agendarSpawn(): void {
    if (this.terminando) return;
    this.time.delayedCall(this.intervaloSpawn, () => {
      if (this.terminando) return;
      if (!this.emCena && this.clientes.length < MAX_CLIENTES) this.spawnCliente();
      this.agendarSpawn();
    });
  }

  /** Fila em diagonal com espaçamento mínimo de 24px. */
  private posicaoSlot(estacao: number, slot: number): { x: number; y: number } {
    const dir = estacao === 2 ? -1 : 1;
    return {
      x: ESTACOES_X[estacao] + dir * (28 + slot * ESPACO_FILA),
      y: GABITCHA_Y - slot * 6,
    };
  }

  private spawnCliente(): void {
    const livres = [0, 1, 2].filter((e) => this.filas[e].length < MAX_FILA);
    if (livres.length === 0) return;
    const estacao = livres[Phaser.Math.Between(0, livres.length - 1)];
    const slot = this.filas[estacao].length;
    const destino = this.posicaoSlot(estacao, slot);

    const variante = Phaser.Math.Between(0, VARIACOES_CLIENTE.length - 1);
    const sprite = this.add
      .image(destino.x < GAME_WIDTH / 2 ? -20 : GAME_WIDTH + 20, destino.y, `cliente32_${variante}`)
      .setDepth(8 - slot);
    sprite.setFlipX(destino.x < sprite.x);

    const cliente: Cliente = {
      sprite,
      pedido: null,
      estagio: "branca",
      variante,
      falou: false,
      estacao,
      baseX: destino.x,
      espera: 0,
      estado: "entrando",
    };
    this.clientes.push(cliente);
    this.filas[estacao].push(cliente);

    const bob = this.tweens.add({
      targets: sprite,
      y: destino.y - 2,
      duration: 200,
      yoyo: true,
      repeat: -1,
    });
    this.tweens.add({
      targets: sprite,
      x: destino.x,
      duration: (Math.abs(destino.x - sprite.x) / 80) * 1000,
      ease: "Linear",
      onComplete: () => {
        bob.stop();
        sprite.setY(destino.y);
        cliente.estado = "esperando";
        this.criarPedido(cliente); // ícone da estação, sem balão de texto
      },
    });
  }

  /** Mini-balão de ícone 12x12: borda = timer de paciência. */
  private criarPedido(cliente: Cliente): void {
    const borda = this.add.rectangle(0, 0, 12, 12, 0xffffff);
    const miolo = this.add.rectangle(0, 0, 10, 10, 0x1d2140);
    const icone = this.add.image(0, 0, ICONES_ESTACOES[cliente.estacao]);
    const rabinho = this.add.rectangle(0, 7, 2, 2, 0xffffff);
    const cont = this.add
      .container(cliente.baseX, cliente.sprite.y - 34, [rabinho, borda, miolo, icone])
      .setDepth(12);
    cliente.pedido = { cont, borda, rabinho };
  }

  private atenderCliente(estacao: number): void {
    const cliente = this.filas[estacao].shift();
    if (!cliente) return;
    cliente.estado = "saindo";
    cliente.pedido?.cont.destroy();
    cliente.pedido = null;
    cliente.sprite.setTexture(`cliente32_${cliente.variante}`);
    if (this.balaoAtual?.prioridade === PRIORIDADE_BALAO.atendimento) {
      this.fecharBalaoTexto(true);
    }

    const coracao = this.add
      .image(cliente.sprite.x, cliente.sprite.y - 30, "coracaoMini")
      .setDepth(12);
    this.tweens.add({
      targets: coracao,
      y: coracao.y - 12,
      alpha: 0,
      duration: 600,
      onComplete: () => coracao.destroy(),
    });

    const saidaX = cliente.sprite.x < GAME_WIDTH / 2 ? -20 : GAME_WIDTH + 20;
    cliente.sprite.setFlipX(saidaX < cliente.sprite.x);
    this.tweens.add({
      targets: cliente.sprite,
      x: saidaX,
      y: GABITCHA_Y,
      duration: 900,
      ease: "Linear",
      onComplete: () => this.removerCliente(cliente),
    });

    this.reacomodarFila(estacao);
    this.atendidos++;
    this.atualizarHud();
    if (this.atendidos >= META_CLIENTES) this.finalizarFase();
  }

  private explodirCliente(cliente: Cliente): void {
    for (let i = 0; i < 6; i++) {
      const p = this.add
        .rectangle(
          cliente.sprite.x + Phaser.Math.Between(-8, 8),
          cliente.sprite.y - Phaser.Math.Between(0, 20),
          2,
          2,
          0x8a8494
        )
        .setDepth(12);
      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(10, 20),
        alpha: 0,
        scale: 2,
        duration: Phaser.Math.Between(350, 550),
        onComplete: () => p.destroy(),
      });
    }
    const estacao = cliente.estacao;
    this.filas[estacao] = this.filas[estacao].filter((c) => c !== cliente);
    this.removerCliente(cliente);
    this.reacomodarFila(estacao);
    this.perderCoracao();
  }

  private removerCliente(cliente: Cliente): void {
    cliente.pedido?.cont.destroy();
    this.tweens.killTweensOf(cliente.sprite);
    cliente.sprite.destroy();
    this.clientes = this.clientes.filter((c) => c !== cliente);
  }

  private reacomodarFila(estacao: number): void {
    this.filas[estacao].forEach((c, i) => {
      const pos = this.posicaoSlot(estacao, i);
      c.baseX = pos.x;
      c.sprite.setDepth(8 - i);
      this.tweens.add({ targets: c.sprite, x: pos.x, y: pos.y, duration: 300, ease: "Sine.easeOut" });
      if (c.pedido) {
        this.tweens.add({
          targets: c.pedido.cont,
          x: pos.x,
          y: pos.y - 34,
          duration: 300,
          ease: "Sine.easeOut",
        });
      }
    });
  }

  private perderCoracao(): void {
    this.vidas--;
    this.atualizarHud();
    this.cameras.main.shake(100, 0.004);
    this.cameras.main.flash(120, 255, 80, 80);
    if (this.vidas <= 0) this.demitida();
  }

  // ---------- a chefe (bronca = mini-cena que rouba tempo) ----------

  private iniciarChefe(): void {
    this.time.addEvent({
      delay: 22000,
      startAt: 10000,
      loop: true,
      callback: () => {
        if (!this.terminando && !this.chefeAtiva && !this.emCena) this.broncaDaChefe();
      },
    });
  }

  private entrarChefe(aoChegar: (chefe: Phaser.GameObjects.Image) => void): void {
    const lado = this.gabitcha.x < GAME_WIDTH / 2 ? 1 : -1;
    const entradaX = lado === 1 ? GAME_WIDTH + 24 : -24;
    const alvoX = Phaser.Math.Clamp(this.gabitcha.x + 44 * lado, 24, GAME_WIDTH - 24);

    const chefe = this.add.image(entradaX, GABITCHA_Y, "chefe").setDepth(11);
    chefe.setFlipX(lado === 1);
    const bob = this.tweens.add({
      targets: chefe,
      y: GABITCHA_Y - 2,
      duration: 180,
      yoyo: true,
      repeat: -1,
    });
    this.tweens.add({
      targets: chefe,
      x: alvoX,
      duration: 1000,
      ease: "Linear",
      onComplete: () => {
        bob.stop();
        chefe.setY(GABITCHA_Y);
        aoChegar(chefe);
      },
    });
  }

  private broncaDaChefe(): void {
    this.chefeAtiva = true;
    this.emCena = true;
    this.gabitcha.setVelocityX(0);

    this.entrarChefe((chefe) => {
      this.gabitcha.setFlipX(chefe.x < this.gabitcha.x);

      // exceção: bronca é cena pausada — balão grande pode dominar
      const broncas = DIALOGOS.fase2.broncasChefe;
      this.mostrarBalaoTexto(
        chefe.x,
        GABITCHA_Y - 24,
        falaSegura(broncas[Phaser.Math.Between(0, broncas.length - 1)]),
        "chefe",
        2600,
        248
      );
      this.time.delayedCall(500, () => this.chorar(1600));

      this.time.delayedCall(3000, () => {
        this.emCena = false;
        const saidaX = chefe.x > GAME_WIDTH / 2 ? GAME_WIDTH + 24 : -24;
        chefe.setFlipX(saidaX > chefe.x);
        this.tweens.add({
          targets: chefe,
          x: saidaX,
          duration: 1000,
          ease: "Linear",
          onComplete: () => {
            chefe.destroy();
            this.chefeAtiva = false;
            // PUNIÇÃO: paciência de todo mundo cai 30%
            for (const c of this.clientes) {
              if (c.estado === "esperando") {
                c.espera += (PACIENCIA_MS - c.espera) * 0.3;
              }
            }
          },
        });
      });
    });
  }

  // ---------- colegas que atrapalham ----------

  private criarColegas(): void {
    // placas OCUPADO na cor do uniforme (conexão visual com o causador)
    this.placasOcupado = ESTACOES_X.map((ex) => {
      const fundo = this.add
        .rectangle(0, 0, 64, 12, UNIFORME_LOJA.base)
        .setStrokeStyle(1, UNIFORME_LOJA.escuro);
      const texto = this.add
        .text(0, 0, DIALOGOS.fase2.ocupado, {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: "#ffffff",
        })
        .setOrigin(0.5);
      return this.add.container(ex, 98, [fundo, texto]).setDepth(12).setVisible(false);
    });

    this.time.delayedCall(3000, () => this.spawnColega());
    this.time.delayedCall(11000, () => this.spawnColega());
  }

  private spawnColega(): void {
    if (this.terminando) return;
    const daEsquerda = Math.random() < 0.5;
    const colega = this.add
      .image(daEsquerda ? -20 : GAME_WIDTH + 20, GABITCHA_Y, "colega")
      .setDepth(6);
    this.colegas.push(colega);
    this.cicloColega(colega);
  }

  private cicloColega(colega: Phaser.GameObjects.Image): void {
    if (this.terminando || !colega.active) return;
    const estacao = Phaser.Math.Between(0, 2);
    const destinoX = ESTACOES_X[estacao] + Phaser.Math.Between(-6, 6);
    colega.setFlipX(destinoX < colega.x);

    const bob = this.tweens.add({
      targets: colega,
      y: GABITCHA_Y - 2,
      duration: 200,
      yoyo: true,
      repeat: -1,
    });
    this.tweens.add({
      targets: colega,
      x: destinoX,
      duration: (Math.abs(destinoX - colega.x) / 55) * 1000,
      ease: "Linear",
      onComplete: () => {
        bob.stop();
        colega.setY(GABITCHA_Y);
        if (this.terminando || !colega.active) return;

        // ocupa a estação enrolando (emote em vez de balão)
        this.estacaoOcupadaPor[estacao] = colega;
        this.placasOcupado[estacao].setVisible(true);
        const emote = this.add
          .text(colega.x, GABITCHA_Y - 36, DIALOGOS.fase2.emoteColega, {
            fontFamily: UI.fonte,
            fontSize: FONT_SM,
            color: "#9aa0b8",
          })
          .setOrigin(0.5)
          .setDepth(12);
        this.tweens.add({
          targets: emote,
          y: GABITCHA_Y - 40,
          alpha: 0.4,
          duration: 700,
          yoyo: true,
          repeat: -1,
        });

        this.time.delayedCall(Phaser.Math.Between(2200, 3000), () => {
          emote.destroy();
          if (this.estacaoOcupadaPor[estacao] === colega) {
            this.estacaoOcupadaPor[estacao] = null;
            this.placasOcupado[estacao].setVisible(false);
          }
          if (this.terminando || !colega.active) return;

          if (Math.random() < 0.35) {
            const falas = DIALOGOS.fase2.colegas;
            this.mostrarBalaoTexto(
              colega.x,
              GABITCHA_Y - 24,
              falaSegura(falas[Phaser.Math.Between(0, falas.length - 1)]),
              "colega",
              2200
            );
            this.time.delayedCall(1200, () => {
              this.tweens.add({
                targets: colega,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                  this.colegas = this.colegas.filter((c) => c !== colega);
                  colega.destroy();
                  this.time.delayedCall(Phaser.Math.Between(7000, 12000), () =>
                    this.spawnColega()
                  );
                },
              });
            });
          } else {
            this.cicloColega(colega);
          }
        });
      },
    });
  }

  // ---------- choro (mesmo overlay da Fase 1) ----------

  private chorar(duracaoMs: number): void {
    this.criarTexturasChoro();
    this.pararBob();

    const rosto = this.add
      .image(this.gabitcha.x, this.gabitcha.y - 10, "gabiChoro0")
      .setDepth(this.gabitcha.depth + 1);
    let frame = 0;
    const alternador = this.time.addEvent({
      delay: 300,
      loop: true,
      callback: () => {
        frame = 1 - frame;
        rosto.setTexture(frame === 0 ? "gabiChoro0" : "gabiChoro1");
      },
    });
    let lado = -1;
    const lagrimas = this.time.addEvent({
      delay: 340,
      loop: true,
      callback: () => {
        lado = -lado;
        const l = this.add
          .rectangle(this.gabitcha.x + lado * 6, this.gabitcha.y - 8, 1, 2, 0x9fd4e8)
          .setDepth(this.gabitcha.depth + 1);
        this.tweens.add({
          targets: l,
          y: "+=12",
          alpha: 0,
          duration: 550,
          ease: "Quad.easeIn",
          onComplete: () => l.destroy(),
        });
      },
    });
    const gota = this.add
      .rectangle(this.gabitcha.x + 9, this.gabitcha.y - 20, 1, 2, 0x9fd4e8)
      .setDepth(this.gabitcha.depth + 1);
    this.tweens.add({
      targets: gota,
      x: gota.x + 6,
      y: gota.y - 6,
      alpha: 0,
      duration: 500,
      ease: "Quad.easeOut",
      onComplete: () => gota.destroy(),
    });

    if (duracaoMs > 0) {
      this.time.delayedCall(duracaoMs, () => {
        alternador.remove();
        lagrimas.remove();
        rosto.destroy();
        if (!this.terminando) this.retomarBob();
      });
    }
  }

  private criarTexturasChoro(): void {
    const desenhar = (key: string, frame: number) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xe0a87c, 1);
      g.fillRect(9, 0, 5, 3);
      g.fillRect(18, 0, 5, 3);
      g.fillStyle(0x241417, 1);
      if (frame === 0) {
        g.fillRect(10, 1, 3, 1);
        g.fillRect(9, 2, 1, 1);
        g.fillRect(13, 2, 1, 1);
        g.fillRect(19, 1, 3, 1);
        g.fillRect(18, 2, 1, 1);
        g.fillRect(22, 2, 1, 1);
      } else {
        g.fillRect(9, 1, 1, 1);
        g.fillRect(13, 1, 1, 1);
        g.fillRect(10, 2, 3, 1);
        g.fillRect(18, 1, 1, 1);
        g.fillRect(22, 1, 1, 1);
        g.fillRect(19, 2, 3, 1);
      }
      g.generateTexture(key, 32, 4);
      g.destroy();
    };
    desenhar("gabiChoro0", 0);
    desenhar("gabiChoro1", 1);
  }

  // ---------- demissão (game over) ----------

  private demitida(): void {
    if (this.terminando) return;
    this.terminando = true;
    this.emCena = true;
    this.balao.fechar(false);
    this.fecharBalaoTexto(false);
    this.barraAtendimento.clear();
    this.gabitcha.setVelocityX(0);
    this.pararBob();

    for (const c of this.clientes) this.tweens.killTweensOf(c.sprite);
    for (const colega of this.colegas) this.tweens.killTweensOf(colega);
    this.placasOcupado.forEach((p) => p.setVisible(false));

    this.entrarChefe((chefe) => {
      this.gabitcha.setFlipX(chefe.x < this.gabitcha.x);
      this.mostrarBalaoTexto(
        chefe.x,
        GABITCHA_Y - 24,
        falaSegura(DIALOGOS.fase2.demissao),
        "chefe",
        3200,
        248
      );

      // escurece só depois do balão da chefe terminar
      this.time.delayedCall(3400, () => {
        const overlay = this.add
          .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x101223, 0.55)
          .setDepth(80)
          .setAlpha(0);
        this.tweens.add({ targets: overlay, alpha: 1, duration: 700 });
        this.gabitcha.setDepth(85);
        this.chorar(0);
      });

      this.time.delayedCall(4400, () => {
        this.add
          .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 14, DIALOGOS.fase2.gameOver, {
            fontFamily: UI.fonte,
            fontSize: FONT_MD,
            color: UI.rosaGabitcha,
          })
          .setOrigin(0.5)
          .setDepth(90);
        const prompt = this.add
          .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, DIALOGOS.fase2.tentarDeNovo, {
            fontFamily: UI.fonte,
            fontSize: FONT_SM,
            color: UI.texto,
          })
          .setOrigin(0.5)
          .setDepth(90);
        this.tweens.add({ targets: prompt, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });

        let reiniciou = false;
        const reiniciar = () => {
          if (reiniciou) return;
          reiniciou = true;
          this.scene.restart();
        };
        this.input.keyboard?.once("keydown-SPACE", reiniciar);
        this.input.once("pointerdown", reiniciar);
      });
    });
  }

  // ---------- suor (3+ clientes esperando) ----------

  private iniciarSuor(): void {
    this.time.addEvent({
      delay: 650,
      loop: true,
      callback: () => {
        if (this.terminando || this.emCena) return;
        const esperando = this.clientes.filter((c) => c.estado === "esperando").length;
        if (esperando < 3) return;
        const lado = this.gabitcha.flipX ? -9 : 9;
        const gota = this.add
          .rectangle(this.gabitcha.x + lado, this.gabitcha.y - 18, 1, 2, 0x9fd4e8)
          .setDepth(11);
        this.tweens.add({
          targets: gota,
          x: gota.x + lado,
          y: gota.y - 6,
          alpha: 0,
          duration: 450,
          ease: "Quad.easeOut",
          onComplete: () => gota.destroy(),
        });
      },
    });
  }

  // ---------- final roteirizado ----------

  private finalizarFase(): void {
    if (this.terminando) return;
    this.terminando = true;
    this.gabitcha.setVelocityX(0);
    this.pararBob();
    this.gabitcha.setFlipX(false);
    this.barraAtendimento.clear();
    this.balao.fechar(false);
    this.fecharBalaoTexto(false);

    for (const c of [...this.clientes]) {
      this.tweens.killTweensOf(c.sprite);
      c.pedido?.cont.destroy();
      this.tweens.add({
        targets: c.sprite,
        alpha: 0,
        duration: 500,
        onComplete: () => c.sprite.destroy(),
      });
    }
    this.clientes = [];
    this.filas = [[], [], []];
    for (const colega of [...this.colegas]) {
      this.tweens.killTweensOf(colega);
      this.tweens.add({ targets: colega, alpha: 0, duration: 500, onComplete: () => colega.destroy() });
    }
    this.colegas = [];
    this.placasOcupado.forEach((p) => p.setVisible(false));

    const luzQuente = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff9a5a, 0.12)
      .setDepth(70)
      .setAlpha(0);
    this.tweens.add({ targets: luzQuente, alpha: 1, duration: 1200 });

    const alvoX = Math.min(this.gabitcha.x, GAME_WIDTH - 96);
    if (alvoX < this.gabitcha.x) {
      this.tweens.add({ targets: this.gabitcha, x: alvoX, duration: 400, ease: "Sine.easeOut" });
    }
    const rafitcho = this.add.sprite(GAME_WIDTH + 24, GABITCHA_Y, "rafitcho").setFlipX(true).setDepth(10);
    const notebook = this.add.image(GAME_WIDTH + 24 - 13, GABITCHA_Y + 6, "notebook").setDepth(11);
    const bob = this.tweens.add({
      targets: notebook,
      y: "-=2",
      duration: 170,
      yoyo: true,
      repeat: -1,
      delay: 700,
    });
    this.time.delayedCall(700, () => atualizarAndar(rafitcho, "rafitcho", true));
    this.tweens.add({
      targets: notebook,
      x: alvoX + 44 - 13,
      duration: 1500,
      ease: "Linear",
      delay: 700,
    });
    this.tweens.add({
      targets: rafitcho,
      x: alvoX + 44,
      duration: 1500,
      ease: "Linear",
      delay: 700,
      onComplete: () => {
        bob.stop();
        atualizarAndar(rafitcho, "rafitcho", false);
        rafitcho.setY(GABITCHA_Y);
        notebook.setPosition(alvoX + 44 - 13, GABITCHA_Y + 6);
        this.balao.falar(rafitcho.x, rafitcho.y - 32, falaSegura(DIALOGOS.fase2.rafitcho), () =>
          this.balao.falar(this.gabitcha.x, this.gabitcha.y - 32, falaSegura(DIALOGOS.fase2.resposta), () =>
            fadeToScene(this, "Fase3Upgrade", 1500)
          )
        );
      },
    });
    this.tweens.add({ targets: notebook, x: alvoX + 44 - 13, duration: 1500, ease: "Linear", delay: 700 });
  }

  // ---------- HUD ----------

  private criarHud(): void {
    this.add
      .text(6, 6, DIALOGOS.fase2.salarioHud, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.douradoYuumitcha,
      })
      .setDepth(50);
    this.vidasTexto = this.add
      .text(6, 18, "", {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.rosaGabitcha,
      })
      .setDepth(50);
    this.clientesTexto = this.add
      .text(GAME_WIDTH - 6, 6, "", {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: UI.texto,
      })
      .setOrigin(1, 0)
      .setDepth(50);
    this.atualizarHud();
    this.criarRelogio();
  }

  private atualizarHud(): void {
    this.vidasTexto.setText("♥".repeat(Math.max(this.vidas, 0)));
    this.clientesTexto.setText(`${DIALOGOS.fase2.hudClientes}: ${this.atendidos}/${META_CLIENTES}`);
  }

  private criarRelogio(): void {
    const face = this.add.circle(0, 0, 6, 0xe8e6f2).setStrokeStyle(1, 0x1a1420);
    const marcas = this.add.graphics();
    marcas.fillStyle(0x1a1420, 1);
    marcas.fillRect(0, -5, 1, 1);
    marcas.fillRect(0, 4, 1, 1);
    marcas.fillRect(-5, 0, 1, 1);
    marcas.fillRect(4, 0, 1, 1);
    this.ponteiro = this.add.graphics();
    this.relogio = this.add
      .container(GAME_WIDTH / 2, 12, [face, marcas, this.ponteiro])
      .setDepth(50);
    this.desenharPonteiro();
  }

  private iniciarRelogio(): void {
    this.time.addEvent({
      delay: 2500,
      loop: true,
      callback: () => {
        if (this.terminando) return;
        const volta = Math.random() < 0.18;
        this.passoRelogio = (this.passoRelogio + (volta ? -1 : 1) + 8) % 8;
        this.desenharPonteiro();
        if (volta) {
          this.relogio.x = GAME_WIDTH / 2 + 1;
          this.time.delayedCall(70, () => (this.relogio.x = GAME_WIDTH / 2));
          const tec = this.add
            .text(GAME_WIDTH / 2 + 12, 8, DIALOGOS.fase2.tec, {
              fontFamily: UI.fonte,
              fontSize: FONT_SM,
              color: "#ff7070",
            })
            .setDepth(50);
          this.tweens.add({
            targets: tec,
            y: 2,
            alpha: 0,
            duration: 700,
            onComplete: () => tec.destroy(),
          });
        }
      },
    });
  }

  private desenharPonteiro(): void {
    this.ponteiro.clear();
    this.ponteiro.fillStyle(0xc14a5a, 1);
    this.ponteiro.fillRect(0, 0, 1, 1);
    for (const [dx, dy] of PONTEIRO_DIRECOES[this.passoRelogio]) {
      this.ponteiro.fillRect(dx, dy, 1, 1);
    }
  }

  private desenharBarra(estacao: number, atendendo: boolean): void {
    this.barraAtendimento.clear();
    if (!atendendo || estacao < 0) return;
    const ex = ESTACOES_X[estacao];
    const p = Math.min(this.progresso / TEMPO_ATENDIMENTO, 1);
    this.barraAtendimento.fillStyle(0x1a1420, 1);
    this.barraAtendimento.fillRect(ex - 10, 92, 20, 5);
    this.barraAtendimento.fillStyle(0x4fd6c4, 1);
    this.barraAtendimento.fillRect(ex - 9, 93, Math.floor(18 * p), 3);
  }

  // ---------- balão de texto único (prioridade: atendido > chefe > colega) ----------

  private mostrarBalaoTexto(
    x: number,
    topoY: number,
    texto: string,
    dono: DonoBalao,
    duracao = 2400,
    maxLargura = 144
  ): void {
    const prioridade = PRIORIDADE_BALAO[dono];
    if (this.balaoAtual) {
      if (this.balaoAtual.prioridade > prioridade) return; // o mais importante fica
      this.fecharBalaoTexto(true);
    }

    const t = this.add
      .text(0, 0, texto, {
        fontFamily: UI.fonte,
        fontSize: FONT_SM,
        color: "#1d2140",
        align: "center",
        lineSpacing: 2,
        wordWrap: { width: maxLargura - 8 },
      })
      .setOrigin(0.5);
    const w = Math.min(t.width + 8, maxLargura);
    const h = t.height + 6;

    // acima da cabeça do falante; inverte pra baixo se estourar o topo
    let cy = topoY - 6 - h / 2;
    let invertido = false;
    if (cy - h / 2 < 24) {
      invertido = true;
      cy = topoY + 60 + h / 2;
    }

    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRect(-w / 2, -h / 2, w, h);
    g.lineStyle(1, 0x1d2140, 1);
    g.strokeRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1);
    g.fillStyle(0xffffff, 1);
    if (invertido) {
      g.fillRect(-2, -h / 2 - 2, 4, 2);
      g.fillRect(-1, -h / 2 - 3, 2, 1);
    } else {
      g.fillRect(-2, h / 2, 4, 2);
      g.fillRect(-1, h / 2 + 2, 2, 1);
    }

    const cx = Phaser.Math.Clamp(x, w / 2 + 2, GAME_WIDTH - w / 2 - 2); // sempre dentro da tela
    const cont = this.add.container(cx, cy, [g, t]).setDepth(45);
    const timer = this.time.delayedCall(duracao, () => this.fecharBalaoTexto(false));
    this.balaoAtual = { cont, prioridade, timer };
  }

  private fecharBalaoTexto(comFade: boolean): void {
    if (!this.balaoAtual) return;
    const b = this.balaoAtual;
    this.balaoAtual = null;
    b.timer.remove();
    if (comFade) {
      this.tweens.add({ targets: b.cont, alpha: 0, duration: 120, onComplete: () => b.cont.destroy() });
    } else {
      b.cont.destroy();
    }
  }

  // ---------- cenário ----------

  private criarCenario(): void {
    this.criarParedeEVitrines();
    this.criarPiso();
    this.criarEstacoes();
    this.criarSilhuetas();
  }

  private criarParedeEVitrines(): void {
    const g = this.add.graphics().setDepth(-8);

    g.fillStyle(0x262a40, 1);
    g.fillRect(0, 0, GAME_WIDTH, 14);
    g.fillStyle(0x454b68, 1);
    g.fillRect(0, 14, GAME_WIDTH, 90);
    g.fillStyle(0x30354e, 1);
    g.fillRect(0, 98, GAME_WIDTH, 12);

    for (let lx = 28; lx < GAME_WIDTH; lx += 56) {
      g.fillStyle(0xdfe8f4, 1);
      g.fillRect(lx - 7, 10, 14, 2);
      g.fillStyle(0xdfe8f4, 0.18);
      g.fillRect(lx - 9, 12, 18, 3);
      g.fillStyle(0xdfe8f4, 0.08);
      g.fillRect(lx - 11, 15, 22, 4);
    }

    const coresLetreiro = [0xb85f78, 0x3f8f88, 0xb08d3f];
    let lx = 8;
    DIALOGOS.fase2.lojas.forEach((nome, i) => {
      const texto = this.add
        .text(0, 30, nome, {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: "#f2f0f7",
        })
        .setOrigin(0, 0.5)
        .setDepth(-8);
      const w = texto.width + 8;
      g.fillStyle(0x1a1420, 1);
      g.fillRect(lx + 1, 25, w, 12);
      g.fillStyle(coresLetreiro[i % coresLetreiro.length], 1);
      g.fillRect(lx, 24, w, 12);
      texto.setPosition(lx + 4, 30);

      const cx = lx + w / 2;
      g.fillStyle(0x2c3048, 1);
      g.fillRect(cx - 28, 40, 56, 62);
      g.fillStyle(0x5f7898, 1);
      g.fillRect(cx - 26, 42, 52, 58);
      g.fillStyle(0x7290b0, 1);
      g.fillRect(cx - 26, 42, 52, 10);

      for (const mx of [cx - 14, cx + 8]) {
        g.fillStyle(0x232845, 1);
        g.fillCircle(mx + 3, 60, 3);
        g.fillRect(mx, 64, 7, 18);
        g.fillRect(mx + 2, 82, 2, 12);
        g.fillRect(mx - 1, 94, 8, 2);
      }

      g.fillStyle(0xffffff, 0.22);
      for (let r = 0; r < 13; r++) {
        const ry = 96 - r * 4;
        g.fillRect(cx - 18 + r, ry > 44 ? ry : 44, 1, 3);
      }

      lx += w + 8;
    });
  }

  private criarPiso(): void {
    const g = this.add.graphics().setDepth(-7);
    g.fillStyle(0x353a54, 1);
    g.fillRect(0, 110, GAME_WIDTH, GAME_HEIGHT - 110);
    g.fillStyle(0x23273a, 1);
    g.fillRect(0, 110, GAME_WIDTH, 2);

    g.fillStyle(0x2a2e46, 1);
    for (let jx = 12; jx < GAME_WIDTH; jx += 28) g.fillRect(jx, 112, 1, GAME_HEIGHT - 112);
    g.fillRect(0, 136, GAME_WIDTH, 1);
    g.fillRect(0, 160, GAME_WIDTH, 1);

    for (let i = 0; i < 3; i++) {
      const rx = 52 + i * 100;
      g.fillStyle(0x4a5578, 0.6);
      g.fillRect(rx - 6, 113, 1, 12);
      g.fillRect(rx + 4, 113, 1, 8);
      g.fillStyle(0xdfe8f4, 0.18);
      g.fillRect(rx - 1, 113, 1, 10);
    }
    for (let lx = 28; lx < GAME_WIDTH; lx += 56) {
      g.fillStyle(0xdfe8f4, 0.1);
      g.fillRect(lx - 2, 114, 4, 6);
    }
  }

  private criarEstacoes(): void {
    const g = this.add.graphics().setDepth(-4);

    // ---- ARARA ----
    {
      const x = ESTACOES_X[0];
      g.fillStyle(0x3f445c, 1);
      g.fillRect(x - 19, 126, 38, 2);
      g.fillRect(x - 19, 128, 2, 40);
      g.fillRect(x + 17, 128, 2, 40);
      g.fillStyle(0x9aa0b8, 1);
      g.fillRect(x - 19, 126, 38, 1);
      g.fillRect(x - 19, 128, 1, 24);
      g.fillStyle(0x3f445c, 1);
      g.fillRect(x - 23, 166, 10, 2);
      g.fillRect(x + 13, 166, 10, 2);
      const roupas = [0xff7aa2, 0x4fd6c4, 0xe9b44c, 0xd8d4e4];
      roupas.forEach((cor, i) => {
        const rx = x - 16 + i * 9;
        g.fillStyle(0x3f445c, 1);
        g.fillRect(rx + 3, 128, 1, 3);
        g.fillStyle(cor, 1);
        g.fillRect(rx, 131, 7, 10);
        const escura = Phaser.Display.Color.ValueToColor(cor).darken(22).color;
        g.fillStyle(escura, 1);
        g.fillRect(rx, 141, 7, 6);
      });
    }

    // ---- CAIXA ----
    {
      const x = ESTACOES_X[1];
      g.fillStyle(0x23273a, 1);
      g.fillRect(x - 25, 143, 50, 25);
      g.fillStyle(0x8a90a8, 1);
      g.fillRect(x - 24, 144, 48, 4);
      g.fillStyle(0x565c78, 1);
      g.fillRect(x - 24, 148, 48, 19);
      g.fillStyle(0x3f445c, 1);
      g.fillRect(x - 24, 156, 48, 1);
      g.fillStyle(0x1a1420, 1);
      g.fillRect(x - 11, 127, 22, 17);
      g.fillStyle(0x2a2e46, 1);
      g.fillRect(x - 10, 128, 20, 15);
      g.fillStyle(0x4a5068, 1);
      g.fillRect(x - 10, 128, 20, 3);
      g.fillStyle(0x4fd6c4, 1);
      g.fillRect(x - 6, 132, 9, 4);
      g.fillStyle(0xffffff, 1);
      g.fillRect(x - 5, 133, 1, 1);
      g.fillStyle(0x8a90a8, 1);
      g.fillRect(x + 4, 132, 2, 2);
      g.fillRect(x + 7, 132, 2, 2);
      g.fillRect(x + 4, 136, 2, 2);
      g.fillRect(x + 7, 136, 2, 2);
    }

    // ---- PROVADOR ----
    {
      const x = ESTACOES_X[2];
      g.fillStyle(0x23273a, 1);
      g.fillRect(x - 18, 117, 36, 51);
      g.fillStyle(0x3f445c, 1);
      g.fillRect(x - 17, 118, 34, 49);
      g.fillStyle(0x1a1d30, 1);
      g.fillRect(x - 15, 122, 30, 44);
      g.fillStyle(0x9aa0b8, 1);
      g.fillRect(x - 15, 123, 30, 1);
      g.fillStyle(0xd85f88, 1);
      g.fillRect(x - 15, 124, 17, 40);
      g.fillStyle(0xb84a6e, 1);
      for (let cx2 = x - 14; cx2 < x + 2; cx2 += 3) g.fillRect(cx2, 124, 1, 40);
      g.fillStyle(0xef7ea2, 1);
      for (let cx2 = x - 13; cx2 < x + 2; cx2 += 3) g.fillRect(cx2, 124, 1, 5);
      g.fillStyle(0x8f3a56, 1);
      g.fillRect(x - 15, 161, 17, 3);
    }

    DIALOGOS.fase2.estacoes.forEach((nome, i) => {
      this.add
        .text(ESTACOES_X[i], 111, nome, {
          fontFamily: UI.fonte,
          fontSize: FONT_SM,
          color: `#${CORES_ESTACOES[i].toString(16).padStart(6, "0")}`,
        })
        .setOrigin(0.5)
        .setDepth(-3);
    });
  }

  private criarSilhuetas(): void {
    const soltar = () => {
      const daEsquerda = Math.random() < 0.5;
      const s = this.add
        .image(daEsquerda ? -16 : GAME_WIDTH + 16, 120, "silhueta")
        .setDepth(-6)
        .setScale(2)
        .setAlpha(0.5)
        .setFlipX(!daEsquerda);
      this.tweens.add({ targets: s, y: 118, duration: 260, yoyo: true, repeat: -1 });
      this.tweens.add({
        targets: s,
        x: daEsquerda ? GAME_WIDTH + 16 : -16,
        duration: Phaser.Math.Between(9000, 14000),
        ease: "Linear",
        onComplete: () => s.destroy(),
      });
    };
    soltar();
    this.time.addEvent({ delay: 6500, loop: true, callback: soltar });
  }

  // ---------- texturas ----------

  private criarTexturas(): void {
    VARIACOES_CLIENTE.forEach((palette, i) => {
      createTextureFromData(this, `cliente32_${i}`, { palette, grid: PESSOA_GRID });
      createTextureFromData(this, `cliente32_${i}_imp`, { palette, grid: PESSOA_IMPACIENTE_GRID });
    });
    createTextureFromData(this, "colega", { palette: PALETTE_COLEGA, grid: COLEGA_GRID });
    createTextureFromData(this, "chefe", CHEFE_DATA);

    const pixelArt = (key: string, grid: string[], cor: number) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(cor, 1);
      grid.forEach((row, y) => {
        [...row].forEach((ch, x) => {
          if (ch === "X") g.fillRect(x, y, 1, 1);
        });
      });
      g.generateTexture(key, grid[0].length, grid.length);
      g.destroy();
    };
    pixelArt("iconeArara", ICONE_CABIDE, CORES_ESTACOES[0]);
    pixelArt("iconeCaixa", ICONE_CIFRAO, CORES_ESTACOES[1]);
    pixelArt("iconeProvador", ICONE_CORTINA, CORES_ESTACOES[2]);
    pixelArt("coracaoMini", [".X.X.", "XXXXX", "XXXXX", ".XXX.", "..X.."], 0xff7aa2);

    if (!this.textures.exists("silhueta")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x1e2238, 1);
      g.fillCircle(5, 3, 3);
      g.fillRect(2, 6, 7, 8);
      g.fillRect(3, 14, 2, 3);
      g.fillRect(6, 14, 2, 3);
      g.generateTexture("silhueta", 11, 17);
      g.destroy();
    }

    if (!this.textures.exists("notebook")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x3f445c, 1);
      g.fillRect(0, 0, 12, 8);
      g.fillStyle(0x8a90a8, 1);
      g.fillRect(0, 0, 12, 1);
      g.fillRect(1, 1, 1, 6);
      g.fillStyle(0x4fd6c4, 1);
      g.fillRect(5, 3, 2, 2);
      g.generateTexture("notebook", 12, 8);
      g.destroy();
    }
  }
}
