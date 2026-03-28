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
  const clefY =
    offsetY + STAFF_CONFIG.topLineY + 4 * STAFF_CONFIG.lineSpacing + 8;
  return (
    <text
      key={`clef-${offsetY}`}
      x={8}
      y={clefY}
      fontSize={52}
      fontFamily="serif"
      fill="#333"
    >
      𝄞
    </text>
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
