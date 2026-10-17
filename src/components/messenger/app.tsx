import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { MY_STATUSES, STATUS_LABEL, type Contact, type Status } from "@/lib/messenger/model";
import { useMessenger } from "@/lib/messenger/store";
import { Chat } from "@/components/messenger/chat";
import { List } from "@/components/messenger/list";
import { DeskCtx, Portrait, type DeskApi } from "@/components/messenger/ui";

type Toast = { id: string; peerId: string; text: string };

function Login({ onEnter }: { onEnter: () => void }) {
  const me = useMessenger((s) => s.me);
  const signIn = useMessenger((s) => s.signIn);
  const [email, setEmail] = useState(me.email);
  const [name, setName] = useState(me.name);
  const [status, setStatus] = useState<Status>(me.status === "offline" ? "online" : me.status);
  const [auto, setAuto] = useState(me.auto);
  const [remember, setRemember] = useState(me.remember);
  const [error, setError] = useState("");
  const [forgot, setForgot] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    const mail = email.trim();
    if (!mail.includes("@") || !mail.split("@")[1]?.includes(".")) {
      setError("Usa um e-mail com @ só para abrir a janela. Nada disso sai do aparelho.");
      return;
    }
    signIn({ email: mail, name, auto, remember, status });
    onEnter();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-desk p-3">
      <form onSubmit={submit} className="grid w-full max-w-3xl overflow-hidden border border-blue-deep bg-chrome shadow-md md:grid-cols-2 md:rounded-md">
        <div className="papo-title flex flex-col justify-between gap-6 p-6 text-on-blue">
          <div>
            <p className="font-display text-4xl font-extrabold tracking-tight">Papo</p>
            <p className="mt-2 max-w-xs text-sm">Mensagens instantâneas, cutucada, arquivo, voz, ligação e jogo. Tudo neste aparelho.</p>
          </div>
          <Portrait src={me.photo} name={name || "Papo"} status={status} className="size-16" />
        </div>
        <div className="space-y-3 p-4">
          <h1 className="font-display text-xl font-extrabold text-blue">Entrar</h1>
          <label className="block text-sm font-semibold text-papo-ink" htmlFor="papo-email">
            E-mail
            <input id="papo-email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" className="mt-1 h-11 w-full border border-papo-line bg-papo-paper px-3 text-base outline-none focus:border-blue" />
          </label>
          <label className="block text-sm font-semibold text-papo-ink" htmlFor="papo-pass">
            Senha
            <input id="papo-pass" type="password" autoComplete="current-password" className="mt-1 h-11 w-full border border-papo-line bg-papo-paper px-3 text-base outline-none focus:border-blue" />
          </label>
          <label className="block text-sm font-semibold text-papo-ink" htmlFor="papo-name">
            Nome na lista
            <input id="papo-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="mt-1 h-11 w-full border border-papo-line bg-papo-paper px-3 text-base outline-none focus:border-blue" />
          </label>
          <label className="block text-sm font-semibold text-papo-ink" htmlFor="papo-status">
            Entrar como
            <select id="papo-status" value={status} onChange={(e) => setStatus(e.target.value as Status)} className="mt-1 h-11 w-full border border-papo-line bg-papo-paper px-3 text-base">
              {MY_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {STATUS_LABEL[item]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm text-papo-ink">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Lembrar meu e-mail
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm text-papo-ink">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
            Entrar automaticamente
          </label>
          <button type="button" className="text-left text-sm font-semibold text-blue" onClick={() => setForgot(true)}>
            Esqueci a senha
          </button>
          {forgot ? <p className="text-sm text-papo-muted">A senha não fica guardada. Ela só abre a janela neste aparelho. Pode entrar de novo com o e-mail.</p> : null}
          {error ? <p className="text-sm text-busy">{error}</p> : null}
          <button type="submit" className="h-11 w-full bg-blue text-sm font-bold text-on-blue">
            Entrar
          </button>
        </div>
      </form>
    </div>
  );
}

function MessengerApp() {
  const me = useMessenger((s) => s.me);
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const pending = useMessenger.persist.rehydrate();
    const done = () => setReady(true);
    if (pending instanceof Promise) void pending.then(done);
    else done();
  }, []);

  if (!ready) return <div className="min-h-dvh bg-desk" />;
  if (!entered && !(me.signedIn && me.auto)) return <Login onEnter={() => setEntered(true)} />;
  return <Desk onLeave={() => setEntered(false)} />;
}

