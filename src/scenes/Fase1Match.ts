import { BaseFase } from "./BaseFase";
import { DIALOGOS } from "../dialogos";

/**
 * Fase 1 — "Match!" (INTOCÁVEL — GAME_DESIGN.md seção 5)
 * Mecânica: dodge. Perfis ruins caem do céu; coletar só o perfil brilhante.
 * TODO: implementar dodge com Arcade Physics; perfis em DIALOGOS.fase1.perfisRuins.
 * TODO(seção 7): expandir perfis com piadas internas.
 */
export class Fase1Match extends BaseFase {
  constructor() {
    super("Fase1Match");
  }

  protected readonly titulo = DIALOGOS.fase1.titulo;
  protected readonly proximaCena = "Fase2Shopping";
}
