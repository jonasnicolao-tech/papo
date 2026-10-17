import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  defaultOptions,
  replyTo,
  seedContacts,
  speakerFor,
  type Contact,
  type FontSize,
  type Kind,
  type Me,
  type Msg,
  type Options,
  type Status,
  type Tone,
} from "@/lib/messenger/model";
import { play } from "@/lib/messenger/sound";

type Style = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: Tone;
  size?: FontSize;
  mono?: boolean;
};

type Typing = { peerId: string; name: string } | null;

type Messenger = {
  me: Me;
  contacts: Contact[];
  messages: Msg[];
  lastRead: Record<string, number>;
  groups: string[];
  options: Options;
  typing: Typing;
  signIn: (input: { email: string; name: string; auto: boolean; remember: boolean; status: Status }) => void;
  signOut: () => void;
  setStatus: (status: Status) => void;
  setProfile: (patch: Partial<Pick<Me, "name" | "message" | "song" | "photo" | "sound">>) => void;
  setOptions: (patch: Partial<Options>) => void;
  send: (peerId: string, text: string, style: Style) => void;
  nudge: (peerId: string) => boolean;
  wink: (peerId: string) => void;
  sendFile: (peerId: string, fileName: string) => void;
  sendVoice: (peerId: string) => void;
  note: (peerId: string, text: string) => void;
  resolveFile: (id: string, accept: boolean) => void;
  addContact: (input: { name: string; message: string; group: string; photo: string; email: string }) => string;
  addRoom: (name: string, memberIds: string[]) => string;
  removeContact: (id: string) => void;
  renameContact: (id: string, name: string) => void;
  toggleBlock: (id: string) => void;
  markRead: (id: string) => void;
  clearThread: (id: string) => void;
  clearAll: () => void;
  bringOnline: (id: string) => void;
  deliver: (peerId: string, text: string, kind: Kind, extra?: Partial<Pick<Msg, "authorId" | "fileName" | "fileState">>) => void;
};

const memory = new Map<string, string>();
const safeStorage = {
  getItem: (key: string) => (typeof window === "undefined" ? (memory.get(key) ?? null) : localStorage.getItem(key)),
  setItem: (key: string, value: string) => {
    if (typeof window === "undefined") memory.set(key, value);
    else localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window === "undefined") memory.delete(key);
    else localStorage.removeItem(key);
  },
};

const nudgedAt = new Map<string, number>();

