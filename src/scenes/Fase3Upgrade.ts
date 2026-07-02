import { BaseFase } from "./BaseFase";
import { DIALOGOS } from "../dialogos";

/**
 * Fase 3 — "O Upgrade" (parte 1 é a PRIMEIRA a ser cortada se o prazo apertar)
 * Parte 1: minigame de montar o CV arrastando qualidades (DIALOGOS.fase3.qualidades).
 * Parte 2: coleta de lâmpadas; cada uma deixa o escritório mais bonito.
 * Mensagem: ELA transforma o lugar aonde chega.
 */
export class Fase3Upgrade extends BaseFase {
  constructor() {
    super("Fase3Upgrade");
  }

  protected readonly titulo = DIALOGOS.fase3.titulo;
  protected readonly proximaCena = "Fase4Viagem";
}
