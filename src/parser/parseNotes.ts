import type { MusicElement, NoteName, Duration, Octave } from "../types/music";
import { ENGLISH_TO_SPANISH, SPANISH_NAMES } from "../constants/noteNames";

export interface ParseError {
  token: string;
  index: number;
  message: string;
}

export interface ParseResult {
  elements: MusicElement[];
  errors: ParseError[];
}

const VALID_DURATIONS = new Set(["r", "b", "n", "c"]);
const VALID_OCTAVES = new Set([3, 4, 5, 6]);

function resolveNoteName(raw: string): NoteName | null {
  const lower = raw.toLowerCase();
  if (SPANISH_NAMES[lower]) return SPANISH_NAMES[lower];
  if (ENGLISH_TO_SPANISH[lower]) return ENGLISH_TO_SPANISH[lower];
  return null;
}

function parseToken(
  token: string,
  index: number,
):
  | { element: MusicElement; error: null }
  | { element: null; error: ParseError } {
  if (token === "||") {
    return { element: { type: "linebreak" }, error: null };
  }

  if (token === "|") {
    return { element: { type: "barline" }, error: null };
  }

  if (token.startsWith("-")) {
    let duration: Duration = "n";
    if (token.includes("/")) {
      const d = token.split("/")[1].toLowerCase();
      if (VALID_DURATIONS.has(d)) {
        duration = d as Duration;
      }
    }
    return { element: { type: "rest", duration }, error: null };
  }

  const match = token.match(/^([a-zA-Z]+)(\d)?\/?([a-zA-Z])?$/i);
  if (!match) {
    return {
      element: null,
      error: { token, index, message: `Unknown token: ${token}` },
    };
  }

  const [, rawName, rawOctave, rawDuration] = match;
  const name = resolveNoteName(rawName);
  if (!name) {
    return {
      element: null,
      error: { token, index, message: `Unknown token: ${token}` },
    };
  }

  let octave: Octave = 4;
  if (rawOctave) {
    const o = parseInt(rawOctave, 10);
    if (VALID_OCTAVES.has(o)) {
      octave = o as Octave;
    }
  }

  let duration: Duration = "n";
  if (rawDuration) {
    const d = rawDuration.toLowerCase();
    if (VALID_DURATIONS.has(d)) {
      duration = d as Duration;
    }
  }

  return {
    element: { type: "note", name, octave, duration },
    error: null,
  };
}

export function parseNotes(input: string): ParseResult {
  const elements: MusicElement[] = [];
  const errors: ParseError[] = [];

  if (!input.trim()) return { elements, errors };

  const tokens = input.trim().split(/\s+/);

  tokens.forEach((token, index) => {
    const result = parseToken(token, index);
    if (result.element) {
      elements.push(result.element);
    }
    if (result.error) {
      errors.push(result.error);
    }
  });

  return { elements, errors };
}
