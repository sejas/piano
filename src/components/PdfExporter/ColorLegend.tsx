import type { ColorMap } from "../../types/music";
import { NOTE_ORDER } from "../../constants/noteNames";

interface ColorLegendProps {
  colors: ColorMap;
}

export function ColorLegend({ colors }: ColorLegendProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        alignItems: "center",
        padding: "8px 0",
      }}
    >
      {NOTE_ORDER.map((name) => (
        <div
          key={name}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: colors[name],
              border: "1px solid rgba(0,0,0,0.15)",
            }}
          />
          <span style={{ fontSize: 11, color: "#444", fontWeight: 500 }}>
            {name}
          </span>
        </div>
      ))}
    </div>
  );
}
