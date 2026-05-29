"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, EmptyRow } from "@/components/layout/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import {
  CheckCircle,
  ArrowLeft,
  Trash2,
  FileDown,
  MessageCircle,
  Copy,
  FileSpreadsheet,
} from "lucide-react";

interface PayrollLine {
  id: string;
  fullDays: number;
  halfDays: number;
  overtimeHours: number;
  grossEarnings: number;
  advancesDeducted: number;
  netPay: number;
  paymentStatus: string;
  paidAt?: string | null;
  paymentMethod?: string | null;
  paymentNotes?: string | null;
  dailyWageSnapshot: number;
  employee: { id: string; name: string; employeeCode: string; phone?: string | null };
}

interface SalaryPeriod {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  status: string;
  payrollLines: PayrollLine[];
}

interface WhatsAppData {
  summary: { message: string; waLink: string | null };
  employees: Array<{
    employeeId: string;
    name: string;
    waLink: string | null;
    message: string;
  }>;
}

export default function PayrollDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useTranslation();
  const [period, setPeriod] = useState<SalaryPeriod | null>(null);
  const [copied, setCopied] = useState(false);

  const load = () => apiFetch<SalaryPeriod>(`/api/payroll/${id}`).then(setPeriod);

  useEffect(() => {
    if (id) load();
  }, [id]);

  const finalize = async () => {
    if (!confirm(t("confirmFinalize"))) return;
    await apiFetch(`/api/payroll/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "finalize" }),
    });
    load();
  };

  const remove = async () => {
    if (!confirm(t("confirmDeletePayroll"))) return;
    await apiFetch(`/api/payroll/${id}`, { method: "DELETE" });
    window.location.href = "/payroll";
  };

  const downloadPdf = (employeeCode?: string) => {
    const q = employeeCode ? `?employee=${employeeCode}&locale=${locale}` : `?locale=${locale}`;
    window.open(`/api/payroll/${id}/pdf${q}`, "_blank");
  };

  const downloadCsv = () => {
    window.open(`/api/payroll/${id}/export/csv`, "_blank");
  };

  const whatsappSummary = async () => {
    const data = await apiFetch<WhatsAppData>(`/api/payroll/${id}/whatsapp?locale=${locale}`);
    if (data.summary.waLink) {
      window.open(data.summary.waLink, "_blank");
    } else {
      await navigator.clipboard.writeText(data.summary.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copySummary = async () => {
    const data = await apiFetch<WhatsAppData>(`/api/payroll/${id}/whatsapp?locale=${locale}`);
    await navigator.clipboard.writeText(data.summary.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappEmployee = async (employeeId: string) => {
    const data = await apiFetch<WhatsAppData>(
      `/api/payroll/${id}/whatsapp?locale=${locale}&employeeId=${employeeId}`
    );
    const emp = data.employees[0];
    if (emp?.waLink) window.open(emp.waLink, "_blank");
    else if (emp?.message) {
      await navigator.clipboard.writeText(emp.message);
      alert(t("copyMessage"));
    }
  };

  const markPaid = async (lineId: string) => {
    const paymentMethod = prompt(
      "Payment Method (CASH / UPI / BANK)",
      "CASH"
    );

    if (!paymentMethod) return;

    try {
      await apiFetch(`/api/payroll-line/${lineId}`, {
        method: "PATCH",
        body: JSON.stringify({
          paymentMethod,
        }),
      });

      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  };

  if (!period) return <p className="text-slate-500">{t("loading")}</p>;

  const totals = period.payrollLines.reduce(
    (a, l) => ({
      gross: a.gross + l.grossEarnings,
      advances: a.advances + l.advancesDeducted,
      net: a.net + l.netPay,
    }),
    { gross: 0, advances: 0, net: 0 }
  );

  const paidEmployees = period.payrollLines.filter(
    (l) => l.paymentStatus === "PAID"
  ).length;

  const unpaidEmployees = period.payrollLines.filter(
    (l) => l.paymentStatus !== "PAID"
  ).length;

  const paidAmount = period.payrollLines
    .filter((l) => l.paymentStatus === "PAID")
    .reduce((sum, l) => sum + l.netPay, 0);

  const pendingAmount = period.payrollLines
    .filter((l) => l.paymentStatus !== "PAID")
    .reduce((sum, l) => sum + l.netPay, 0);

  return (
    <div>
      <Link
        href="/payroll"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> {t("backToPayroll")}
      </Link>

      <PageHeader
        title={period.label}
        description={`${formatDate(period.startDate)} – ${formatDate(period.endDate)}`}
        action={
          <div className="flex flex-wrap gap-2">
            {period.status === "DRAFT" && (
              <>
                <Button onClick={finalize}>
                  <CheckCircle className="h-4 w-4" /> {t("finalize")}
                </Button>
                <Button variant="danger" onClick={remove}>
                  <Trash2 className="h-4 w-4" /> {t("deleteDraft")}
                </Button>
              </>
            )}
            <Badge variant={period.status === "FINALIZED" ? "success" : "warning"}>
              {period.status === "FINALIZED" ? t("finalized") : t("draft")}
            </Badge>
          </div>
        }
      />

      <Card className="no-print mb-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Export & Share
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => downloadPdf()}>
            <FileDown className="h-4 w-4" /> {t("downloadAllPdf")}
          </Button>
          <Button variant="secondary" onClick={downloadCsv}>
            <FileSpreadsheet className="h-4 w-4" /> {t("exportCsv")}
          </Button>
          <Button variant="secondary" onClick={whatsappSummary}>
            <MessageCircle className="h-4 w-4" /> {t("whatsappAll")}
          </Button>
          <Button variant="ghost" onClick={copySummary}>
            <Copy className="h-4 w-4" /> {copied ? t("copied") : t("copyMessage")}
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            {t("printSheet")}
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          PDF uses Rs. amounts and fits all columns (landscape). Hindi names show as employee code if needed.
        </p>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-5">
        <Card>
          <p className="text-sm text-slate-500">{t("totalGross")}</p>
          <p className="text-xl font-bold">{formatCurrency(totals.gross)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">{t("advancesDeducted")}</p>
          <p className="text-xl font-bold text-amber-700">{formatCurrency(totals.advances)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">{t("netPayable")}</p>
          <p className="text-xl font-bold text-emerald-700">{formatCurrency(totals.net)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">
            Paid Employees
          </p>

          <p className="text-xl font-bold text-emerald-700">
            {paidEmployees}
          </p>

          <p className="text-xs text-slate-500">
            {formatCurrency(paidAmount)}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-slate-500">
            Pending Employees
          </p>

          <p className="text-xl font-bold text-amber-700">
            {unpaidEmployees}
          </p>

          <p className="text-xs text-slate-500">
            {formatCurrency(pendingAmount)}
          </p>
        </Card>
      </div>

      <DataTable
        headers={[
          t("employees"),
          t("fullDays"),
          t("halfDays"),
          t("otHrs"),
          t("dailyWage"),
          t("gross"),
          t("advances"),
          t("netPay"),
          "Payment",
          t("actions"),
        ]}
      >
        {period.payrollLines.length === 0 ? (
          <EmptyRow colSpan={10} message={t("noRecords")} />
        ) : (
          period.payrollLines.map((l) => (
            <tr key={l.id}>
              <td className="px-4 py-3">
                <p className="font-medium">{l.employee.name}</p>
                <p className="text-xs text-slate-500">{l.employee.employeeCode}</p>
              </td>
              <td className="px-4 py-3">{l.fullDays}</td>
              <td className="px-4 py-3">{l.halfDays}</td>
              <td className="px-4 py-3">{l.overtimeHours}</td>
              <td className="px-4 py-3">{formatCurrency(l.dailyWageSnapshot)}</td>
              <td className="px-4 py-3">{formatCurrency(l.grossEarnings)}</td>
              <td className="px-4 py-3 text-amber-700">{formatCurrency(l.advancesDeducted)}</td>
              <td className="px-4 py-3 font-semibold">{formatCurrency(l.netPay)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <Badge
                    variant={
                      l.paymentStatus === "PAID"
                        ? "success"
                        : "warning"
                    }
                  >
                    {l.paymentStatus}
                  </Badge>

                  {l.paymentStatus === "PAID" && (
                    <>
                      <span className="text-xs text-slate-500">
                        {l.paymentMethod}
                      </span>

                      <span className="text-xs text-slate-500">
                        {l.paidAt
                          ? formatDate(l.paidAt)
                          : ""}
                      </span>
                    </>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  {l.paymentStatus !== "PAID" && (
                    <button
                      type="button"
                      onClick={() => markPaid(l.id)}
                      className="text-left text-xs text-emerald-700 hover:underline"
                    >
                      Mark Paid
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => downloadPdf(l.employee.employeeCode)}
                    className="text-left text-xs text-brand-600 hover:underline"
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => whatsappEmployee(l.employee.id)}
                    className="text-left text-xs text-emerald-600 hover:underline"
                  >
                    {t("whatsappEmployee")}
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </div>
  );
}
