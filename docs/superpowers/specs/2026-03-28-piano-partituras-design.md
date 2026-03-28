# Piano Partituras — Design Spec

A web app for creating, browsing, playing, and printing color-coded piano sheet music for kids.

## Problem

Teaching young kids piano with traditional black-and-white sheet music is intimidating. Color-coded notes make it intuitive — each note has a color, and you can label piano keys with matching stickers. There's no simple tool that combines color-coded staff notation, playback, and printable PDFs in one place.

## Solution

A React + Vite + TypeScript SPA that:

1. Renders real 5-line staff notation with color-coded note heads
2. Lets users write partituras via text input with live preview
3. Provides a searchable built-in song database
4. Plays songs back with synthesized piano sound
5. Exports printable PDFs with title, staff, color legend, and piano keyboard diagram
6. Saves everything in the browser (localStorage)

## Tech Stack

- **React 18 + Vite + TypeScript** — app framework
- **SVG** — staff rendering (shared between screen and PDF)
- **Web Audio API** — synthesized piano playback (no external audio libraries)
- **jsPDF + svg2pdf.js** — PDF generation from SVG
- **localStorage** — persistence for user songs and settings

No backend. Fully client-side.

## Color Mapping (Defaults)

| Note | Spanish | English | Color | Hex |
|------|---------|---------|-------|-----|
| C | Do | C | Rojo (Red) | #e74c3c |
| D | Re | D | Morado (Purple) | #8e44ad |
| E | Mi | E | Azul oscuro (Dark blue) | #1a3a6b |
| F | Fa | F | Azul claro (Light blue) | #3498db |
| G | Sol | G | Verde (Green) | #27ae60 |
| A | La | A | Amarillo (Yellow) | #f1c40f |
| B | Si | B | Naranja (Orange) | #e67e22 |

Users can customize these colors in a settings panel.

## Note Text Syntax

Flexible parser that accepts Spanish and English note names, with optional octave and duration.

### Format

```
<NoteName>[Octave][/Duration]
```

### Note Names

| Spanish | English |
|---------|---------|
| Do | C |
| Re | D |
| Mi | E |
| Fa | F |
| Sol | G |
| La | A |
| Si | B |

Case-insensitive. Mixing Spanish and English in the same line is allowed.

### Octave

Integer suffix. Default: 4. Range: 3-6 (two octaves default C4-B5, extensible).

Examples: `Do4`, `C5`, `Sol3`

### Duration

Slash + code suffix. Default: `n` (negra / quarter note).

| Code | Spanish | English | Notation |
|------|---------|---------|----------|
| `r` | Redonda | Whole | Open head, no stem |
| `b` | Blanca | Half | Open head + stem |
| `n` | Negra | Quarter | Filled head + stem |
| `c` | Corchea | Eighth | Filled head + stem + flag |

Examples: `Do/b` (half note Do4), `C5/c` (eighth note C5), `Sol` (quarter note Sol4)

### Special Tokens

- `|` — bar line (vertical line on staff)
- `-` — rest/silence, supports duration: `-/b` (half rest), `-` (quarter rest)

### Examples

```
Do Do Sol Sol La La Sol/b | Fa Fa Mi Mi Re Re Do/b
```

```
C C G G A A G/b | F F E E D D C/b
```

Both produce Twinkle Twinkle Little Star.

## Data Model

```typescript
type NoteName = 'Do' | 'Re' | 'Mi' | 'Fa' | 'Sol' | 'La' | 'Si';
type Duration = 'r' | 'b' | 'n' | 'c';
type Octave = 3 | 4 | 5 | 6;

interface Note {
  type: 'note';
  name: NoteName;
  octave: Octave;
  duration: Duration;
}

interface Rest {
  type: 'rest';
  duration: Duration;
}

interface BarLine {
  type: 'barline';
}

type MusicElement = Note | Rest | BarLine;

interface Song {
  id: string;
  title: string;
  author?: string;
  category?: string;
  difficulty?: 1 | 2 | 3;
  notes: string;        // raw text input
  createdAt: number;
  updatedAt: number;
}

interface ColorMap {
  Do: string;
  Re: string;
  Mi: string;
  Fa: string;
  Sol: string;
  La: string;
  Si: string;
}
```

Internally, the parser normalizes English names to Spanish (C -> Do, D -> Re, etc.) so the rest of the app works with a single canonical representation.

## Architecture

### Views

1. **Editor View** — split panel layout
   - Left: text input area (monospace, line numbers, syntax highlighting for note names)
   - Right: live SVG staff preview that updates as you type
   - Top toolbar: title input, playback controls, PDF export button, save button

2. **Browse View** — song database browser
   - Search bar with text filtering
   - Category filter chips (Clasicas, Infantiles, Navidad, etc.)
   - Difficulty indicator (1-3 stars)
   - Song cards — click to open in editor (creates a copy)
   - "My Partituras" tab for user-saved songs

