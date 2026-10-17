export type Status = "online" | "busy" | "away" | "brb" | "phone" | "lunch" | "invisible" | "offline";

export type Tone = "ink" | "blue" | "busy" | "online" | "away";

export type Kind = "text" | "nudge" | "wink" | "file" | "system" | "voice";

export type FontSize = "sm" | "md" | "lg";

export type Scene = "plain" | "lines" | "grid";

export type EmoteIcon =
  | "smile"
  | "sad"
  | "laugh"
  | "tongue"
  | "wink"
  | "shock"
  | "confused"
  | "cry"
  | "cool"
  | "heart"
  | "broken"
  | "kiss"
  | "yes"
  | "no"
  | "beer"
  | "coffee"
  | "flower"
  | "gift"
  | "star"
  | "music"
  | "pizza"
  | "cake"
  | "cat"
  | "dog"
  | "plane"
  | "car"
  | "phone"
  | "mail"
  | "camera"
  | "idea"
  | "umbrella"
  | "sun"
  | "moon"
  | "rain";

export type Contact = {
  id: string;
  name: string;
  message: string;
  status: Status;
  photo: string;
  group: string;
  blocked: boolean;
  song: string;
  email: string;
  members?: string[];
};

export type Me = {
  signedIn: boolean;
  auto: boolean;
  remember: boolean;
  email: string;
  name: string;
  message: string;
  status: Status;
  photo: string;
  song: string;
  sound: boolean;
};

export type Msg = {
  id: string;
  peerId: string;
  fromMe: boolean;
  text: string;
  at: number;
  kind: Kind;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: Tone;
  size?: FontSize;
  mono?: boolean;
  fileName?: string;
  fileState?: "offered" | "saved" | "declined";
  authorId?: string;
};

export type Options = {
  showOffline: boolean;
  view: "status" | "group";
  enterSends: boolean;
  showTime: boolean;
  scene: Scene;
  fontSize: FontSize;
  mono: boolean;
  alerts: boolean;
};

export const defaultOptions: Options = {
  showOffline: true,
  view: "group",
  enterSends: true,
  showTime: true,
  scene: "plain",
  fontSize: "md",
  mono: false,
  alerts: true,
};

export const STATUS_LABEL: Record<Status, string> = {
  online: "Disponível",
  busy: "Ocupado",
  away: "Ausente",
  brb: "Volto logo",
  phone: "Ao telefone",
  lunch: "Saí para almoçar",
  invisible: "Aparecer offline",
  offline: "Desconectado",
};

export const MY_STATUSES: Status[] = ["online", "busy", "away", "brb", "phone", "lunch", "invisible"];

export const TONE_LABEL: Record<Tone, string> = {
  ink: "preto",
  blue: "azul",
  busy: "vermelho",
  online: "verde",
  away: "laranja",
};

export function statusBucket(status: Status) {
  if (status === "offline" || status === "invisible") return "off";
  if (status === "busy" || status === "phone") return "busy";
  if (status === "away" || status === "brb" || status === "lunch") return "away";
  return "online";
}

export function roomStatus(contact: Contact, all: Contact[]): Status {
  if (!contact.members?.length) return contact.status;
  const people = contact.members
    .map((id) => all.find((item) => item.id === id))
    .filter((item): item is Contact => Boolean(item));
  if (people.some((item) => item.status === "online" || item.status === "busy" || item.status === "phone")) return "online";
  if (people.some((item) => item.status !== "offline" && item.status !== "invisible")) return "away";
  return "offline";
}

