import { forwardRef } from "react";
import type { MusicElement, Note, ColorMap } from "../../types/music";
import {
  STAFF_CONFIG,
  getNoteY,
  getStemDirection,
  getLedgerLines,
  layoutNotes,
  getTotalStaffHeight,
} from "./staffUtils";

interface StaffRendererProps {
  elements: MusicElement[];
  colors: ColorMap;
  width?: number;
  activeNoteIndex?: number;
}

const REST_SYMBOLS: Record<string, string> = {
  r: "𝄻", // whole rest
  b: "𝄼", // half rest
  n: "𝄽", // quarter rest
  c: "𝄾", // eighth rest
};

function renderStaffLines(offsetY: number, width: number) {
  const lines = [];
  for (let i = 0; i < 5; i++) {
    const y = offsetY + STAFF_CONFIG.topLineY + i * STAFF_CONFIG.lineSpacing;
    lines.push(
      <line
        key={`staffline-${i}`}
        x1={0}
        y1={y}
        x2={width}
        y2={y}
        stroke="#333"
        strokeWidth={1}
      />,
    );
  }
  return lines;
}

// Treble clef path from a proper vector source (potrace)
const TREBLE_CLEF_PATH =
  "M3599 12778 c-303 -107 -613 -565 -797 -1178 -82 -275 -124 -513 " +
  "-142 -806 -21 -349 17 -667 219 -1842 l18 -103 -235 -242 c-551 -568 -766 " +
  "-807 -1003 -1117 -386 -505 -604 -958 -689 -1433 -79 -441 -23 -1008 145 " +
  "-1471 292 -802 859 -1344 1600 -1531 192 -49 326 -66 560 -72 234 -6 433 10 " +
  "634 50 75 15 114 20 116 13 9 -28 110 -634 150 -891 111 -721 120 -984 40 " +
  "-1222 -106 -316 -353 -540 -693 -630 -124 -33 -345 -38 -456 -10 -159 40 -280 " +
  "127 -337 243 -18 35 -29 67 -26 70 3 3 35 12 72 19 192 41 369 180 455 360 48 " +
  "102 63 165 63 279 0 269 -161 504 -416 606 -377 151 -792 -59 -916 -462 -59 " +
  "-193 -66 -458 -17 -603 148 -431 716 -775 1326 -801 592 -26 1041 262 1214 " +
  "780 67 202 96 460 77 702 -21 270 -106 812 -224 1424 l-44 225 31 14 c281 130 " +
  "430 227 594 385 63 61 145 152 182 202 433 575 485 1413 130 2072 -72 133 " +
  "-171 264 -290 383 -205 205 -425 327 -705 390 -127 29 -402 37 -544 15 -57 -9 " +
  "-105 -15 -107 -13 -2 2 -159 766 -219 1065 l-36 182 123 133 c426 455 682 872 " +
  "850 1381 156 472 216 921 205 1526 -7 398 -37 654 -112 959 -170 693 -478 " +
  "1060 -796 949z m378 -1136 c127 -65 199 -241 210 -517 13 -301 -51 -573 -206 " +
  "-890 -155 -314 -383 -629 -744 -1024 l-132 -145 -12 65 c-20 110 -62 438 -73 " +
  "564 -11 133 0 379 26 575 68 524 246 966 489 1216 157 160 320 218 442 156z " +
  "m-818 -4167 c18 -88 68 -342 112 -564 81 -407 82 -420 46 -421 -5 0 -58 -25 " +
  "-118 -55 -374 -186 -660 -494 -810 -871 -104 -264 -117 -579 -34 -842 31 -97 " +
  "107 -248 171 -338 102 -144 286 -315 460 -427 87 -56 298 -167 318 -167 8 0 " +
  "24 14 36 30 l21 30 -108 108 c-234 231 -366 467 -408 725 -18 109 -19 173 -4 " +
  "270 41 278 193 516 426 668 64 41 206 109 230 109 5 0 21 -62 35 -137 15 -76 " +
  "74 -376 132 -668 140 -708 308 -1587 303 -1591 -2 -3 -46 -15 -98 -28 -314 " +
  "-80 -666 -80 -975 0 -559 144 -979 464 -1208 922 -140 281 -204 611 -193 997 " +
  "10 356 68 597 212 890 126 258 260 439 525 709 91 93 257 250 369 350 469 416 " +
  "525 465 527 463 1 -1 16 -74 33 -162z m863 -1734 c266 -69 495 -249 648 -511 " +
  "122 -209 182 -440 182 -700 -1 -345 -108 -627 -330 -862 -84 -88 -272 -231 " +
  "-287 -216 -5 5 -22 87 -159 758 -115 564 -314 1518 -322 1544 -6 18 -2 19 92 " +
  "13 55 -3 134 -15 176 -26z";