function nid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Date.now()}`;
}

const meSeed: Me = {
  signedIn: false,
  auto: true,
  remember: true,
  email: "",
  name: "Jhow",
  message: "se o recado for bom, eu respondo.",
  status: "online",
  photo: "/faces/jhow.jpg",
  song: "",
  sound: true,
};

const groupSeed = ["Amigos", "Trabalho", "Cidade", "Grupos"];

function push(messages: Msg[], msg: Msg) {
  return [...messages, msg].slice(-400);
}

function later(ms: number, fn: () => void) {
  if (typeof window === "undefined") return;
  window.setTimeout(fn, ms);
}

function hydrateContacts(list?: Contact[]) {
  const seed = seedContacts();
  const byId = new Map(seed.map((item) => [item.id, item]));
  const source = list?.length ? list : seed;
  const base = source.map((item) => {
    const known = byId.get(item.id);
    return {
      ...(known ?? item),
      ...item,
      email: item.email || known?.email || "",
    };
  });
  if (!base.some((item) => item.id === "mesa")) {
    const mesa = seed.find((item) => item.id === "mesa");
    if (mesa) base.push(mesa);
  }
  return base;
}

function firstName(name: string) {
  return name.split(" ")[0] || name;
}

export const useMessenger = create<Messenger>()(
  persist(
    (set, get) => ({
      me: meSeed,
      contacts: seedContacts(),
      messages: [],
      lastRead: {},
      groups: groupSeed,
      options: defaultOptions,
      typing: null,
      deliver: (peerId, text, kind, extra) => {
        const state = get();
        const msg: Msg = {
          id: nid(),
          peerId,
          fromMe: false,
          text,
          at: Date.now(),
          kind,
          ...extra,
        };
        set({
          messages: push(state.messages, msg),
          typing: state.typing?.peerId === peerId ? null : state.typing,
        });
        if (kind !== "system") play(kind === "nudge" ? "nudge" : kind === "voice" ? "voice" : "message", state.me.sound);
      },
      signIn: ({ email, name, auto, remember, status }) => {
        const local = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
        const display = name.trim() || local || get().me.name;
        set((s) => ({
          me: {
            ...s.me,
            signedIn: true,
            auto,
            remember,
            email: remember ? email.trim() : "",
            name: display.slice(0, 40),
            status,
          },
        }));
        play("online", get().me.sound);
        later(1600, () => {
          const marina = get().contacts.find((c) => c.id === "marina");
          if (!marina || marina.blocked || !get().me.signedIn) return;
          get().deliver("marina", "entrou? o café esfriou e o lucas já ameaçou uma planilha.", "text");
        });
      },
      signOut: () => set((s) => ({ me: { ...s.me, signedIn: false }, typing: null })),
      setStatus: (status) => set((s) => ({ me: { ...s.me, status } })),
      setProfile: (patch) =>
        set((s) => ({
          me: {
            ...s.me,
            ...patch,
            name: patch.name !== undefined ? patch.name.trim().slice(0, 40) || s.me.name : s.me.name,
            message: patch.message !== undefined ? patch.message.slice(0, 80) : s.me.message,
            song: patch.song !== undefined ? patch.song.slice(0, 60) : s.me.song,
          },
        })),
      setOptions: (patch) => set((s) => ({ options: { ...s.options, ...patch } })),
      send: (peerId, text, style) => {
        const body = text.trim().slice(0, 500);
        const state = get();
        const contact = state.contacts.find((c) => c.id === peerId);
        if (!body || !contact || contact.blocked) return;
        const mine: Msg = { id: nid(), peerId, fromMe: true, text: body, at: Date.now(), kind: "text", ...style };
        const speaker = speakerFor(contact, state.contacts);
        const who = state.contacts.find((c) => c.id === speaker);
        set((s) => ({ messages: push(s.messages, mine), typing: { peerId, name: firstName(who?.name || contact.name) } }));
        play("send", state.me.sound);
        const offline = !contact.members && contact.status === "offline";
        const wait = offline ? 2800 : 900 + Math.round(Math.random() * 900);
        later(wait, () => {
          if (get().typing?.peerId === peerId) set({ typing: null });
          const current = get().contacts.find((c) => c.id === peerId);
          if (!current || current.blocked || !get().me.signedIn) return;
          if (offline) {
            set((s) => ({
              contacts: s.contacts.map((c) => (c.id === peerId ? { ...c, status: "online" } : c)),
            }));
            play("online", get().me.sound);
          }
          get().deliver(peerId, replyTo(speaker, body), "text", { authorId: speaker === peerId ? undefined : speaker });
        });
      },
      nudge: (peerId) => {
        const contact = get().contacts.find((c) => c.id === peerId);
        if (!contact || contact.blocked) return false;
        const last = nudgedAt.get(peerId) ?? 0;
        if (Date.now() - last < 8000) return false;
        nudgedAt.set(peerId, Date.now());
        const line: Msg = {
          id: nid(),
          peerId,
          fromMe: true,
          text: `Você cutucou ${firstName(contact.name)}.`,
          at: Date.now(),
          kind: "nudge",
        };
        set((s) => ({ messages: push(s.messages, line) }));
        play("nudge", get().me.sound);
        later(700, () => {
          if (Math.random() > 0.55) return;
          const current = get().contacts.find((c) => c.id === peerId);
          if (!current || current.blocked) return;
          const speaker = speakerFor(current, get().contacts);
          const who = get().contacts.find((c) => c.id === speaker);
          get().deliver(peerId, `${firstName(who?.name || current.name)} cutucou você de volta.`, "nudge", {
            authorId: speaker === peerId ? undefined : speaker,
          });
        });
        return true;
      },
      wink: (peerId) => {
        const contact = get().contacts.find((c) => c.id === peerId);
        if (!contact || contact.blocked) return;
        const line: Msg = {
          id: nid(),
          peerId,
          fromMe: true,
          text: `Você piscou para ${firstName(contact.name)}.`,
          at: Date.now(),
          kind: "wink",
        };
        set((s) => ({ messages: push(s.messages, line) }));
        later(800, () => {
          const current = get().contacts.find((c) => c.id === peerId);
          if (!current || current.blocked) return;
          const speaker = speakerFor(current, get().contacts);
          const who = get().contacts.find((c) => c.id === speaker);
          get().deliver(peerId, `${firstName(who?.name || current.name)} piscou de volta.`, "wink", {
            authorId: speaker === peerId ? undefined : speaker,
          });
        });
      },
      sendFile: (peerId, fileName) => {
        const contact = get().contacts.find((c) => c.id === peerId);
        if (!contact || contact.blocked) return;
        const line: Msg = {
          id: nid(),
          peerId,
          fromMe: true,
          text: "Arquivo enviado",
          at: Date.now(),
          kind: "file",
          fileName: fileName.slice(0, 80),
          fileState: "saved",
        };
        set((s) => ({ messages: push(s.messages, line) }));
        const speaker = speakerFor(contact, get().contacts);
        later(1100, () => {
          const current = get().contacts.find((c) => c.id === peerId);
          if (!current || current.blocked) return;
          get().deliver(peerId, "quer te mandar um arquivo de volta.", "file", {
            fileName: "de-volta.jpg",
            fileState: "offered",
            authorId: speaker === peerId ? undefined : speaker,
          });
        });
      },
      sendVoice: (peerId) => {
        const contact = get().contacts.find((c) => c.id === peerId);
        if (!contact || contact.blocked) return;
        const line: Msg = {
          id: nid(),
          peerId,
          fromMe: true,
          text: "Clipe de voz",
          at: Date.now(),
          kind: "voice",
        };
        set((s) => ({ messages: push(s.messages, line) }));
        play("voice", get().me.sound);
        const speaker = speakerFor(contact, get().contacts);
        later(1200, () => {
          const current = get().contacts.find((c) => c.id === peerId);
          if (!current || current.blocked) return;
          get().deliver(peerId, "clipe de voz", "voice", { authorId: speaker === peerId ? undefined : speaker });
        });
      },
      note: (peerId, text) => {
        const msg: Msg = { id: nid(), peerId, fromMe: false, text, at: Date.now(), kind: "system" };
        set((s) => ({ messages: push(s.messages, msg) }));
      },
      resolveFile: (id, accept) => {
        const msg = get().messages.find((item) => item.id === id);
        if (!msg || msg.fileState !== "offered") return;
        set((s) => ({
          messages: s.messages.map((item) => (item.id === id ? { ...item, fileState: accept ? "saved" : "declined" } : item)),
        }));
        if (accept) {
          later(500, () => {
            get().deliver(msg.peerId, "arquivo aceito. se for planilha, a culpa é do lucas.", "text", { authorId: msg.authorId });
          });
        }
      },
      addContact: ({ name, message, group, photo, email }) => {
        const id = nid();
        const contact: Contact = {
          id,
          name: name.trim().slice(0, 40) || "Contato novo",
          message: message.trim().slice(0, 80),
          status: "online",
          photo,
          group: group.trim().slice(0, 24) || "Amigos",
          blocked: false,
          song: "",
          email: email.trim().slice(0, 60),
        };
        set((s) => ({
          contacts: [...s.contacts, contact],
          groups: s.groups.includes(contact.group) ? s.groups : [...s.groups, contact.group],
        }));
        later(800, () => {
          if (!get().contacts.some((item) => item.id === id)) return;
          get().deliver(id, "aceitei o convite. pode falar.", "text");
        });
        return id;
      },
      addRoom: (name, memberIds) => {
        const id = nid();
        const members = memberIds.filter((item, index) => memberIds.indexOf(item) === index).slice(0, 8);
        const first = get().contacts.find((item) => item.id === members[0]);
        const contact: Contact = {
          id,
          name: name.trim().slice(0, 40) || "Conversa em grupo",
          message: members
            .map((item) => firstName(get().contacts.find((person) => person.id === item)?.name || item))
            .join(", "),
          status: "online",
          photo: first?.photo || "",
          group: "Grupos",
          blocked: false,
          song: "",
          email: "",
          members,
        };
        set((s) => ({
          contacts: [...s.contacts, contact],
          groups: s.groups.includes("Grupos") ? s.groups : [...s.groups, "Grupos"],
        }));
        return id;
      },
      removeContact: (id) =>
        set((s) => ({
          contacts: s.contacts.filter((c) => c.id !== id),
          messages: s.messages.filter((m) => m.peerId !== id),
          typing: s.typing?.peerId === id ? null : s.typing,
        })),
      renameContact: (id, name) =>
        set((s) => ({
          contacts: s.contacts.map((c) => (c.id === id ? { ...c, name: name.trim().slice(0, 40) || c.name } : c)),
        })),
      toggleBlock: (id) =>
        set((s) => ({
          contacts: s.contacts.map((c) => (c.id === id ? { ...c, blocked: !c.blocked } : c)),
        })),
      markRead: (id) => set((s) => ({ lastRead: { ...s.lastRead, [id]: Date.now() } })),
      clearThread: (id) => set((s) => ({ messages: s.messages.filter((m) => m.peerId !== id) })),
      clearAll: () => set({ messages: [], lastRead: {} }),
      bringOnline: (id) => {
        const contact = get().contacts.find((c) => c.id === id);
        if (!contact || contact.status !== "offline" || contact.blocked || contact.members) return;
        set((s) => ({
          contacts: s.contacts.map((c) => (c.id === id ? { ...c, status: "online" } : c)),
        }));
        play("online", get().me.sound);
        get().deliver(id, "entrei. disse que ia.", "system");
      },
    }),
    {
      name: "papo-v1",
      version: 2,
      skipHydration: true,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        me: s.me,
        contacts: s.contacts,
        messages: s.messages,
        lastRead: s.lastRead,
        options: s.options,
        groups: s.groups,
      }),
      migrate: (persisted) => {
        const saved = (persisted ?? {}) as Partial<Messenger>;
        return {
          me: { ...meSeed, ...saved.me },
          contacts: hydrateContacts(saved.contacts),
          messages: saved.messages ?? [],
          lastRead: saved.lastRead ?? {},
          options: { ...defaultOptions, ...saved.options },
          groups: saved.groups?.length ? saved.groups : groupSeed,
        };
      },
    },
  ),
);
