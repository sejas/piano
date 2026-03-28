export type NoteName = "Do" | "Re" | "Mi" | "Fa" | "Sol" | "La" | "Si";
export type Duration = "r" | "b" | "n" | "c";
export type Octave = 3 | 4 | 5 | 6;

export interface Note {
  type: "note";
  name: NoteName;
  octave: Octave;
  duration: Duration;
}

export interface Rest {
  type: "rest";
  duration: Duration;
}

export interface BarLine {
  type: "barline";
}

export interface LineBreak {
  type: "linebreak";
}

export type MusicElement = Note | Rest | BarLine | LineBreak;

export interface Song {
  id: string;
  title: string;
  author?: string;
  category?: string;
  difficulty?: 1 | 2 | 3;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface ColorMap {
  Do: string;
  Re: string;
  Mi: string;
  Fa: string;
  Sol: string;
  La: string;
  Si: string;
}
