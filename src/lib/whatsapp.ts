import { formatCurrency, formatDate } from "@/lib/utils";

export interface SalaryLineForMessage {
  employee: { name: string; employeeCode: string; phone: string | null };
  fullDays: number;
  halfDays: number;
  overtimeHours: number;
  grossEarnings: number;
  advancesDeducted: number;
  netPay: number;
}

export interface PeriodForMessage {
  label: string;
  startDate: Date | string;
  endDate: Date | string;
}

export function formatEmployeeSalaryMessage(
  period: PeriodForMessage,
  line: SalaryLineForMessage,
  locale: "en" | "hi" = "hi"
): string {
  const hi = locale === "hi";
  const lines = [
    hi ? `*प्रीति एंटरप्राइजेस*` : `*Priti Enterprises*`,
    hi ? `वेतन पर्ची — ${period.label}` : `Salary Slip — ${period.label}`,
    `${formatDate(period.startDate)} - ${formatDate(period.endDate)}`,
    ``,
    hi ? `नाम: ${line.employee.name}` : `Name: ${line.employee.name}`,
    hi ? `कोड: ${line.employee.employeeCode}` : `Code: ${line.employee.employeeCode}`,
    ``,
    hi ? `पूरे दिन: ${line.fullDays}` : `Full days: ${line.fullDays}`,
    hi ? `आधे दिन: ${line.halfDays}` : `Half days: ${line.halfDays}`,
    hi ? `OT घंटे: ${line.overtimeHours}` : `OT hours: ${line.overtimeHours}`,
    hi ? `सकल: ${formatCurrency(line.grossEarnings)}` : `Gross: ${formatCurrency(line.grossEarnings)}`,
    hi
      ? `एडवांस कटौती: ${formatCurrency(line.advancesDeducted)}`
      : `Advance deducted: ${formatCurrency(line.advancesDeducted)}`,
    hi ? `*शुद्ध वेतन: ${formatCurrency(line.netPay)}*` : `*Net pay: ${formatCurrency(line.netPay)}*`,
    ``,
    hi ? `धन्यवाद।` : `Thank you.`,
  ];
  return lines.join("\n");
}

export function formatPayrollSummaryMessage(
  period: PeriodForMessage,
  lines: SalaryLineForMessage[],
  totals: { gross: number; advances: number; net: number },
  locale: "en" | "hi" = "hi"
): string {
  const hi = locale === "hi";
  const header = [
    hi ? `*प्रीति एंटरप्राइजेस — पेरोल सारांश*` : `*Priti Enterprises — Payroll Summary*`,
    `${period.label}`,
    `${formatDate(period.startDate)} - ${formatDate(period.endDate)}`,
    ``,
  ];

  const body = lines.map((l) => {
    const name = l.employee.name;
    return `${name}: ${formatCurrency(l.netPay)} (${hi ? "सकल" : "gross"} ${formatCurrency(l.grossEarnings)}, ${hi ? "एडवांस" : "adv"} -${formatCurrency(l.advancesDeducted)})`;
  });

  const footer = [
    ``,
    hi ? `कुल सकल: ${formatCurrency(totals.gross)}` : `Total gross: ${formatCurrency(totals.gross)}`,
    hi ? `कुल एडवांस: ${formatCurrency(totals.advances)}` : `Total advances: ${formatCurrency(totals.advances)}`,
    hi ? `*कुल शुद्ध: ${formatCurrency(totals.net)}*` : `*Total net: ${formatCurrency(totals.net)}*`,
  ];

  return [...header, ...body, ...footer].join("\n");
}

export function whatsappUrl(phone: string | null | undefined, message: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  if (normalized.length < 10) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
