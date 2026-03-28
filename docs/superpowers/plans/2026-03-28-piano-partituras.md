# Piano Partituras Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React SPA for creating, browsing, playing, and printing color-coded piano sheet music for kids.

**Architecture:** React + Vite + TypeScript SPA. SVG-based staff rendering shared between screen display and PDF export. Web Audio API for synthesized playback. localStorage for persistence. No backend.

**Tech Stack:** React 18, Vite, TypeScript, jsPDF, svg2pdf.js, Web Audio API

**Spec:** `docs/superpowers/specs/2026-03-28-piano-partituras-design.md`

---

## File Structure

```
src/
  types/
    music.ts                 — NoteName, Duration, Octave, Note, Rest, BarLine, MusicElement, Song, ColorMap types
  constants/
    colors.ts                — DEFAULT_COLORS map, note-to-color lookup
    frequencies.ts           — Note+octave to Hz frequency table
    noteNames.ts             — Spanish/English name mappings
  parser/
    parseNotes.ts            — Text string → MusicElement[] parser
    parseNotes.test.ts       — Parser unit tests
  hooks/
    usePlayback.ts           — Web Audio API synth engine hook
    useLocalStorage.ts       — Generic localStorage persistence hook
  components/
    StaffRenderer/
      StaffRenderer.tsx      — SVG 5-line staff with colored notes
      staffUtils.ts          — Note positioning math, layout calculations
      staffUtils.test.ts     — Staff positioning unit tests
    NoteEditor/
      NoteEditor.tsx         — Text input panel with monospace textarea
    PlaybackControls/
      PlaybackControls.tsx   — Play/pause/stop + tempo slider
    SongBrowser/
      SongBrowser.tsx        — Search/filter song database + user songs
    PdfExporter/
      PdfExporter.tsx        — PDF generation with title, staff, legend, keyboard
      PianoKeyboardSvg.tsx   — 2-octave keyboard diagram SVG component
      ColorLegend.tsx        — Note color legend SVG component
    ColorSettings/
      ColorSettings.tsx      — Color picker per note + reset
  views/
    EditorView.tsx           — Split panel: NoteEditor left, StaffRenderer right, toolbar top
    BrowseView.tsx           — SongBrowser with tabs for built-in and user songs
  data/
    songs.json               — Built-in song database (~10-15 kids' songs)
  App.tsx                    — Root component with nav and view routing
  App.css                    — Global styles
  main.tsx                   — Vite entry point
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.css`

- [ ] **Step 1: Scaffold Vite + React + TypeScript project**

Run:
```bash
cd /Users/macbookpro/Documents/projects-m3.nosync/personal/piano
npm create vite@latest . -- --template react-ts
```

If the directory is non-empty, use a temp dir and copy:
```bash
npm create vite@latest /tmp/piano-scaffold -- --template react-ts
cp -r /tmp/piano-scaffold/* /Users/macbookpro/Documents/projects-m3.nosync/personal/piano/
cp /tmp/piano-scaffold/.gitignore /Users/macbookpro/Documents/projects-m3.nosync/personal/piano/
rm -rf /tmp/piano-scaffold
```

- [ ] **Step 2: Add `.superpowers/` to `.gitignore`**

Append to `.gitignore`:
```
.superpowers/
```

- [ ] **Step 3: Install dependencies**

```bash
npm install
npm install jspdf svg2pdf.js
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 4: Configure Vitest**

Add to `vite.config.ts`:
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
```

Create `src/test-setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

Add to `tsconfig.json` under `compilerOptions`:
```json
"types": ["vitest/globals"]
```

Add script to `package.json`:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 5: Clean up default scaffolding**

Delete `src/assets/`, `src/App.css` contents (replace with empty), delete `public/vite.svg`.

Replace `src/App.tsx`:
```tsx
function App() {
  return <div>Piano Partituras</div>
}

export default App
```

- [ ] **Step 6: Verify dev server runs**

```bash
npm run dev
```
Expected: App runs at localhost, shows "Piano Partituras".

- [ ] **Step 7: Verify tests run**

```bash
npm run test:run
```
Expected: 0 tests, no errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TypeScript project with vitest"
```

---

### Task 2: Types and Constants

**Files:**
- Create: `src/types/music.ts`, `src/constants/colors.ts`, `src/constants/frequencies.ts`, `src/constants/noteNames.ts`

- [ ] **Step 1: Create music types**

Create `src/types/music.ts`:
```typescript
export type NoteName = 'Do' | 'Re' | 'Mi' | 'Fa' | 'Sol' | 'La' | 'Si';
export type Duration = 'r' | 'b' | 'n' | 'c';
export type Octave = 3 | 4 | 5 | 6;

export interface Note {
  type: 'note';
  name: NoteName;
  octave: Octave;
  duration: Duration;
}

export interface Rest {
  type: 'rest';
  duration: Duration;
}

export interface BarLine {
  type: 'barline';
}

export type MusicElement = Note | Rest | BarLine;

export interface Song {
  id: string;
  title: string;
  author?: string;
  category?: string;
  difficulty?: 1 | 2 | 3;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface ColorMap {
  Do: string;
  Re: string;
  Mi: string;
  Fa: string;
  Sol: string;
  La: string;
  Si: string;
}
```

- [ ] **Step 2: Create color constants**

Create `src/constants/colors.ts`:
```typescript
import { ColorMap } from '../types/music'

export const DEFAULT_COLORS: ColorMap = {
  Do: '#e74c3c',
  Re: '#8e44ad',
  Mi: '#1a3a6b',
  Fa: '#3498db',
  Sol: '#27ae60',
  La: '#f1c40f',
  Si: '#e67e22',
}

// Print-optimized colors (slightly more saturated for CMYK)
export const PRINT_COLORS: ColorMap = {
  Do: '#d63031',
  Re: '#6c3483',
  Mi: '#1a3a6b',
  Fa: '#2e86c1',
  Sol: '#1e8449',
  La: '#d4ac0d',
  Si: '#ca6f1e',
}
```

- [ ] **Step 3: Create note name mappings**

Create `src/constants/noteNames.ts`:
```typescript
import { NoteName } from '../types/music'

export const ENGLISH_TO_SPANISH: Record<string, NoteName> = {
  c: 'Do',
  d: 'Re',
  e: 'Mi',
  f: 'Fa',
  g: 'Sol',
  a: 'La',
  b: 'Si',
}

export const SPANISH_NAMES: Record<string, NoteName> = {
  do: 'Do',
  re: 'Re',
  mi: 'Mi',
  fa: 'Fa',
  sol: 'Sol',
  la: 'La',
  si: 'Si',
}

export const ALL_NOTE_NAMES = new Set([
  ...Object.keys(ENGLISH_TO_SPANISH),
  ...Object.keys(SPANISH_NAMES),
])

export const NOTE_ORDER: NoteName[] = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si']
```

- [ ] **Step 4: Create frequency table**

Create `src/constants/frequencies.ts`:
```typescript
import { NoteName, Octave } from '../types/music'

// Semitone offsets from C in each octave
const SEMITONE_OFFSET: Record<NoteName, number> = {
  Do: 0,
  Re: 2,
  Mi: 4,
  Fa: 5,
  Sol: 7,
  La: 9,
  Si: 11,
}

/**
 * Calculate frequency in Hz for a note + octave.
 * Uses A4 = 440 Hz standard tuning.
 * Formula: f = 440 * 2^((n - 69) / 12) where n is MIDI note number.
 */
export function getFrequency(name: NoteName, octave: Octave): number {
  const midiNote = (octave + 1) * 12 + SEMITONE_OFFSET[name]
  return 440 * Math.pow(2, (midiNote - 69) / 12)
}

/**
 * Get duration in beats for a duration code.
 * Quarter note = 1 beat.
 */
export function getDurationBeats(duration: 'r' | 'b' | 'n' | 'c'): number {
  const beats: Record<string, number> = { r: 4, b: 2, n: 1, c: 0.5 }
  return beats[duration]
}
```

- [ ] **Step 5: Commit**

```bash
git add src/types/ src/constants/
git commit -m "feat: add music types, color constants, note mappings, frequency table"
```

---

### Task 3: Note Parser

**Files:**
- Create: `src/parser/parseNotes.ts`, `src/parser/parseNotes.test.ts`

- [ ] **Step 1: Write parser tests**

