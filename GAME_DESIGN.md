# A Encomenda do Futuro 🎁

> Jogo-presente de aniversário para a Gabitcha, feito pelo Rafitcho.
> Um platformer/coletânea de minigames em pixel art inspirado em Fireboy & Watergirl,
> que conta a história real dos dois — do match ao "eu te amo" final.
>
> **CONFIDENCIAL: repo privado. A jogadora final NÃO pode ver nada disso antes do aniversário.**

---

## 1. Visão geral

- **Gênero:** aventura 2D em fases, cada fase com uma mecânica própria (dodge, corrida contra o tempo, coleta, minigame de arrastar, fase narrativa).
- **Jogadora:** single-player. A Gabitcha (pessoa real) joga sozinha, controlando a personagem Gabitcha.
- **Tom:** engraçado nas fases do meio, emocional no final. As piadas internas do casal são o tempero (ver seção 7 — TODO).
- **Duração alvo:** 10–20 minutos de jogo. Curto e polido > longo e inacabado.
- **Plataforma:** browser (desktop + mobile com controles touch). Deploy em Vercel ou itch.io, entregue como um link no dia do aniversário.
- **Arco emocional:** encontro → luta → conquista → alegria → crise → superação → declaração de amor.

## 2. Personagens

### Gabitcha (protagonista jogável)
Veio de uma cidade pequena para São Paulo com o objetivo de crescer na vida. Esforçada, muito inteligente, sentimental e dramática (no bom sentido — drama é feature, não bug). Facilidade gigantesca de fazer amigos; traz alegria por onde passa. Ama comunicação e vive tendo ideias novas.
- **Visual do sprite:** cabelo preto longo e ondulado com risca ao meio e reflexos de brilho, olhos com sparkle e cílios, blush, batom rosa-avermelhado, brincos e colar dourados, blusa preta de renda (pontinhos de pele aparecendo).

### Rafitcho (NPC principal / interesse amoroso)
Dev recém-formado que já morava na cidade grande. Nerd: videogame, anime, livros, vive no computador. Faz de tudo pela Gabitcha e quer vê-la crescer. Consegue um trabalho remoto internacional em dólar. Passa por um desligamento da empresa na Fase 6.
- **Visual do sprite:** óculos redondos pretos, cabelo escuro curto, sorrisão com dentes, bigode/cavanhaque sutil, camiseta preta com estampa rosa, tatuagem (pixel teal) no braço esquerdo, calça marrom.

### Yuumitcha (mascote)
Pug filhote que "vem do futuro" — chega numa caixa misteriosa com remetente "O FUTURO" na Fase 5. Caos ambulante: destrói chinelos, fios e sofás, mas enche a casa de felicidade.
- **Visual do sprite:** 12x12 (metade da escala dos humanos), fawn com máscara e orelhas pretas, focinho grande, brilho nos olhos, rabinho enrolado.

## 3. Fases

### Prólogo — "Duas cidades" (cutscene jogável, ~30s)
- Tela dividida em pixel art: esquerda = Gabitcha na cidade pequena arrumando a mala; direita = Rafitcho no quarto gamer (action figures, luz de monitor, pilha de livros).
- Ela caminha para a direita rumo à cidade grande; ele não sai da cadeira.
- Texto: *"Duas vidas. Uma cidade gigante. Zero chance de se encontrarem... certo?"*
- **Mecânica:** só andar para a direita (tutorial disfarçado de movimento).

### Fase 1 — "Match!" (o encontro pelo app)
- **Cenário:** cidade grande à noite — prédios, letreiros neon.
- **Mecânica:** dodge. Perfis de app de namoro caem do céu como obstáculos; a Gabitcha desvia dos "matches ruins" (o cara da foto com peixe, o "oi sumida", o boy da academia — substituir/expandir com piadas internas, ver seção 7) e coleta o único perfil brilhante: Rafitcho.
- **Final da fase:** os dois se encontram num café; corações em pixel art sobem pela tela.

### Fase 2 — "O Shopping do Caos"
- **Cenário:** interior de shopping — vitrines, escada rolante, praça de alimentação.
- **Mecânica:** corrida contra o relógio atendendo clientes que se multiplicam; chefe grita balões de texto absurdos; HUD mostra salário ridículo ("R$ 3,50/hora").
- **Design intencional:** cansativa DE PROPÓSITO, mas curta — o level design comunica a desvalorização que ela vivia.
- **Final da fase:** Rafitcho aparece com um notebook: *"Peraí. Eu tenho uma ideia."*

