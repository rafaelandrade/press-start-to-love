// ============================================================
// TODOS os textos do jogo vivem aqui. (GAME_DESIGN.md seção 4)
// Piadas internas do casal: TODO — ver GAME_DESIGN.md seção 7 ⚠️
// ============================================================

export const DIALOGOS = {
  telaInicial: {
    titulo: "GABITCHA",
    subtitulo: "uma aventura feita com amor",
    start: "PRESS START",
  },

  prologo: {
    titulo: "Duas cidades",
    dica: "→ ande para a direita",
    // Falas da Gabitcha saindo da cidade pequena (typewriter no balão)
    falas: [
      "Mala pronta! Levei só o essencial:\n3 casacos, 5 batons e\nZERO arrependimentos.",
      "Tchau, cidade pequena! Aqui todo\nmundo sabe da vida de todo mundo...\nagora vou fofocar de LONGE.",
      "Mãe, eu ligo quando chegar!\n...mentira. Vou mandar áudio\nde 7 minutos.",
      "São Paulo, se prepara.\nA GABITCHA tá chegando!",
    ],
    enquantoIsso:
      "Enquanto isso, na cidade grande...\n\nRafitcho upava de nível.\nNo jogo. Só no jogo.",
    placa: "SÃO PAULO →",
    pontoOnibus: "PONTO",
    narracao: "Duas vidas. Uma cidade gigante.\nZero chance de se encontrarem... certo?",
  },

  fase1: {
    titulo: "Match!",
    // Intro com contexto (balões antes do dodge começar)
    intro: [
      "Cheguei! São Paulo, seus problemas\nacabaram. Os meus... começaram agora.",
      "Hora de baixar o aplicativo\nde namoro. O que pode dar errado?",
    ],
    instrucao: "DESVIE dos perfis ruins!\nPEGUE o perfil brilhante ★",
    controles: "← → ou A/D para mover",
    comecar: "pressione ESPAÇO",
    // TODO(seção 7): substituir/expandir com piadas internas — maior densidade de humor do jogo
    // (textos curtos: precisam caber no mini-card de 76px de largura de texto)
    perfisRuins: [
      "Foto com peixe 🐟",
      '"Oi sumida"',
      "Boy da academia 💪",
    ],
    // Clímax: a estrela dourada com "ELE" substitui o card do Rafitcho
    estrela: "ELE",
    eleAparece: "NOSSAAA... QUEM É ESSE??",
    vitoria: {
      ela: "Um dev? Sei lá...\nvai me trocar por um\ncomputador, né?",
      ele: "Jamais. Computador não ri\ndas minhas piadas.\n...você vai rir, né?",
    },
    narracao: "E foi assim que tudo começou.",
    derrota: "Você perdeu seu grande amor...",
    tentarDeNovo: "pressione ESPAÇO para tentar de novo",
  },

  fase2: {
    titulo: "O Shopping do Caos",
    salarioHud: "SALÁRIO: R$3,50/h",
    hudClientes: "CLIENTES",
    tec: "tec",
    instrucao: "ATENDA os clientes na\nestação que eles pedem!",
    controles: "← → correr\nESPAÇO na estação = atender",
    comecar: "pressione ESPAÇO",
    estacoes: ["ARARA", "CAIXA", "PROVADOR"],
    ocupado: "OCUPADO",
    lojas: ["CHIQUE S.A", "TUDO R$1,99", "PASTEL & CIA"],
    gameOver: "GAME OVER",
    tentarDeNovo: "pressione ESPAÇO para tentar de novo",

    // Exigências dos clientes — falam SÓ durante o atendimento
    // (máx 2 linhas de ~17 caracteres: balão de 140px)
    clientes: [
      "Mesma blusa, mas\nem OUTRA cor?",
      "Quero trocar. Sem\netiqueta e usada.",
      "Rapidinho! Eu tô\ncom MUITA pressa.",
      "2 MINUTOS de fila?\nQue ABSURDO!",
      "Tem desconto se\neu levar meio?",
      "Me explica esse\nshopping INTEIRO?",
      "Provou 23 peças.\nVai levar ZERO.",
      "Aceita pix, cartão\ne promessa?",
    ],

    // Broncas da chefe (a cada aparição, uma diferente)
    broncasChefe: [
      "Gabitcha! A fila tá ENORME!\nMultitarefa, querida.\nVocê tem DUAS mãos!",
      "Sorrindo pouco, Gabitcha.\nO cliente sente. A LOJA sente.\nEU sinto.",
      "Vi você piscando os olhos.\nIsso é tempo de atendimento\nque não volta mais.",
      "A meta subiu 40%.\nComemora! É sinal de que\nconfiamos em você. SEM PAUSA.",
      "Quando eu tinha sua idade,\neu atendia 3 lojas AO MESMO\nTEMPO. E descalça.",
    ],

    // Colegas inúteis (soltam a fala e SOMEM) — máx 2 linhas
    colegas: [
      "Vou ver uma coisa\nno estoque...",
      "Cobre minha pausa?\nSó 15 minutinhos.",
      "Hoje eu tô só de\napoio MORAL, sabe?",
    ],
    emoteColega: "zZz",

    // Demissão (game over)
    demissao:
      "DEMITIDA?! Não, querida.\nVocê está sendo LIBERADA\npara novos desafios. Tchau.",

    // Vitória: a chefe some, entra o Rafitcho
    rafitcho: "Peraí. Eu tenho uma ideia.",
    resposta:
      "Se for 'respira fundo',\neu vou chorar. De novo.\nAgora. Aqui.",
  },

  fase3: {
    titulo: "O Upgrade",
    // janela de atualização de sistema (título da fase)
    instalando: "INSTALANDO: O UPGRADE",
    concluido: "UPGRADE CONCLUÍDO ✓",
    // intro roteirizada no quarto
    intro: [
      "Eu não aguento mais\naquele shopping...",
      "Então chega. Hoje a gente\nmonta o SEU currículo.",
      "Currículo com o quê? Eu só\nsei atender cliente chato.",
      "Você só acha isso.\nOlha em volta.",
    ],
    objetivo: "COLETE as 5 qualidades da\nGabitcha e monte o currículo!",
    controles: "← → andar   ESPAÇO coletar",
    comecar: "pressione ESPAÇO",
    hintColeta: "ESPAÇO",
    // metade 1: montar o CV no quarto
    cvDoc: "CURRÍCULO.DOC",
    qualidades: ["COMUNICAÇÃO", "CRIATIVIDADE", "ALEGRIA", "IDEIAS", "DRAMA"],
    // reações do Rafitcho a cada badge (mesma ordem) — provisórias
    reacoesCV: [
      "Ela conversa até\ncom o boleto.",
      "Uma ideia por\nminuto. No mínimo.",
      "O RH não tá\npronto pra isso.",
      "Anota TUDO.\nConfia.",
      "Isso vai no\ncurrículo? VAI.",
    ],
    enviado: "Enviado. Agora\na gente espera.",
    tresDias: "3 dias depois...",
    // metade 2: o escritório que ela transforma
    colegasNovos: [
      "Quem É ela?!",
      "Essa ideia salvou\no meu trimestre!",
      "Ela chegou HOJE\ne já mudou tudo.",
    ],
    letreiro: "MELHOR IDEIA DO MÊS:\nGABITCHA",
    final: "Ser valorizada é isso?\nEu podia me acostumar.",
    mensagem: "Ela transforma o lugar aonde chega.",
  },

  fase4: {
    titulo: "O Sonho da Viagem",
    // cartão de embarque (título da fase)
    embarque: "EMBARQUE / BOARDING",
    rota: "GRU → SCL",
    passageiros: "PASSAGEIROS: GABITCHA + RAFITCHO",
    carimbo: "O SONHO\nDA VIAGEM ✈",
    // abertura 1: o aeroporto (interativa — ela leva a mala até o portão)
    aeroporto: {
      painelVoo: "GRU→SCL 23:40",
      painelStatus: "EMBARQUE",
      portao: "PORTÃO 7 →",
      dica: "→ leve a mala até o portão",
      falas: [
        "Passaporte, celular,\ncarregador... e se eu\nesqueci algo?",
        "Esqueceu. Sempre esquece.\nMas a gente compra lá.",
        "Por isso que eu te amo.",
      ],
    },
    // abertura 2: o avião (cutscene — pista → nuvens → Andes pela janela)
    aviao: {
      falas: ["se eu chorar na\nimigração...", "Eu vou chorar JUNTO."],
      aviso: "✈ APERTEM OS CINTOS",
    },
    // separadores de cartão-postal + placa de objetivo local no HUD
    postais: [
      { nome: "SANTIAGO!", placa: "Santiago\n2 fotos para tirar" },
      { nome: "VALE DO VINHO!", placa: "Vale do Vinho\n2 fotos para tirar" },
      { nome: "VALPARAÍSO!", placa: "Valparaíso\n2 fotos para tirar" },
    ],
    dica: "→ caminhe e colecione memórias",
    hintFoto: "ESPAÇO",
    hintConversa: "ESPAÇO para conversar",
    albumHud: "ÁLBUM",
    placa: "MIRADOR →",
    // legendas das polaroids (2 por local: Santiago, Vale do Vinho, Valparaíso)
    polaroids: [
      "Os Andes. 20 min\nde silêncio.",
      "Sky Costanera.\nTchau, vertigem.",
      "Taças pro alto.\nSaúde, a gente!",
      "Empanada nº1 de\n47. Sem culpa.",
      "Casinhas de TODAS\nas cores. Todas.",
      "Anota aí: a\ngente VOLTA.",
    ],
    // 7º slot secreto: quem conversa com todo mundo ganha a foto com o gato
    polaroidBonus: "Fizemos um amigo.\nEle falou: 'miau'.",
    // NPCs conversáveis — falas provisórias, lapidar depois
    npcIndicador: "...",
    letreiroCompletos: "COMPLETOS",
    npcs: {
      completos: [
        "Completo italiano!\nÉ como o hot dog...",
        "...se o hot dog\ntivesse dado certo.",
      ],
      turista: [
        "Você sabe onde fica\na cordilheira?",
        "...é ATRÁS de mim?\nDesde ONTEM?",
      ],
      vinho: [
        "Esse aqui é suave,\nesse é intenso...",
        "...e esse aqui resolve\nqualquer problema.",
      ],
      vinhoEntrega: "Toma. Brinde dos\nnamorados, por conta\nda casa.",
      violonista: [
        "Essa próxima eu fiz\npra minha namorada.",
        "As 47 anteriores\ntambém.",
      ],
      gato: "miau.",
    },
    brinde: "tim!",
    final: "O mundo é grande.\nE é nosso.",
  },

  fase5: {
    titulo: "A Encomenda do Futuro",
    // etiqueta de encomenda (título da fase)
    etiqueta: {
      remetente: "REMETENTE: O FUTURO ★",
      destinatario: "DESTINATÁRIO:\nGABITCHA & RAFITCHO",
      conteudo: "CONTEÚDO: ???",
      rastreio: "BR-AUAU-2024",
      fragil: "FRÁGIL",
    },
    // ato 1: o mistério
    campainha: "DING DONG",
    dicaPorta: "→ atenda a porta",
    susto: "?!",
    misterio: [
      "Rafitcho...\na caixa PULOU.",
      "Caixa não pula, amor.\nDeve ser o vento.",
      "O VENTO?\nDENTRO do prédio?",
    ],
    abrirCaixa: "ESPAÇO para abrir a caixa",
    // ato 2: a revelação (ela fala em auau o jogo inteiro)
    revelacao: [
      "É UM FILHOTE?!\nEU VOU CHORAR.\nJÁ TÔ CHORANDO.",
      "Bem-vinda ao futuro,\nYuumitcha.",
      "auau!",
    ],
    corte: "20 minutos de fofura depois...",
    // ato 3: o caos
    instrucao: "SALVE os itens antes que\na Yuumitcha os alcance!",
    controles: "← → correr   ESPAÇO salvar",
    comecar: "pressione ESPAÇO",
    hudFelicidade: "FELICIDADE DA CASA",
    hudSalvos: "SALVOS",
    hudDestruidos: "DESTRUÍDOS",
    // TODO(seção 7): objetos que a Yuumitcha destrói e as reações
    caos: [
      "O CHINELO NÃO,\nELE É DO PAR NOVO!",
      "Deixa o controle...\na gente assiste\nno notebook.",
      "Como algo tão pequeno\ndestrói TÃO RÁPIDO?",
      "auau! auau!!",
    ],
    placar: {
      titulo: "Felicidade da casa:\n100%... 200%... ∞",
      salvos: "SALVOS:",
      destruidos: "DESTRUÍDOS:",
      arrependimentos: "ARREPENDIMENTOS: 0",
    },
    final: [
      "Nossa casa nunca mais\nvai ser a mesma.",
      "Não. Vai ser melhor.",
      "auau. ♥",
    ],
  },

  fase6: {
    titulo: "A Tempestade",
    // e-mail no notebook (balão estilo janela de e-mail)
    emailAssunto: "ASSUNTO: Desligamento —\nReestruturação da equipe",
    abertura: {
      raf: "Perdi o emprego.",
      gab: "Então hoje a gente fica\ntriste juntos. E amanhã\na gente resolve. JUNTOS.",
    },
    objetivo: "Acenda as luzes da casa.\nFique perto de quem você ama.",
    hintLuz: "segure ESPAÇO",
    // falas dela ao acender cada luz (tom de força serena — provisórias)
    luzes: [
      "Uma luz de cada vez.",
      "A gente já passou por coisa\npior. Tipo aquele shopping.",
      "Você cuidou de mim quando\neu precisei. Minha vez.",
      "Olha, até a Yuumitcha tá\najudando. Moralmente.",
      "Última. Vem cá.",
    ],
    narracaoCor: "E a cor voltou.",
    final: "Com você, até tempestade\npassa rápido.",
  },

  final: {
    titulo: "A Carta",
    carta: [
      "Oi, amor.",
      "",
      "Se você chegou até aqui,",
      "já sabe: essa história é nossa.",
      "",
      "Uma menina que saiu da cidade pequena",
      "com a mala cheia de coragem",
      "e zero arrependimentos.",
      "",
      "Um nerd que achava que já tinha tudo,",
      "até dar match com você.",
      "",
      "Eu te vi enfrentar o caos do shopping,",
      "e te vi transformar cada lugar",
      "por onde você passou.",
      "Você faz isso, sabia?",
      "Você acende os lugares.",
      "",
      "Brindamos no Chile,",
      "adotamos um caos de quatro patas,",
      "e quando a tempestade chegou pra mim,",
      "foi você quem acendeu as luzes.",
      "",
      "Esse jogo pode parecer simples.",
      "Mas é o meu jeito de dizer",
      "o que eu sinto todos os dias:",
      "",
      "do seu lado, até o difícil",
      "parece fácil.",
      "",
      "Tudo que você sonha, você alcança.",
      "Eu já vi acontecer.",
      "Eu tive a sorte de estar perto.",
      "",
      "Você merece o mundo, Gabitcha.",
      "E eu vou passar a vida",
      "tentando te entregar ele.",
      "",
      "Feliz aniversário.",
      "",
      "Te amo além do que cabe",
      "em qualquer pixel.",
      "",
      "— seu Rafitcho ♥",
    ],
    fim1: "Feliz aniversário,\nGabitcha.",
    fim2: "Te amo. — Rafitcho",
    botao: "ESPAÇO ♥",
    obrigado: "OBRIGADO POR JOGAR",
    // mural de fotos reais (pós "Feliz aniversário")
    mural: {
      titulo: "nossa história em fotos — arraste para ver",
      memorias: "memórias ♥",
      sair: "ESC ▸ fim",
    },
  },

  // TODO(seção 7): frases que o casal fala um pro outro no dia a dia (diálogos entre fases)
  entreFases: [] as string[],
} as const;

