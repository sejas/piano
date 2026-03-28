import { describe, it, expect } from "vitest";
import { parseNotes } from "./parseNotes";

describe("parseNotes", () => {
  it("parses simple Spanish note names with default octave and duration", () => {
    const result = parseNotes("Do Re Mi");
    expect(result.elements).toEqual([
      { type: "note", name: "Do", octave: 4, duration: "n" },
      { type: "note", name: "Re", octave: 4, duration: "n" },
      { type: "note", name: "Mi", octave: 4, duration: "n" },
    ]);
    expect(result.errors).toEqual([]);
  });

  it("parses English note names and maps to Spanish", () => {
    const result = parseNotes("C D E");
    expect(result.elements).toEqual([
      { type: "note", name: "Do", octave: 4, duration: "n" },
      { type: "note", name: "Re", octave: 4, duration: "n" },
      { type: "note", name: "Mi", octave: 4, duration: "n" },
    ]);
  });

  it("parses explicit octave", () => {
    const result = parseNotes("Do5 Re3");
    expect(result.elements).toEqual([
      { type: "note", name: "Do", octave: 5, duration: "n" },
      { type: "note", name: "Re", octave: 3, duration: "n" },
    ]);
  });

  it("parses explicit duration", () => {
    const result = parseNotes("Do/b Re/c Mi/r");
    expect(result.elements).toEqual([
      { type: "note", name: "Do", octave: 4, duration: "b" },
      { type: "note", name: "Re", octave: 4, duration: "c" },
      { type: "note", name: "Mi", octave: 4, duration: "r" },
    ]);
  });

  it("parses octave + duration combined", () => {
    const result = parseNotes("Do5/b C3/c");
    expect(result.elements).toEqual([
      { type: "note", name: "Do", octave: 5, duration: "b" },
      { type: "note", name: "Do", octave: 3, duration: "c" },
    ]);
  });

  it("parses bar lines", () => {
    const result = parseNotes("Do Re | Mi Fa");
    expect(result.elements).toEqual([
      { type: "note", name: "Do", octave: 4, duration: "n" },
      { type: "note", name: "Re", octave: 4, duration: "n" },
      { type: "barline" },
      { type: "note", name: "Mi", octave: 4, duration: "n" },
      { type: "note", name: "Fa", octave: 4, duration: "n" },
    ]);
  });

  it("parses rests", () => {
    const result = parseNotes("Do - Re");
    expect(result.elements).toEqual([
      { type: "note", name: "Do", octave: 4, duration: "n" },
      { type: "rest", duration: "n" },
      { type: "note", name: "Re", octave: 4, duration: "n" },
    ]);
  });

  it("parses rests with duration", () => {
    const result = parseNotes("-/b -/c");
    expect(result.elements).toEqual([
      { type: "rest", duration: "b" },
      { type: "rest", duration: "c" },
    ]);
  });

  it("is case-insensitive", () => {
    const result = parseNotes("do RE mi SOL");
    expect(result.elements).toEqual([
      { type: "note", name: "Do", octave: 4, duration: "n" },
      { type: "note", name: "Re", octave: 4, duration: "n" },
      { type: "note", name: "Mi", octave: 4, duration: "n" },
      { type: "note", name: "Sol", octave: 4, duration: "n" },
    ]);
  });

  it("allows mixing Spanish and English", () => {
    const result = parseNotes("Do D Mi F");
    expect(result.elements).toEqual([
      { type: "note", name: "Do", octave: 4, duration: "n" },
      { type: "note", name: "Re", octave: 4, duration: "n" },
      { type: "note", name: "Mi", octave: 4, duration: "n" },
      { type: "note", name: "Fa", octave: 4, duration: "n" },
    ]);
  });

  it("reports errors for unknown tokens without breaking", () => {
    const result = parseNotes("Do xyz Re");
    expect(result.elements).toEqual([
      { type: "note", name: "Do", octave: 4, duration: "n" },
      { type: "note", name: "Re", octave: 4, duration: "n" },
    ]);
    expect(result.errors).toEqual([
      { token: "xyz", index: 1, message: "Unknown token: xyz" },
    ]);
  });

  it("handles empty input", () => {
    const result = parseNotes("");
    expect(result.elements).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it("handles extra whitespace", () => {
    const result = parseNotes("  Do   Re   Mi  ");
    expect(result.elements).toHaveLength(3);
  });

  it("parses Twinkle Twinkle in Spanish", () => {
    const result = parseNotes(
      "Do Do Sol Sol La La Sol/b | Fa Fa Mi Mi Re Re Do/b",
    );
    expect(result.errors).toEqual([]);
    expect(result.elements).toHaveLength(15);
  });

  it("parses Twinkle Twinkle in English", () => {
    const result = parseNotes("C C G G A A G/b | F F E E D D C/b");
    expect(result.errors).toEqual([]);
    expect(result.elements).toHaveLength(15);
    expect(result.elements[0]).toEqual({
      type: "note",
      name: "Do",
      octave: 4,
      duration: "n",
    });
  });
});
