# Piano Partituras

Color-coded piano sheet music app for kids. Write, browse, play, and print partituras with colored notes.

**Live:** https://sejas.github.io/piano/

## Features

- **Color-coded staff** — real 5-line pentagrama with colored note heads (Do=red, Re=purple, Mi=dark blue, Fa=light blue, Sol=green, La=yellow, Si=orange)
- **Text editor with live preview** — type notes in Spanish (Do Re Mi) or English (C D E) and see the staff update in real-time
- **Piano keyboard** — click keys or use keyboard shortcuts (A-J for octave 4, Q-U for octave 5)
- **Playback** — synthesized piano sound with adjustable tempo (60-180 BPM)
- **Song browser** — 11 built-in kids' songs (Twinkle Twinkle, Cumpleanos Feliz, La Lambada, etc.)
- **PDF export** — printable A4 pages with title, staff, color legend, and keyboard diagram
- **Customizable colors** — change any note's color in Settings
- **Offline** — fully client-side, saves to localStorage

## Note Syntax

```
Do Re Mi Fa Sol La Si     (Spanish, default octave 4, quarter note)
C D E F G A B             (English)
Do5 Re3                   (explicit octave)
Do/b Re/c Mi/r            (duration: r=whole, b=half, n=quarter, c=eighth)
Do5/b                     (octave + duration)
|                         (bar line)
-                         (rest, e.g. -/b for half rest)
```

## Development

```bash
npm install
npm run dev       # start dev server
npm run test:run  # run tests
npm run build     # production build
```

## Tech Stack

React 18, Vite, TypeScript, Web Audio API, jsPDF + svg2pdf.js, localStorage