function Desk({ onLeave }: { onLeave: () => void }) {
  const contacts = useMessenger((s) => s.contacts);
  const messages = useMessenger((s) => s.messages);
  const lastRead = useMessenger((s) => s.lastRead);
  const options = useMessenger((s) => s.options);
  const me = useMessenger((s) => s.me);
  const bringOnline = useMessenger((s) => s.bringOnline);
  const setStatus = useMessenger((s) => s.setStatus);
  const [active, setActive] = useState<string | null>(null);
  const [tabs, setTabs] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const [wink, setWink] = useState(false);
  const [parked, setParked] = useState(false);
  const [cardId, setCardId] = useState<string | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seen = useRef(false);
  const prevLen = useRef(0);
  const prevStatus = useRef<Record<string, string>>({});
  const autoAway = useRef(false);

  const openChat = useCallback((id: string) => {
    setTabs((current) => (current.includes(id) ? current : [...current, id].slice(-6)));
    setActive(id);
    setParked(false);
  }, []);

  const tabsRef = useRef<string[]>([]);
  tabsRef.current = tabs;
  const closeTab = useCallback((id: string) => {
    const rest = tabsRef.current.filter((item) => item !== id);
    setTabs(rest);
    setActive((open) => (open === id ? (rest[rest.length - 1] ?? null) : open));
  }, []);

  const showList = useCallback(() => setActive(null), []);
  const park = useCallback(() => setParked(true), []);
  const leave = useCallback(() => {
    useMessenger.getState().signOut();
    onLeave();
  }, [onLeave]);
  const bump = useCallback((kind: "nudge" | "wink") => {
    if (kind === "nudge") {
      setShake(true);
      window.setTimeout(() => setShake(false), 480);
    } else {
      setWink(true);
      window.setTimeout(() => setWink(false), 1400);
    }
  }, []);

  const api = useMemo<DeskApi>(
    () => ({
      active,
      tabs,
      shake,
      wink,
      openChat,
      closeTab,
      openCard: setCardId,
      openOptions: () => setOptionsOpen(true),
      openHelp: () => setHelpOpen(true),
      park,
      showList,
      leave,
      bump,
    }),
    [active, tabs, shake, wink, openChat, closeTab, park, showList, leave, bump],
  );

  useEffect(() => {
    const onlineLater = window.setTimeout(() => bringOnline("thiago"), 9000);
    const ping = window.setTimeout(() => {
      const camila = useMessenger.getState().contacts.find((item) => item.id === "camila");
      if (!camila || camila.blocked || !useMessenger.getState().me.signedIn) return;
      useMessenger.getState().deliver("camila", "sábado ainda está de pé. você vem ou só cutuca?", "text");
    }, 14000);
    return () => {
      window.clearTimeout(onlineLater);
      window.clearTimeout(ping);
    };
  }, [bringOnline]);

  useEffect(() => {
    let timer = window.setTimeout(idle, 90000);
    function idle() {
      if (useMessenger.getState().me.status === "online") {
        autoAway.current = true;
        setStatus("away");
      }
    }
    function wake() {
      window.clearTimeout(timer);
      if (autoAway.current && useMessenger.getState().me.status === "away") {
        autoAway.current = false;
        setStatus("online");
      }
      timer = window.setTimeout(idle, 90000);
    }
    window.addEventListener("pointerdown", wake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", wake);
    };
  }, [setStatus]);

  useEffect(() => {
    if (!seen.current) {
      seen.current = true;
      prevLen.current = messages.length;
      prevStatus.current = Object.fromEntries(contacts.map((item) => [item.id, item.status]));
      return;
    }
    const fresh = messages.slice(prevLen.current);
    prevLen.current = messages.length;
    const next: Toast[] = [];
    for (const msg of fresh) {
      if (msg.fromMe || msg.kind === "system") continue;
      if (!options.alerts) continue;
      if (!parked && msg.peerId === active) continue;
      const who = contacts.find((item) => item.id === (msg.authorId || msg.peerId));
      const text = msg.kind === "nudge" ? `${who?.name ?? "Alguém"} cutucou você` : msg.kind === "wink" ? `${who?.name ?? "Alguém"} piscou` : msg.kind === "file" ? `${who?.name ?? "Alguém"} enviou um arquivo` : msg.kind === "voice" ? `${who?.name ?? "Alguém"} mandou um clipe` : `${who?.name ?? "Alguém"}: ${msg.text}`;
      next.push({ id: msg.id, peerId: msg.peerId, text: text.slice(0, 90) });
    }
    for (const contact of contacts) {
      const before = prevStatus.current[contact.id];
      if (before === "offline" && contact.status === "online" && options.alerts) {
        next.push({ id: `on-${contact.id}-${contact.status}`, peerId: contact.id, text: `${contact.name} entrou` });
      }
      prevStatus.current[contact.id] = contact.status;
    }
    if (next.length) setToasts((current) => [...next, ...current].slice(0, 3));
  }, [messages, contacts, active, parked, options.alerts]);

  const unread = messages.filter((msg) => !msg.fromMe && msg.kind !== "system" && msg.at > (lastRead[msg.peerId] ?? 0)).length;

  if (parked) {
    return (
      <div className="flex min-h-dvh items-end bg-desk p-3">
        <button type="button" className="flex h-11 w-full items-center justify-between bg-blue px-4 text-on-blue" onClick={() => setParked(false)}>
          <span className="font-display text-base font-extrabold">Papo — {me.name}</span>
          <span className="text-sm">{unread ? `${unread} novas` : STATUS_LABEL[me.status]}</span>
        </button>
      </div>
    );
  }

  return (
    <DeskCtx.Provider value={api}>
      <div className="flex h-dvh flex-col bg-desk md:p-3">
        {toasts.slice(0, 2).map((toast) => (
          <div key={toast.id} className="mx-auto flex h-11 w-full max-w-5xl items-center bg-blue text-on-blue">
            <button type="button" className="h-11 min-w-0 flex-1 truncate px-3 text-left text-sm" onClick={() => { openChat(toast.peerId); setToasts((current) => current.filter((item) => item.id !== toast.id)); }}>
              {toast.text}
            </button>
            <button type="button" className="inline-flex size-11 items-center justify-center" aria-label="dispensar aviso" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}>
              <X className="size-4" />
            </button>
          </div>
        ))}
        <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 gap-3">
          <div className={cn("min-h-0 w-full md:w-80", active ? "hidden md:block" : "block")}>
            <List />
          </div>
          <div className={cn("min-h-0 min-w-0 flex-1", active ? "flex" : "hidden md:flex")}>
            <Chat />
          </div>
        </div>
      </div>
      {optionsOpen ? <OptionsDialog onClose={() => setOptionsOpen(false)} /> : null}
      {helpOpen ? <HelpDialog onClose={() => setHelpOpen(false)} /> : null}
      {cardId ? <CardDialog id={cardId} onClose={() => setCardId(null)} onOpen={openChat} /> : null}
    </DeskCtx.Provider>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-blue-deep/70 p-3" role="presentation" onMouseDown={onClose}>
      <div className="max-h-full w-full max-w-sm overflow-y-auto border border-blue-deep bg-chrome shadow-md" role="dialog" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="papo-title flex h-11 items-center justify-between px-3 text-on-blue">
          <h2 className="font-display text-base font-extrabold">{title}</h2>
          <button type="button" className="inline-flex size-11 items-center justify-center" aria-label="fechar" onClick={onClose}>
            <X className="size-4" />
          </button>
        </header>
        <div className="space-y-3 p-4">{children}</div>
      </div>
    </div>
  );
}

