import { useMemo, useRef } from "react";
import { StaffRenderer } from "../components/StaffRenderer/StaffRenderer";
import { PlaybackControls } from "../components/PlaybackControls/PlaybackControls";
import { PdfExporter } from "../components/PdfExporter/PdfExporter";
import { PianoInput } from "../components/PianoInput/PianoInput";
import { parseNotes } from "../parser/parseNotes";
import { usePlayback } from "../hooks/usePlayback";
import { usePlayNote } from "../hooks/usePlayNote";
import type { ColorMap, Song } from "../types/music";

interface SongViewProps {
  song: Song;
  colors: ColorMap;
  onEdit: () => void;
}

export function SongView({ song, colors, onEdit }: SongViewProps) {
  const { elements } = useMemo(() => parseNotes(song.notes), [song.notes]);
  const playback = usePlayback(elements);
  const playNote = usePlayNote();
  const staffSvgRef = useRef<SVGSVGElement>(null);

  const activeNote = useMemo(() => {
    if (playback.currentIndex < 0 || playback.currentIndex >= elements.length)
      return null;
    const el = elements[playback.currentIndex];
    if (el.type === "note") return { name: el.name, octave: el.octave };
    return null;
  }, [playback.currentIndex, elements]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderBottom: "1px solid #eee",
        }}
      >
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>{song.title}</h2>
          {song.author && (
            <span style={{ fontSize: 13, color: "#888" }}>{song.author}</span>
          )}
        </div>
        <PlaybackControls
          isPlaying={playback.isPlaying}
          tempo={playback.tempo}
          onPlay={playback.play}
          onPause={playback.pause}
          onStop={playback.stop}
          onTempoChange={playback.setTempo}
        />
        <PdfExporter
          title={song.title}
          elements={elements}
          colors={colors}
          staffSvgRef={staffSvgRef}
        />
        <button
          onClick={onEdit}
          style={{
            padding: "6px 16px",
            fontSize: 14,
            border: "1px solid #8e44ad",
            borderRadius: 6,
            background: "#8e44ad",
            color: "white",
            cursor: "pointer",
          }}
        >
          Edit
        </button>
      </div>

      {/* Piano keyboard */}
      <PianoInput
        colors={colors}
        onNoteClick={() => {}}
        onPlayNote={playNote}
        activeNote={activeNote}
      />

      {/* Staff */}
      <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
        <StaffRenderer
          ref={staffSvgRef}
          elements={elements}
          colors={colors}
          activeNoteIndex={playback.currentIndex}
        />
      </div>
    </div>
  );
}
