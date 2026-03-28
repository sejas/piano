import type { ColorMap, NoteName } from "../../types/music";
import { DEFAULT_COLORS } from "../../constants/colors";
import { NOTE_ORDER } from "../../constants/noteNames";

interface ColorSettingsProps {
  colors: ColorMap;
  onChange: (colors: ColorMap) => void;
}

export function ColorSettings({ colors, onChange }: ColorSettingsProps) {
  const handleColorChange = (name: NoteName, color: string) => {
    onChange({ ...colors, [name]: color });
  };

  const handleReset = () => {
    onChange({ ...DEFAULT_COLORS });
  };

  return (
    <div style={{ padding: 16, maxWidth: 400 }}>
      <h3 style={{ marginBottom: 16 }}>Note Colors</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {NOTE_ORDER.map((name) => (
          <div
            key={name}
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <input
              type="color"
              value={colors[name]}
              onChange={(e) => handleColorChange(name, e.target.value)}
              style={{
                width: 40,
                height: 30,
                border: "none",
                cursor: "pointer",
              }}
            />
            <span style={{ fontWeight: "bold", minWidth: 30 }}>{name}</span>
            <span style={{ color: "#999", fontSize: 13 }}>{colors[name]}</span>
          </div>
        ))}
      </div>
      <button
        onClick={handleReset}
        style={{
          marginTop: 16,
          padding: "6px 14px",
          fontSize: 13,
          border: "1px solid #ddd",
          borderRadius: 6,
          background: "white",
          cursor: "pointer",
        }}
      >
        Reset to Defaults
      </button>
    </div>
  );
}
