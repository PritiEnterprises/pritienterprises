"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, EmptyRow } from "@/components/layout/DataTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate, toDateInputValue } from "@/lib/utils";
import { Calculator } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface SalaryPeriod {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  status: string;
  totals: { gross: number; advances: number; net: number };
  _count: { payrollLines: number };
}

export default function PayrollPage() {
  const { t } = useTranslation();
  const [periods, setPeriods] = useState<SalaryPeriod[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    label: format(new Date(), "MMMM yyyy") + " Salary",
    startDate: toDateInputValue(startOfMonth(new Date())),
    endDate: toDateInputValue(endOfMonth(new Date())),
    notes: "",
  });

  const load = () => apiFetch<SalaryPeriod[]>("/api/payroll").then(setPeriods);

  useEffect(() => {
    load();
  }, []);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(t("confirmGeneratePayroll"))) return;
    setGenerating(true);
    try {
      const period = await apiFetch<{ id: string }>("/api/payroll", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setShowForm(false);
      load();
      window.location.href = `/payroll/${period.id}`;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t("payroll")}
        description={t("payrollDesc")}
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            <Calculator className="h-4 w-4" />
            {t("generateSalary")}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6" title="New Salary Period">
          <form onSubmit={generate} className="grid gap-4 sm:grid-cols-2">
            <Input label="Period Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
            <div />
            <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            <Input label="Notes" className="sm:col-span-2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <Button type="submit" disabled={generating}>
              {generating ? "Calculating..." : "Generate Payroll"}
            </Button>
          </form>
          <p className="mt-3 text-xs text-slate-500">
            Calculates: (full days × daily wage) + (half days × 50%) + (OT hours × OT rate) − pending advances
          </p>
        </Card>
      )}

      <DataTable headers={["Period", "Dates", "Employees", "Gross", "Advances", "Net Pay", "Status", ""]}>
        {periods.length === 0 ? (
          <EmptyRow colSpan={8} message="No salary periods yet. Generate your first payroll." />
        ) : (
          periods.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3 font-medium">{p.label}</td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {formatDate(p.startDate)} – {formatDate(p.endDate)}
              </td>
              <td className="px-4 py-3">{p._count.payrollLines}</td>
              <td className="px-4 py-3">{formatCurrency(p.totals.gross)}</td>
              <td className="px-4 py-3 text-amber-700">{formatCurrency(p.totals.advances)}</td>
              <td className="px-4 py-3 font-semibold text-emerald-700">{formatCurrency(p.totals.net)}</td>
              <td className="px-4 py-3">
                <Badge variant={p.status === "FINALIZED" ? "success" : "warning"}>{p.status}</Badge>
              </td>
              <td className="px-4 py-3">
                <Link href={`/payroll/${p.id}`} className="text-sm text-brand-600 hover:underline">
                  View →
                </Link>
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </div>
  );
}
