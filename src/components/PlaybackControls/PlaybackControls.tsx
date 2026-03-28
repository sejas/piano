import React from "react";

interface PlaybackControlsProps {
  isPlaying: boolean;
  tempo: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onTempoChange: (tempo: number) => void;
}

export function PlaybackControls({
  isPlaying,
  tempo,
  onPlay,
  onPause,
  onStop,
  onTempoChange,
}: PlaybackControlsProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {isPlaying ? (
        <button onClick={onPause} title="Pause" style={buttonStyle}>
          ⏸
        </button>
      ) : (
        <button onClick={onPlay} title="Play" style={buttonStyle}>
          ▶
        </button>
      )}
      <button onClick={onStop} title="Stop" style={buttonStyle}>
        ⏹
      </button>
      <label
        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}
      >
        🎵
        <input
          type="range"
          min={60}
          max={180}
          value={tempo}
          onChange={(e) => onTempoChange(Number(e.target.value))}
          style={{ width: 80 }}
        />
        <span style={{ minWidth: 40 }}>{tempo} bpm</span>
      </label>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: "4px 12px",
  fontSize: 18,
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "white",
  cursor: "pointer",
};