### Fase 3 — "O Upgrade"
- **Cenário:** metade 1 = quarto do casal; metade 2 = escritório novo, colorido e iluminado (oposto visual do shopping).
- **Mecânica parte 1:** minigame de montar o CV arrastando as qualidades dela (comunicação, criatividade, alegria, ideias).
- **Mecânica parte 2:** coleta de "ideias" (lâmpadas em pixel art); cada lâmpada coletada deixa o escritório visivelmente mais bonito.
- **Mensagem visual:** ELA transforma o lugar aonde chega.

### Fase 4 — "O Sonho da Viagem"
- **Setup:** cena rápida do Rafitcho conseguindo o trabalho remoto (de pijama numa call, cifrão em dólar — piada autodepreciativa liberada).
- **Cenário:** aeroporto/avião → level curto em SANTIAGO DO CHILE: Cordilheira dos Andes nevada no horizonte, Sky Costanera, palmeiras e mirante no final.
- **Mecânica:** fase contemplativa, sem inimigos, sem timer, sem game over. Coletáveis: fotos polaroid que preenchem um álbum.
- **Função no arco:** a recompensa e o respiro depois do caos do shopping.

### Fase 5 — "A Encomenda do Futuro"
- **Setup:** chega uma caixa misteriosa com etiqueta *"REMETENTE: O FUTURO"*. Dela sai a Yuumitcha. (Dá nome ao jogo.)
- **Mecânica:** a fase mais engraçada — caos de filhote. A Gabitcha corre para salvar chinelos, fios de carregador e o sofá enquanto a pug corre em círculos.
- **Final da fase:** os três no sofá; a barra de "felicidade da casa" enche até estourar.

### Fase 6 — "A Tempestade"
- **Tom:** muda. Cenário = o apartamento em tons dessaturados, chuva na janela. Rafitcho recebe o e-mail de desligamento.
- **Sacada de design:** INVERTE o papel — em todas as fases ele ajudou ou ela foi ajudada; agora ELA é a força.
- **Mecânica:** a Gabitcha carrega uma luzinha e acende o apartamento cômodo por cômodo; cada luz acesa reergue o Rafitcho (o sprite dele levanta a cabeça gradualmente). A Yuumitcha segue os dois. Sem inimigos: o "chefe" é a escuridão, a arma é ela estar do lado dele.
- **Final da fase:** a cor volta ao cenário.

### Final — "A Carta"
- Céu estrelado em pixel art, os três num telhado/varanda.
- A carta entra linha por linha, estilo final de RPG. Conteúdo (adaptar do texto original do Rafael):
  - o quanto ela é incrível;
  - tudo que ela deseja e almeja, ela pode conseguir;
  - ela merece o mundo, e o dia dela tem tudo para ser especial;
  - o jogo pode parecer simples, mas é um jeito diferente e animado de dizer que, mesmo diante das dificuldades, ao lado dela tudo parece fácil;
  - **"Rafitcho ama muito a Gabitcha"** + fogos em pixel art.
- **Easter egg final:** botão de "replay" que mostra uma foto real do casal pixelizada.

## 4. Decisões técnicas

- **Engine:** Phaser 3 + TypeScript. Cada fase = uma `Phaser.Scene`; transição entre cenas com fade.
- **Física:** Arcade Physics (suficiente para dodge/platformer leve).
- **Render:** `pixelArt: true` na config do Phaser (desliga antialiasing); sprites com `setScale(4)`.
- **Deploy:** build estático → Vercel ou itch.io. Testar em mobile (adicionar controles touch simples: setas virtuais ou tap nas metades da tela).
- **Diálogos:** TODOS os textos e piadas centralizados em `src/dialogos.ts` — vai ser o arquivo mais iterado do projeto.

### Estrutura de pastas

