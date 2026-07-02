# Contexto do projeto

**Leia `GAME_DESIGN.md` antes de qualquer tarefa. Ele é a fonte da verdade deste projeto.**

Resumo em 10 linhas:

1. Este é um jogo-presente de aniversário, secreto, feito pelo Rafael para a namorada. Repo privado — nunca sugerir tornar público ou compartilhar conteúdo.
2. Gênero: aventura 2D em pixel art, inspirado em Fireboy & Watergirl, single-player, jogado no browser (desktop + mobile).
3. Stack: Phaser 3 + TypeScript, Arcade Physics, `pixelArt: true`, deploy estático (Vercel/itch.io).
4. Estrutura: cada fase é uma `Phaser.Scene` em `src/scenes/`; TODOS os textos ficam em `src/dialogos.ts`.
5. Personagens: Gabitcha (protagonista, 24x24), Rafitcho (NPC, 24x24), Yuumitcha (pug, 12x12). Matrizes de pixels na seção 6 do GAME_DESIGN.md.
6. Fases: Prólogo, 1-Match, 2-Shopping, 3-Upgrade, 4-Viagem, 5-Encomenda, 6-Tempestade, Final-Carta. Mecânicas descritas na seção 3.
7. Prioridade de escopo: Prólogo, Fase 1, Fase 5, Fase 6 e Final são intocáveis; Fases 2–4 podem virar cutscene se o prazo apertar.
8. Tom: humor nas fases do meio (piadas internas do casal — seção 7, ainda TODO), emoção crescente até a carta final.
9. Terminado > ambicioso. Fases curtas e polidas, jogo de 10–20 minutos.
10. Idioma do jogo e dos diálogos: português brasileiro.
