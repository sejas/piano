import { useEffect, useCallback } from "react";
import type { NoteName, Octave, ColorMap } from "../../types/music";
import { NOTE_ORDER } from "../../constants/noteNames";

interface PianoInputProps {
  colors: ColorMap;
  onNoteClick: (name: NoteName, octave: Octave) => void;
  onDeleteLastNote?: () => void;
  onPlayNote?: (name: NoteName, octave: Octave) => void;
  activeNote?: { name: NoteName; octave: Octave } | null;
}

// Computer keyboard → note mapping
const KEY_MAP: Record<string, { name: NoteName; octave: Octave }> = {
  a: { name: "Do", octave: 4 },
  s: { name: "Re", octave: 4 },
  d: { name: "Mi", octave: 4 },
  f: { name: "Fa", octave: 4 },
  g: { name: "Sol", octave: 4 },
  h: { name: "La", octave: 4 },
  j: { name: "Si", octave: 4 },
  q: { name: "Do", octave: 5 },
  w: { name: "Re", octave: 5 },
  e: { name: "Mi", octave: 5 },
  r: { name: "Fa", octave: 5 },
  t: { name: "Sol", octave: 5 },
  y: { name: "La", octave: 5 },
  u: { name: "Si", octave: 5 },
};

const WHITE_KEY_WIDTH = 44;
const WHITE_KEY_HEIGHT = 100;
const BLACK_KEY_WIDTH = 28;
const BLACK_KEY_HEIGHT = 62;

const HAS_SHARP: Set<NoteName> = new Set(["Do", "Re", "Fa", "Sol", "La"]);

// Keyboard shortcut labels for each note+octave
const KEY_LABELS: Record<string, string> = {
  "Do-4": "A",
  "Re-4": "S",
  "Mi-4": "D",
  "Fa-4": "F",
  "Sol-4": "G",
  "La-4": "H",
  "Si-4": "J",
  "Do-5": "Q",
  "Re-5": "W",
  "Mi-5": "E",
  "Fa-5": "R",
  "Sol-5": "T",
  "La-5": "Y",
  "Si-5": "U",
};

function isActiveKey(
  name: NoteName,
  octave: Octave,
  activeNote?: { name: NoteName; octave: Octave } | null,
): boolean {
  return activeNote?.name === name && activeNote?.octave === octave;
}

export function PianoInput({
  colors,
  onNoteClick,
  onDeleteLastNote,
  onPlayNote,
  activeNote,
}: PianoInputProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't capture when typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "Backspace" && onDeleteLastNote) {
        e.preventDefault();
        onDeleteLastNote();
        return;
      }
      const mapping = KEY_MAP[e.key.toLowerCase()];
      if (mapping) {
        e.preventDefault();
        onNoteClick(mapping.name, mapping.octave);
        onPlayNote?.(mapping.name, mapping.octave);
      }
    },
    [onNoteClick],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const keys: Array<{ name: NoteName; octave: Octave; x: number }> = [];
  let x = 0;
  for (let oct = 4; oct <= 5; oct++) {
    for (const name of NOTE_ORDER) {
      keys.push({ name, octave: oct as Octave, x });
      x += WHITE_KEY_WIDTH;
    }
  }

  const totalWidth = keys.length * WHITE_KEY_WIDTH;

  return (
    <div
      style={{
        padding: "8px 16px",
        borderBottom: "1px solid #eee",
        overflowX: "auto",
      }}
    >
      <svg
        width={totalWidth}
        height={WHITE_KEY_HEIGHT + 18}
        style={{ display: "block", margin: "0 auto" }}
      >
        {/* White keys */}
        {keys.map((key) => {
          const active = isActiveKey(key.name, key.octave, activeNote);
          const label = KEY_LABELS[`${key.name}-${key.octave}`];
          return (
            <g
              key={`${key.name}-${key.octave}`}
              onClick={() => {
                onNoteClick(key.name, key.octave);
                onPlayNote?.(key.name, key.octave);
              }}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={key.x}
                y={0}
                width={WHITE_KEY_WIDTH - 1}
                height={WHITE_KEY_HEIGHT}
                fill={active ? colors[key.name] : "white"}
                stroke="#bbb"
                strokeWidth={1}
                rx={2}
              />
              {/* Color dot */}
              <circle
                cx={key.x + WHITE_KEY_WIDTH / 2}
                cy={WHITE_KEY_HEIGHT - 20}
                r={6}
                fill={active ? "white" : colors[key.name]}
                opacity={active ? 0.9 : 0.7}
              />
              {/* Note name */}
              <text
                x={key.x + WHITE_KEY_WIDTH / 2}
                y={WHITE_KEY_HEIGHT - 6}
                textAnchor="middle"
                fontSize="10"
                fill={active ? "white" : "#666"}
                fontWeight={active ? "bold" : "normal"}
              >
                {key.name}
                {key.octave !== 4 ? key.octave : ""}
              </text>
              {/* Keyboard shortcut */}
              {label && (
                <text
                  x={key.x + WHITE_KEY_WIDTH / 2}
                  y={WHITE_KEY_HEIGHT + 14}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#aaa"
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}

        {/* Black keys */}
        {keys.map((key) => {
          if (!HAS_SHARP.has(key.name)) return null;
          return (
            <rect
              key={`black-${key.name}-${key.octave}`}
              x={key.x + WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2}
              y={0}
              width={BLACK_KEY_WIDTH}
              height={BLACK_KEY_HEIGHT}
              fill="#333"
              stroke="#000"
              strokeWidth={1}
              rx={2}
            />
          );
        })}
      </svg>
    </div>
  );
}