```
a-encomenda-do-futuro/
├── src/
│   ├── main.ts               # config do Phaser (pixelArt: true)
│   ├── scenes/
│   │   ├── Prologo.ts
│   │   ├── Fase1Match.ts
│   │   ├── Fase2Shopping.ts
│   │   ├── Fase3Upgrade.ts
│   │   ├── Fase4Viagem.ts
│   │   ├── Fase5Encomenda.ts
│   │   ├── Fase6Tempestade.ts
│   │   └── FinalCarta.ts
│   ├── sprites/              # PNGs exportados (24x24 humanos, 12x12 pug)
│   ├── dialogos.ts           # todas as falas e piadas
│   └── ui/                   # HUD, caixas de diálogo, transições
├── assets/tiles/             # tilesets (Kenney.nl / itch.io, CC0) + mapas do Tiled
├── index.html
└── README.md                 # texto despistador: "estudo de Phaser 3"
```

### Assets
- **Personagens:** sprites próprios (dados na seção 6). Animações a fazer: idle 2 frames (bounce), andar 2–4 frames, Yuumitcha correndo em círculo (Fase 5), Rafitcho "levantando a cabeça" em 3 estágios (Fase 6).
- **Cenários:** tilesets gratuitos CC0 — Kenney.nl e itch.io (buscar "city tileset pixel art free", "interior tileset"). Mapas montados no Tiled, exportados como JSON para o Phaser.
- **Fontes:** Press Start 2P (Google Fonts) para UI.
- **Paleta de UI (do sprite studio):** fundo noite `#101223`, painel `#1d2140`, linha `#2c3160`, texto `#e8e6f2`, rosa Gabitcha `#ff7aa2`, teal Rafitcho `#4fd6c4`, dourado Yuumitcha `#e9b44c`.

## 5. Princípios de escopo

1. **Terminado > ambicioso.** 6 fases curtas e polidas. Se o prazo apertar, cortar nesta ordem: Fase 3 parte 1 (minigame do CV) → Fase 4 vira cutscene → Fase 2 vira cutscene. Prólogo, Fase 1, Fase 5, Fase 6 e Final são intocáveis (são o coração do arco).
2. **A piada e a emoção valem mais que a mecânica.** Melhor uma fase simples com diálogo perfeito do que uma fase complexa genérica.
3. **Testar no celular dela** (provavelmente vai jogar no celular ou no notebook — confirmar e otimizar pro dispositivo real).

## 6. Sprites (dados de pixel)

Cada sprite é uma matriz de strings; cada caractere mapeia para uma cor na paleta; `.` = transparente.
Para renderizar: iterar célula a célula com `fillRect`, ou exportar PNG pelo sprite studio (`sprites-gabitcha-rafitcho.html`).

### RAFITCHO (24x24)

```js
const RAFITCHO = {
  size: 24,
  palette: {
    "H": "#241d18", // cabelo
    "S": "#a5713f", // pele
    "G": "#14110f", // armacao dos oculos
    "W": "#ffffff", // branco (lente/dentes)
    "E": "#2a1c12", // olhos
    "n": "#8a5a30", // nariz (sombra)
    "M": "#2b211a", // bigode/cavanhaque
    "T": "#1b1b1f", // camiseta preta
    "P": "#e75a8a", // estampa rosa
    "t": "#3aa6a0", // tatuagem
    "B": "#4a3b2f"  // calca
  },
  grid: [
    "........HHHHHHHH........",
    "......HHHHHHHHHHHH......",
    ".....HHHHHHHHHHHHHH.....",
    ".....HHHHHHHHHHHHHH.....",
    ".....HSSSSSSSSSSSSH.....",
    ".....HSSSSSSSSSSSSH.....",
    ".....SSSSSSSSSSSSSS.....",
    ".....GGGGGGGGGGGGGG.....",
    ".....GWEEWGSSGWEEWG.....",
    ".....GGGGGGSSGGGGGG.....",
    ".....SSSSSSSSSSSSSS.....",
    ".....SSSSSSnnSSSSSS.....",
    ".....SSMMMMMMMMMMSS.....",
    ".....SSMWWWWWWWWMSS.....",
    "......SSSWWWWWWSSS......",
    ".......SSSSSSSSSS.......",
    "........TTTTTTTT........",
    "......TTTTTTTTTTTT......",
    ".....TTTTTTTTTTTTTT.....",
    "....STTTPPPPPPPPTTTS....",
    "....STTTTPPPPPPTTTTS....",
    "....tTTTTTTTTTTTTTTS....",
    "....STTTTTTTTTTTTTTS....",
    "......BBBB....BBBB......"
  ]
};
```