Create `src/parser/parseNotes.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { parseNotes } from './parseNotes'

describe('parseNotes', () => {
  it('parses simple Spanish note names with default octave and duration', () => {
    const result = parseNotes('Do Re Mi')
    expect(result.elements).toEqual([
      { type: 'note', name: 'Do', octave: 4, duration: 'n' },
      { type: 'note', name: 'Re', octave: 4, duration: 'n' },
      { type: 'note', name: 'Mi', octave: 4, duration: 'n' },
    ])
    expect(result.errors).toEqual([])
  })

  it('parses English note names and maps to Spanish', () => {
    const result = parseNotes('C D E')
    expect(result.elements).toEqual([
      { type: 'note', name: 'Do', octave: 4, duration: 'n' },
      { type: 'note', name: 'Re', octave: 4, duration: 'n' },
      { type: 'note', name: 'Mi', octave: 4, duration: 'n' },
    ])
  })

  it('parses explicit octave', () => {
    const result = parseNotes('Do5 Re3')
    expect(result.elements).toEqual([
      { type: 'note', name: 'Do', octave: 5, duration: 'n' },
      { type: 'note', name: 'Re', octave: 3, duration: 'n' },
    ])
  })

  it('parses explicit duration', () => {
    const result = parseNotes('Do/b Re/c Mi/r')
    expect(result.elements).toEqual([
      { type: 'note', name: 'Do', octave: 4, duration: 'b' },
      { type: 'note', name: 'Re', octave: 4, duration: 'c' },
      { type: 'note', name: 'Mi', octave: 4, duration: 'r' },
    ])
  })

  it('parses octave + duration combined', () => {
    const result = parseNotes('Do5/b C3/c')
    expect(result.elements).toEqual([
      { type: 'note', name: 'Do', octave: 5, duration: 'b' },
      { type: 'note', name: 'Do', octave: 3, duration: 'c' },
    ])
  })

  it('parses bar lines', () => {
    const result = parseNotes('Do Re | Mi Fa')
    expect(result.elements).toEqual([
      { type: 'note', name: 'Do', octave: 4, duration: 'n' },
      { type: 'note', name: 'Re', octave: 4, duration: 'n' },
      { type: 'barline' },
      { type: 'note', name: 'Mi', octave: 4, duration: 'n' },
      { type: 'note', name: 'Fa', octave: 4, duration: 'n' },
    ])
  })

  it('parses rests', () => {
    const result = parseNotes('Do - Re')
    expect(result.elements).toEqual([
      { type: 'note', name: 'Do', octave: 4, duration: 'n' },
      { type: 'rest', duration: 'n' },
      { type: 'note', name: 'Re', octave: 4, duration: 'n' },
    ])
  })

  it('parses rests with duration', () => {
    const result = parseNotes('-/b -/c')
    expect(result.elements).toEqual([
      { type: 'rest', duration: 'b' },
      { type: 'rest', duration: 'c' },
    ])
  })

  it('is case-insensitive', () => {
    const result = parseNotes('do RE mi SOL')
    expect(result.elements).toEqual([
      { type: 'note', name: 'Do', octave: 4, duration: 'n' },
      { type: 'note', name: 'Re', octave: 4, duration: 'n' },
      { type: 'note', name: 'Mi', octave: 4, duration: 'n' },
      { type: 'note', name: 'Sol', octave: 4, duration: 'n' },
    ])
  })

  it('allows mixing Spanish and English', () => {
    const result = parseNotes('Do D Mi F')
    expect(result.elements).toEqual([
      { type: 'note', name: 'Do', octave: 4, duration: 'n' },
      { type: 'note', name: 'Re', octave: 4, duration: 'n' },
      { type: 'note', name: 'Mi', octave: 4, duration: 'n' },
      { type: 'note', name: 'Fa', octave: 4, duration: 'n' },
    ])
  })

  it('reports errors for unknown tokens without breaking', () => {
    const result = parseNotes('Do xyz Re')
    expect(result.elements).toEqual([
      { type: 'note', name: 'Do', octave: 4, duration: 'n' },
      { type: 'note', name: 'Re', octave: 4, duration: 'n' },
    ])
    expect(result.errors).toEqual([
      { token: 'xyz', index: 1, message: 'Unknown token: xyz' },
    ])
  })

  it('handles empty input', () => {
    const result = parseNotes('')
    expect(result.elements).toEqual([])
    expect(result.errors).toEqual([])
  })

  it('handles extra whitespace', () => {
    const result = parseNotes('  Do   Re   Mi  ')
    expect(result.elements).toHaveLength(3)
  })

  it('parses Twinkle Twinkle in Spanish', () => {
    const result = parseNotes('Do Do Sol Sol La La Sol/b | Fa Fa Mi Mi Re Re Do/b')
    expect(result.errors).toEqual([])
    expect(result.elements).toHaveLength(15) // 14 notes + 1 barline
  })

  it('parses Twinkle Twinkle in English', () => {
    const result = parseNotes('C C G G A A G/b | F F E E D D C/b')
    expect(result.errors).toEqual([])
    expect(result.elements).toHaveLength(15)
    expect(result.elements[0]).toEqual({ type: 'note', name: 'Do', octave: 4, duration: 'n' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- src/parser/parseNotes.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the parser**

Create `src/parser/parseNotes.ts`:
```typescript
import { MusicElement, NoteName, Duration, Octave } from '../types/music'
import { ENGLISH_TO_SPANISH, SPANISH_NAMES } from '../constants/noteNames'

export interface ParseError {
  token: string
  index: number
  message: string
}

export interface ParseResult {
  elements: MusicElement[]
  errors: ParseError[]
}

const VALID_DURATIONS = new Set(['r', 'b', 'n', 'c'])
const VALID_OCTAVES = new Set([3, 4, 5, 6])

function resolveNoteName(raw: string): NoteName | null {
  const lower = raw.toLowerCase()
  if (SPANISH_NAMES[lower]) return SPANISH_NAMES[lower]
  if (ENGLISH_TO_SPANISH[lower]) return ENGLISH_TO_SPANISH[lower]
  return null
}

/**
 * Parse a single token like "Do5/b", "C", "Sol/c", "-/b", "|"
 */
function parseToken(
  token: string,
  index: number,
): { element: MusicElement; error: null } | { element: null; error: ParseError } {
  // Bar line
  if (token === '|') {
    return { element: { type: 'barline' }, error: null }
  }

  // Rest: "-" or "-/duration"
  if (token.startsWith('-')) {
    let duration: Duration = 'n'
    if (token.includes('/')) {
      const d = token.split('/')[1].toLowerCase()
      if (VALID_DURATIONS.has(d)) {
        duration = d as Duration
      }
    }
    return { element: { type: 'rest', duration }, error: null }
  }

  // Note: parse name, optional octave, optional /duration
  // Regex: (noteName)(octave)?(/duration)?
  // noteName can be 1-3 chars (e.g. "Sol", "Do", "C", "A")
  const match = token.match(/^([a-zA-Z]+)(\d)?\/?([a-zA-Z])?$/i)
  if (!match) {
    return { element: null, error: { token, index, message: `Unknown token: ${token}` } }
  }

  const [, rawName, rawOctave, rawDuration] = match
  const name = resolveNoteName(rawName)
  if (!name) {
    return { element: null, error: { token, index, message: `Unknown token: ${token}` } }
  }

  let octave: Octave = 4
  if (rawOctave) {
    const o = parseInt(rawOctave, 10)
    if (VALID_OCTAVES.has(o)) {
      octave = o as Octave
    }
  }

  let duration: Duration = 'n'
  if (rawDuration) {
    const d = rawDuration.toLowerCase()
    if (VALID_DURATIONS.has(d)) {
      duration = d as Duration
    }
  }

  return {
    element: { type: 'note', name, octave, duration },
    error: null,
  }
}

