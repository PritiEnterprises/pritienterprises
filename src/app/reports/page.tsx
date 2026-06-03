"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable, EmptyRow } from "@/components/layout/DataTable";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface LedgerRow {
  id: string;

  name: string;

  employeeCode: string;

  dailyWage: number;

  fullDays: number;

  halfDays: number;

  absentDays: number;

  overtimeHours: number;

  payableDays: number;

  grossPay: number;

  pendingAdvance: number;

  netPay: number;

  carryForward: number;
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

interface PendingAdvanceRow {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  pendingAdvance: number;
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const [month, setMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0")
  );

  const [year, setYear] = useState(
    String(new Date().getFullYear())
  );
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  const [pendingAdvances, setPendingAdvances] =
    useState<PendingAdvanceRow[]>([]);

  const fromDate =
    `${year}-${month}-01`;

  const lastDay = new Date(
    Number(year),
    Number(month),
    0
  ).getDate();

  const toDate =
    `${year}-${month}-${String(lastDay).padStart(2, "0")}`;

  const loadLedger = () => {
    apiFetch<{ ledger: LedgerRow[] }>(
      `/api/reports?type=employee-ledger&from=${fromDate}&to=${toDate}`
    ).then((d) => setLedger(d.ledger));
  };

  const loadSettlements = () => {
    apiFetch<{ settlements: SettlementRow[] }>(
      "/api/reports?type=builder-settlement"
    ).then((d) => setSettlements(d.settlements));
  };

  const loadPendingAdvances = () => {
    apiFetch<{
      pendingAdvances: PendingAdvanceRow[];
    }>(
      "/api/reports?type=pending-advances"
    ).then((d) =>
      setPendingAdvances(d.pendingAdvances)
    );
  };

  const generateReports = () => {
    loadLedger();
    loadPendingAdvances();
  };

  const exportSalaryPdf = () => {
    const doc = new jsPDF();

    const totalGross = ledger.reduce(
      (sum, r) => sum + r.grossPay,
      0
    );

    const totalPending = ledger.reduce(
      (sum, r) => sum + r.pendingAdvance,
      0
    );

    const totalNet = ledger.reduce(
      (sum, r) => sum + r.netPay,
      0
    );

    const totalCarry = ledger.reduce(
      (sum, r) => sum + r.carryForward,
      0
    );

    doc.setFontSize(20);
    doc.text(
      "PRITI ENTERPRISES",
      105,
      15,
      { align: "center" }
    );

    doc.setFontSize(13);
    doc.text(
      "Monthly Payroll Report",
      105,
      24,
      { align: "center" }
    );

    doc.setFontSize(10);
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    doc.text(
      `${monthNames[Number(month) - 1]} ${year} | Generated: ${new Date().toLocaleDateString("en-GB")}`,
      105,
      31,
      { align: "center" }
    );


    autoTable(doc, {
      startY: 55,
      head: [["Summary", "Value"]],
      body: [
        ["Total Employees", String(ledger.length)],
        ["Total Gross Salary", `Rs. ${Math.round(totalGross).toLocaleString("en-IN")}`],
        ["Total Pending Advance", `Rs. ${Math.round(totalPending).toLocaleString("en-IN")}`],
        ["Total Net Salary", `Rs. ${Math.round(totalNet).toLocaleString("en-IN")}`],
        ["Total Carry Forward", `Rs. ${Math.round(totalCarry).toLocaleString("en-IN")}`],
      ],
    });

    let currentY =
      (doc as any).lastAutoTable.finalY + 10;

    doc.text("Salary Report", 14, currentY);

    autoTable(doc, {
      startY: currentY + 5,
      head: [[
        "Employee",
        "Payable Days",
        "Gross Pay",
        "Pending Advance",
        "Net Pay",
        "Carry Forward",
      ]],
      body: ledger.map((r) => [
        r.name,
        r.payableDays > 0
          ? r.payableDays.toFixed(2)
          : "-",
        r.grossPay > 0
          ? `Rs. ${Math.round(r.grossPay).toLocaleString("en-IN")}`
          : "-",
        r.pendingAdvance > 0
          ? `Rs. ${Math.round(r.pendingAdvance).toLocaleString("en-IN")}`
          : "-",
        r.netPay > 0
          ? `Rs. ${Math.round(r.netPay).toLocaleString("en-IN")}`
          : "-",
        r.carryForward > 0
          ? `Rs. ${Math.round(r.carryForward).toLocaleString("en-IN")}`
          : "-"
      ]),
    });

    currentY =
      (doc as any).lastAutoTable.finalY + 10;

    doc.text("Attendance Summary", 14, currentY);

    autoTable(doc, {
      startY: currentY + 5,
      head: [[
        "Employee",
        "Full Days",
        "Half Days",
        "OT Hours",
        "Absent",
        "Payable Days",
      ]],
      body: ledger.map((r) => [
        r.name,
        r.fullDays,
        r.halfDays,
        r.overtimeHours,
        r.absentDays,
        r.payableDays > 0
          ? r.payableDays.toFixed(2)
          : "-",
      ]),
    });

    currentY =
      (doc as any).lastAutoTable.finalY + 10;

    doc.text(
      "Pending Advance Report",
      14,
      currentY
    );

    autoTable(doc, {
      startY: currentY + 5,
      head: [[
        "Employee",
        "Pending Advance",
      ]],
      body:
        pendingAdvances.length > 0
          ? pendingAdvances.map((p) => [
            p.employeeName,
            `Rs. ${p.pendingAdvance.toLocaleString("en-IN")}`,
          ])
          : [["No Pending Advances", "-"]],
    });


    currentY =
      (doc as any).lastAutoTable.finalY + 20;

    doc.setFontSize(10);

    doc.text(
      "Generated by Priti Enterprises Employee Management System",
      14,
      currentY
    );

    doc.save(
      `payroll-report-${month}-${year}.pdf`
    );
  };

