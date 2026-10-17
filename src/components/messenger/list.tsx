import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { ChevronDown, Music, Plus, Search, Users, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/cn";
import { MY_STATUSES, STATUS_LABEL, roomStatus, type Contact } from "@/lib/messenger/model";
import { useMessenger } from "@/lib/messenger/store";
import { dot, Frame, Portrait, Rich, squash, useDesk } from "@/components/messenger/ui";

type Menu = "arquivo" | "contatos" | "acoes" | "ferramentas" | "quero" | "status" | null;

export function List() {
  const desk = useDesk();
  const me = useMessenger((s) => s.me);
  const contacts = useMessenger((s) => s.contacts);
  const messages = useMessenger((s) => s.messages);
  const lastRead = useMessenger((s) => s.lastRead);
  const groups = useMessenger((s) => s.groups);
  const options = useMessenger((s) => s.options);
  const setStatus = useMessenger((s) => s.setStatus);
  const setProfile = useMessenger((s) => s.setProfile);
  const setOptions = useMessenger((s) => s.setOptions);
  const addContact = useMessenger((s) => s.addContact);
  const addRoom = useMessenger((s) => s.addRoom);
  const nudge = useMessenger((s) => s.nudge);
  const toggleBlock = useMessenger((s) => s.toggleBlock);
  const removeContact = useMessenger((s) => s.removeContact);
  const clearThread = useMessenger((s) => s.clearThread);
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<Menu>(null);
  const [adding, setAdding] = useState(false);
  const [room, setRoom] = useState(false);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [edit, setEdit] = useState<"name" | "message" | "song" | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const q = query.trim().toLowerCase();
  const visible = contacts.filter((c) => !q || `${c.name} ${c.message} ${c.email} ${c.group}`.toLowerCase().includes(q));

  function unread(id: string) {
    const since = lastRead[id] ?? 0;
    return messages.filter((m) => m.peerId === id && !m.fromMe && m.kind !== "system" && m.at > since).length;
  }

  function toggle(next: Menu) {
    setMenu((current) => (current === next ? null : next));
  }

  function open(id: string) {
    setMenu(null);
    desk.openChat(id);
  }

  const current = contacts.find((c) => c.id === desk.active) ?? null;

  function sections() {
    const blocked = visible.filter((c) => c.blocked);
    const free = visible.filter((c) => !c.blocked);
    if (options.view === "status") {
      const online = free.filter((c) => roomStatus(c, contacts) !== "offline");
      const offline = free.filter((c) => roomStatus(c, contacts) === "offline");
      return [
        { key: "online", title: "Online", items: online },
        ...(options.showOffline ? [{ key: "offline", title: "Offline", items: offline }] : []),
        ...(blocked.length ? [{ key: "blocked", title: "Bloqueados", items: blocked }] : []),
      ];
    }
    const grouped = groups
      .map((group) => ({
        key: group,
        title: group,
        items: free.filter((c) => c.group === group && (options.showOffline || roomStatus(c, contacts) !== "offline")),
      }))
      .filter((group) => group.items.length);
    return [...grouped, ...(blocked.length ? [{ key: "blocked", title: "Bloqueados", items: blocked }] : [])];
  }

  return (
    <Frame title="Papo" onPark={desk.park}>
      <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-papo-line bg-chrome px-1">
        {(
          [
            ["arquivo", "Arquivo"],
            ["contatos", "Contatos"],
            ["acoes", "Ações"],
            ["ferramentas", "Ferramentas"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" className={cn("h-11 shrink-0 px-2 text-xs font-semibold", menu === id ? "bg-blue text-on-blue" : "text-papo-ink")} onClick={() => toggle(id)}>
            {label}
          </button>
        ))}
        <button type="button" className="h-11 shrink-0 px-2 text-xs font-semibold text-papo-ink" onClick={() => { setMenu(null); desk.openHelp(); }}>
          Ajuda
        </button>
      </nav>
      {menu === "arquivo" ? (
        <MenuList>
          <MenuItem onClick={() => toggle("status")}>Meu status</MenuItem>
          <MenuItem onClick={() => { setMenu(null); desk.park(); }}>Minimizar para a bandeja</MenuItem>
          <MenuItem onClick={() => { setMenu(null); desk.leave(); }}>Sair</MenuItem>
        </MenuList>
      ) : null}
      {menu === "status" ? (
        <MenuList>
          {MY_STATUSES.map((status) => (
            <MenuItem
              key={status}
              onClick={() => {
                setStatus(status);
                setMenu(null);
              }}
            >
              <span className={cn("size-2.5 rounded-full", dot[status === "invisible" ? "off" : status === "online" ? "online" : status === "busy" || status === "phone" ? "busy" : "away"])} />
              {STATUS_LABEL[status]}
            </MenuItem>
          ))}
        </MenuList>
      ) : null}
      {menu === "contatos" ? (
        <MenuList>
          <MenuItem onClick={() => { setMenu(null); setRoom(false); setAdding(true); }}>Adicionar um contato</MenuItem>
          <MenuItem onClick={() => { setMenu(null); setAdding(false); setRoom(true); }}>Nova conversa em grupo</MenuItem>
          <MenuItem onClick={() => setOptions({ showOffline: !options.showOffline })}>{options.showOffline ? "Ocultar offline" : "Mostrar offline"}</MenuItem>
          <MenuItem onClick={() => setOptions({ view: options.view === "group" ? "status" : "group" })}>
            {options.view === "group" ? "Ver por status" : "Ver por grupo"}
          </MenuItem>
        </MenuList>
      ) : null}
      {menu === "acoes" ? (
        <MenuList>
          {current ? (
            <>
              <MenuItem onClick={() => open(current.id)}>Conversar com {current.name}</MenuItem>
              <MenuItem onClick={() => { const ok = nudge(current.id); if (ok) desk.bump("nudge"); setMenu(null); open(current.id); }}>Cutucar</MenuItem>
              <MenuItem onClick={() => { toggleBlock(current.id); setMenu(null); }}>{current.blocked ? "Desbloquear" : "Bloquear"}</MenuItem>
              <MenuItem onClick={() => { setMenu(null); desk.openCard(current.id); }}>Ver cartão</MenuItem>
              <MenuItem
                onClick={() => {
                  if (window.confirm(`Tirar ${current.name} da lista?`)) {
                    removeContact(current.id);
                    desk.closeTab(current.id);
                  }
                  setMenu(null);
                }}
              >
                Apagar contato
              </MenuItem>
            </>
          ) : (
            <p className="px-3 py-3 text-sm text-papo-muted">Escolhe alguém na lista.</p>
          )}
        </MenuList>
      ) : null}
      {menu === "ferramentas" ? (
        <MenuList>
          <MenuItem onClick={() => { setMenu(null); desk.openOptions(); }}>Opções</MenuItem>
          <MenuItem onClick={() => setProfile({ sound: !me.sound })}>{me.sound ? "Desligar sons" : "Ligar sons"}</MenuItem>
          {current ? <MenuItem onClick={() => { clearThread(current.id); setMenu(null); }}>Limpar conversa atual</MenuItem> : null}
        </MenuList>
      ) : null}
      <div className="flex gap-3 border-b border-papo-line bg-papo-paper p-3">
        <label className="relative shrink-0">
          <Portrait src={me.photo} name={me.name} status={me.status} className="size-16" />
          <span className="sr-only">trocar foto</span>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              void squash(file).then((src) => {
                if (src) setProfile({ photo: src });
              });
            }}
          />
        </label>
        <div className="min-w-0 flex-1">
          {edit === "name" ? (
            <input
              autoFocus
              defaultValue={me.name}
              maxLength={40}
              aria-label="seu nome"
              className="h-11 w-full border border-papo-line bg-papo-paper px-2 text-base font-bold"
              onBlur={(event) => {
                setProfile({ name: event.target.value });
                setEdit(null);
              }}
            />
          ) : (
            <button type="button" className="block max-w-full truncate text-left text-base font-bold text-papo-ink" onClick={() => setEdit("name")}>
              {me.name}
            </button>
          )}
          {edit === "message" ? (
            <input
              autoFocus
              defaultValue={me.message}
              maxLength={80}
              aria-label="mensagem pessoal"
              className="mt-1 h-11 w-full border border-papo-line px-2 text-base"
              onBlur={(event) => {
                setProfile({ message: event.target.value });
                setEdit(null);
              }}
            />
          ) : (
            <button type="button" className="mt-0.5 block max-w-full truncate text-left text-sm text-papo-muted italic" onClick={() => setEdit("message")}>
              <Rich text={me.message || "<Digite uma mensagem pessoal>"} />
            </button>
          )}
          <button type="button" className="mt-1 inline-flex max-w-full items-center gap-1 text-sm text-blue" onClick={() => toggle("status")}>
            <span className={cn("size-2.5 rounded-full", dot[me.status === "invisible" ? "off" : me.status === "online" ? "online" : me.status === "busy" || me.status === "phone" ? "busy" : "away"])} />
            {STATUS_LABEL[me.status]}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 border-b border-papo-line px-3">
        <Music className="size-4 shrink-0 text-papo-muted" />
        {edit === "song" ? (
          <input
            autoFocus
            defaultValue={me.song}
            maxLength={60}
            aria-label="ouvindo agora"
            placeholder="o que você está ouvindo"
            className="h-11 min-w-0 flex-1 border border-papo-line bg-papo-paper px-2 text-base"
            onBlur={(event) => {
              setProfile({ song: event.target.value });
              setEdit(null);
            }}
          />
        ) : (
          <button type="button" className="h-11 min-w-0 flex-1 truncate text-left text-sm text-papo-muted" onClick={() => setEdit("song")}>
            {me.song ? `Ouvindo: ${me.song}` : "<Digite o que você está ouvindo>"}
          </button>
        )}
        <button type="button" className="inline-flex size-11 items-center justify-center" aria-label={me.sound ? "desligar som" : "ligar som"} onClick={() => setProfile({ sound: !me.sound })}>
          {me.sound ? <Volume2 className="size-5 text-blue" /> : <VolumeX className="size-5 text-papo-muted" />}
        </button>
      </div>
      <div className="relative border-b border-papo-line">
        <button type="button" className="flex h-11 w-full items-center justify-between px-3 text-left text-sm font-semibold text-papo-ink" onClick={() => toggle("quero")}>
          Eu quero…
          <ChevronDown className="size-4" />
        </button>
        {menu === "quero" ? (
          <MenuList>
            <MenuItem onClick={() => { setMenu(null); setRoom(false); setAdding(true); }}>Adicionar um contato</MenuItem>
            <MenuItem
              onClick={() => {
                const first = contacts.find((c) => !c.blocked && roomStatus(c, contacts) !== "offline");
                if (first) open(first.id);
                else setMenu(null);
              }}
            >
              Enviar uma mensagem instantânea
            </MenuItem>
            <MenuItem onClick={() => { setMenu(null); photoRef.current?.click(); }}>Mudar minha foto</MenuItem>
            <MenuItem onClick={() => { setMenu(null); setEdit("song"); }}>Dizer o que estou ouvindo</MenuItem>
            <MenuItem onClick={() => { setMenu(null); desk.openOptions(); }}>Mudar minhas opções</MenuItem>
          </MenuList>
        ) : null}
      </div>
      <label className="relative block border-b border-papo-line">
        <span className="sr-only">buscar contatos</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-papo-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar contato" className="h-11 w-full bg-papo-paper pr-3 pl-10 text-base outline-none" />
      </label>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {adding ? (
          <AddForm
            groups={groups}
            onClose={() => setAdding(false)}
            onCreate={(input) => {
              const id = addContact(input);
              setAdding(false);
              open(id);
            }}
          />
        ) : null}
        {room ? (
          <RoomForm
            contacts={contacts.filter((c) => !c.members && !c.blocked)}
            onClose={() => setRoom(false)}
            onCreate={(name, ids) => {
              const id = addRoom(name, ids);
              setRoom(false);
              open(id);
            }}
          />
        ) : null}
        {sections().map((section) => (
          <section key={section.key}>
            <button
              type="button"
              className="flex h-11 w-full items-center justify-between px-3 text-left text-xs font-bold tracking-wide text-papo-muted uppercase"
              onClick={() => setClosed((s) => ({ ...s, [section.key]: !s[section.key] }))}
            >
              {section.title}
              <span>{section.items.length}</span>
            </button>
            {closed[section.key]
              ? null
              : section.items.map((contact) => (
                  <Row key={contact.id} contact={contact} unread={unread(contact.id)} current={desk.active === contact.id} onOpen={() => open(contact.id)} />
                ))}
          </section>
        ))}
        {!visible.length ? <p className="px-3 py-6 text-center text-sm text-papo-muted">Ninguém com esse nome.</p> : null}
      </div>
    </Frame>
  );
}

