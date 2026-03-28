import { describe, it, expect } from "vitest";
import {
  getNoteY,
  getStemDirection,
  layoutNotes,
  STAFF_CONFIG,
} from "./staffUtils";

describe("getNoteY", () => {
  it("places E4 on first line", () => {
    const y = getNoteY("Mi", 4);
    // In treble clef from top: F5, D5, B4, G4, E4
    // E4 is on the FIRST (bottom) line
    // topLineY is the top line. Bottom line = topLineY + 4 * lineSpacing
    expect(y).toBe(STAFF_CONFIG.topLineY + 4 * STAFF_CONFIG.lineSpacing);
  });

  it("places F5 on fifth (top) line", () => {
    const y = getNoteY("Fa", 5);
    expect(y).toBe(STAFF_CONFIG.topLineY);
  });

  it("places C4 below the staff (needs ledger line)", () => {
    const y = getNoteY("Do", 4);
    expect(y).toBeGreaterThan(
      STAFF_CONFIG.topLineY + 4 * STAFF_CONFIG.lineSpacing,
    );
  });

  it("places A5 above the staff (needs ledger line)", () => {
    const y = getNoteY("La", 5);
    expect(y).toBeLessThan(STAFF_CONFIG.topLineY);
  });
});

describe("getStemDirection", () => {
  it('returns "up" for notes below B4', () => {
    expect(getStemDirection("Do", 4)).toBe("up");
    expect(getStemDirection("La", 3)).toBe("up");
  });

  it('returns "down" for B4 and above', () => {
    expect(getStemDirection("Si", 4)).toBe("down");
    expect(getStemDirection("Do", 5)).toBe("down");
  });
});

describe("layoutNotes", () => {
  it("calculates x positions for notes", () => {
    const elements = [
      {
        type: "note" as const,
        name: "Do" as const,
        octave: 4 as const,
        duration: "n" as const,
      },
      {
        type: "note" as const,
        name: "Re" as const,
        octave: 4 as const,
        duration: "n" as const,
      },
    ];
    const layout = layoutNotes(elements, 800);
    expect(layout).toHaveLength(2);
    expect(layout[0].x).toBeLessThan(layout[1].x);
  });

  it("wraps to new staff line when exceeding width", () => {
    const elements = Array.from({ length: 30 }, () => ({
      type: "note" as const,
      name: "Do" as const,
      octave: 4 as const,
      duration: "n" as const,
    }));
    const layout = layoutNotes(elements, 400);
    const staffLines = new Set(layout.map((n) => n.staffLine));
    expect(staffLines.size).toBeGreaterThan(1);
  });
});