function OptionsDialog({ onClose }: { onClose: () => void }) {
  const options = useMessenger((s) => s.options);
  const setOptions = useMessenger((s) => s.setOptions);
  const me = useMessenger((s) => s.me);
  const setProfile = useMessenger((s) => s.setProfile);
  const clearAll = useMessenger((s) => s.clearAll);

  return (
    <Sheet title="Opções" onClose={onClose}>
      <Check on={me.sound} onClick={() => setProfile({ sound: !me.sound })} label="Sons de mensagem, cutucada e entrada" />
      <Check on={options.alerts} onClick={() => setOptions({ alerts: !options.alerts })} label="Avisos quando chega mensagem" />
      <Check on={options.showOffline} onClick={() => setOptions({ showOffline: !options.showOffline })} label="Mostrar contatos offline" />
      <Check on={options.view === "group"} onClick={() => setOptions({ view: options.view === "group" ? "status" : "group" })} label="Agrupar por grupo" />
      <Check on={options.enterSends} onClick={() => setOptions({ enterSends: !options.enterSends })} label="Enter envia a mensagem" />
      <Check on={options.showTime} onClick={() => setOptions({ showTime: !options.showTime })} label="Mostrar horário na conversa" />
      <Check on={options.mono} onClick={() => setOptions({ mono: !options.mono })} label="Fonte de máquina" />
      <div className="flex gap-2">
        {(["plain", "lines", "grid"] as const).map((scene) => (
          <button key={scene} type="button" className={cn("h-11 flex-1 text-sm font-semibold", options.scene === scene ? "bg-blue text-on-blue" : "border border-papo-line text-papo-ink")} onClick={() => setOptions({ scene })}>
            {scene === "plain" ? "Liso" : scene === "lines" ? "Pauta" : "Grade"}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="h-11 w-full border border-busy text-sm font-semibold text-busy"
        onClick={() => {
          if (window.confirm("Apagar o histórico de todas as conversas neste aparelho?")) clearAll();
        }}
      >
        Limpar todo o histórico
      </button>
    </Sheet>
  );
}

function Check({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-sm text-papo-ink">
      <input type="checkbox" checked={on} onChange={onClick} />
      {label}
    </label>
  );
}

function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="Ajuda" onClose={onClose}>
      <p className="text-sm text-papo-ink">Papo é a janela azul de mensagem instantânea. O nome é outro de propósito. Nada sai deste aparelho.</p>
      <ul className="list-disc space-y-1 pl-4 text-sm text-papo-muted">
        <li>Status: disponível, ocupado, ausente, volto logo, telefone, almoço e aparecer offline.</li>
        <li>Mensagem pessoal, foto e o que você está ouvindo.</li>
        <li>Grupos, busca, adicionar, bloquear e conversa em grupo.</li>
        <li>Negrito, itálico, sublinhado, cor, tamanho e fonte.</li>
        <li>Emoticons no texto, no estilo dos atalhos de sempre.</li>
        <li>Cutucar balança a janela. Piscar mostra a foto.</li>
        <li>Arquivo, clipe de voz, ligação e câmera.</li>
        <li>Jogo da velha e pedra, papel ou tesoura.</li>
        <li>Abas, histórico, salvar a conversa e avisos.</li>
        <li>Depois de um tempo sem mexer, você fica ausente.</li>
      </ul>
    </Sheet>
  );
}

function CardDialog({ id, onClose, onOpen }: { id: string; onClose: () => void; onOpen: (id: string) => void }) {
  const contacts = useMessenger((s) => s.contacts);
  const contact = contacts.find((item) => item.id === id);
  const rename = useMessenger((s) => s.renameContact);
  const toggleBlock = useMessenger((s) => s.toggleBlock);
  const [name, setName] = useState(contact?.name ?? "");
  if (!contact) return null;
  const members = (contact.members ?? []).map((item) => contacts.find((person) => person.id === item)).filter((item): item is Contact => Boolean(item));
  return (
    <Sheet title="Cartão" onClose={onClose}>
      <div className="flex items-center gap-3">
        <Portrait src={contact.photo} name={contact.name} status={contact.status} className="size-16" />
        <div className="min-w-0">
          <p className="truncate font-bold text-papo-ink">{contact.name}</p>
          <p className="text-sm text-papo-muted">{STATUS_LABEL[contact.status]}</p>
        </div>
      </div>
      <p className="text-sm text-papo-ink italic">{contact.message || "Sem mensagem pessoal"}</p>
      {contact.song ? <p className="text-sm text-blue">Ouvindo {contact.song}</p> : null}
      {contact.email ? <p className="text-sm text-papo-muted">{contact.email}</p> : null}
      <p className="text-sm text-papo-muted">Grupo: {contact.group}</p>
      {members.length ? <p className="text-sm text-papo-muted">Na sala: {members.map((item) => item.name).join(", ")}</p> : null}
      <label className="block text-sm font-semibold text-papo-ink">
        Apelido
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="mt-1 h-11 w-full border border-papo-line bg-papo-paper px-2 text-base" />
      </label>
      <button type="button" className="h-11 w-full bg-blue text-sm font-bold text-on-blue" onClick={() => { rename(contact.id, name); onOpen(contact.id); onClose(); }}>
        Conversar
      </button>
      <button type="button" className="h-11 w-full border border-papo-line text-sm font-semibold text-papo-ink" onClick={() => { rename(contact.id, name); }}>
        Salvar apelido
      </button>
      <button type="button" className="h-11 w-full text-sm font-semibold text-busy" onClick={() => toggleBlock(contact.id)}>
        {contact.blocked ? "Desbloquear" : "Bloquear"}
      </button>
    </Sheet>
  );
}

export { MessengerApp };