function MenuList({ children }: { children: ReactNode }) {
  return <div className="border-b border-papo-line bg-papo-paper">{children}</div>;
}

function MenuItem({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm text-papo-ink" onClick={onClick}>
      {children}
    </button>
  );
}

function Row({ contact, unread, current, onOpen }: { contact: Contact; unread: number; current: boolean; onOpen: () => void }) {
  const all = useMessenger((s) => s.contacts);
  const status = contact.blocked ? "offline" : roomStatus(contact, all);
  return (
    <button type="button" onClick={onOpen} className={cn("flex min-h-11 w-full items-center gap-2 px-3 py-1.5 text-left", current ? "bg-blue text-on-blue" : "hover:bg-papo-paper")}>
      <Portrait src={contact.photo} name={contact.name} status={contact.blocked ? "offline" : status} className="size-10" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1">
          {contact.members ? <Users className="size-3.5 shrink-0" /> : null}
          <span className={cn("truncate text-sm font-bold", !current && status === "offline" && "text-papo-muted")}>{contact.name}</span>
        </span>
        <span className={cn("block truncate text-xs", current ? "text-on-blue" : "text-papo-muted")}>
          {contact.blocked ? "Bloqueado" : contact.song ? `Ouvindo ${contact.song}` : contact.message || STATUS_LABEL[status]}
        </span>
      </span>
      {unread > 0 ? <span className="grid min-w-6 place-items-center rounded-full bg-busy px-1.5 text-xs font-bold text-on-blue">{unread}</span> : null}
    </button>
  );
}