export function seedContacts(): Contact[] {
  return [
    { id: "marina", name: "Marina Costa", message: "não leio de manhã.", status: "online", photo: "/faces/marina.jpg", group: "Amigos", blocked: false, song: "rádio da revista", email: "marina@papo.local" },
    { id: "lucas", name: "Lucas Ferreira", message: "prometo que não é planilha.", status: "online", photo: "/faces/lucas.jpg", group: "Trabalho", blocked: false, song: "", email: "lucas@papo.local" },
    { id: "larissa", name: "Larissa Pires", message: "poa, eu volto já.", status: "away", photo: "/faces/larissa.jpg", group: "Cidade", blocked: false, song: "", email: "larissa@papo.local" },
    { id: "camila", name: "Camila Rocha", message: "sábado tem som.", status: "online", photo: "/faces/camila.jpg", group: "Amigos", blocked: false, song: "ensaio no chuveiro", email: "camila@papo.local" },
    { id: "ana", name: "Ana Beatriz Lima", message: "recado curto, verdade longa.", status: "brb", photo: "/faces/ana.jpg", group: "Amigos", blocked: false, song: "", email: "ana@papo.local" },
    { id: "rafael", name: "Rafael Dias", message: "traz o cabo, eu levo a música.", status: "phone", photo: "/faces/rafael.jpg", group: "Amigos", blocked: false, song: "violão sem nome", email: "rafael@papo.local" },
    { id: "pedro", name: "Pedro Henrique", message: "curitiba também tem recado.", status: "busy", photo: "/faces/pedro.jpg", group: "Trabalho", blocked: false, song: "", email: "pedro@papo.local" },
    { id: "juliana", name: "Juliana Martins", message: "a medida é o olho.", status: "lunch", photo: "/faces/juliana.jpg", group: "Cidade", blocked: false, song: "", email: "juliana@papo.local" },
    { id: "bia", name: "Bia Almeida", message: "vem pra sombra.", status: "offline", photo: "/faces/bia.jpg", group: "Amigos", blocked: false, song: "", email: "bia@papo.local" },
    { id: "diego", name: "Diego Souza", message: "a umidade também é gente.", status: "offline", photo: "/faces/diego.jpg", group: "Cidade", blocked: false, song: "", email: "diego@papo.local" },
    { id: "thiago", name: "Thiago Nunes", message: "pedido enviado. agora espero.", status: "offline", photo: "/faces/thiago.jpg", group: "Trabalho", blocked: false, song: "", email: "thiago@papo.local" },
    {
      id: "mesa",
      name: "a mesa",
      message: "Marina, Camila e Rafael",
      status: "online",
      photo: "/faces/marina.jpg",
      group: "Grupos",
      blocked: false,
      song: "",
      email: "",
      members: ["marina", "camila", "rafael"],
    },
  ];
}

const LINES: Record<string, string[]> = {
  marina: ["o gato sentou no teclado. isso conta como resposta?", "tópico do café ainda está quente. você não.", "para de sumir no meio da frase."],
  lucas: ["sem planilha. no máximo uma lista.", "se isso virar pauta eu saio do papo.", "beleza. anotei numa folha de verdade."],
  larissa: ["vento aqui. você está a favor ou contra?", "sábado eu topo. traz casaco.", "poa não apaga. eu também não."],
  camila: ["sábado tem som. você vem ou só cutuca?", "cantei no chuveiro e o vizinho aplaudiu.", "manda o recado, eu mando o refrão."],
  ana: ["isso daria um depoimento, mas cabe numa linha.", "recife acordou. eu não.", "fala curto que eu respondo longo."],
  rafael: ["cabo separado. conversa também.", "tô no intervalo. o violão não.", "se for convite, eu levo o instrumento."],
  pedro: ["curitiba está fria e o papo também pode esquentar.", "mensagem recebida entre um ônibus e outro.", "ocupado, mas li."],
  juliana: ["não tenho medida pra essa frase.", "almoço primeiro. resposta depois.", "o caderno da avó não tinha emoticon."],
  bia: ["sol demais pra janela tão pequena.", "vi agora. o bolo não esperou.", "pode mandar. eu estava offline de mentira."],
  diego: ["a chuva atrasou. a mensagem não.", "apareci. não prometo ficar.", "rio no fundo, papo na frente."],
  thiago: ["eu disse que ia entrar. entrei.", "ocupado com prazo. este papo é o intervalo.", "pode falar. eu estava desconectado de propósito."],
};

export function replyTo(id: string, text: string) {
  const t = text.toLowerCase();
  if (/cutuc/.test(t)) return "ai. sem cutucar toda hora.";
  if (/\boi\b|ol[aá]|e a[ií]|fala/.test(t)) return "oi. demorou, mas entrou.";
  if (/kk|haha|rs+|kkk/.test(t)) return "kkkk. para, que eu tô no trabalho. mentira.";
  if (/s[aá]bado|som|bar/.test(t)) return "sábado eu topo. sem desculpa no meio.";
  if (/foto|arquivo|m[uú]sica/.test(t)) return "manda. se for grande, eu finjo que baixou.";
  if (/jogo|velha|pedra|papel|tesoura/.test(t)) return "jogo aceito. não vale chorar.";
  const bank = LINES[id] ?? ["entendi.", "pode mandar o resto.", "tô aqui."];
  return bank[Math.floor(Math.random() * bank.length)] ?? "tô aqui.";
}

export function speakerFor(contact: Contact, all: Contact[]) {
  if (!contact.members?.length) return contact.id;
  const online = contact.members.filter((id) => {
    const person = all.find((item) => item.id === id);
    return person && person.status !== "offline" && person.status !== "invisible";
  });
  const pool = online.length ? online : contact.members;
  return pool[Math.floor(Math.random() * pool.length)] ?? contact.id;
}

