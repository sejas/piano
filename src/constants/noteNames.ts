import type { NoteName } from "../types/music";

export const ENGLISH_TO_SPANISH: Record<string, NoteName> = {
  c: "Do",
  d: "Re",
  e: "Mi",
  f: "Fa",
  g: "Sol",
  a: "La",
  b: "Si",
};

export const SPANISH_NAMES: Record<string, NoteName> = {
  do: "Do",
  re: "Re",
  mi: "Mi",
  fa: "Fa",
  sol: "Sol",
  la: "La",
  si: "Si",
};

export const ALL_NOTE_NAMES = new Set([
  ...Object.keys(ENGLISH_TO_SPANISH),
  ...Object.keys(SPANISH_NAMES),
]);

export const NOTE_ORDER: NoteName[] = [
  "Do",
  "Re",
  "Mi",
  "Fa",
  "Sol",
  "La",
  "Si",
];
