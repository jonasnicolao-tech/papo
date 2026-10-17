import { createContext, useContext, type ReactNode } from "react";
import {
  Annoyed,
  Beer,
  Cake,
  Camera,
  Car,
  Cat,
  ChevronLeft,
  CloudRain,
  Coffee,
  Dog,
  Flower2,
  Frown,
  Gift,
  Glasses,
  Heart,
  HeartCrack,
  Laugh,
  Lightbulb,
  Mail,
  Meh,
  Minus,
  Moon,
  Music,
  Phone,
  Pizza,
  Plane,
  Smile,
  Star,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Umbrella,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { EMOTES, partsOf, statusBucket, type EmoteIcon, type FontSize, type Status, type Tone } from "@/lib/messenger/model";

export type DeskApi = {
  active: string | null;
  tabs: string[];
  shake: boolean;
  wink: boolean;
  openChat: (id: string) => void;
  closeTab: (id: string) => void;
  openCard: (id: string) => void;
  openOptions: () => void;
  openHelp: () => void;
  park: () => void;
  showList: () => void;
  leave: () => void;
  bump: (kind: "nudge" | "wink") => void;
};

export const DeskCtx = createContext<DeskApi | null>(null);

export function useDesk() {
  const ctx = useContext(DeskCtx);
  if (!ctx) throw new Error("fora da mesa");
  return ctx;
}

export const dot: Record<string, string> = {
  online: "bg-online",
  away: "bg-away",
  busy: "bg-busy",
  off: "bg-papo-line",
};

export const toneClass: Record<Tone, string> = {
  ink: "text-papo-ink",
  blue: "text-blue",
  busy: "text-busy",
  online: "text-online",
  away: "text-away",
};

export const swatch: Record<Tone, string> = {
  ink: "bg-papo-ink",
  blue: "bg-blue",
  busy: "bg-busy",
  online: "bg-online",
  away: "bg-away",
};

export const sizeClass: Record<FontSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

const EMOTICON = new Map(EMOTES.map((item) => [item.code, item.icon]));

const iconMap = {
  smile: Smile,
  sad: Frown,
  laugh: Laugh,
  shock: Meh,
  confused: Annoyed,
  cry: CloudRain,
  cool: Glasses,
  heart: Heart,
  broken: HeartCrack,
  kiss: Heart,
  yes: ThumbsUp,
  no: ThumbsDown,
  beer: Beer,
  coffee: Coffee,
  flower: Flower2,
  gift: Gift,
  star: Star,
  music: Music,
  pizza: Pizza,
  cake: Cake,
  cat: Cat,
  dog: Dog,
  plane: Plane,
  car: Car,
  phone: Phone,
  mail: Mail,
  camera: Camera,
  idea: Lightbulb,
  umbrella: Umbrella,
  sun: Sun,
  moon: Moon,
  rain: CloudRain,
} satisfies Record<Exclude<EmoteIcon, "tongue" | "wink">, typeof Smile>;

export function Face({ code }: { code: string }) {
  const found = EMOTICON.get(code);
  if (found === "tongue" || found === "wink" || !found) {
    return (
      <svg viewBox="0 0 24 24" className="inline size-4 align-text-bottom text-away" aria-label={code}>
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        {found === "wink" ? (
          <path d="M7 10h3M16 10h.01M8 15c1.2 1 2.6 1.4 4 1.4S14.8 16 16 15" stroke="var(--color-papo-ink)" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M8 10h.01M16 10h.01M8 14c1.2 1.4 2.5 2 4 2s2.8-.6 4-2" stroke="var(--color-papo-ink)" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        )}
      </svg>
    );
  }
  const Icon = iconMap[found];
  return <Icon className="inline size-4 align-text-bottom text-away" aria-label={code} />;
}

export function Rich({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {partsOf(text).map((part, index) =>
        part.emote ? <Face key={`${part.value}-${index}`} code={part.value} /> : <span key={index}>{part.value}</span>,
      )}
    </span>
  );
}

export function Portrait({ src, name, status, className }: { src: string; name: string; status?: Status; className?: string }) {
  const letter = name.trim().slice(0, 1).toUpperCase() || "?";
  return (
    <span className={cn("relative inline-flex shrink-0 overflow-hidden rounded-sm border border-papo-line bg-chrome", className)}>
      {src ? (
        <img
          src={src}
          alt=""
          className="size-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
            const fallback = event.currentTarget.nextElementSibling;
            if (fallback instanceof HTMLElement) fallback.hidden = false;
          }}
        />
      ) : null}
      <span hidden={Boolean(src)} className="absolute inset-0 grid place-items-center font-display text-sm font-extrabold text-blue">
        {letter}
      </span>
      {status ? <span className={cn("absolute right-0 bottom-0 size-2.5 rounded-full border border-papo-paper", dot[statusBucket(status)])} /> : null}
    </span>
  );
}

export function Frame({
  title,
  shake,
  onBack,
  onPark,
  extra,
  children,
}: {
  title: string;
  shake?: boolean;
  onBack?: () => void;
  onPark?: () => void;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden border border-blue-deep bg-chrome shadow-md md:rounded-md", shake && "papo-shake")}>
      <header className="papo-title flex h-11 shrink-0 items-center gap-1 px-1 text-on-blue">
        {onBack ? (
          <button type="button" className="inline-flex size-11 items-center justify-center md:hidden" onClick={onBack} aria-label="voltar à lista">
            <ChevronLeft className="size-5" />
          </button>
        ) : (
          <span className="ml-2 grid size-6 place-items-center rounded-sm bg-on-blue font-display text-xs font-extrabold text-blue">P</span>
        )}
        <h1 className="min-w-0 flex-1 truncate px-1 font-display text-base font-extrabold">{title}</h1>
        {extra}
        {onPark ? (
          <button type="button" className="inline-flex size-11 items-center justify-center" onClick={onPark} aria-label="minimizar para a bandeja">
            <Minus className="size-5" />
          </button>
        ) : null}
      </header>
      {children}
    </section>
  );
}

export function squash(file: File) {
  return new Promise<string>((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 240 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("");
    };
    img.src = url;
  });
}

export function clock(at: number) {
  return new Date(at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
