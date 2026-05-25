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
        include: {
          employee: { select: { id: true, name: true, employeeCode: true, phone: true } },
          advances: true,
        },
        orderBy: { employee: { name: "asc" } },
      },
    },
  });
  if (!period) return apiError("Salary period not found", 404);
  return NextResponse.json(period);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  if (body.action === "finalize") {
    const period = await prisma.salaryPeriod.findUnique({
      where: { id: params.id },
    });
    if (!period) return apiError("Not found", 404);
    if (period.status === "FINALIZED") return apiError("Already finalized");

    const updated = await prisma.salaryPeriod.update({
      where: { id: params.id },
      data: { status: "FINALIZED", finalizedAt: new Date() },
      include: {
        payrollLines: { include: { employee: true } },
      },
    });
    return NextResponse.json(updated);
  }

  return apiError("Invalid action");
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const period = await prisma.salaryPeriod.findUnique({
    where: { id: params.id },
  });
  if (!period) return apiError("Not found", 404);
  if (period.status === "FINALIZED") {
    return apiError("Cannot delete finalized payroll");
  }

  await prisma.employeeAdvance.updateMany({
    where: { payrollLine: { salaryPeriodId: params.id } },
    data: { status: "PENDING", payrollLineId: null },
  });

  await prisma.salaryPeriod.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
