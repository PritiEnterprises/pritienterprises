"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable, EmptyRow } from "@/components/layout/DataTable";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";
import { formatCurrency, toDateInputValue } from "@/lib/utils";
import { startOfMonth, endOfMonth } from "date-fns";
import { useTranslation } from "@/lib/i18n/context";

interface LedgerRow {
  id: string;
  name: string;
  employeeCode: string;
  dailyWage: number;
  fullDays: number;
  halfDays: number;
  overtimeHours: number;
  totalAdvances: number;
}

interface SettlementRow {
  id: string;
  projectCode: string;
  name: string;
  builderName: string;
  status: string;
  contractAmount: number;
  totalReceived: number;
  balanceDue: number;
  advanceTotal: number;
  interimTotal: number;
  finalTotal: number;
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const [from, setFrom] = useState(toDateInputValue(startOfMonth(new Date())));
  const [to, setTo] = useState(toDateInputValue(endOfMonth(new Date())));
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);

  const loadLedger = () => {
    apiFetch<{ ledger: LedgerRow[] }>(
      `/api/reports?type=employee-ledger&from=${from}&to=${to}`
    ).then((d) => setLedger(d.ledger));
  };

  const loadSettlements = () => {
    apiFetch<{ settlements: SettlementRow[] }>(
      "/api/reports?type=builder-settlement"
    ).then((d) => setSettlements(d.settlements));
  };

  useEffect(() => {
    loadSettlements();
  }, []);

  useEffect(() => {
    loadLedger();
  }, []);

  return (
    <div>
      <PageHeader title={t("reportsTitle")} description={t("reportsDesc")} />

      <Card className="mb-8" title={t("employeeSummary")}>
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <Input label={t("startDate")} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label={t("endDate")} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Button onClick={loadLedger} className="mb-0">{t("generate")}</Button>
        </div>
        <DataTable
          headers={[
            "Employee",
            "Daily Wage",
            "Full Days",
            "Half Days",
            "OT Hours",
            "Advances Given",
          ]}
        >
          {ledger.length === 0 ? (
            <EmptyRow colSpan={6} />
          ) : (
            ledger.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.employeeCode}</p>
                </td>
                <td className="px-4 py-3">{formatCurrency(r.dailyWage)}</td>
                <td className="px-4 py-3">{r.fullDays}</td>
                <td className="px-4 py-3">{r.halfDays}</td>
                <td className="px-4 py-3">{r.overtimeHours}</td>
                <td className="px-4 py-3 text-amber-700">{formatCurrency(r.totalAdvances)}</td>
              </tr>
            ))
          )}
        </DataTable>
      </Card>

      <Card title={t("builderSettlement")}>
        <p className="mb-4 text-sm text-slate-500">{t("builderSettlementDesc")}</p>
        <DataTable
          headers={[
            "Project",
            "Builder",
            "Contract",
            "Advances",
            "Interim",
            "Final",
            "Total Received",
            "Balance Due",
            "Status",
          ]}
        >
          {settlements.length === 0 ? (
            <EmptyRow colSpan={9} />
          ) : (
            settlements.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.projectCode}</p>
                </td>
                <td className="px-4 py-3">{s.builderName}</td>
                <td className="px-4 py-3">{formatCurrency(s.contractAmount)}</td>
                <td className="px-4 py-3">{formatCurrency(s.advanceTotal)}</td>
                <td className="px-4 py-3">{formatCurrency(s.interimTotal)}</td>
                <td className="px-4 py-3">{formatCurrency(s.finalTotal)}</td>
                <td className="px-4 py-3 text-emerald-700">{formatCurrency(s.totalReceived)}</td>
                <td className="px-4 py-3 font-semibold text-red-700">{formatCurrency(s.balanceDue)}</td>
                <td className="px-4 py-3">{s.status}</td>
              </tr>
            ))
          )}
        </DataTable>
      </Card>
    </div>
  );
}
