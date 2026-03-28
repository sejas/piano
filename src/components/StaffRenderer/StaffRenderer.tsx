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

function renderTrebleClef(offsetY: number) {
  // Position: the curl of the clef wraps around the G line (second line from bottom)
  // G4 line is at topLineY + 3 * lineSpacing
  const gLineY = STAFF_CONFIG.topLineY + 3 * STAFF_CONFIG.lineSpacing;
  const clefX = 6;
  const scale = STAFF_CONFIG.lineSpacing / 10; // scale relative to 10px spacing

  return (
    <g
      key={`clef-${offsetY}`}
      transform={`translate(${clefX}, ${offsetY + gLineY}) scale(${scale})`}
    >
      <path
        d={
          // Treble clef SVG path centered on G line (y=0)
          "M 10 32 " +
          "C 10 28, 14 20, 18 14 " + // lower curve up
          "C 22 8, 24 2, 22 -6 " + // rising to top
          "C 20 -14, 16 -20, 12 -26 " + // top curve
          "C 8 -32, 6 -38, 8 -44 " + // upper extension
          "C 10 -50, 14 -52, 18 -48 " + // top curl
          "C 22 -44, 20 -38, 16 -32 " + // descend from top
          "C 12 -26, 10 -20, 10 -12 " + // through middle
          "C 10 -4, 14 4, 20 8 " + // S curve down
          "C 26 12, 30 16, 30 22 " + // lower belly
          "C 30 28, 26 34, 20 36 " + // bottom curve
          "C 14 38, 8 36, 6 32 " + // close bottom
          "C 4 28, 6 24, 10 24 " + // inner curl
          "C 14 24, 16 28, 14 30 " + // small circle
          "C 12 32, 10 32, 10 32 Z" // close
        }
        fill="#333"
      />
      {/* Vertical stem line */}
      <line x1={16} y1={-52} x2={16} y2={36} stroke="#333" strokeWidth={1.8} />
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
