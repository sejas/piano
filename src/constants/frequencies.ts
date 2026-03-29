import type { NoteName, Octave } from "../types/music";

const SEMITONE_OFFSET: Record<NoteName, number> = {
  Do: 0,
  Re: 2,
  Mi: 4,
  Fa: 5,
  Sol: 7,
  La: 9,
  Si: 11,
};

export function getFrequency(
  name: NoteName,
  octave: Octave,
  sharp?: boolean,
): number {
  const midiNote = (octave + 1) * 12 + SEMITONE_OFFSET[name] + (sharp ? 1 : 0);
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

export function getDurationBeats(
  duration: "r" | "b" | "n" | "c" | "s",
): number {
  const beats: Record<string, number> = { r: 4, b: 2, n: 1, c: 0.5, s: 0.25 };
  return beats[duration];
}