function renderTrebleClef(offsetY: number) {
  // The SVG source is 6400x12800 units (potrace at 0.1 scale), Y-flipped.
  // The clef's visual center (G-line curl) is roughly at y=7500 in source coords.
  // We need to scale and position so the curl sits on the G4 line.
  const staffHeight = 4 * STAFF_CONFIG.lineSpacing; // 40px
  const clefHeight = staffHeight * 3.2; // clef is ~3.2x staff height
  const sourceHeight = 12800;
  const scale = clefHeight / sourceHeight;

  // G4 line is 3rd from bottom = topLineY + 3*lineSpacing
  const gLineY = offsetY + STAFF_CONFIG.topLineY + 3 * STAFF_CONFIG.lineSpacing;
  // In source coords, the G-line curl is at roughly y=7400 from top (12800-5400)
  // After scaling and flipping, position so that maps to gLineY
  const gLineSourceY = 5400; // approximate Y in original (before flip) where G curl is
  const clefY = gLineY - (sourceHeight - gLineSourceY) * scale;
  const clefX = 4;

  return (
    <g
      key={`clef-${offsetY}`}
      transform={`translate(${clefX}, ${clefY}) scale(${scale})`}
    >
      <g transform={`translate(0, ${sourceHeight}) scale(1, -1)`}>
        <path d={TREBLE_CLEF_PATH} fill="#333" stroke="none" />
      </g>
    </g>
  );
}

function renderNote(
  note: Note,
  x: number,
  offsetY: number,
  color: string,
  isActive: boolean,
  key: string,
) {
  const rawY = getNoteY(note.name, note.octave);
  const y = offsetY + rawY;
  const { noteHeadRx, noteHeadRy, stemLength } = STAFF_CONFIG;
  const duration = note.duration;
  const isOpen = duration === "r" || duration === "b";
  const isWhole = duration === "r";
  const stemDir = getStemDirection(note.name, note.octave);
  const ledgerLines = getLedgerLines(note.name, note.octave);

  const elements = [];

  // Glow highlight for active note
  if (isActive) {
    elements.push(
      <ellipse
        key={`${key}-glow`}
        cx={x}
        cy={y}
        rx={noteHeadRx + 6}
        ry={noteHeadRy + 6}
        fill={color}
        opacity={0.3}
      />,
    );
  }

  // Ledger lines
  ledgerLines.forEach((ledgerY, i) => {
    elements.push(
      <line
        key={`${key}-ledger-${i}`}
        x1={x - noteHeadRx - 4}
        y1={offsetY + ledgerY}
        x2={x + noteHeadRx + 4}
        y2={offsetY + ledgerY}
        stroke="#333"
        strokeWidth={1.2}
      />,
    );
  });

  // Sharp symbol
  if (note.sharp) {
    elements.push(
      <text
        key={`${key}-sharp`}
        x={x - noteHeadRx - 10}
        y={y + 4}
        fontSize="14"
        fontWeight="bold"
        fill="#333"
        textAnchor="middle"
      >
        #
      </text>,
    );
  }

  // Note head
  elements.push(
    <ellipse
      key={`${key}-head`}
      cx={x}
      cy={y}
      rx={noteHeadRx}
      ry={noteHeadRy}
      fill={isOpen ? "white" : color}
      stroke={color}
      strokeWidth={isOpen ? 1.8 : 0}
      transform={`rotate(-15, ${x}, ${y})`}
    />,
  );

  // Note name label above/below the note
  const labelY = stemDir === "up" ? y + noteHeadRy + 12 : y - noteHeadRy - 5;
  elements.push(
    <text
      key={`${key}-label`}
      x={x}
      y={labelY}
      textAnchor="middle"
      fontSize="8"
      fill={color}
      fontWeight="bold"
    >
      {note.name}
      {note.sharp ? "#" : ""}
    </text>,
  );

  // Stem (not for whole notes)
  if (!isWhole) {
    const stemX = stemDir === "up" ? x + noteHeadRx - 1 : x - noteHeadRx + 1;
    const stemY1 = y;
    const stemY2 = stemDir === "up" ? y - stemLength : y + stemLength;

    elements.push(
      <line
        key={`${key}-stem`}
        x1={stemX}
        y1={stemY1}
        x2={stemX}
        y2={stemY2}
        stroke={color}
        strokeWidth={1.5}
      />,
    );

    // Flag for eighth notes (corchea)
    if (duration === "c") {
      if (stemDir === "up") {
        elements.push(
          <path
            key={`${key}-flag`}
            d={`M ${stemX} ${stemY2} C ${stemX + 14} ${stemY2 + 8}, ${stemX + 16} ${stemY2 + 20}, ${stemX + 4} ${stemY2 + 30}`}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
          />,
        );
      } else {
        elements.push(
          <path
            key={`${key}-flag`}
            d={`M ${stemX} ${stemY2} C ${stemX + 14} ${stemY2 - 8}, ${stemX + 16} ${stemY2 - 20}, ${stemX + 4} ${stemY2 - 30}`}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
          />,
        );
      }
    }
  }

  return elements;
}