function AddForm({
  groups,
  onClose,
  onCreate,
}: {
  groups: string[];
  onClose: () => void;
  onCreate: (input: { name: string; message: string; group: string; photo: string; email: string }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [group, setGroup] = useState(groups[0] ?? "Amigos");
  const [fresh, setFresh] = useState("");
  const [photo, setPhoto] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !email.includes("@")) return;
    onCreate({ name, email, message, group: fresh.trim() || group, photo });
  }

  return (
    <form className="space-y-2 border-b border-papo-line bg-papo-paper p-3" onSubmit={submit}>
      <p className="text-sm font-bold text-papo-ink">Adicionar um contato</p>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e-mail" required className="h-11 w-full border border-papo-line bg-chrome px-2 text-base" />
      <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="apelido" required className="h-11 w-full border border-papo-line bg-chrome px-2 text-base" />
      <input value={message} onChange={(e) => setMessage(e.target.value)} maxLength={80} placeholder="mensagem pessoal" className="h-11 w-full border border-papo-line bg-chrome px-2 text-base" />
      <select value={group} onChange={(e) => setGroup(e.target.value)} className="h-11 w-full border border-papo-line bg-chrome px-2 text-base" aria-label="grupo">
        {groups.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <input value={fresh} onChange={(e) => setFresh(e.target.value)} maxLength={24} placeholder="ou um grupo novo" className="h-11 w-full border border-papo-line bg-chrome px-2 text-base" />
      <label className="inline-flex h-11 items-center gap-2 text-sm font-semibold text-blue">
        <Plus className="size-4" />
        foto
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            void squash(file).then((src) => {
              if (src) setPhoto(src);
            });
          }}
        />
      </label>
      <div className="flex gap-2">
        <button type="submit" className="h-11 flex-1 bg-blue text-sm font-bold text-on-blue">
          Adicionar
        </button>
        <button type="button" className="h-11 flex-1 border border-papo-line text-sm font-semibold" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function RoomForm({ contacts, onClose, onCreate }: { contacts: Contact[]; onClose: () => void; onCreate: (name: string, ids: string[]) => void }) {
  const [name, setName] = useState("galera");
  const [ids, setIds] = useState<string[]>([]);

  return (
    <form
      className="space-y-2 border-b border-papo-line bg-papo-paper p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (ids.length < 2) return;
        onCreate(name, ids);
      }}
    >
      <p className="text-sm font-bold text-papo-ink">Conversa em grupo</p>
      <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} aria-label="nome do grupo" className="h-11 w-full border border-papo-line bg-chrome px-2 text-base" />
      <div className="max-h-40 overflow-y-auto">
        {contacts.map((contact) => (
          <label key={contact.id} className="flex h-11 items-center gap-2 text-sm text-papo-ink">
            <input
              type="checkbox"
              checked={ids.includes(contact.id)}
              onChange={(event) => setIds((current) => (event.target.checked ? [...current, contact.id] : current.filter((id) => id !== contact.id)))}
            />
            {contact.name}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="submit" className="h-11 flex-1 bg-blue text-sm font-bold text-on-blue" disabled={ids.length < 2}>
          Criar
        </button>
        <button type="button" className="h-11 flex-1 border border-papo-line text-sm font-semibold" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
