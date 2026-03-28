import type { ColorMap } from "../../types/music";
import { NOTE_ORDER } from "../../constants/noteNames";

interface PianoKeyboardSvgProps {
  colors: ColorMap;
  width?: number;
}

const NOTE_NAMES = NOTE_ORDER;
const HAS_SHARP = new Set(["Do", "Re", "Fa", "Sol", "La"]);

export function PianoKeyboardSvg({
  colors,
  width = 300,
}: PianoKeyboardSvgProps) {
  const numOctaves = 2;
  const numWhiteKeys = numOctaves * 7;
  const whiteKeyW = width / numWhiteKeys;
  const whiteKeyH = 60;
  const blackKeyW = whiteKeyW * 0.6;
  const blackKeyH = 36;
  const dotR = whiteKeyW * 0.2;
  const height = whiteKeyH + 4;

  const whiteKeys: Array<{ x: number; name: string }> = [];
  for (let oct = 0; oct < numOctaves; oct++) {
    NOTE_NAMES.forEach((name) => {
      whiteKeys.push({
        x: (oct * 7 + NOTE_NAMES.indexOf(name)) * whiteKeyW,
        name,
      });
    });
  }

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {/* White keys */}
      {whiteKeys.map(({ x, name }, i) => (
        <g key={i}>
          <rect
            x={x + 0.5}
            y={0}
            width={whiteKeyW - 1}
            height={whiteKeyH}
            fill="white"
            stroke="#555"
            strokeWidth={0.8}
            rx={2}
          />
          <circle
            cx={x + whiteKeyW / 2}
            cy={whiteKeyH - 8}
            r={dotR}
            fill={colors[name as keyof ColorMap]}
          />
        </g>
      ))}

      {/* Black keys */}
      {whiteKeys.map(({ x, name }, i) => {
        if (!HAS_SHARP.has(name)) return null;
        return (
          <rect
            key={`b${i}`}
            x={x + whiteKeyW - blackKeyW / 2}
            y={0}
            width={blackKeyW}
            height={blackKeyH}
            fill="#2c2c2c"
            rx={2}
          />
        );
      })}
    </svg>
  );
}