export const EMOTES: { code: string; label: string; icon: EmoteIcon; alias?: boolean }[] = [
  { code: ":-)", label: "sorriso", icon: "smile", alias: true },
  { code: ":-(", label: "triste", icon: "sad", alias: true },
  { code: ":-D", label: "gargalhada", icon: "laugh", alias: true },
  { code: ";-)", label: "piscadela", icon: "wink", alias: true },
  { code: ":-P", label: "língua", icon: "tongue", alias: true },
  { code: ":-O", label: "surpresa", icon: "shock", alias: true },
  { code: ":'(", label: "choro", icon: "cry" },
  { code: ":)", label: "sorriso", icon: "smile" },
  { code: ":(", label: "triste", icon: "sad" },
  { code: ":D", label: "gargalhada", icon: "laugh" },
  { code: ":P", label: "língua", icon: "tongue" },
  { code: ";)", label: "piscadela", icon: "wink" },
  { code: ":O", label: "surpresa", icon: "shock" },
  { code: ":S", label: "confuso", icon: "confused" },
  { code: "(H)", label: "legal", icon: "cool" },
  { code: "(L)", label: "coração", icon: "heart" },
  { code: "(U)", label: "partido", icon: "broken" },
  { code: "(K)", label: "beijo", icon: "kiss" },
  { code: "(Y)", label: "joinha", icon: "yes" },
  { code: "(N)", label: "não", icon: "no" },
  { code: "(B)", label: "brinde", icon: "beer" },
  { code: "(C)", label: "café", icon: "coffee" },
  { code: "(F)", label: "flor", icon: "flower" },
  { code: "(G)", label: "presente", icon: "gift" },
  { code: "(*)", label: "estrela", icon: "star" },
  { code: "(8)", label: "música", icon: "music" },
  { code: "(pi)", label: "pizza", icon: "pizza" },
  { code: "(^)", label: "bolo", icon: "cake" },
  { code: "(@)", label: "gato", icon: "cat" },
  { code: "(&)", label: "cachorro", icon: "dog" },
  { code: "(ap)", label: "avião", icon: "plane" },
  { code: "(au)", label: "carro", icon: "car" },
  { code: "(mp)", label: "celular", icon: "phone" },
  { code: "(e)", label: "e-mail", icon: "mail" },
  { code: "(p)", label: "câmera", icon: "camera" },
  { code: "(i)", label: "ideia", icon: "idea" },
  { code: "(um)", label: "guarda-chuva", icon: "umbrella" },
  { code: "(so)", label: "sol", icon: "sun" },
  { code: "(mo)", label: "lua", icon: "moon" },
  { code: "(st)", label: "chuva", icon: "rain" },
];

const EMOTES_BY_LENGTH = [...EMOTES].sort((a, b) => b.code.length - a.code.length);

export function partsOf(text: string) {
  const out: { emote: boolean; value: string }[] = [];
  let i = 0;
  while (i < text.length) {
    const slice = text.slice(i);
    const hit = EMOTES_BY_LENGTH.find((item) => slice.startsWith(item.code));
    if (hit) {
      out.push({ emote: true, value: hit.code });
      i += hit.code.length;
      continue;
    }
    const last = out[out.length - 1];
    if (last && !last.emote) last.value += text[i] ?? "";
    else out.push({ emote: false, value: text[i] ?? "" });
    i += 1;
  }
  return out;
}

export type Cell = "" | "x" | "o";

const LINES_TTT = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export function winner(board: Cell[]): Cell | "draw" | "" {
  for (const [a, b, c] of LINES_TTT) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (board.every(Boolean)) return "draw";
  return "";
}

function pair(board: Cell[], mark: Cell) {
  for (const [a, b, c] of LINES_TTT) {
    const trio = [board[a], board[b], board[c]];
    if (trio.filter((value) => value === mark).length === 2 && trio.includes("")) {
      return [a, b, c].find((index) => board[index] === "") ?? -1;
    }
  }
  return -1;
}

export function botMove(board: Cell[]) {
  const win = pair(board, "o");
  if (win >= 0) return win;
  const block = pair(board, "x");
  if (block >= 0) return block;
  if (board[4] === "") return 4;
  const corners = [0, 2, 6, 8].filter((index) => board[index] === "");
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)] ?? -1;
  const rest = board.map((value, index) => (value === "" ? index : -1)).filter((index) => index >= 0);
  return rest[Math.floor(Math.random() * rest.length)] ?? -1;
}

export function rpsResult(mine: string, theirs: string) {
  if (mine === theirs) return "empate";
  if (
    (mine === "pedra" && theirs === "tesoura") ||
    (mine === "papel" && theirs === "pedra") ||
    (mine === "tesoura" && theirs === "papel")
  ) {
    return "você venceu";
  }
  return "você perdeu";
}
