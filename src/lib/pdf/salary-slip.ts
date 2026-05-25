import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  formatCurrencyPdf,
  formatDatePdf,
  pdfEmployeeName,
  pdfText,
} from "@/lib/pdf/format";

export interface PdfPayrollData {
  companyName: string;
  period: {
    label: string;
    startDate: Date | string;
    endDate: Date | string;
    status: string;
  };
  lines: Array<{
    employee: { name: string; employeeCode: string };
    fullDays: number;
    halfDays: number;
    overtimeHours: number;
    dailyWageSnapshot: number;
    grossEarnings: number;
    advancesDeducted: number;
    netPay: number;
  }>;
  locale?: "en" | "hi";
}

const BRAND = { r: 15, g: 23, b: 42 } as const;
const ACCENT = { r: 217, g: 119, b: 6 } as const;

export function generatePayrollPdf(
  data: PdfPayrollData,
  singleEmployeeCode?: string
): Buffer {
  const filtered = singleEmployeeCode
    ? data.lines.filter((l) => l.employee.employeeCode === singleEmployeeCode)
    : data.lines;

  if (singleEmployeeCode && filtered.length === 0) {
    throw new Error("Employee not found in payroll");
  }

  const doc = singleEmployeeCode && filtered.length === 1
    ? buildSingleSlip(data, filtered[0])
    : buildSummarySheet(data, filtered);

  return Buffer.from(doc.output("arraybuffer"));
}

function drawHeader(
  doc: jsPDF,
  companyName: string,
  subtitle: string,
  periodLabel: string,
  dateRange: string
) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 0, w, 32, "F");
  doc.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.rect(0, 32, w, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(pdfText(companyName), w / 2, 12, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(pdfText(subtitle), w / 2, 20, { align: "center" });

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(pdfText(periodLabel), 14, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(pdfText(dateRange), 14, 48);
}

function buildSingleSlip(
  data: PdfPayrollData,
  line: PdfPayrollData["lines"][0]
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const periodLabel = pdfText(data.period.label);
  const dateRange = `${formatDatePdf(data.period.startDate)} - ${formatDatePdf(data.period.endDate)}`;

  drawHeader(doc, data.companyName, "Salary Slip / Vetan Parchi", periodLabel, dateRange);

  const name = pdfEmployeeName(line.employee.name, line.employee.employeeCode);
  const rows = [
    ["Employee Code", pdfText(line.employee.employeeCode)],
    ["Employee Name", name],
    ["Full Days", String(line.fullDays)],
    ["Half Days", String(line.halfDays)],
    ["OT Hours", String(line.overtimeHours)],
    ["Daily Wage", formatCurrencyPdf(line.dailyWageSnapshot)],
    ["Gross Earnings", formatCurrencyPdf(line.grossEarnings)],
    ["Advance Deducted", formatCurrencyPdf(line.advancesDeducted)],
    ["Net Payable", formatCurrencyPdf(line.netPay)],
  ];

  autoTable(doc, {
    startY: 54,
    body: rows,
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 3,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55, fillColor: [248, 250, 252] },
      1: { cellWidth: "auto", halign: "right" },
    },
    didParseCell: (hook: { row: { index: number }; column: { index: number }; cell: { styles: Record<string, unknown> } }) => {
      if (hook.row.index === rows.length - 1 && hook.column.index === 1) {
        hook.cell.styles.fontStyle = "bold";
        hook.cell.styles.textColor = [5, 150, 105];
        hook.cell.styles.fontSize = 12;
      }
    },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
    ?.finalY ?? 120;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Employee Signature: _________________________", 14, finalY + 12);
  doc.text("Authorized Signatory: _______________________", 14, finalY + 20);
  doc.text(
    `Generated on ${formatDatePdf(new Date())} | Priti Enterprises`,
    14,
    doc.internal.pageSize.getHeight() - 8
  );

  return doc;
}

function buildSummarySheet(
  data: PdfPayrollData,
  lines: PdfPayrollData["lines"]
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const periodLabel = pdfText(data.period.label);
  const dateRange = `${formatDatePdf(data.period.startDate)} - ${formatDatePdf(data.period.endDate)}`;
  const status = pdfText(data.period.status);

  drawHeader(
    doc,
    data.companyName,
    "Payroll Summary Sheet",
    periodLabel,
    `${dateRange}  |  Status: ${status}`
  );

  const totals = lines.reduce(
    (a, l) => ({
      gross: a.gross + l.grossEarnings,
      advances: a.advances + l.advancesDeducted,
      net: a.net + l.netPay,
    }),
    { gross: 0, advances: 0, net: 0 }
  );

  autoTable(doc, {
    startY: 54,
    head: [
      [
        "Code",
        "Employee Name",
        "Full",
        "Half",
        "OT",
        "Daily Wage",
        "Gross",
        "Advance",
        "Net Pay",
      ],
    ],
    body: lines.map((l) => [
      pdfText(l.employee.employeeCode),
      pdfEmployeeName(l.employee.name, l.employee.employeeCode),
      String(l.fullDays),
      String(l.halfDays),
      String(l.overtimeHours),
      formatCurrencyPdf(l.dailyWageSnapshot),
      formatCurrencyPdf(l.grossEarnings),
      formatCurrencyPdf(l.advancesDeducted),
      formatCurrencyPdf(l.netPay),
    ]),
    foot: [
      [
        { content: "TOTAL", colSpan: 6, styles: { halign: "right" } },
        formatCurrencyPdf(totals.gross),
        formatCurrencyPdf(totals.advances),
        formatCurrencyPdf(totals.net),
      ],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [BRAND.r, BRAND.g, BRAND.b],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    footStyles: {
      fillColor: [255, 247, 237],
      textColor: [BRAND.r, BRAND.g, BRAND.b],
      fontStyle: "bold",
      fontSize: 9,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      overflow: "linebreak",
      lineColor: [226, 232, 240],
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 42 },
      2: { cellWidth: 12, halign: "center" },
      3: { cellWidth: 12, halign: "center" },
      4: { cellWidth: 12, halign: "center" },
      5: { cellWidth: 26, halign: "right" },
      6: { cellWidth: 26, halign: "right" },
      7: { cellWidth: 26, halign: "right" },
      8: { cellWidth: 28, halign: "right", fontStyle: "bold" },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (hook: { pageNumber: number }) => {
      const pageCount = doc.getNumberOfPages();
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${hook.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.getWidth() - 14,
        pageH - 6,
        { align: "right" }
      );
    },
  });

  return doc;
}