export function parseNotes(input: string): ParseResult {
  const elements: MusicElement[] = []
  const errors: ParseError[] = []

  if (!input.trim()) return { elements, errors }

  const tokens = input.trim().split(/\s+/)

  tokens.forEach((token, index) => {
    const result = parseToken(token, index)
    if (result.element) {
      elements.push(result.element)
    }
    if (result.error) {
      errors.push(result.error)
    }
  })

  return { elements, errors }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/parser/parseNotes.test.ts
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/parser/
git commit -m "feat: add note parser with Spanish/English support and tests"
```

---

### Task 4: Staff Positioning Utilities

**Files:**
- Create: `src/components/StaffRenderer/staffUtils.ts`, `src/components/StaffRenderer/staffUtils.test.ts`

- [ ] **Step 1: Write staff utility tests**

Create `src/components/StaffRenderer/staffUtils.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { getNoteY, getStemDirection, layoutNotes, STAFF_CONFIG } from './staffUtils'

describe('getNoteY', () => {
  it('places E4 on first line', () => {
    const y = getNoteY('Mi', 4)
    expect(y).toBe(STAFF_CONFIG.topLineY + 4 * STAFF_CONFIG.lineSpacing) // first line = bottom line... no
    // In treble clef from top: F5, D5, B4, G4, E4
    // E4 is on the FIRST (bottom) line
    // topLineY is the top line. Bottom line = topLineY + 4 * lineSpacing
    expect(y).toBe(STAFF_CONFIG.topLineY + 4 * STAFF_CONFIG.lineSpacing)
  })

  it('places F5 on fifth (top) line', () => {
    const y = getNoteY('Fa', 5)
    expect(y).toBe(STAFF_CONFIG.topLineY)
  })

  it('places C4 below the staff (needs ledger line)', () => {
    const y = getNoteY('Do', 4)
    expect(y).toBeGreaterThan(STAFF_CONFIG.topLineY + 4 * STAFF_CONFIG.lineSpacing)
  })

  it('places A5 above the staff (needs ledger line)', () => {
    const y = getNoteY('La', 5)
    expect(y).toBeLessThan(STAFF_CONFIG.topLineY)
  })
})

describe('getStemDirection', () => {
  it('returns "up" for notes below B4', () => {
    expect(getStemDirection('Do', 4)).toBe('up')
    expect(getStemDirection('La', 3)).toBe('up')
  })

  it('returns "down" for B4 and above', () => {
    expect(getStemDirection('Si', 4)).toBe('down')
    expect(getStemDirection('Do', 5)).toBe('down')
  })
})

describe('layoutNotes', () => {
  it('calculates x positions for notes', () => {
    const elements = [
      { type: 'note' as const, name: 'Do' as const, octave: 4 as const, duration: 'n' as const },
      { type: 'note' as const, name: 'Re' as const, octave: 4 as const, duration: 'n' as const },
    ]
    const layout = layoutNotes(elements, 800)
    expect(layout).toHaveLength(2)
    expect(layout[0].x).toBeLessThan(layout[1].x)
  })

  it('wraps to new staff line when exceeding width', () => {
    const elements = Array.from({ length: 30 }, () => ({
      type: 'note' as const,
      name: 'Do' as const,
      octave: 4 as const,
      duration: 'n' as const,
    }))
    const layout = layoutNotes(elements, 400)
    const staffLines = new Set(layout.map((n) => n.staffLine))
    expect(staffLines.size).toBeGreaterThan(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- src/components/StaffRenderer/staffUtils.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement staff utilities**

Create `src/components/StaffRenderer/staffUtils.ts`:
```typescript
import { MusicElement, NoteName, Octave } from '../../types/music'

export const STAFF_CONFIG = {
  topLineY: 40,
  lineSpacing: 10,
  noteSpacing: 40,
  staffLeftMargin: 60, // space for treble clef
  staffRightMargin: 20,
  staffLineGap: 80, // vertical gap between wrapped staff systems
  noteHeadRx: 6,
  noteHeadRy: 4.5,
  stemLength: 30,
}

/**
 * Map a note to its vertical position on the treble clef staff.
 *
 * Treble clef lines from top to bottom:
 *   Line 5 (top):    F5  → y = topLineY
 *   Line 4:          D5  → y = topLineY + 1 * lineSpacing
 *   Line 3:          B4  → y = topLineY + 2 * lineSpacing
 *   Line 2:          G4  → y = topLineY + 3 * lineSpacing
 *   Line 1 (bottom): E4  → y = topLineY + 4 * lineSpacing
 *
 * Each half-step in staff position = lineSpacing / 2
 */

// Staff positions relative to top line (F5 = 0).
// Each unit = half a lineSpacing (one staff position).
// Higher number = lower on the page.
const STAFF_POSITION: Record<NoteName, number> = {
  Do: 0,  // C
  Re: 1,  // D
  Mi: 2,  // E
  Fa: 3,  // F
  Sol: 4, // G
  La: 5,  // A
  Si: 6,  // B
}

export function getNoteY(name: NoteName, octave: Octave): number {
  // F5 is at topLineY (position 0)
  // Each staff position down is lineSpacing/2
  // F5 position = 0
  // E5 position = 1, D5 = 2, C5 = 3, B4 = 4, A4 = 5, G4 = 6, F4 = 7, E4 = 8, D4 = 9, C4 = 10
  const f5StaffPos = 0
  // Distance from F5 in semitone-like staff positions (not semitones, diatonic steps)
  // F5 = octave 5, position Fa
  const notePos = STAFF_POSITION[name]
  const octaveDiff = 5 - octave

  // F5 is Fa in octave 5 → staffPos 3 in that octave
  // We need diatonic steps from F5
  // In octave 5: Fa=0, Mi=1, Re=2, Do=3
  // In octave 4: Si=4, La=5, Sol=6, Fa=7, Mi=8, Re=9, Do=10
  const refPos = STAFF_POSITION['Fa'] // 3
  const stepsFromF5 = (octaveDiff * 7) + (refPos - notePos)

  return STAFF_CONFIG.topLineY + stepsFromF5 * (STAFF_CONFIG.lineSpacing / 2)
}

export function getStemDirection(name: NoteName, octave: Octave): 'up' | 'down' {
  // B4 and above → stem down, below B4 → stem up
  // B4 is on the middle line (line 3)
  const y = getNoteY(name, octave)
  const middleLine = STAFF_CONFIG.topLineY + 2 * STAFF_CONFIG.lineSpacing
  return y <= middleLine ? 'down' : 'up'
}

/**
 * Returns true if a note needs ledger lines (is outside the 5 staff lines).
 * Returns the ledger line Y positions needed.
 */
export function getLedgerLines(name: NoteName, octave: Octave): number[] {
  const y = getNoteY(name, octave)
  const topY = STAFF_CONFIG.topLineY
  const bottomY = topY + 4 * STAFF_CONFIG.lineSpacing
  const spacing = STAFF_CONFIG.lineSpacing
  const lines: number[] = []

  if (y > bottomY) {
    // Below staff — add ledger lines downward
    for (let ly = bottomY + spacing; ly <= y + 1; ly += spacing) {
      lines.push(ly)
    }
  } else if (y < topY) {
    // Above staff — add ledger lines upward
    for (let ly = topY - spacing; ly >= y - 1; ly -= spacing) {
      lines.push(ly)
    }
  }

  return lines
}

export interface NoteLayout {
  elementIndex: number
  x: number
  y: number
  staffLine: number // which wrapped staff line (0-indexed)
}

export function layoutNotes(elements: MusicElement[], availableWidth: number): NoteLayout[] {
  const usableWidth = availableWidth - STAFF_CONFIG.staffLeftMargin - STAFF_CONFIG.staffRightMargin
  const layout: NoteLayout[] = []
  let currentX = STAFF_CONFIG.staffLeftMargin
  let staffLine = 0

  elements.forEach((el, index) => {
    if (el.type === 'barline') {
      // Bar lines take minimal space
      layout.push({ elementIndex: index, x: currentX, y: 0, staffLine })
      currentX += 20
    } else {
      const noteWidth = STAFF_CONFIG.noteSpacing
      if (currentX + noteWidth > availableWidth - STAFF_CONFIG.staffRightMargin) {
        staffLine++
        currentX = STAFF_CONFIG.staffLeftMargin
      }

      let y = 0
      if (el.type === 'note') {
        y = getNoteY(el.name, el.octave)
      }

      layout.push({ elementIndex: index, x: currentX, y, staffLine })
      currentX += noteWidth
    }
  })

  return layout
}

export function getTotalStaffHeight(staffLineCount: number): number {
  const singleStaffHeight = STAFF_CONFIG.topLineY * 2 + 4 * STAFF_CONFIG.lineSpacing
  return staffLineCount * (singleStaffHeight + STAFF_CONFIG.staffLineGap) - STAFF_CONFIG.staffLineGap
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/components/StaffRenderer/staffUtils.test.ts
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/StaffRenderer/staffUtils.ts src/components/StaffRenderer/staffUtils.test.ts
git commit -m "feat: add staff positioning utilities with note layout and wrapping"
```

---

### Task 5: Staff Renderer Component

**Files:**
- Create: `src/components/StaffRenderer/StaffRenderer.tsx`

- [ ] **Step 1: Implement StaffRenderer**

Create `src/components/StaffRenderer/StaffRenderer.tsx`:
```tsx
import { MusicElement, Note } from '../../types/music'
import { ColorMap } from '../../types/music'
import {
  STAFF_CONFIG,
  getNoteY,
  getStemDirection,
  getLedgerLines,
  layoutNotes,
  getTotalStaffHeight,
} from './staffUtils'

interface StaffRendererProps {
  elements: MusicElement[]
  colors: ColorMap
  width?: number
  activeNoteIndex?: number // for playback highlight
}

function TrebleClef({ x, y }: { x: number; y: number }) {
  // Simplified treble clef using a text glyph
  return (
    <text
      x={x}
      y={y + 2 * STAFF_CONFIG.lineSpacing + 8}
      fontSize="48"
      fontFamily="serif"
      fill="#333"
    >
      𝄞
    </text>
  )
}

function NoteHead({
  note,
  x,
  y,
  color,
  isActive,
}: {
  note: Note
  x: number
  y: number
  color: string
  isActive: boolean
}) {
  const isFilled = note.duration === 'n' || note.duration === 'c'
  const stemDir = getStemDirection(note.name, note.octave)
  const ledgerLines = getLedgerLines(note.name, note.octave)
  const { noteHeadRx, noteHeadRy, stemLength } = STAFF_CONFIG

  return (
    <g>
      {/* Ledger lines */}
      {ledgerLines.map((ly) => (
        <line
          key={ly}
          x1={x - noteHeadRx - 4}
          y1={ly}
          x2={x + noteHeadRx + 4}
          y2={ly}
          stroke="#333"
          strokeWidth={1}
        />
      ))}

      {/* Highlight glow for active note */}
      {isActive && (
        <ellipse cx={x} cy={y} rx={noteHeadRx + 4} ry={noteHeadRy + 4} fill={color} opacity={0.3} />
      )}

      {/* Note head */}
      <ellipse
        cx={x}
        cy={y}
        rx={noteHeadRx}
        ry={noteHeadRy}
        fill={isFilled ? color : 'white'}
        stroke={color}
        strokeWidth={2}
        transform={`rotate(-10, ${x}, ${y})`}
      />

      {/* Stem (not for whole notes) */}
      {note.duration !== 'r' && (
        <line
          x1={stemDir === 'up' ? x + noteHeadRx - 1 : x - noteHeadRx + 1}
          y1={y}
          x2={stemDir === 'up' ? x + noteHeadRx - 1 : x - noteHeadRx + 1}
          y2={stemDir === 'up' ? y - stemLength : y + stemLength}
          stroke="#333"
          strokeWidth={1.5}
        />
      )}

      {/* Flag for eighth notes */}
      {note.duration === 'c' && (
        <path
          d={
            stemDir === 'up'
              ? `M${x + noteHeadRx - 1},${y - stemLength} q8,8 2,20`
              : `M${x - noteHeadRx + 1},${y + stemLength} q-8,-8 -2,-20`
          }
          fill="none"
          stroke="#333"
          strokeWidth={1.5}
        />
      )}
    </g>
  )
}

function RestSymbol({ x, y, duration }: { x: number; y: number; duration: string }) {
  const centerY = y + 2 * STAFF_CONFIG.lineSpacing
  // Simple rest symbols
  const restText: Record<string, string> = {
    r: '𝄻', // whole rest
    b: '𝄼', // half rest
    n: '𝄽', // quarter rest
    c: '𝄾', // eighth rest
  }
  return (
    <text x={x - 5} y={centerY + 5} fontSize="20" fontFamily="serif" fill="#333">
      {restText[duration] || '𝄽'}
    </text>
  )
}

export function StaffRenderer({
  elements,
  colors,
  width = 800,
  activeNoteIndex,
}: StaffRendererProps) {
  const layout = layoutNotes(elements, width)
  const maxStaffLine = layout.length > 0 ? Math.max(...layout.map((l) => l.staffLine)) : 0
  const totalHeight = getTotalStaffHeight(maxStaffLine + 1)
  const singleStaffHeight = STAFF_CONFIG.topLineY * 2 + 4 * STAFF_CONFIG.lineSpacing

  return (
    <svg width={width} height={Math.max(totalHeight, singleStaffHeight)} xmlns="http://www.w3.org/2000/svg">
      {/* Render each staff system */}
      {Array.from({ length: maxStaffLine + 1 }, (_, staffIdx) => {
        const offsetY = staffIdx * (singleStaffHeight + STAFF_CONFIG.staffLineGap)
        return (
          <g key={staffIdx} transform={`translate(0, ${offsetY})`}>
            {/* Treble clef */}
            <TrebleClef x={8} y={STAFF_CONFIG.topLineY} />

            {/* 5 staff lines */}
            {Array.from({ length: 5 }, (_, lineIdx) => (
              <line
                key={lineIdx}
                x1={0}
                y1={STAFF_CONFIG.topLineY + lineIdx * STAFF_CONFIG.lineSpacing}
                x2={width}
                y2={STAFF_CONFIG.topLineY + lineIdx * STAFF_CONFIG.lineSpacing}
                stroke="#999"
                strokeWidth={1}
              />
            ))}
          </g>
        )
      })}

      {/* Render notes, rests, barlines */}
      {layout.map((item) => {
        const el = elements[item.elementIndex]
        const offsetY = item.staffLine * (singleStaffHeight + STAFF_CONFIG.staffLineGap)

        if (el.type === 'barline') {
          return (
            <line
              key={item.elementIndex}
              x1={item.x}
              y1={offsetY + STAFF_CONFIG.topLineY}
              x2={item.x}
              y2={offsetY + STAFF_CONFIG.topLineY + 4 * STAFF_CONFIG.lineSpacing}
              stroke="#666"
              strokeWidth={1.5}
            />
          )
        }

        if (el.type === 'rest') {
          return (
            <RestSymbol
              key={item.elementIndex}
              x={item.x}
              y={offsetY + STAFF_CONFIG.topLineY}
              duration={el.duration}
            />
          )
        }

        if (el.type === 'note') {
          return (
            <NoteHead
              key={item.elementIndex}
              note={el}
              x={item.x}
              y={offsetY + item.y}
              color={colors[el.name]}
              isActive={item.elementIndex === activeNoteIndex}
            />
          )
        }

        return null
      })}
    </svg>
  )
}
```

- [ ] **Step 2: Wire into App for visual verification**

Replace `src/App.tsx`:
```tsx
import { StaffRenderer } from './components/StaffRenderer/StaffRenderer'
import { parseNotes } from './parser/parseNotes'
import { DEFAULT_COLORS } from './constants/colors'

function App() {
  const { elements } = parseNotes('Do Do Sol Sol La La Sol/b | Fa Fa Mi Mi Re Re Do/b')

  return (
    <div style={{ padding: 20 }}>
      <h1>Piano Partituras</h1>
      <StaffRenderer elements={elements} colors={DEFAULT_COLORS} width={800} />
    </div>
  )
}

export default App
```

- [ ] **Step 3: Verify visually**

```bash
npm run dev
```
Expected: Browser shows Twinkle Twinkle Little Star on a 5-line staff with colored notes.

- [ ] **Step 4: Commit**

```bash
git add src/components/StaffRenderer/StaffRenderer.tsx src/App.tsx
git commit -m "feat: add SVG staff renderer with colored notes, stems, flags, and ledger lines"
```

---

### Task 6: Note Editor Component

**Files:**
- Create: `src/components/NoteEditor/NoteEditor.tsx`

- [ ] **Step 1: Implement NoteEditor**

Create `src/components/NoteEditor/NoteEditor.tsx`:
```tsx
import { ParseError } from '../../parser/parseNotes'

interface NoteEditorProps {
  value: string
  onChange: (value: string) => void
  errors: ParseError[]
}

export function NoteEditor({ value, onChange, errors }: NoteEditorProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type notes here: Do Re Mi Fa Sol La Si&#10;&#10;Examples:&#10;  Do Do Sol Sol La La Sol/b&#10;  C D E F G A B&#10;&#10;Duration: /r=whole /b=half /n=quarter /c=eighth&#10;Octave: Do4 Do5 (default: 4)&#10;Bar line: |&#10;Rest: -"
        style={{
          flex: 1,
          fontFamily: 'monospace',
          fontSize: 16,
          padding: 12,
          border: '1px solid #ddd',
          borderRadius: 8,
          resize: 'none',
          outline: 'none',
          lineHeight: 1.6,
        }}
        spellCheck={false}
      />
      {errors.length > 0 && (
        <div style={{ padding: '8px 12px', color: '#e74c3c', fontSize: 13 }}>
          {errors.map((err, i) => (
            <div key={i}>⚠ {err.message}</div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/NoteEditor/
git commit -m "feat: add NoteEditor textarea component with error display"
```

---

### Task 7: Editor View (Split Panel)

**Files:**
- Create: `src/views/EditorView.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement EditorView**

Create `src/views/EditorView.tsx`:
```tsx
import { useState, useMemo } from 'react'
import { NoteEditor } from '../components/NoteEditor/NoteEditor'
import { StaffRenderer } from '../components/StaffRenderer/StaffRenderer'
import { parseNotes } from '../parser/parseNotes'
import { ColorMap } from '../types/music'

interface EditorViewProps {
  colors: ColorMap
  initialTitle?: string
  initialNotes?: string
  activeNoteIndex?: number
}

export function EditorView({
  colors,
  initialTitle = '',
  initialNotes = '',
  activeNoteIndex,
}: EditorViewProps) {
  const [title, setTitle] = useState(initialTitle)
  const [notesText, setNotesText] = useState(initialNotes)

  const { elements, errors } = useMemo(() => parseNotes(notesText), [notesText])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px',
          borderBottom: '1px solid #eee',
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
            fontWeight: 'bold',
            border: 'none',
            outline: 'none',
            padding: '4px 0',
          }}
        />
      </div>

      {/* Split panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: editor */}
        <div style={{ width: '35%', borderRight: '1px solid #eee', padding: 12 }}>
          <NoteEditor value={notesText} onChange={setNotesText} errors={errors} />
        </div>

        {/* Right: staff preview */}
        <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
          {elements.length > 0 ? (
            <StaffRenderer
              elements={elements}
              colors={colors}
              activeNoteIndex={activeNoteIndex}
            />
          ) : (
            <div style={{ color: '#999', padding: 40, textAlign: 'center' }}>
              Type notes on the left to see the partitura here
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update App to use EditorView**

Replace `src/App.tsx`:
```tsx
import { EditorView } from './views/EditorView'
import { DEFAULT_COLORS } from './constants/colors'

function App() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <EditorView
        colors={DEFAULT_COLORS}
        initialNotes="Do Do Sol Sol La La Sol/b | Fa Fa Mi Mi Re Re Do/b"
        initialTitle="Twinkle Twinkle Little Star"
      />
    </div>
  )
}

export default App
```

- [ ] **Step 3: Verify visually**

```bash
npm run dev
```
Expected: Split panel — text editor on left, live staff on right. Editing text updates staff in real-time.

- [ ] **Step 4: Commit**

```bash
git add src/views/EditorView.tsx src/App.tsx
git commit -m "feat: add EditorView with split panel — text input left, live staff preview right"
```

---

### Task 8: Playback Engine

**Files:**
- Create: `src/hooks/usePlayback.ts`, `src/components/PlaybackControls/PlaybackControls.tsx`

- [ ] **Step 1: Implement usePlayback hook**

Create `src/hooks/usePlayback.ts`:
```typescript
import { useState, useRef, useCallback } from 'react'
import { MusicElement } from '../types/music'
import { getFrequency, getDurationBeats } from '../constants/frequencies'

interface PlaybackState {
  isPlaying: boolean
  currentIndex: number
  tempo: number
}

export function usePlayback(elements: MusicElement[]) {
  const [state, setState] = useState<PlaybackState>({
    isPlaying: false,
    currentIndex: -1,
    tempo: 100,
  })

  const audioCtxRef = useRef<AudioContext | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const isPlayingRef = useRef(false)

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    return audioCtxRef.current
  }, [])

  const playNote = useCallback(
    (frequency: number, durationSec: number) => {
      const ctx = getAudioContext()

      // Sine + triangle mix for piano-like timbre
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = 'sine'
      osc1.frequency.value = frequency
      osc2.type = 'triangle'
      osc2.frequency.value = frequency

      const merger = ctx.createGain()
      merger.gain.value = 0.5

      osc1.connect(gain)
      osc2.connect(merger)
      merger.connect(gain)
      gain.connect(ctx.destination)

      // ADSR envelope
      const now = ctx.currentTime
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.3, now + 0.02) // attack
      gain.gain.linearRampToValueAtTime(0.2, now + 0.1) // decay
      gain.gain.setValueAtTime(0.2, now + durationSec - 0.05) // sustain
      gain.gain.linearRampToValueAtTime(0, now + durationSec) // release

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + durationSec)
      osc2.stop(now + durationSec)
    },
    [getAudioContext],
  )

  const playSequence = useCallback(
    (startIndex: number) => {
      if (startIndex >= elements.length || !isPlayingRef.current) {
        setState((s) => ({ ...s, isPlaying: false, currentIndex: -1 }))
        isPlayingRef.current = false
        return
      }

      const el = elements[startIndex]

      if (el.type === 'barline') {
        // Skip barlines, no delay
        setState((s) => ({ ...s, currentIndex: startIndex }))
        timeoutRef.current = window.setTimeout(() => playSequence(startIndex + 1), 50)
        return
      }

      const duration = el.type === 'note' ? el.duration : el.duration
      const beats = getDurationBeats(duration)
      const beatDurationSec = 60 / state.tempo
      const durationSec = beats * beatDurationSec

      setState((s) => ({ ...s, currentIndex: startIndex }))

      if (el.type === 'note') {
        const freq = getFrequency(el.name, el.octave)
        playNote(freq, durationSec)
      }
      // Rests: just wait, don't play sound

      timeoutRef.current = window.setTimeout(
        () => playSequence(startIndex + 1),
        durationSec * 1000,
      )
    },
    [elements, state.tempo, playNote],
  )

  const play = useCallback(() => {
    isPlayingRef.current = true
    setState((s) => ({ ...s, isPlaying: true }))
    const startIdx = state.currentIndex >= 0 ? state.currentIndex : 0
    playSequence(startIdx)
  }, [playSequence, state.currentIndex])

  const pause = useCallback(() => {
    isPlayingRef.current = false
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setState((s) => ({ ...s, isPlaying: false }))
  }, [])

  const stop = useCallback(() => {
    isPlayingRef.current = false
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setState((s) => ({ ...s, isPlaying: false, currentIndex: -1 }))
  }, [])

  const setTempo = useCallback((tempo: number) => {
    setState((s) => ({ ...s, tempo }))
  }, [])

  return {
    isPlaying: state.isPlaying,
    currentIndex: state.currentIndex,
    tempo: state.tempo,
    play,
    pause,
    stop,
    setTempo,
  }
}
```

- [ ] **Step 2: Implement PlaybackControls**

Create `src/components/PlaybackControls/PlaybackControls.tsx`:
```tsx
interface PlaybackControlsProps {
  isPlaying: boolean
  tempo: number
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onTempoChange: (tempo: number) => void
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
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
  )
}

const buttonStyle: React.CSSProperties = {
  padding: '4px 12px',
  fontSize: 18,
  border: '1px solid #ddd',
  borderRadius: 6,
  background: 'white',
  cursor: 'pointer',
}
```

- [ ] **Step 3: Wire playback into EditorView**

Update `src/views/EditorView.tsx` — add playback hook and controls to the toolbar:

Replace the imports at the top:
```tsx
import { useState, useMemo } from 'react'
import { NoteEditor } from '../components/NoteEditor/NoteEditor'
import { StaffRenderer } from '../components/StaffRenderer/StaffRenderer'
import { PlaybackControls } from '../components/PlaybackControls/PlaybackControls'
import { parseNotes } from '../parser/parseNotes'
import { usePlayback } from '../hooks/usePlayback'
import { ColorMap } from '../types/music'
```

Replace the EditorViewProps interface and component (full replacement of the file):
```tsx
import { useState, useMemo } from 'react'
import { NoteEditor } from '../components/NoteEditor/NoteEditor'
import { StaffRenderer } from '../components/StaffRenderer/StaffRenderer'
import { PlaybackControls } from '../components/PlaybackControls/PlaybackControls'
import { parseNotes } from '../parser/parseNotes'
import { usePlayback } from '../hooks/usePlayback'
import { ColorMap } from '../types/music'

interface EditorViewProps {
  colors: ColorMap
  initialTitle?: string
  initialNotes?: string
}

export function EditorView({
  colors,
  initialTitle = '',
  initialNotes = '',
}: EditorViewProps) {
  const [title, setTitle] = useState(initialTitle)
  const [notesText, setNotesText] = useState(initialNotes)

  const { elements, errors } = useMemo(() => parseNotes(notesText), [notesText])
  const playback = usePlayback(elements)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px',
          borderBottom: '1px solid #eee',
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
            fontWeight: 'bold',
            border: 'none',
            outline: 'none',
            padding: '4px 0',
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
      </div>

      {/* Split panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: editor */}
        <div style={{ width: '35%', borderRight: '1px solid #eee', padding: 12 }}>
          <NoteEditor value={notesText} onChange={setNotesText} errors={errors} />
        </div>

        {/* Right: staff preview */}
        <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
          {elements.length > 0 ? (
            <StaffRenderer
              elements={elements}
              colors={colors}
              activeNoteIndex={playback.currentIndex}
            />
          ) : (
            <div style={{ color: '#999', padding: 40, textAlign: 'center' }}>
              Type notes on the left to see the partitura here
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify playback works**

```bash
npm run dev
```
Expected: Click play button — hear synthesized piano notes, see highlight move on staff.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePlayback.ts src/components/PlaybackControls/ src/views/EditorView.tsx
git commit -m "feat: add Web Audio API playback engine with play/pause/stop and tempo control"
```

---

### Task 9: localStorage Persistence

**Files:**
- Create: `src/hooks/useLocalStorage.ts`

- [ ] **Step 1: Implement useLocalStorage hook**

Create `src/hooks/useLocalStorage.ts`:
```typescript
import { useState, useCallback } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const newValue = value instanceof Function ? value(prev) : value
        localStorage.setItem(key, JSON.stringify(newValue))
        return newValue
      })
    },
    [key],
  )

  return [storedValue, setValue] as const
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useLocalStorage.ts
git commit -m "feat: add useLocalStorage hook for persistence"
```

---

### Task 10: Song Database

**Files:**
- Create: `src/data/songs.json`, `src/components/SongBrowser/SongBrowser.tsx`, `src/views/BrowseView.tsx`

- [ ] **Step 1: Create song database**

Create `src/data/songs.json`:
```json
[
  {
    "id": "twinkle-twinkle",
    "title": "Twinkle Twinkle Little Star",
    "author": "Traditional",
    "category": "Clasicas",
    "difficulty": 1,
    "notes": "Do Do Sol Sol La La Sol/b | Fa Fa Mi Mi Re Re Do/b | Sol Sol Fa Fa Mi Mi Re/b | Sol Sol Fa Fa Mi Mi Re/b | Do Do Sol Sol La La Sol/b | Fa Fa Mi Mi Re Re Do/b"
  },
  {
    "id": "cumpleanos-feliz",
    "title": "Cumpleaños Feliz",
    "author": "Traditional",
    "category": "Clasicas",
    "difficulty": 1,
    "notes": "Sol/c Sol/c La Sol Do5 Si/b | Sol/c Sol/c La Sol Re5 Do5/b | Sol/c Sol/c Sol5 Mi5 Do5 Si La | Fa5/c Fa5/c Mi5 Do5 Re5 Do5/b"
  },
  {
    "id": "frere-jacques",
    "title": "Frère Jacques",
    "author": "Traditional",
    "category": "Infantiles",
    "difficulty": 1,
    "notes": "Do Re Mi Do | Do Re Mi Do | Mi Fa Sol/b | Mi Fa Sol/b | Sol/c La/c Sol/c Fa/c Mi Do | Sol/c La/c Sol/c Fa/c Mi Do | Do Sol3 Do/b | Do Sol3 Do/b"
  },
  {
    "id": "mary-had-a-little-lamb",
    "title": "Mary Had a Little Lamb",
    "author": "Traditional",
    "category": "Infantiles",
    "difficulty": 1,
    "notes": "Mi Re Do Re Mi Mi Mi/b | Re Re Re/b | Mi Sol Sol/b | Mi Re Do Re Mi Mi Mi | Mi Re Re Mi Re Do/b"
  },
  {
    "id": "ode-to-joy",
    "title": "Ode to Joy",
    "author": "Beethoven",
    "category": "Clasicas",
    "difficulty": 2,
    "notes": "Mi Mi Fa Sol | Sol Fa Mi Re | Do Do Re Mi | Mi Re Re/b | Mi Mi Fa Sol | Sol Fa Mi Re | Do Do Re Mi | Re Do Do/b"
  },
  {
    "id": "jingle-bells",
    "title": "Jingle Bells",
    "author": "Traditional",
    "category": "Navidad",
    "difficulty": 1,
    "notes": "Mi Mi Mi/b | Mi Mi Mi/b | Mi Sol Do Re Mi/r | Fa Fa Fa Fa Fa Mi Mi Mi/c Mi/c | Mi Re Re Mi Re Sol/b"
  },
  {
    "id": "london-bridge",
    "title": "London Bridge",
    "author": "Traditional",
    "category": "Infantiles",
    "difficulty": 1,
    "notes": "Sol La Sol Fa Mi Fa Sol/b | Re Mi Fa/b | Mi Fa Sol/b | Sol La Sol Fa Mi Fa Sol/b | Re Sol Mi Do/b"
  },
  {
    "id": "row-row-row",
    "title": "Row Row Row Your Boat",
    "author": "Traditional",
    "category": "Infantiles",
    "difficulty": 1,
    "notes": "Do Do Do Re Mi/b | Mi Re Mi Fa Sol/r | Do5/c Do5/c Do5/c Sol/c Sol/c Sol/c Mi/c Mi/c Mi/c Do/c Do/c Do/c | Sol Fa Mi Re Do/r"
  },
  {
    "id": "hot-cross-buns",
    "title": "Hot Cross Buns",
    "author": "Traditional",
    "category": "Infantiles",
    "difficulty": 1,
    "notes": "Mi Re Do/b | Mi Re Do/b | Do Do Re Re Mi Re Do/b"
  },
  {
    "id": "au-clair-de-la-lune",
    "title": "Au Clair de la Lune",
    "author": "Traditional",
    "category": "Clasicas",
    "difficulty": 1,
    "notes": "Do Do Do Re Mi/b Re/b | Do Mi Re Re Do/r | Do Do Do Re Mi/b Re/b | Do Mi Re Re Do/r"
  }
]
```

- [ ] **Step 2: Implement SongBrowser**

Create `src/components/SongBrowser/SongBrowser.tsx`:
```tsx
import { useState, useMemo } from 'react'
import { Song } from '../../types/music'

interface SongBrowserProps {
  builtInSongs: Song[]
  userSongs: Song[]
  onSelectSong: (song: Song) => void
  onDeleteUserSong?: (id: string) => void
}

type Tab = 'browse' | 'my-songs'

export function SongBrowser({
  builtInSongs,
  userSongs,
  onSelectSong,
  onDeleteUserSong,
}: SongBrowserProps) {
  const [tab, setTab] = useState<Tab>('browse')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | null>(null)

  const categories = useMemo(() => {
    const cats = new Set(builtInSongs.map((s) => s.category).filter(Boolean) as string[])
    return Array.from(cats).sort()
  }, [builtInSongs])

  const filteredSongs = useMemo(() => {
    const songs = tab === 'browse' ? builtInSongs : userSongs
    return songs.filter((song) => {
      const matchesSearch = !search || song.title.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !category || song.category === category
      return matchesSearch && matchesCategory
    })
  }, [tab, builtInSongs, userSongs, search, category])

  const difficultyStars = (d?: number) => '⭐'.repeat(d || 1)

  return (
    <div style={{ padding: 16 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setTab('browse')}
          style={{
            ...tabStyle,
            fontWeight: tab === 'browse' ? 'bold' : 'normal',
            borderBottom: tab === 'browse' ? '2px solid #333' : '2px solid transparent',
          }}
        >
          Browse Songs
        </button>
        <button
          onClick={() => setTab('my-songs')}
          style={{
            ...tabStyle,
            fontWeight: tab === 'my-songs' ? 'bold' : 'normal',
            borderBottom: tab === 'my-songs' ? '2px solid #333' : '2px solid transparent',
          }}
        >
          My Partituras ({userSongs.length})
        </button>
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search songs..."
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', outline: 'none' }}
        />
        {tab === 'browse' && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setCategory(null)}
              style={{ ...chipStyle, background: !category ? '#333' : '#f0f0f0', color: !category ? 'white' : '#333' }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat === category ? null : cat)}
                style={{ ...chipStyle, background: cat === category ? '#333' : '#f0f0f0', color: cat === category ? 'white' : '#333' }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Song list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
        {filteredSongs.map((song) => (
          <div
            key={song.id}
            onClick={() => onSelectSong(song)}
            style={{
              padding: 16,
              border: '1px solid #eee',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'box-shadow 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
          >
            <h3 style={{ margin: 0, fontSize: 16 }}>{song.title}</h3>
            {song.author && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>{song.author}</p>}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              {song.category && <span style={{ fontSize: 12, color: '#666' }}>{song.category}</span>}
              {song.difficulty && <span style={{ fontSize: 12 }}>{difficultyStars(song.difficulty)}</span>}
            </div>
            {tab === 'my-songs' && onDeleteUserSong && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteUserSong(song.id)
                }}
                style={{ marginTop: 8, padding: '2px 8px', fontSize: 12, color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: 4, background: 'white', cursor: 'pointer' }}
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      {filteredSongs.length === 0 && (
        <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
          {tab === 'my-songs' ? 'No saved partituras yet. Create one in the editor!' : 'No songs match your search.'}
        </div>
      )}
    </div>
  )
}

const tabStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '8px 16px',
  cursor: 'pointer',
  fontSize: 15,
}

const chipStyle: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: 16,
  border: 'none',
  cursor: 'pointer',
  fontSize: 13,
}
```

- [ ] **Step 3: Create BrowseView**

Create `src/views/BrowseView.tsx`:
```tsx
import { SongBrowser } from '../components/SongBrowser/SongBrowser'
import { Song } from '../types/music'
import builtInSongs from '../data/songs.json'

interface BrowseViewProps {
  userSongs: Song[]
  onSelectSong: (song: Song) => void
  onDeleteUserSong: (id: string) => void
}

export function BrowseView({ userSongs, onSelectSong, onDeleteUserSong }: BrowseViewProps) {
  return (
    <SongBrowser
      builtInSongs={builtInSongs as Song[]}
      userSongs={userSongs}
      onSelectSong={onSelectSong}
      onDeleteUserSong={onDeleteUserSong}
    />
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/data/songs.json src/components/SongBrowser/ src/views/BrowseView.tsx
git commit -m "feat: add song database with 10 kids' songs and SongBrowser component"
```

---

### Task 11: App Shell with Navigation and Persistence

**Files:**
- Modify: `src/App.tsx`, `src/App.css`
- Modify: `src/views/EditorView.tsx`

- [ ] **Step 1: Update EditorView to support save**

Replace `src/views/EditorView.tsx` with full file including save support:
```tsx
import { useState, useMemo } from 'react'
import { NoteEditor } from '../components/NoteEditor/NoteEditor'
import { StaffRenderer } from '../components/StaffRenderer/StaffRenderer'
import { PlaybackControls } from '../components/PlaybackControls/PlaybackControls'
import { parseNotes } from '../parser/parseNotes'
import { usePlayback } from '../hooks/usePlayback'
import { ColorMap, Song } from '../types/music'

interface EditorViewProps {
  colors: ColorMap
  initialTitle?: string
  initialNotes?: string
  editingSongId?: string | null
  onSave?: (song: Omit<Song, 'createdAt' | 'updatedAt'>) => void
}

export function EditorView({
  colors,
  initialTitle = '',
  initialNotes = '',
  editingSongId = null,
  onSave,
}: EditorViewProps) {
  const [title, setTitle] = useState(initialTitle)
  const [notesText, setNotesText] = useState(initialNotes)

  const { elements, errors } = useMemo(() => parseNotes(notesText), [notesText])
  const playback = usePlayback(elements)

  const handleSave = () => {
    if (!onSave) return
    onSave({
      id: editingSongId || crypto.randomUUID(),
      title: title || 'Untitled',
      notes: notesText,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px',
          borderBottom: '1px solid #eee',
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
            fontWeight: 'bold',
            border: 'none',
            outline: 'none',
            padding: '4px 0',
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
        {onSave && (
          <button
            onClick={handleSave}
            style={{
              padding: '6px 16px',
              fontSize: 14,
              border: '1px solid #27ae60',
              borderRadius: 6,
              background: '#27ae60',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        )}
      </div>

      {/* Split panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: editor */}
        <div style={{ width: '35%', borderRight: '1px solid #eee', padding: 12 }}>
          <NoteEditor value={notesText} onChange={setNotesText} errors={errors} />
        </div>

        {/* Right: staff preview */}
        <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
          {elements.length > 0 ? (
            <StaffRenderer
              elements={elements}
              colors={colors}
              activeNoteIndex={playback.currentIndex}
            />
          ) : (
            <div style={{ color: '#999', padding: 40, textAlign: 'center' }}>
              Type notes on the left to see the partitura here
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build full App shell with nav and routing**

Replace `src/App.tsx`:
```tsx
import { useState, useCallback } from 'react'
import { EditorView } from './views/EditorView'
import { BrowseView } from './views/BrowseView'
import { DEFAULT_COLORS } from './constants/colors'
import { useLocalStorage } from './hooks/useLocalStorage'
import { Song, ColorMap } from './types/music'
import './App.css'

type View = 'editor' | 'browse'

function App() {
  const [view, setView] = useState<View>('editor')
  const [colors] = useLocalStorage<ColorMap>('partituras:settings', DEFAULT_COLORS)
  const [userSongs, setUserSongs] = useLocalStorage<Song[]>('partituras:songs', [])

  // Current editor state
  const [editorKey, setEditorKey] = useState(0) // force remount on song change
  const [editTitle, setEditTitle] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editingSongId, setEditingSongId] = useState<string | null>(null)

  const handleSelectSong = useCallback(
    (song: Song) => {
      setEditTitle(song.title)
      setEditNotes(song.notes)
      setEditingSongId(null) // open as a new copy
      setEditorKey((k) => k + 1)
      setView('editor')
    },
    [],
  )

  const handleSave = useCallback(
    (song: Omit<Song, 'createdAt' | 'updatedAt'>) => {
      setUserSongs((prev) => {
        const now = Date.now()
        const existing = prev.find((s) => s.id === song.id)
        if (existing) {
          return prev.map((s) =>
            s.id === song.id ? { ...s, ...song, updatedAt: now } : s,
          )
        }
        return [...prev, { ...song, createdAt: now, updatedAt: now } as Song]
      })
      setEditingSongId(song.id)
    },
    [setUserSongs],
  )

  const handleDeleteUserSong = useCallback(
    (id: string) => {
      setUserSongs((prev) => prev.filter((s) => s.id !== id))
    },
    [setUserSongs],
  )

  const handleNew = useCallback(() => {
    setEditTitle('')
    setEditNotes('')
    setEditingSongId(null)
    setEditorKey((k) => k + 1)
    setView('editor')
  }, [])

  return (
    <div className="app">
      {/* Nav bar */}
      <nav className="nav">
        <span className="nav-title">🎹 Piano Partituras</span>
        <div className="nav-links">
          <button
            className={`nav-link ${view === 'editor' ? 'active' : ''}`}
            onClick={handleNew}
          >
            + New
          </button>
          <button
            className={`nav-link ${view === 'editor' ? 'active' : ''}`}
            onClick={() => setView('editor')}
          >
            Editor
          </button>
          <button
            className={`nav-link ${view === 'browse' ? 'active' : ''}`}
            onClick={() => setView('browse')}
          >
            Browse
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="main">
        {view === 'editor' && (
          <EditorView
            key={editorKey}
            colors={colors}
            initialTitle={editTitle}
            initialNotes={editNotes}
            editingSongId={editingSongId}
            onSave={handleSave}
          />
        )}
        {view === 'browse' && (
          <BrowseView
            userSongs={userSongs}
            onSelectSong={handleSelectSong}
            onDeleteUserSong={handleDeleteUserSong}
          />
        )}
      </main>
    </div>
  )
}

export default App
```

- [ ] **Step 3: Add App styles**

Replace `src/App.css`:
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px;
  border-bottom: 1px solid #eee;
  background: white;
}

.nav-title {
  font-size: 18px;
  font-weight: 700;
}

.nav-links {
  display: flex;
  gap: 4px;
}

.nav-link {
  background: none;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
}

.nav-link:hover {
  background: #f5f5f5;
}

.nav-link.active {
  color: #333;
  font-weight: 600;
}

.main {
  flex: 1;
  overflow: hidden;
}
```

Also ensure `src/index.css` has minimal reset:
```css
body {
  margin: 0;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 4: Verify full app flow**

```bash
npm run dev
```
Expected: Nav bar with New/Editor/Browse. Create a song, save it, browse to find it, click to reopen.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/App.css src/index.css src/views/EditorView.tsx
git commit -m "feat: add app shell with navigation, save/load, and browse integration"
```

---

### Task 12: PDF Export

**Files:**
- Create: `src/components/PdfExporter/PdfExporter.tsx`, `src/components/PdfExporter/PianoKeyboardSvg.tsx`, `src/components/PdfExporter/ColorLegend.tsx`

- [ ] **Step 1: Implement PianoKeyboardSvg**

Create `src/components/PdfExporter/PianoKeyboardSvg.tsx`:
```tsx
import { ColorMap, NoteName } from '../../types/music'
import { NOTE_ORDER } from '../../constants/noteNames'

interface PianoKeyboardSvgProps {
  colors: ColorMap
  width?: number
}

export function PianoKeyboardSvg({ colors, width = 500 }: PianoKeyboardSvgProps) {
  const whiteKeyWidth = width / 14 // 14 white keys for 2 octaves
  const whiteKeyHeight = 80
  const blackKeyWidth = whiteKeyWidth * 0.6
  const blackKeyHeight = 50

  // Which notes have black keys after them (sharps)
  const hasSharpAfter = new Set<NoteName>(['Do', 'Re', 'Fa', 'Sol', 'La'])

  const keys: Array<{ x: number; name: NoteName; octave: number }> = []
  let x = 0
  for (let oct = 4; oct <= 5; oct++) {
    for (const name of NOTE_ORDER) {
      keys.push({ x, name, octave: oct })
      x += whiteKeyWidth
    }
  }

  return (
    <svg width={width} height={whiteKeyHeight + 20} xmlns="http://www.w3.org/2000/svg">
      {/* White keys */}
      {keys.map((key, i) => (
        <g key={i}>
          <rect
            x={key.x}
            y={0}
            width={whiteKeyWidth - 1}
            height={whiteKeyHeight}
            fill="white"
            stroke="#333"
            strokeWidth={1}
          />
          {/* Color dot on the key */}
          <circle
            cx={key.x + whiteKeyWidth / 2}
            cy={whiteKeyHeight - 15}
            r={8}
            fill={colors[key.name]}
          />
          <text
            x={key.x + whiteKeyWidth / 2}
            y={whiteKeyHeight + 14}
            textAnchor="middle"
            fontSize="9"
            fill="#666"
          >
            {key.name}
          </text>
        </g>
      ))}

      {/* Black keys */}
      {keys.map((key, i) => {
        if (!hasSharpAfter.has(key.name)) return null
        return (
          <rect
            key={`black-${i}`}
            x={key.x + whiteKeyWidth - blackKeyWidth / 2}
            y={0}
            width={blackKeyWidth}
            height={blackKeyHeight}
            fill="#333"
            stroke="#000"
            strokeWidth={1}
            rx={2}
          />
        )
      })}
    </svg>
  )
}
```

- [ ] **Step 2: Implement ColorLegend**

Create `src/components/PdfExporter/ColorLegend.tsx`:
```tsx
import { ColorMap } from '../../types/music'
import { NOTE_ORDER } from '../../constants/noteNames'

interface ColorLegendProps {
  colors: ColorMap
  width?: number
}

export function ColorLegend({ colors, width = 500 }: ColorLegendProps) {
  const itemWidth = width / NOTE_ORDER.length

  return (
    <svg width={width} height={40} xmlns="http://www.w3.org/2000/svg">
      {NOTE_ORDER.map((name, i) => (
        <g key={name}>
          <circle cx={i * itemWidth + itemWidth / 2} cy={12} r={10} fill={colors[name]} />
          <text
            x={i * itemWidth + itemWidth / 2}
            y={35}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill="#333"
          >
            {name}
          </text>
        </g>
      ))}
    </svg>
  )
}
```

- [ ] **Step 3: Implement PdfExporter**

Create `src/components/PdfExporter/PdfExporter.tsx`:
```tsx
import { useState } from 'react'
import { jsPDF } from 'jspdf'
import 'svg2pdf.js'
import { MusicElement, ColorMap } from '../../types/music'
import { PRINT_COLORS } from '../../constants/colors'

interface PdfExporterProps {
  title: string
  author?: string
  elements: MusicElement[]
  colors: ColorMap
  staffSvgRef: React.RefObject<SVGSVGElement | null>
}

export function PdfExporter({
  title,
  elements,
  staffSvgRef,
}: PdfExporterProps) {
  const [pdfTitle, setPdfTitle] = useState(title)
  const [pdfAuthor, setPdfAuthor] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!staffSvgRef.current || elements.length === 0) return

    setIsExporting(true)
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()

      // Title
      pdf.setFontSize(24)
      pdf.text(pdfTitle || 'Untitled', pageWidth / 2, 25, { align: 'center' })

      // Author
      if (pdfAuthor) {
        pdf.setFontSize(14)
        pdf.setTextColor(100)
        pdf.text(pdfAuthor, pageWidth / 2, 33, { align: 'center' })
        pdf.setTextColor(0)
      }

      // Staff SVG
      const svgEl = staffSvgRef.current
      const svgWidth = svgEl.getBoundingClientRect().width
      const svgHeight = svgEl.getBoundingClientRect().height
      const pdfStaffWidth = pageWidth - 20 // 10mm margins
      const scale = pdfStaffWidth / svgWidth
      const pdfStaffHeight = svgHeight * scale

      await pdf.svg(svgEl, {
        x: 10,
        y: 40,
        width: pdfStaffWidth,
        height: pdfStaffHeight,
      })

      // Color legend (rendered as text + circles since svg2pdf handles inline SVG)
      const legendY = 40 + pdfStaffHeight + 15
      const printColors = PRINT_COLORS
      const names = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'] as const
      const legendItemWidth = pdfStaffWidth / 7
      pdf.setFontSize(10)
      names.forEach((name, i) => {
        const cx = 10 + i * legendItemWidth + legendItemWidth / 2
        pdf.setFillColor(printColors[name])
        pdf.circle(cx, legendY, 3, 'F')
        pdf.setTextColor(50)
        pdf.text(name, cx, legendY + 7, { align: 'center' })
      })
      pdf.setTextColor(0)

      // Piano keyboard diagram
      // Render a simple 2-octave keyboard below the legend
      const kbY = legendY + 15
      const kbWidth = pdfStaffWidth
      const whiteKeyW = kbWidth / 14
      const whiteKeyH = 18
      const blackKeyW = whiteKeyW * 0.6
      const blackKeyH = 11
      const noteNames = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'] as const
      const hasSharp = new Set(['Do', 'Re', 'Fa', 'Sol', 'La'])

      // White keys
      let kx = 10
      const keyPositions: Array<{ x: number; name: typeof noteNames[number] }> = []
      for (let oct = 0; oct < 2; oct++) {
        for (const n of noteNames) {
          keyPositions.push({ x: kx, name: n })
          pdf.setDrawColor(50)
          pdf.setFillColor(255, 255, 255)
          pdf.rect(kx, kbY, whiteKeyW - 0.5, whiteKeyH, 'FD')
          // Color dot
          pdf.setFillColor(printColors[n])
          pdf.circle(kx + whiteKeyW / 2, kbY + whiteKeyH - 4, 1.5, 'F')
          kx += whiteKeyW
        }
      }
      // Black keys
      for (const kp of keyPositions) {
        if (hasSharp.has(kp.name)) {
          pdf.setFillColor(40, 40, 40)
          pdf.rect(kp.x + whiteKeyW - blackKeyW / 2, kbY, blackKeyW, blackKeyH, 'F')
        }
      }

      pdf.save(`${pdfTitle || 'partitura'}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="text"
        value={pdfTitle}
        onChange={(e) => setPdfTitle(e.target.value)}
        placeholder="PDF title..."
        style={{ padding: '4px 8px', fontSize: 13, borderRadius: 4, border: '1px solid #ddd', width: 150 }}
      />
      <input
        type="text"
        value={pdfAuthor}
        onChange={(e) => setPdfAuthor(e.target.value)}
        placeholder="Author..."
        style={{ padding: '4px 8px', fontSize: 13, borderRadius: 4, border: '1px solid #ddd', width: 120 }}
      />
      <button
        onClick={handleExport}
        disabled={isExporting || elements.length === 0}
        style={{
          padding: '6px 14px',
          fontSize: 13,
          border: '1px solid #8e44ad',
          borderRadius: 6,
          background: isExporting ? '#ccc' : '#8e44ad',
          color: 'white',
          cursor: isExporting ? 'not-allowed' : 'pointer',
        }}
      >
        {isExporting ? 'Exporting...' : '📄 PDF'}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Wire PDF export into EditorView**

Update `src/views/EditorView.tsx` — add a ref for the SVG and include PdfExporter in toolbar.

Full file replacement:
```tsx
import { useState, useMemo, useRef } from 'react'
import { NoteEditor } from '../components/NoteEditor/NoteEditor'
import { StaffRenderer } from '../components/StaffRenderer/StaffRenderer'
import { PlaybackControls } from '../components/PlaybackControls/PlaybackControls'
import { PdfExporter } from '../components/PdfExporter/PdfExporter'
import { parseNotes } from '../parser/parseNotes'
import { usePlayback } from '../hooks/usePlayback'
import { ColorMap, Song } from '../types/music'

interface EditorViewProps {
  colors: ColorMap
  initialTitle?: string
  initialNotes?: string
  editingSongId?: string | null
  onSave?: (song: Omit<Song, 'createdAt' | 'updatedAt'>) => void
}

export function EditorView({
  colors,
  initialTitle = '',
  initialNotes = '',
  editingSongId = null,
  onSave,
}: EditorViewProps) {
  const [title, setTitle] = useState(initialTitle)
  const [notesText, setNotesText] = useState(initialNotes)
  const staffSvgRef = useRef<SVGSVGElement>(null)

  const { elements, errors } = useMemo(() => parseNotes(notesText), [notesText])
  const playback = usePlayback(elements)

  const handleSave = () => {
    if (!onSave) return
    onSave({
      id: editingSongId || crypto.randomUUID(),
      title: title || 'Untitled',
      notes: notesText,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px',
          borderBottom: '1px solid #eee',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Song title..."
          style={{
            flex: 1,
            minWidth: 150,
            fontSize: 18,
            fontWeight: 'bold',
            border: 'none',
            outline: 'none',
            padding: '4px 0',
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
              padding: '6px 16px',
              fontSize: 14,
              border: '1px solid #27ae60',
              borderRadius: 6,
              background: '#27ae60',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        )}
      </div>

      {/* Split panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: editor */}
        <div style={{ width: '35%', borderRight: '1px solid #eee', padding: 12 }}>
          <NoteEditor value={notesText} onChange={setNotesText} errors={errors} />
        </div>

        {/* Right: staff preview */}
        <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
          {elements.length > 0 ? (
            <StaffRenderer
              ref={staffSvgRef}
              elements={elements}
              colors={colors}
              activeNoteIndex={playback.currentIndex}
            />
          ) : (
            <div style={{ color: '#999', padding: 40, textAlign: 'center' }}>
              Type notes on the left to see the partitura here
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Add forwardRef to StaffRenderer**

Update `src/components/StaffRenderer/StaffRenderer.tsx` to forward the SVG ref.

Wrap the export with `forwardRef`:

Change the function signature from:
```tsx
export function StaffRenderer({
  elements,
  colors,
  width = 800,
  activeNoteIndex,
}: StaffRendererProps) {
```

To:
```tsx
import { forwardRef } from 'react'

// ... (keep all internal components the same)

export const StaffRenderer = forwardRef<SVGSVGElement, StaffRendererProps>(
  function StaffRenderer({ elements, colors, width = 800, activeNoteIndex }, ref) {
```

And change the `<svg>` tag to include the ref:
```tsx
    <svg ref={ref} width={width} height={...} xmlns="http://www.w3.org/2000/svg">
```

Close with `})` instead of just `}`.

- [ ] **Step 6: Verify PDF export**

```bash
npm run dev
```
Expected: Type some notes, click PDF button, a PDF file downloads with the staff rendered.

- [ ] **Step 7: Commit**

```bash
git add src/components/PdfExporter/ src/components/StaffRenderer/StaffRenderer.tsx src/views/EditorView.tsx
git commit -m "feat: add PDF export with title, colored staff, legend, and keyboard diagram"
```

---

### Task 13: Color Settings

**Files:**
- Create: `src/components/ColorSettings/ColorSettings.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement ColorSettings**

Create `src/components/ColorSettings/ColorSettings.tsx`:
```tsx
import { ColorMap, NoteName } from '../../types/music'
import { DEFAULT_COLORS } from '../../constants/colors'
import { NOTE_ORDER } from '../../constants/noteNames'

interface ColorSettingsProps {
  colors: ColorMap
  onChange: (colors: ColorMap) => void
}

export function ColorSettings({ colors, onChange }: ColorSettingsProps) {
  const handleColorChange = (name: NoteName, color: string) => {
    onChange({ ...colors, [name]: color })
  }

  const handleReset = () => {
    onChange({ ...DEFAULT_COLORS })
  }

  return (
    <div style={{ padding: 16, maxWidth: 400 }}>
      <h3 style={{ marginBottom: 16 }}>Note Colors</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {NOTE_ORDER.map((name) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="color"
              value={colors[name]}
              onChange={(e) => handleColorChange(name, e.target.value)}
              style={{ width: 40, height: 30, border: 'none', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 'bold', minWidth: 30 }}>{name}</span>
            <span style={{ color: '#999', fontSize: 13 }}>{colors[name]}</span>
          </div>
        ))}
      </div>
      <button
        onClick={handleReset}
        style={{
          marginTop: 16,
          padding: '6px 14px',
          fontSize: 13,
          border: '1px solid #ddd',
          borderRadius: 6,
          background: 'white',
          cursor: 'pointer',
        }}
      >
        Reset to Defaults
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Add settings view to App**

Update `src/App.tsx` — add a `settings` view option.

Add to the `View` type:
```tsx
type View = 'editor' | 'browse' | 'settings'
```

Add the `setColors` from `useLocalStorage` (it's the second return value, already destructured as `[colors]` — change to `[colors, setColors]`).

Add a nav link for Settings:
```tsx
<button
  className={`nav-link ${view === 'settings' ? 'active' : ''}`}
  onClick={() => setView('settings')}
>
  Settings
</button>
```

Add the settings view in main:
```tsx
{view === 'settings' && (
  <ColorSettings colors={colors} onChange={setColors} />
)}
```

Import `ColorSettings`:
```tsx
import { ColorSettings } from './components/ColorSettings/ColorSettings'
```

- [ ] **Step 3: Verify color customization**

```bash
npm run dev
```
Expected: Settings page shows color pickers. Changing a color updates the staff in real-time.

- [ ] **Step 4: Commit**

```bash
git add src/components/ColorSettings/ src/App.tsx
git commit -m "feat: add color settings with per-note color picker and reset to defaults"
```

---

### Task 14: Final Integration and Polish

**Files:**
- Modify: `src/App.css`, `src/views/EditorView.tsx`

- [ ] **Step 1: Add responsive styles and polish**

Append to `src/App.css`:
```css
/* Responsive: stack editor panels on small screens */
@media (max-width: 768px) {
  .split-panel {
    flex-direction: column !important;
  }
  .split-panel > div:first-child {
    width: 100% !important;
    height: 200px !important;
    border-right: none !important;
    border-bottom: 1px solid #eee;
  }
}

/* Textarea focus */
textarea:focus {
  border-color: #8e44ad !important;
}

/* Button hover effects */
button:hover:not(:disabled) {
  opacity: 0.9;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}
```

- [ ] **Step 2: Run all tests**

```bash
npm run test:run
```
Expected: All tests pass.

- [ ] **Step 3: Build for production**

```bash
npm run build
```
Expected: Build succeeds, output in `dist/`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: final polish — responsive layout, styling, production build verified"
```

---

## Summary

| Task | Description | Dependencies |
|------|-------------|--------------|
| 1 | Project scaffolding | None |
| 2 | Types and constants | 1 |
| 3 | Note parser + tests | 2 |
| 4 | Staff positioning utilities + tests | 2 |
| 5 | Staff renderer SVG component | 3, 4 |
| 6 | Note editor component | 3 |
| 7 | Editor view (split panel) | 5, 6 |
| 8 | Playback engine + controls | 2, 7 |
| 9 | localStorage persistence hook | 1 |
| 10 | Song database + browser | 2, 9 |
| 11 | App shell with nav + persistence | 7, 8, 9, 10 |
| 12 | PDF export | 5, 11 |
| 13 | Color settings | 11 |
| 14 | Final integration + polish | All |

**Parallel opportunities:** Tasks 3 and 4 can run in parallel. Tasks 6 and 4 can run in parallel. Tasks 9 and 10 can start once Task 2 is done.