  const exportExcel = () => {
    const workbook = XLSX.utils.book_new();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet([
      ["PRITI ENTERPRISES"],
      ["Monthly Payroll Report"],
      [
        `${monthNames[Number(month) - 1]} ${year}`
      ],
      [],
      ["Summary", "Value"],
      ["Total Employees", ledger.length],
      [
        "Total Gross Salary",
        `₹${ledger
          .reduce((s, r) => s + r.grossPay, 0)
          .toLocaleString("en-IN")}`,
      ],
      [
        "Total Pending Advance",
        `₹${ledger
          .reduce((s, r) => s + r.pendingAdvance, 0)
          .toLocaleString("en-IN")}`,
      ],
      [
        "Total Net Salary",
        `₹${ledger
          .reduce((s, r) => s + r.netPay, 0)
          .toLocaleString("en-IN")}`,
      ],
      [
        "Total Carry Forward",
        `₹${ledger
          .reduce((s, r) => s + r.carryForward, 0)
          .toLocaleString("en-IN")}`,
      ],
    ]);

    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      "Summary"
    );

    summarySheet["!cols"] = [
      { wch: 30 },
      { wch: 20 },
    ];

    const salarySheet = XLSX.utils.json_to_sheet(
      ledger.map((r) => ({
        Employee: r.name,
        "Payable Days": r.payableDays,
        "Gross Pay": r.grossPay,
        "Pending Advance": r.pendingAdvance,
        "Net Pay": r.netPay,
        "Carry Forward": r.carryForward,
      }))
    );

    XLSX.utils.book_append_sheet(
      workbook,
      salarySheet,
      "Salary Report"
    );

