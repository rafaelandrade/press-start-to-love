import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, UI } from "./ui/constants";
import { Boot } from "./scenes/Boot";
import { Prologo } from "./scenes/Prologo";
import { Fase1Match } from "./scenes/Fase1Match";
import { Fase2Shopping } from "./scenes/Fase2Shopping";
import { Fase3Upgrade } from "./scenes/Fase3Upgrade";
import { Fase4Viagem } from "./scenes/Fase4Viagem";
import { Fase5Encomenda } from "./scenes/Fase5Encomenda";
import { Fase6Tempestade } from "./scenes/Fase6Tempestade";
import { FinalCarta } from "./scenes/FinalCarta";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true, // desliga antialiasing (GAME_DESIGN.md seção 4)
  backgroundColor: UI.fundoNoite,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 4,
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: 600 }, debug: false },
  },
  scene: [
    Boot,
    Prologo,
    Fase1Match,
    Fase2Shopping,
    Fase3Upgrade,
    Fase4Viagem,
    Fase5Encomenda,
    Fase6Tempestade,
    FinalCarta,
  ],
});
