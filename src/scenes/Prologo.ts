import { BaseFase } from "./BaseFase";
import { DIALOGOS } from "../dialogos";
import { UI, GAME_WIDTH, GAME_HEIGHT } from "../ui/constants";

/**
 * Prólogo — "Duas cidades" (~30s)
 * Tela dividida: Gabitcha na cidade pequena / Rafitcho no quarto gamer.
 * Mecânica: só andar para a direita (tutorial disfarçado).
 * TODO: implementar tela dividida + caminhada; hoje é placeholder navegável.
 */
export class Prologo extends BaseFase {
  constructor() {
    super("Prologo");
  }

  protected readonly titulo = DIALOGOS.prologo.titulo;
  protected readonly proximaCena = "Fase1Match";

  protected override montar(): void {
    // Divisória da tela
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 2, GAME_HEIGHT, UI.linha);

    this.add.image(GAME_WIDTH / 4, GAME_HEIGHT / 2, "gabitcha").setScale(2);
    this.add.image((GAME_WIDTH / 4) * 3, GAME_HEIGHT / 2, "rafitcho").setScale(2);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 45, DIALOGOS.prologo.narracao, {
        fontFamily: UI.fonte,
        fontSize: "6px",
        color: UI.texto,
        align: "center",
        lineSpacing: 4,
      })
      .setOrigin(0.5);
  }
}
