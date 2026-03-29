import { useState, useMemo, useRef, useCallback } from "react";
import { NoteEditor } from "../components/NoteEditor/NoteEditor";
import { StaffRenderer } from "../components/StaffRenderer/StaffRenderer";
import { PlaybackControls } from "../components/PlaybackControls/PlaybackControls";
import { PdfExporter } from "../components/PdfExporter/PdfExporter";
import { PianoInput } from "../components/PianoInput/PianoInput";
import { parseNotes } from "../parser/parseNotes";
import type { ColorMap, Song, NoteName, Octave } from "../types/music";
import { usePlayback } from "../hooks/usePlayback";
import { usePlayNote } from "../hooks/usePlayNote";

interface EditorViewProps {
  colors: ColorMap;
  initialTitle?: string;
  initialNotes?: string;
  editingSongId?: string | null;
  onSave?: (song: Omit<Song, "createdAt" | "updatedAt">) => void;
}

export function EditorView({
  colors,
  initialTitle = "",
  initialNotes = "",
  editingSongId,
  onSave,
}: EditorViewProps) {
  const [title, setTitle] = useState(initialTitle);
  const [notesText, setNotesText] = useState(initialNotes);
  const staffSvgRef = useRef<SVGSVGElement>(null);

  const handleSave = () => {
    if (!onSave) return;
    onSave({
      id: editingSongId || crypto.randomUUID(),
      title: title || "Untitled",
      notes: notesText,
    });
  };

  const { elements, errors } = useMemo(
    () => parseNotes(notesText),
    [notesText],
  );

  const playback = usePlayback(elements);
  const playNote = usePlayNote();

  // Derive active note for piano highlight during playback
  const activeNote = useMemo(() => {
    if (playback.currentIndex < 0 || playback.currentIndex >= elements.length)
      return null;
    const el = elements[playback.currentIndex];
    if (el.type === "note")
      return { name: el.name, octave: el.octave, sharp: el.sharp };
    return null;
  }, [playback.currentIndex, elements]);

  const handlePianoNote = useCallback(
    (name: NoteName, octave: Octave, sharp?: boolean) => {
      const sharpStr = sharp ? "#" : "";
      const octStr = octave === 4 ? "" : String(octave);
      const noteStr = `${name}${sharpStr}${octStr}`;
      setNotesText((prev) => {
        if (!prev || prev.endsWith(" ") || prev.endsWith("\n"))
          return prev + noteStr;
        return prev + " " + noteStr;
      });
    },
    [],
  );

  const handleDeleteLastNote = useCallback(() => {
    setNotesText((prev) => {
      const trimmed = prev.trimEnd();
      if (!trimmed) return "";
      const lastSpace = trimmed.lastIndexOf(" ");
      if (lastSpace === -1) return "";
      return trimmed.slice(0, lastSpace + 1);
    });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 16px",
          borderBottom: "1px solid #eee",
        }}
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Song title..."
          style={{
            flex: 1,
            fontSize: 18,
            fontWeight: "bold",
            border: "none",
            outline: "none",
            padding: "4px 0",
          }}
        />
        <PlaybackControls
          isPlaying={playback.isPlaying}
          tempo={playback.tempo}
          onPlay={playback.play}
          onPause={playback.pause}
          onStop={playback.stop}
          onTempoChange={playback.setTempo}
        />
        <PdfExporter
          title={title}
          elements={elements}
          colors={colors}
          staffSvgRef={staffSvgRef}
        />
        {onSave && (
          <button
            onClick={handleSave}
            style={{
              background: "#27ae60",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "6px 16px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save
          </button>
        )}
      </div>

      {/* Piano keyboard */}
      <PianoInput
        colors={colors}
        onNoteClick={handlePianoNote}
        onDeleteLastNote={handleDeleteLastNote}
        onPlayNote={playNote}
        activeNote={activeNote}
      />

      {/* Split panel */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left: editor */}
        <div
          style={{ width: "35%", borderRight: "1px solid #eee", padding: 12 }}
        >
          <NoteEditor
            value={notesText}
            onChange={setNotesText}
            errors={errors}
          />
        </div>

        {/* Right: staff preview */}
        <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
          {elements.length > 0 ? (
            <StaffRenderer
              ref={staffSvgRef}
              elements={elements}
              colors={colors}
              activeNoteIndex={playback.currentIndex}
            />
          ) : (
            <div style={{ color: "#999", padding: 40, textAlign: "center" }}>
              Type notes on the left to see the partitura here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
