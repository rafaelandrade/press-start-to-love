import { BaseFase } from "./BaseFase";
import { DIALOGOS } from "../dialogos";

/**
 * Fase 2 — "O Shopping do Caos" (pode virar cutscene se o prazo apertar)
 * Mecânica: corrida contra o relógio; clientes se multiplicam; HUD "R$ 3,50/hora".
 * Cansativa DE PROPÓSITO, mas curta.
 * TODO(seção 7): falas do chefe em DIALOGOS.fase2.falasChefe.
 */
export class Fase2Shopping extends BaseFase {
  constructor() {
    super("Fase2Shopping");
  }

  protected readonly titulo = DIALOGOS.fase2.titulo;
  protected readonly proximaCena = "Fase3Upgrade";
}
