import { prisma } from "@/lib/prisma";
import { calculateProjectSettlement } from "@/modules/projects/settlement";
import { NextRequest, NextResponse } from "next/server";
import { parseDateInput, startOfDay, endOfDay } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") || "summary";
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  if (type === "employee-ledger" && from && to) {
    const start = startOfDay(parseDateInput(from));
    const end = endOfDay(parseDateInput(to));

    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: {
        attendances: {
          where: { date: { gte: start, lte: end } },
        },
        advances: {
          where: { date: { gte: start, lte: end } },
        },
      },
      orderBy: { name: "asc" },
    });

    const ledger = employees.map((e) => {
      const fullDays = e.attendances.filter((a) => a.dayType === "FULL_DAY").length;
      const halfDays = e.attendances.filter((a) => a.dayType === "HALF_DAY").length;
      const otHours = e.attendances.reduce((s, a) => s + a.overtimeHours, 0);
      const advances = e.advances.reduce((s, a) => s + a.amount, 0);
      return {
        id: e.id,
        name: e.name,
        employeeCode: e.employeeCode,
        dailyWage: e.dailyWage,
        fullDays,
        halfDays,
        overtimeHours: otHours,
        totalAdvances: advances,
      };
    });

    return NextResponse.json({ ledger, from, to });
  }

  if (type === "builder-settlement") {
    const projects = await prisma.project.findMany({
      include: { builderPayments: true },
      orderBy: { name: "asc" },
    });

    const settlements = projects.map((p) => ({
      id: p.id,
      projectCode: p.projectCode,
      name: p.name,
      builderName: p.builderName,
      status: p.status,
      ...calculateProjectSettlement(p.contractAmount, p.builderPayments),
    }));

    return NextResponse.json({ settlements });
  }

  const [employees, projects, pendingAdvances, latestPayroll] = await Promise.all([
    prisma.employee.count({ where: { isActive: true } }),
    prisma.project.count(),
    prisma.employeeAdvance.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
    }),
    prisma.salaryPeriod.findFirst({
      orderBy: { createdAt: "desc" },
      include: { payrollLines: true },
    }),
  ]);

  return NextResponse.json({
    employees,
    projects,
    pendingAdvances: pendingAdvances._sum.amount ?? 0,
    latestPayroll: latestPayroll
      ? {
          label: latestPayroll.label,
          status: latestPayroll.status,
          totalNet: latestPayroll.payrollLines.reduce((s, l) => s + l.netPay, 0),
        }
      : null,
  });
}
