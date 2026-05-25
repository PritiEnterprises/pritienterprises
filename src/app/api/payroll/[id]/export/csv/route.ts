import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const period = await prisma.salaryPeriod.findUnique({
    where: { id: params.id },
    include: {
      payrollLines: {
        include: { employee: true },
        orderBy: { employee: { name: "asc" } },
      },
    },
  });

  if (!period) return apiError("Not found", 404);

  const headers = [
    "Employee Code",
    "Name",
    "Phone",
    "Full Days",
    "Half Days",
    "OT Hours",
    "Daily Wage",
    "Gross",
    "Advances Deducted",
    "Net Pay",
  ];

  const rows = period.payrollLines.map((l) =>
    [
      l.employee.employeeCode,
      l.employee.name,
      l.employee.phone || "",
      l.fullDays,
      l.halfDays,
      l.overtimeHours,
      l.dailyWageSnapshot,
      l.grossEarnings,
      l.advancesDeducted,
      l.netPay,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const filename = `payroll-${period.label.replace(/\s+/g, "-")}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
