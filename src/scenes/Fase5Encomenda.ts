import { BaseFase } from "./BaseFase";
import { DIALOGOS } from "../dialogos";

/**
 * Fase 5 — "A Encomenda do Futuro" (INTOCÁVEL — dá nome ao jogo)
 * Caixa "REMETENTE: O FUTURO" → Yuumitcha. Caos de filhote: salvar chinelos,
 * fios e sofá enquanto a pug corre em círculos. Barra de felicidade estoura no final.
 * TODO(seção 7): objetos destruídos e reações em DIALOGOS.fase5.
 */
export class Fase5Encomenda extends BaseFase {
  constructor() {
    super("Fase5Encomenda");
  }

  protected readonly titulo = DIALOGOS.fase5.titulo;
  protected readonly proximaCena = "Fase6Tempestade";
}
