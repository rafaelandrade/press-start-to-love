// ============================================================
// TODOS os textos do jogo vivem aqui. (GAME_DESIGN.md seção 4)
// Piadas internas do casal: TODO — ver GAME_DESIGN.md seção 7 ⚠️
// ============================================================

export const DIALOGOS = {
  prologo: {
    titulo: "Duas cidades",
    narracao: "Duas vidas. Uma cidade gigante.\nZero chance de se encontrarem... certo?",
  },

  fase1: {
    titulo: "Match!",
    // TODO(seção 7): substituir/expandir com piadas internas — maior densidade de humor do jogo
    perfisRuins: [
      "O cara da foto com peixe 🐟",
      '"Oi sumida"',
      "O boy da academia 💪",
    ],
    perfilBrilhante: "Rafitcho, dev ✨",
    finalFase: "E foi assim que tudo começou.",
  },

  fase2: {
    titulo: "O Shopping do Caos",
    salarioHud: "R$ 3,50/hora",
    // TODO(seção 7): falas absurdas do chefe e dos clientes
    falasChefe: [
      "MAIS RÁPIDO!",
      "O cliente tem SEMPRE razão!",
    ],
    finalFase: "Peraí. Eu tenho uma ideia.",
  },

  fase3: {
    titulo: "O Upgrade",
    qualidades: ["Comunicação", "Criatividade", "Alegria", "Ideias"],
    mensagem: "Ela transforma o lugar aonde chega.",
  },

  fase4: {
    titulo: "O Sonho da Viagem",
    setup: "Trabalho remoto. Em dólar. De pijama.", // piada autodepreciativa liberada
    // TODO: ajustar cenário/textos para o destino real da viagem do casal
  },

  fase5: {
    titulo: "A Encomenda do Futuro",
    etiquetaCaixa: "REMETENTE: O FUTURO",
    // TODO(seção 7): objetos que a Yuumitcha destrói e as reações
    objetosDestruidos: ["Chinelo", "Fio do carregador", "Sofá"],
    finalFase: "Felicidade da casa: 100%... 200%... ∞",
  },

  fase6: {
    titulo: "A Tempestade",
    email: "Assunto: Comunicado de desligamento",
    mensagem: "Agora era a vez dela ser a força.",
    finalFase: "E a cor voltou.",
  },

  final: {
    titulo: "A Carta",
    // TODO: adaptar do texto original do Rafael (GAME_DESIGN.md, seção 3 — Final)
    carta: [
      "Gabitcha,",
      "",
      "Você é incrível.",
      "Tudo que você deseja e almeja, você pode conseguir.",
      "Você merece o mundo — e o seu dia tem tudo para ser especial.",
      "",
      "Esse jogo pode parecer simples,",
      "mas é um jeito diferente e animado de dizer que,",
      "mesmo diante das dificuldades,",
      "ao lado de você tudo parece fácil.",
      "",
      "Rafitcho ama muito a Gabitcha. ❤️",
    ],
    botaoReplay: "Jogar de novo",
  },

  // TODO(seção 7): frases que o casal fala um pro outro no dia a dia (diálogos entre fases)
  entreFases: [] as string[],
} as const;
