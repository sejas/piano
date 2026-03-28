import type { ParseError } from "../../parser/parseNotes";

interface NoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  errors: ParseError[];
}

export function NoteEditor({ value, onChange, errors }: NoteEditorProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type notes here: Do Re Mi Fa Sol La Si&#10;&#10;Examples:&#10;  Do Do Sol Sol La La Sol/b&#10;  C D E F G A B&#10;&#10;Duration: /r=whole /b=half /n=quarter /c=eighth&#10;Octave: Do4 Do5 (default: 4)&#10;Bar line: |&#10;Rest: -"
        style={{
          flex: 1,
          fontFamily: "monospace",
          fontSize: 16,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 8,
          resize: "none",
          outline: "none",
          lineHeight: 1.6,
        }}
        spellCheck={false}
      />
      {errors.length > 0 && (
        <div style={{ padding: "8px 12px", color: "#e74c3c", fontSize: 13 }}>
          {errors.map((err, i) => (
            <div key={i}>⚠ {err.message}</div>
          ))}
        </div>
      )}
    </div>
  );
}