    salarySheet["!cols"] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 18 },
    ];

    const attendanceSheet =
      XLSX.utils.json_to_sheet(
        ledger.map((r) => ({
          Employee: r.name,
          "Full Days": r.fullDays,
          "Half Days": r.halfDays,
          "OT Hours": r.overtimeHours,
          Absent: r.absentDays,
          "Payable Days": r.payableDays,
        }))
      );

    XLSX.utils.book_append_sheet(
      workbook,
      attendanceSheet,
      "Attendance"
    );

    attendanceSheet["!cols"] = [
      { wch: 25 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
    ];

    const advanceSheet =
      XLSX.utils.json_to_sheet(
        pendingAdvances.map((p) => ({
          Employee: p.employeeName,
          "Pending Advance":
            p.pendingAdvance,
        }))
      );

    XLSX.utils.book_append_sheet(
      workbook,
      advanceSheet,
      "Pending Advances"
    );

    advanceSheet["!cols"] = [
      { wch: 25 },
      { wch: 20 },
    ];

    XLSX.writeFile(
      workbook,
      `payroll-report-${month}-${year}.xlsx`
    );
  };


  useEffect(() => {
    loadSettlements();
    generateReports();
  }, []);

  return (
    <div>
      <PageHeader title={t("reportsTitle")} description={t("reportsDesc")} />
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">

        <div>
          <label className="mb-1 block text-sm font-medium">
            Month
          </label>

          <select
            value={month}
            onChange={(e) =>
              setMonth(e.target.value)
            }
            className="rounded-xl border px-3 py-2"
          >
            <option value="01">January</option>
            <option value="02">February</option>
            <option value="03">March</option>
            <option value="04">April</option>
            <option value="05">May</option>
            <option value="06">June</option>
            <option value="07">July</option>
            <option value="08">August</option>
            <option value="09">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Year
          </label>

          <select
            value={year}
            onChange={(e) =>
              setYear(e.target.value)
            }
            className="rounded-xl border px-3 py-2"
          >
            {Array.from(
              { length: 5 },
              (_, i) => new Date().getFullYear() - 2 + i
            ).map((y) => (
              <option
                key={y}
                value={String(y)}
              >
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Button onClick={generateReports}>
            Generate
          </Button>

          <Button
            onClick={exportSalaryPdf}
            variant="secondary"
          >
            Export PDF
          </Button>

          <Button
            onClick={exportExcel}
            variant="secondary"
          >
            Export Excel
          </Button>
        </div>

      </div>

      <Card className="mb-8" title="Salary Report">

        <DataTable
          headers={[
            "Employee",
            "Payable Days",
            "Daily Wage",
            "Gross Pay",
            "Pending Advance",
            "Net Pay",
            "Carry Forward",
          ]}
        >
          {ledger.length === 0 ? (
            <EmptyRow colSpan={7} />
          ) : (
            ledger.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.employeeCode}</p>
                </td>
                <td className="px-4 py-3">
                  {r.payableDays.toFixed(2)}
                </td>

                <td className="px-4 py-3">
                  {formatCurrency(r.dailyWage)}
                </td>

                <td className="px-4 py-3 text-emerald-700">
                  {formatCurrency(r.grossPay)}
                </td>

                <td className="px-4 py-3 text-amber-700">
                  {formatCurrency(r.pendingAdvance)}
                </td>

                <td className="px-4 py-3 font-semibold text-blue-700">
                  {formatCurrency(r.netPay)}
                </td>

                <td className="px-4 py-3 font-semibold text-red-700">
                  {formatCurrency(r.carryForward)}
                </td>
              </tr>
            ))
          )}
        </DataTable>
      </Card>

      <Card className="mb-8" title="Attendance Summary">
        <DataTable
          headers={[
            "Employee",
            "Full Days",
            "Half Days",
            "OT Hours",
            "Absent",
            "Payable Days",
          ]}
        >
          {ledger.length === 0 ? (
            <EmptyRow colSpan={6} />
          ) : (
            ledger.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">
                    {r.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {r.employeeCode}
                  </p>
                </td>

                <td className="px-4 py-3">
                  {r.fullDays}
                </td>

                <td className="px-4 py-3">
                  {r.halfDays}
                </td>

                <td className="px-4 py-3">
                  {r.overtimeHours}
                </td>

                <td className="px-4 py-3">
                  {r.absentDays}
                </td>

                <td className="px-4 py-3 font-semibold text-blue-700">
                  {r.payableDays.toFixed(2)}
                </td>
              </tr>
            ))
          )}
        </DataTable>
      </Card>

      <Card className="mb-8" title="Pending Advance Report">
        <DataTable
          headers={[
            "Employee",
            "Pending Advance",
          ]}
        >
          {pendingAdvances.length === 0 ? (
            <EmptyRow colSpan={2} />
          ) : (
            pendingAdvances.map((p) => (
              <tr key={p.employeeId}>
                <td className="px-4 py-3">
                  <p className="font-medium">
                    {p.employeeName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.employeeCode}
                  </p>
                </td>

                <td className="px-4 py-3 text-red-700 font-semibold">
                  {formatCurrency(
                    p.pendingAdvance
                  )}
                </td>
              </tr>
            ))
          )}
        </DataTable>

        <div className="mt-4 text-right font-semibold">
          Total Pending:{" "}
          {formatCurrency(
            pendingAdvances.reduce(
              (sum, p) =>
                sum + p.pendingAdvance,
              0
            )
          )}
        </div>
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
