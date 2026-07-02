// Matrizes de pixels dos personagens — fonte da verdade: GAME_DESIGN.md seção 6.
// `.` = transparente; cada caractere mapeia para uma cor na paleta.

export interface SpriteData {
  size: number;
  palette: Record<string, string>;
  grid: string[];
}

export const RAFITCHO: SpriteData = {
  size: 24,
  palette: {
    H: "#241d18", // cabelo
    S: "#a5713f", // pele
    G: "#14110f", // armacao dos oculos
    W: "#ffffff", // branco (lente/dentes)
    E: "#2a1c12", // olhos
    n: "#8a5a30", // nariz (sombra)
    M: "#2b211a", // bigode/cavanhaque
    T: "#1b1b1f", // camiseta preta
    P: "#e75a8a", // estampa rosa
    t: "#3aa6a0", // tatuagem
    B: "#4a3b2f", // calca
  },
  grid: [
    "........HHHHHHHH........",
    "......HHHHHHHHHHHH......",
    ".....HHHHHHHHHHHHHH.....",
    ".....HHHHHHHHHHHHHH.....",
    ".....HSSSSSSSSSSSSH.....",
    ".....HSSSSSSSSSSSSH.....",
    ".....SSSSSSSSSSSSSS.....",
    ".....GGGGGGGGGGGGGG.....",
    ".....GWEEWGSSGWEEWG.....",
    ".....GGGGGGSSGGGGGG.....",
    ".....SSSSSSSSSSSSSS.....",
    ".....SSSSSSnnSSSSSS.....",
    ".....SSMMMMMMMMMMSS.....",
    ".....SSMWWWWWWWWMSS.....",
    "......SSSWWWWWWSSS......",
    ".......SSSSSSSSSS.......",
    "........TTTTTTTT........",
    "......TTTTTTTTTTTT......",
    ".....TTTTTTTTTTTTTT.....",
    "....STTTPPPPPPPPTTTS....",
    "....STTTTPPPPPPTTTTS....",
    "....tTTTTTTTTTTTTTTS....",
    "....STTTTTTTTTTTTTTS....",
    "......BBBB....BBBB......",
  ],
};

export const GABITCHA: SpriteData = {
  size: 24,
  palette: {
    H: "#171012", // cabelo
    h: "#3d2a2e", // brilho do cabelo
    S: "#cfa176", // pele
    b: "#241417", // sobrancelha / cilios
    E: "#241417", // olhos
    W: "#ffffff", // brilho do olho (sparkle)
    n: "#ab7a52", // nariz
    L: "#c14a5a", // batom
    R: "#e08a7a", // blush
    G: "#d9a441", // ouro (colar/brincos)
    T: "#141216", // renda preta
    d: "#8d6247", // pontinhos da renda
  },
  grid: [
    "........HHHHHHHH........",
    "......HHHHHHHHHHHH......",
    ".....HHhHHHHHHHHhHH.....",
    "....HHHHHHHHHHHHHHHH....",
    "....HHHhSSSSSSSShHHH....",
    "...HHHhSSSSSSSSSShHHH...",
    "...HHHSSSSSSSSSSSSHHH...",
    "...HHSSbbbSSSSbbbSSHH...",
    "...HHSSEWESSSSEWESSHH...",
    "...HHSSSSSSnnSSSSSSHH...",
    "...HGSRSSLLLLLLSSRSGH...",
    "...HHHSSSSSSSSSSSSHHH...",
    "....HHHSSSSSSSSSSHHH....",
    "....HHHHSSSSSSSSHHHH....",
    "...HHHHHSSSSSSSSHHHHH...",
    "...HHHHHSSGGGGSSHHHHH...",
    "...HHHHTTTTTTTTTTHHHH...",
    "..HHHHTTdTTTTTTdTTHHHH..",
    "..HHhHTTTTdTTdTTTTHhHH..",
    "..HHHTTTdTTTTTTdTTTHHH..",
    "..HHHTTTTTddTTTTTTTHHH..",
    "..HHHTTTTTTTTTTTTTTHHH..",
    "...HHTTTTTTTTTTTTTTHH...",
    "..HHhTTTTTTTTTTTTTThHH..",
  ],
};

export const YUUMITCHA: SpriteData = {
  size: 12,
  palette: {
    K: "#211a16", // orelhas / mascara
    F: "#d8b488", // pelo fawn
    f: "#ecd7b0", // pelo claro (peito)
    E: "#171210", // olhos
    W: "#ffffff", // brilho do olho
    N: "#0d0a08", // nariz
    Q: "#b08d5f", // rabinho enrolado
  },
  grid: [
    ".KK......KK.",
    ".KFFFFFFFFK.",
    "KKFFFFFFFFKK",
    "KFEEFFFFEEFK",
    "KFEWFKKFEWFK",
    "KFFFKNNKFFFK",
    ".FFKKKKKKFF.",
    ".FFKKffKKFF.",
    "..FFFFFFFF..",
    "..FffffffF.Q",
    "..FffffffFQQ",
    "...FF..FF...",
  ],
};
