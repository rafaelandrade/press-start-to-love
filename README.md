# Estudo de Phaser 3 + TypeScript

Projeto de estudo com [Phaser 3](https://phaser.io/) e TypeScript:
cenas encadeadas, Arcade Physics, sprites gerados proceduralmente e
build estático com [Vite](https://vitejs.dev/).

## Requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- [pnpm](https://pnpm.io/) 9 (`corepack enable` já disponibiliza)

## Rodar localmente

```bash
pnpm install
pnpm dev
```

O servidor de desenvolvimento sobe em `http://localhost:5173`.

## Build

```bash
pnpm build      # checagem de tipos + bundle de produção em dist/
pnpm preview    # serve o build de produção localmente
```

## Deploy (Vercel)

O projeto é um site estático. Na Vercel, o preset do Vite já funciona;
caso precise configurar manualmente:

- **Build Command:** `pnpm build`
- **Output Directory:** `dist`
- **Install Command:** `pnpm install`

## Assets de imagem

As imagens ficam em `docs/` (fora do bundle do Vite) e são sincronizadas
para `public/` durante o build por um script:

```bash
pnpm gen:photos
```

`pnpm build` executa isso automaticamente. Se adicionar ou remover uma
imagem em `docs/`, rode o script (ou um novo build) para atualizar
`public/` e o `manifest.json`.

## Estrutura

```
src/
├── main.ts          # configuração do Phaser
├── scenes/          # cenas do jogo
├── sprites/         # dados e geração de sprites
├── ui/              # componentes de interface
└── dialogos.ts      # textos centralizados
```
