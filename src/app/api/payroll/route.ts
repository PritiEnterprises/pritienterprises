import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";
import { parseDateInput, startOfDay, endOfDay } from "@/lib/utils";
import {
  aggregateAttendance,
  calculatePayroll,
} from "@/modules/payroll/calculations";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  label: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  notes: z.string().optional(),
});

export async function GET() {
  const periods = await prisma.salaryPeriod.findMany({
    orderBy: { startDate: "desc" },
    include: {
      _count: { select: { payrollLines: true } },
      payrollLines: {
        select: { netPay: true, grossEarnings: true, advancesDeducted: true },
      },
    },
  });

  const enriched = periods.map((p) => ({
    ...p,
    totals: p.payrollLines.reduce(
      (acc, l) => ({
        gross: acc.gross + l.grossEarnings,
        advances: acc.advances + l.advancesDeducted,
        net: acc.net + l.netPay,
      }),
      { gross: 0, advances: 0, net: 0 }
    ),
    payrollLines: undefined,
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createSchema.parse(body);
    const startDate = startOfDay(parseDateInput(data.startDate));
    const endDate = endOfDay(parseDateInput(data.endDate));

    const existing = await prisma.salaryPeriod.findFirst({
      where: { startDate, endDate },
    });
    if (existing) return apiError("Salary period already exists for these dates");

    const employees = await prisma.employee.findMany({
      where: { isActive: true },
    });

    const period = await prisma.salaryPeriod.create({
      data: {
        label: data.label,
        startDate,
        endDate,
        notes: data.notes,
        status: "DRAFT",
      },
    });

    for (const emp of employees) {
      const attendances = await prisma.attendance.findMany({
        where: {
          employeeId: emp.id,
          date: { gte: startDate, lte: endDate },
          dayType: { not: "ABSENT" },
        },
      });

      const { fullDays, halfDays, overtimeHours } = aggregateAttendance(attendances);

      const pendingAdvances = await prisma.employeeAdvance.findMany({
        where: { employeeId: emp.id, status: "PENDING" },
      });
      const pendingTotal = pendingAdvances.reduce((s, a) => s + a.amount, 0);

      const calc = calculatePayroll({
        dailyWage: emp.dailyWage,
        overtimeRate: emp.overtimeRate,
        fullDays,
        halfDays,
        overtimeHours,
        pendingAdvances: pendingTotal,
      });

      const line = await prisma.payrollLine.create({
        data: {
          salaryPeriodId: period.id,
          employeeId: emp.id,
          fullDays,
          halfDays,
          overtimeHours,
          dailyWageSnapshot: emp.dailyWage,
          overtimeRateSnap: emp.overtimeRate,
          grossEarnings: calc.grossEarnings,
          advancesDeducted: calc.advancesDeducted,
          netPay: calc.netPay,
        },
      });

      let remaining = calc.advancesDeducted;
      for (const adv of pendingAdvances.sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      )) {
        if (remaining <= 0) break;
        if (adv.amount <= remaining) {
          await prisma.employeeAdvance.update({
            where: { id: adv.id },
            data: { status: "DEDUCTED", payrollLineId: line.id },
          });
          remaining -= adv.amount;
        } else if (remaining > 0) {
          await prisma.employeeAdvance.update({
            where: { id: adv.id },
            data: { amount: adv.amount - remaining },
          });
          await prisma.employeeAdvance.create({
            data: {
              employeeId: emp.id,
              amount: remaining,
              date: adv.date,
              notes: `Deducted in ${data.label}`,
              status: "DEDUCTED",
              payrollLineId: line.id,
            },
          });
          remaining = 0;
        }
      }
    }

    const full = await prisma.salaryPeriod.findUnique({
      where: { id: period.id },
      include: {
        payrollLines: { include: { employee: true }, orderBy: { employee: { name: "asc" } } },
      },
    });

    return NextResponse.json(full, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.errors[0].message);
    console.error(e);
    return apiError("Failed to generate payroll", 500);
  }
}
