import { useState } from "react";
import { jsPDF } from "jspdf";
import "svg2pdf.js";
import type { MusicElement, ColorMap } from "../../types/music";
import { PRINT_COLORS } from "../../constants/colors";

interface PdfExporterProps {
  title: string;
  elements: MusicElement[];
  colors: ColorMap;
  staffSvgRef: React.RefObject<SVGSVGElement | null>;
}

export function PdfExporter({
  title,
  elements,
  staffSvgRef,
}: PdfExporterProps) {
  const [pdfTitle, setPdfTitle] = useState(title);
  const [pdfAuthor, setPdfAuthor] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!staffSvgRef.current || elements.length === 0) return;
    setIsExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Title
      pdf.setFontSize(24);
      pdf.text(pdfTitle || "Untitled", pageWidth / 2, 25, { align: "center" });

      // Author
      if (pdfAuthor) {
        pdf.setFontSize(14);
        pdf.setTextColor(100);
        pdf.text(pdfAuthor, pageWidth / 2, 33, { align: "center" });
        pdf.setTextColor(0);
      }

      // Staff SVG
      const svgEl = staffSvgRef.current;
      const svgWidth = svgEl.getBoundingClientRect().width;
      const svgHeight = svgEl.getBoundingClientRect().height;
      const pdfStaffWidth = pageWidth - 20;
      const scale = pdfStaffWidth / svgWidth;
      const pdfStaffHeight = svgHeight * scale;

      await pdf.svg(svgEl, {
        x: 10,
        y: 40,
        width: pdfStaffWidth,
        height: pdfStaffHeight,
      });

      // Color legend
      const legendY = 40 + pdfStaffHeight + 15;
      const printColors = PRINT_COLORS;
      const names = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"] as const;
      const legendItemWidth = pdfStaffWidth / 7;
      pdf.setFontSize(10);
      names.forEach((name, i) => {
        const cx = 10 + i * legendItemWidth + legendItemWidth / 2;
        pdf.setFillColor(printColors[name]);
        pdf.circle(cx, legendY, 3, "F");
        pdf.setTextColor(50);
        pdf.text(name, cx, legendY + 7, { align: "center" });
      });
      pdf.setTextColor(0);

      // Piano keyboard diagram
      const kbY = legendY + 15;
      const kbWidth = pdfStaffWidth;
      const whiteKeyW = kbWidth / 14;
      const whiteKeyH = 18;
      const blackKeyW = whiteKeyW * 0.6;
      const blackKeyH = 11;
      const noteNames = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"] as const;
      const hasSharp = new Set(["Do", "Re", "Fa", "Sol", "La"]);

      let kx = 10;
      const keyPositions: Array<{
        x: number;
        name: (typeof noteNames)[number];
      }> = [];
      for (let oct = 0; oct < 2; oct++) {
        for (const n of noteNames) {
          keyPositions.push({ x: kx, name: n });
          pdf.setDrawColor(50);
          pdf.setFillColor(255, 255, 255);
          pdf.rect(kx, kbY, whiteKeyW - 0.5, whiteKeyH, "FD");
          pdf.setFillColor(printColors[n]);
          pdf.circle(kx + whiteKeyW / 2, kbY + whiteKeyH - 4, 1.5, "F");
          kx += whiteKeyW;
        }
      }
      for (const kp of keyPositions) {
        if (hasSharp.has(kp.name)) {
          pdf.setFillColor(40, 40, 40);
          pdf.rect(
            kp.x + whiteKeyW - blackKeyW / 2,
            kbY,
            blackKeyW,
            blackKeyH,
            "F",
          );
        }
      }

      pdf.save(`${pdfTitle || "partitura"}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        type="text"
        value={pdfTitle}
        onChange={(e) => setPdfTitle(e.target.value)}
        placeholder="PDF title..."
        style={{
          padding: "4px 8px",
          fontSize: 13,
          borderRadius: 4,
          border: "1px solid #ddd",
          width: 150,
        }}
      />
      <input
        type="text"
        value={pdfAuthor}
        onChange={(e) => setPdfAuthor(e.target.value)}
        placeholder="Author..."
        style={{
          padding: "4px 8px",
          fontSize: 13,
          borderRadius: 4,
          border: "1px solid #ddd",
          width: 120,
        }}
      />
      <button
        onClick={handleExport}
        disabled={isExporting || elements.length === 0}
        style={{
          padding: "6px 14px",
          fontSize: 13,
          border: "1px solid #8e44ad",
          borderRadius: 6,
          background: isExporting ? "#ccc" : "#8e44ad",
          color: "white",
          cursor: isExporting ? "not-allowed" : "pointer",
        }}
      >
        {isExporting ? "Exporting..." : "PDF"}
      </button>
    </div>
  );
}