export const StaffRenderer = forwardRef<SVGSVGElement, StaffRendererProps>(
  function StaffRenderer(
    { elements, colors, width = 800, activeNoteIndex },
    ref,
  ) {
    const layout = layoutNotes(elements, width);

    const staffLineCount =
      layout.length > 0 ? layout[layout.length - 1].staffLine + 1 : 1;

    const singleStaffHeight =
      STAFF_CONFIG.topLineY * 2 + 4 * STAFF_CONFIG.lineSpacing;
    const staffSystemHeight = singleStaffHeight + STAFF_CONFIG.staffLineGap;
    const totalHeight = getTotalStaffHeight(staffLineCount);

    const svgElements: React.ReactNode[] = [];

    // Render staff lines and treble clefs for each system
    for (let s = 0; s < staffLineCount; s++) {
      const offsetY = s * staffSystemHeight;
      svgElements.push(...renderStaffLines(offsetY, width));
      svgElements.push(renderTrebleClef(offsetY));
    }

    // Render music elements
    layout.forEach(({ elementIndex, x, staffLine }) => {
      const el = elements[elementIndex];
      const offsetY = staffLine * staffSystemHeight;
      const key = `el-${elementIndex}`;

      if (el.type === "barline") {
        const topY = offsetY + STAFF_CONFIG.topLineY;
        const bottomY = topY + 4 * STAFF_CONFIG.lineSpacing;
        svgElements.push(
          <line
            key={`${key}-barline`}
            x1={x}
            y1={topY}
            x2={x}
            y2={bottomY}
            stroke="#333"
            strokeWidth={1.5}
          />,
        );
      } else if (el.type === "rest") {
        const restY =
          offsetY + STAFF_CONFIG.topLineY + 2 * STAFF_CONFIG.lineSpacing;
        svgElements.push(
          <text
            key={`${key}-rest`}
            x={x}
            y={restY}
            textAnchor="middle"
            fontSize={20}
            fontFamily="serif"
            fill="#555"
          >
            {REST_SYMBOLS[el.duration] ?? "𝄽"}
          </text>,
        );
      } else if (el.type === "note") {
        const color = colors[el.name];
        const isActive = activeNoteIndex === elementIndex;
        const noteElements = renderNote(el, x, offsetY, color, isActive, key);
        svgElements.push(...noteElements);
      }
    });

    return (
      <svg
        ref={ref}
        width={width}
        height={totalHeight}
        viewBox={`0 0 ${width} ${totalHeight}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        {svgElements}
      </svg>
    );
  },
);
