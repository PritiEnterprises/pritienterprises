import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";
import {
  formatEmployeeSalaryMessage,
  formatPayrollSummaryMessage,
  whatsappUrl,
} from "@/lib/whatsapp";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const locale = (request.nextUrl.searchParams.get("locale") as "en" | "hi") || "hi";
  const employeeId = request.nextUrl.searchParams.get("employeeId");

  const period = await prisma.salaryPeriod.findUnique({
    where: { id: params.id },
    include: {
      payrollLines: {
        include: {
          employee: { select: { id: true, name: true, employeeCode: true, phone: true } },
        },
        orderBy: { employee: { name: "asc" } },
      },
    },
  });

  if (!period) return apiError("Not found", 404);

  const periodInfo = {
    label: period.label,
    startDate: period.startDate,
    endDate: period.endDate,
  };

  const lines = period.payrollLines.map((l) => ({
    employee: l.employee,
    fullDays: l.fullDays,
    halfDays: l.halfDays,
    overtimeHours: l.overtimeHours,
    grossEarnings: l.grossEarnings,
    advancesDeducted: l.advancesDeducted,
    netPay: l.netPay,
  }));

  const totals = lines.reduce(
    (a, l) => ({
      gross: a.gross + l.grossEarnings,
      advances: a.advances + l.advancesDeducted,
      net: a.net + l.netPay,
    }),
    { gross: 0, advances: 0, net: 0 }
  );

  const summaryMessage = formatPayrollSummaryMessage(periodInfo, lines, totals, locale);
  const summaryUrl = whatsappUrl(null, summaryMessage);

  const employees = (employeeId
    ? lines.filter((l) => l.employee.id === employeeId)
    : lines
  ).map((l) => {
    const message = formatEmployeeSalaryMessage(periodInfo, l, locale);
    return {
      employeeId: l.employee.id,
      name: l.employee.name,
      employeeCode: l.employee.employeeCode,
      phone: l.employee.phone,
      message,
      waLink: whatsappUrl(l.employee.phone, message),
    };
  });

  return NextResponse.json({
    summary: {
      message: summaryMessage,
      waLink: summaryUrl ? `https://wa.me/?text=${encodeURIComponent(summaryMessage)}` : null,
    },
    employees,
  });
}
