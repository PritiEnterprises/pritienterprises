import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";
import { generatePayrollPdf } from "@/lib/pdf/salary-slip";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const employeeCode = request.nextUrl.searchParams.get("employee");
  const locale = (request.nextUrl.searchParams.get("locale") as "en" | "hi") || "hi";

  const period = await prisma.salaryPeriod.findUnique({
    where: { id: params.id },
    include: {
      payrollLines: {
        include: { employee: { select: { name: true, employeeCode: true } } },
        orderBy: { employee: { name: "asc" } },
      },
    },
  });

  if (!period) return apiError("Not found", 404);

  try {
    const buffer = generatePayrollPdf(
      {
        companyName: "Priti Enterprises",
        period: {
          label: period.label,
          startDate: period.startDate,
          endDate: period.endDate,
          status: period.status,
        },
        lines: period.payrollLines,
        locale,
      },
      employeeCode || undefined
    );

    const filename = employeeCode
      ? `salary-${employeeCode}-${period.label.replace(/\s+/g, "-")}.pdf`
      : `salary-sheet-${period.label.replace(/\s+/g, "-")}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "PDF generation failed", 500);
  }
}
