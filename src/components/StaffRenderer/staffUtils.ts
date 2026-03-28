import type { MusicElement, NoteName, Octave } from "../../types/music";

export const STAFF_CONFIG = {
  topLineY: 40,
  lineSpacing: 10,
  noteSpacing: 40,
  staffLeftMargin: 60,
  staffRightMargin: 20,
  staffLineGap: 80,
  noteHeadRx: 6,
  noteHeadRy: 4.5,
  stemLength: 30,
};

const STAFF_POSITION: Record<NoteName, number> = {
  Do: 0,
  Re: 1,
  Mi: 2,
  Fa: 3,
  Sol: 4,
  La: 5,
  Si: 6,
};

export function getNoteY(name: NoteName, octave: Octave): number {
  // F5 is at topLineY. Each diatonic step down = lineSpacing/2
  // F5 is Fa in octave 5 → STAFF_POSITION 3
  const notePos = STAFF_POSITION[name];
  const octaveDiff = 5 - octave;
  const refPos = STAFF_POSITION["Fa"]; // 3
  const stepsFromF5 = octaveDiff * 7 + (refPos - notePos);
  return STAFF_CONFIG.topLineY + stepsFromF5 * (STAFF_CONFIG.lineSpacing / 2);
}

export function getStemDirection(
  name: NoteName,
  octave: Octave,
): "up" | "down" {
  const y = getNoteY(name, octave);
  const middleLine = STAFF_CONFIG.topLineY + 2 * STAFF_CONFIG.lineSpacing;
  return y <= middleLine ? "down" : "up";
}

export function getLedgerLines(name: NoteName, octave: Octave): number[] {
  const y = getNoteY(name, octave);
  const topY = STAFF_CONFIG.topLineY;
  const bottomY = topY + 4 * STAFF_CONFIG.lineSpacing;
  const spacing = STAFF_CONFIG.lineSpacing;
  const lines: number[] = [];

  if (y > bottomY) {
    for (let ly = bottomY + spacing; ly <= y + 1; ly += spacing) {
      lines.push(ly);
    }
  } else if (y < topY) {
    for (let ly = topY - spacing; ly >= y - 1; ly -= spacing) {
      lines.push(ly);
    }
  }

  return lines;
}

export interface NoteLayout {
  elementIndex: number;
  x: number;
  y: number;
  staffLine: number;
}

export function layoutNotes(
  elements: MusicElement[],
  availableWidth: number,
): NoteLayout[] {
  const layout: NoteLayout[] = [];
  let currentX = STAFF_CONFIG.staffLeftMargin;
  let staffLine = 0;

  elements.forEach((el, index) => {
    if (el.type === "linebreak") {
      staffLine++;
      currentX = STAFF_CONFIG.staffLeftMargin;
      return;
    }

    if (el.type === "barline") {
      layout.push({ elementIndex: index, x: currentX, y: 0, staffLine });
      currentX += 20;
    } else {
      const noteWidth = STAFF_CONFIG.noteSpacing;
      if (
        currentX + noteWidth >
        availableWidth - STAFF_CONFIG.staffRightMargin
      ) {
        staffLine++;
        currentX = STAFF_CONFIG.staffLeftMargin;
      }

      let y = 0;
      if (el.type === "note") {
        y = getNoteY(el.name, el.octave);
      }

      layout.push({ elementIndex: index, x: currentX, y, staffLine });
      currentX += noteWidth;
    }
  });

  return layout;
}

export function getTotalStaffHeight(staffLineCount: number): number {
  const singleStaffHeight =
    STAFF_CONFIG.topLineY * 2 + 4 * STAFF_CONFIG.lineSpacing;
  return (
    staffLineCount * (singleStaffHeight + STAFF_CONFIG.staffLineGap) -
    STAFF_CONFIG.staffLineGap
  );
}
