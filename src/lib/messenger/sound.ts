let ctx: AudioContext | null = null;

function context() {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function beep(freq: number, at: number, dur: number, gain: number) {
  const audio = context();
  if (!audio) return;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(0.0001, audio.currentTime + at);
  amp.gain.exponentialRampToValueAtTime(gain, audio.currentTime + at + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + at + dur);
  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start(audio.currentTime + at);
  osc.stop(audio.currentTime + at + dur + 0.02);
}

export type SoundName = "message" | "nudge" | "online" | "send" | "ring" | "voice";

export function play(kind: SoundName, enabled: boolean) {
  if (!enabled) return;
  if (kind === "message") {
    beep(880, 0, 0.08, 0.05);
    beep(1175, 0.09, 0.1, 0.04);
  } else if (kind === "send") {
    beep(660, 0, 0.06, 0.03);
  } else if (kind === "online") {
    beep(523, 0, 0.08, 0.04);
    beep(659, 0.1, 0.08, 0.04);
    beep(784, 0.2, 0.12, 0.04);
  } else if (kind === "ring") {
    beep(740, 0, 0.14, 0.05);
    beep(620, 0.18, 0.16, 0.04);
  } else if (kind === "voice") {
    beep(420, 0, 0.06, 0.04);
    beep(510, 0.08, 0.06, 0.035);
    beep(460, 0.16, 0.1, 0.03);
  } else {
    beep(140, 0, 0.18, 0.07);
    beep(90, 0.16, 0.22, 0.06);
  }
}