### Components

#### StaffRenderer (SVG)

- Renders a 5-line treble clef staff
- Treble clef symbol at the start of each staff line
- Notes positioned correctly: E4 on first line, F4 on first space, through F5 on fifth line
- Ledger lines for notes outside the staff (C4 below, A5/B5 above)
- Note heads are colored ovals/circles filled with the assigned color
- Stems in dark gray (#333), extending up or down based on note position (B4 and above: stem down, below B4: stem up)
- Flags on eighth notes
- Bar lines as vertical lines spanning the staff
- Rest symbols at appropriate positions
- Auto-wraps to multiple staff lines when notes overflow the available width
- During playback: current note gets a highlight glow effect

#### NoteEditor

- Textarea for raw note text input
- Monospace font
- Inline error indicators for unparseable tokens (red underline or similar)
- Line wrapping at bar lines for readability

#### PlaybackControls

- Play / Pause / Stop buttons
- Tempo slider (60-180 BPM, default 100)
- Visual indicator of current playback position (synced with staff highlight)

#### SongBrowser

- Reads from `songs.json` (built-in) and localStorage (user songs)
- Search filters by title substring
- Category and difficulty filters
- Click opens song in editor as a new copy

#### PdfExporter

- Title input field (pre-filled with song title)
- Optional author/subtitle field
- Export button generates A4 portrait PDF containing:
  1. Title (large, centered)
  2. Author/subtitle (smaller, centered)
  3. Full staff notation (SVG rendered to PDF via svg2pdf.js)
  4. Color legend row — each note name with its colored circle
  5. Piano keyboard diagram — 2-octave keyboard with colored keys

#### ColorSettings

- Shows current color for each note with a color picker
- Reset to defaults button
- Persisted to localStorage

### Hooks

#### useParser

- Input: raw text string
- Output: `MusicElement[]` array + `ParseError[]` for invalid tokens
- Case-insensitive, trims whitespace
- Maps English -> Spanish internally
- Lenient: unknown tokens produce warnings, don't break the rest

#### usePlayback

- Exposes: `play()`, `pause()`, `stop()`, `setTempo(bpm)`
- Uses Web Audio API `OscillatorNode` (sine + triangle wave mix)
- ADSR envelope via `GainNode` for piano-like sound
- Frequency table mapping note + octave to Hz (A4 = 440 Hz standard tuning)
- Reports current note index for staff highlight sync
- Interface designed so the oscillator can be swapped for `AudioBuffer` sample playback later

### Persistence (localStorage)

- `partituras:songs` — array of user-saved Song objects
- `partituras:settings` — ColorMap and preferences
- Simple JSON serialization. No migration system needed initially.

## Song Database

Bundled `songs.json` with ~10-15 common kids' songs to start:

- Twinkle Twinkle Little Star
- Cumpleanos Feliz
- Frere Jacques
- Mary Had a Little Lamb
- Estrellita
- Ode to Joy (simplified)
- Jingle Bells
- London Bridge
- Row Row Row Your Boat
- Hot Cross Buns

Each song includes: id, title, author, category, difficulty (1-3), notes (text notation).

The file grows over time as you add more songs manually.

## PDF Layout (A4 Portrait)

```
+----------------------------------+
|          [Custom Title]          |
|           [Author]               |
|                                  |
|  G-clef  ==================     |
|  |----|--o--o--o--o--o--o--|    |  <- staff lines with colored notes
|  |----|--------------------|    |
|  |----|--o--o--o--o--o--o--|    |
|  |----|--------------------|    |
|  |----|---------------------|   |
|                                  |
|  (more staff lines as needed)   |
|                                  |
|  [Do] [Re] [Mi] [Fa] [Sol]...  |  <- color legend
|                                  |
|  [Piano Keyboard Diagram]       |  <- 2-octave colored keyboard
+----------------------------------+
```

- White background, black stems
- Colors slightly adjusted for CMYK print vibrancy
- Vector rendering (SVG to PDF) — crisp at any size

## Acceptance Criteria

1. User can type notes in text area and see live staff preview update in real-time
2. Parser accepts both Spanish (Do Re Mi) and English (C D E) note names
3. Staff renders on proper 5-line pentagrama with treble clef
4. Notes are correctly positioned on the staff by pitch
5. Note heads are colored according to the color map
6. Different note durations render with correct notation (whole/half/quarter/eighth)
7. Playback plays the song with synthesized piano at adjustable tempo
8. Current note highlights on staff during playback
9. Song browser shows built-in songs, filterable by search/category/difficulty
10. Clicking a song opens it in the editor
11. User can save/load their own partituras (localStorage)
12. PDF export generates A4 page with title, staff, color legend, and keyboard diagram
13. Colors are customizable in settings
14. App works fully offline (no backend)