// ------------------------------------------------------------
// Higiene de placeholders: nenhum "TODO..." pode renderizar em jogo
// ------------------------------------------------------------

const FALA_GENERICA = "Atende aqui, por favor!";

/** Usar em todo texto dinâmico: troca placeholder TODO por fala genérica. */
export function falaSegura(texto: string): string {
  if (texto.startsWith("TODO")) {
    console.warn(`[dialogos] piada pendente ("${texto}") — usando fala genérica`);
    return FALA_GENERICA;
  }
  return texto;
}

function coletarTodos(no: unknown, caminho: string, saida: string[]): void {
  if (typeof no === "string") {
    if (no.startsWith("TODO")) saida.push(caminho);
    return;
  }
  if (Array.isArray(no)) {
    no.forEach((v, i) => coletarTodos(v, `${caminho}[${i}]`, saida));
    return;
  }
  if (no && typeof no === "object") {
    for (const [chave, valor] of Object.entries(no)) {
      coletarTodos(valor, `${caminho}.${chave}`, saida);
    }
  }
}

// Loga uma vez, no carregamento, a lista de TODOs pendentes
const todosPendentes: string[] = [];
coletarTodos(DIALOGOS, "DIALOGOS", todosPendentes);
if (todosPendentes.length > 0) {
  console.warn(
    `[dialogos] ${todosPendentes.length} texto(s) TODO pendente(s):\n- ${todosPendentes.join("\n- ")}`
  );
}
