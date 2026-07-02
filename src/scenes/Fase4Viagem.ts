import { BaseFase } from "./BaseFase";
import { DIALOGOS } from "../dialogos";

/**
 * Fase 4 — "O Sonho da Viagem" (pode virar cutscene se o prazo apertar)
 * Fase contemplativa, sem inimigos. Coletáveis: fotos polaroid → álbum.
 * TODO: ajustar cenário para o destino real da viagem do casal.
 */
export class Fase4Viagem extends BaseFase {
  constructor() {
    super("Fase4Viagem");
  }

  protected readonly titulo = DIALOGOS.fase4.titulo;
  protected readonly proximaCena = "Fase5Encomenda";
}
