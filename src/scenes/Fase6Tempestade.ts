import { BaseFase } from "./BaseFase";
import { DIALOGOS } from "../dialogos";

/**
 * Fase 6 — "A Tempestade" (INTOCÁVEL — inversão do arco: ELA é a força)
 * Apartamento dessaturado, chuva na janela, e-mail de desligamento.
 * Mecânica: Gabitcha acende o apartamento cômodo por cômodo; cada luz reergue
 * o Rafitcho (sprite levanta a cabeça em 3 estágios). Sem inimigos —
 * o "chefe" é a escuridão. Final: a cor volta.
 */
export class Fase6Tempestade extends BaseFase {
  constructor() {
    super("Fase6Tempestade");
  }

  protected readonly titulo = DIALOGOS.fase6.titulo;
  protected readonly proximaCena = "FinalCarta";
}