### GABITCHA (24x24)

```js
const GABITCHA = {
  size: 24,
  palette: {
    "H": "#171012", // cabelo
    "h": "#3d2a2e", // brilho do cabelo
    "S": "#cfa176", // pele
    "b": "#241417", // sobrancelha / cilios
    "E": "#241417", // olhos
    "W": "#ffffff", // brilho do olho (sparkle)
    "n": "#ab7a52", // nariz
    "L": "#c14a5a", // batom
    "R": "#e08a7a", // blush
    "G": "#d9a441", // ouro (colar/brincos)
    "T": "#141216", // renda preta
    "d": "#8d6247"  // pontinhos da renda
  },
  grid: [
    "........HHHHHHHH........",
    "......HHHHHHHHHHHH......",
    ".....HHhHHHHHHHHhHH.....",
    "....HHHHHHHHHHHHHHHH....",
    "....HHHhSSSSSSSShHHH....",
    "...HHHhSSSSSSSSSShHHH...",
    "...HHHSSSSSSSSSSSSHHH...",
    "...HHSSbbbSSSSbbbSSHH...",
    "...HHSSEWESSSSEWESSHH...",
    "...HHSSSSSSnnSSSSSSHH...",
    "...HGSRSSLLLLLLSSRSGH...",
    "...HHHSSSSSSSSSSSSHHH...",
    "....HHHSSSSSSSSSSHHH....",
    "....HHHHSSSSSSSSHHHH....",
    "...HHHHHSSSSSSSSHHHHH...",
    "...HHHHHSSGGGGSSHHHHH...",
    "...HHHHTTTTTTTTTTHHHH...",
    "..HHHHTTdTTTTTTdTTHHHH..",
    "..HHhHTTTTdTTdTTTTHhHH..",
    "..HHHTTTdTTTTTTdTTTHHH..",
    "..HHHTTTTTddTTTTTTTHHH..",
    "..HHHTTTTTTTTTTTTTTHHH..",
    "...HHTTTTTTTTTTTTTTHH...",
    "..HHhTTTTTTTTTTTTTThHH.."
  ]
};
```

### YUUMITCHA (12x12 — metade da escala dos humanos)

```js
const YUUMITCHA = {
  size: 12,
  palette: {
    "K": "#211a16", // orelhas / mascara
    "F": "#d8b488", // pelo fawn
    "f": "#ecd7b0", // pelo claro (peito)
    "E": "#171210", // olhos
    "W": "#ffffff", // brilho do olho
    "N": "#0d0a08", // nariz
    "Q": "#b08d5f"  // rabinho enrolado
  },
  grid: [
    ".KK......KK.",
    ".KFFFFFFFFK.",
    "KKFFFFFFFFKK",
    "KFEEFFFFEEFK",
    "KFEWFKKFEWFK",
    "KFFFKNNKFFFK",
    ".FFKKKKKKFF.",
    ".FFKKffKKFF.",
    "..FFFFFFFF..",
    "..FffffffF.Q",
    "..FffffffFQQ",
    "...FF..FF..."
  ]
};
```

## 7. Piadas internas do casal — **TODO** ⚠️

> PENDENTE: o Rafael ainda vai fornecer as piadas internas.
> Quando chegarem, distribuir assim:
> - **Fase 1:** piadas viram os perfis ruins do app (maior densidade de humor do jogo).
> - **Fase 2:** falas absurdas do chefe e dos clientes do shopping.
> - **Fase 5:** os objetos que a Yuumitcha destrói e as reações.
> - **Diálogos entre fases:** frases que o casal fala um pro outro no dia a dia.
> Tudo entra em `src/dialogos.ts`.

## 8. Status / roadmap

- [x] História e divisão de fases
- [x] Sprites dos 3 personagens (v2: Gabitcha glow-up, Yuumitcha 12x12)
- [ ] Piadas internas (aguardando o Rafael)
- [x] Esqueleto Phaser + config pixelArt (pnpm + Vite + TS)
- [ ] Prólogo
- [x] Fase 1 "Match!" (primeiro protótipo jogável)
- [ ] Fases 2–6
- [ ] Final "A Carta"
- [ ] Controles touch + teste no dispositivo real dela
- [ ] Deploy + link final
