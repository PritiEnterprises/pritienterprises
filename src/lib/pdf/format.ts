/** PDF-safe formatting (Helvetica / WinAnsi — no Devanagari or special symbols) */

export function formatCurrencyPdf(amount: number): string {
  const n = Math.round(amount);
  const formatted = n.toLocaleString("en-IN");
  return `Rs. ${formatted}`;
}

export function formatDatePdf(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/** Strip or replace characters that break default PDF fonts */
export function pdfText(value: string): string {
  if (!value) return "";
  const ascii = value.replace(/[^\x20-\x7E]/g, "").trim();
  return ascii || value.replace(/[^\x20-\x7E]/g, "?");
}

export function pdfEmployeeName(name: string, code: string): string {
  const safe = pdfText(name);
  if (safe.length >= 2) return safe;
  return code;
}
