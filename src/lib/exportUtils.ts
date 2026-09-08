import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
  AlignmentType,
} from "docx";
import { formatDisplayDateTime } from "@/lib/dateUtils";

export interface ExportTableOptions {
  filename: string;
  title: string;
  subtitle?: string;
  sheetName?: string;
  headers: string[];
  data: (string | number)[][];
  orientation?: "portrait" | "landscape";
  companyName?: string;
}

export const exportToExcel = ({
  filename,
  sheetName = "Sheet1",
  title,
  headers,
  data,
  companyName,
}: ExportTableOptions) => {
  const wb = XLSX.utils.book_new();

  const titleRows: (string | number)[][] = [];
  if (companyName) {
    titleRows.push([companyName]);
  }
  if (title) {
    titleRows.push([title]);
  }
  titleRows.push([`Generated on: ${formatDisplayDateTime(new Date())}`]);
  titleRows.push([]); // blank row

  const allRows = [...titleRows, headers, ...data];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Auto-calculate column widths
  const colWidths = headers.map((header, colIdx) => {
    let maxLen = String(header).length;
    for (const row of data) {
      const cellVal = row[colIdx] !== undefined && row[colIdx] !== null ? String(row[colIdx]) : "";
      if (cellVal.length > maxLen) maxLen = cellVal.length;
    }
    return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
  });
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  const safeFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
};

export const exportToPdf = ({
  filename,
  title,
  subtitle,
  headers,
  data,
  orientation = "landscape",
  companyName,
}: ExportTableOptions) => {
  const doc = new jsPDF({
    orientation,
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Company Name Header
  if (companyName) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 30, 45);
    doc.text(companyName, 40, 40);
  }

  // Report Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129); // Emerald primary
  doc.text(title, 40, companyName ? 60 : 45);

  // Subtitle / Date
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  const subText = subtitle ? `${subtitle} | Generated on ${formatDisplayDateTime(new Date())}` : `Generated on ${formatDisplayDateTime(new Date())}`;
  doc.text(subText, 40, companyName ? 76 : 60);

  // Table rendering via autoTable
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: companyName ? 90 : 75,
    margin: { left: 40, right: 40 },
    theme: "striped",
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (hookData) => {
      // Footer page numbering
      const str = `Page ${hookData.pageNumber}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, pageWidth - 80, doc.internal.pageSize.getHeight() - 20);
    },
  });

  const safeFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  doc.save(safeFilename);
};

export const exportToWord = async ({
  filename,
  title,
  subtitle,
  headers,
  data,
  companyName,
}: ExportTableOptions) => {
  const tableRows: TableRow[] = [];

  // Header Row
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: headers.map(
        (h) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: String(h), bold: true, color: "FFFFFF" })],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: { fill: "10B981" }, // Emerald
          })
      ),
    })
  );

  // Data Rows
  data.forEach((row, rowIdx) => {
    tableRows.push(
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: cell !== undefined && cell !== null ? String(cell) : "" })],
                }),
              ],
              shading: rowIdx % 2 === 1 ? { fill: "F8FAFC" } : undefined,
            })
        ),
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...(companyName
            ? [
                new Paragraph({
                  children: [new TextRun({ text: companyName, bold: true, size: 28, color: "0F172A" })],
                }),
              ]
            : []),
          new Paragraph({
            children: [new TextRun({ text: title, bold: true, size: 32, color: "10B981" })],
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: subtitle ? `${subtitle} | Generated on ${formatDisplayDateTime(new Date())}` : `Generated on ${formatDisplayDateTime(new Date())}`,
                size: 18,
                color: "64748B",
              }),
            ],
          }),
          new Paragraph({ text: "" }), // space
          new Table({
            rows: tableRows,
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".docx") ? filename : `${filename}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToCsv = ({
  filename,
  headers,
  data,
}: {
  filename: string;
  headers: string[];
  data: (string | number)[][];
}) => {
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      row
        .map((cell) => {
          const str = cell !== undefined && cell !== null ? String(cell) : "";
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];

  const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
