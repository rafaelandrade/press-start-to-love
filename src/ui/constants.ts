// Paleta de UI (GAME_DESIGN.md seção 4 — Assets)
export const UI = {
  fundoNoite: 0x101223,
  painel: 0x1d2140,
  linha: 0x2c3160,
  texto: "#e8e6f2",
  rosaGabitcha: "#ff7aa2",
  tealRafitcho: "#4fd6c4",
  douradoYuumitcha: "#e9b44c",
  fonte: '"Press Start 2P", monospace',
} as const;

// Press Start 2P é desenhada em grid de 8px — usar SÓ múltiplos de 8
// pra não borrar (nada de 5/6/7/9/22px!).
export const FONT_SM = "8px"; // diálogos, HUD, textos corridos
export const FONT_MD = "16px"; // subtítulos / títulos de fase
export const FONT_LG = "24px"; // títulos grandes
export const FONT_XL = "32px"; // título da tela inicial

export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 180;
export const SCALE = 4; // sprites com setScale(4)
