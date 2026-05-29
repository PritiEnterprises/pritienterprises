import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const payrollLine = await prisma.payrollLine.findUnique({
      where: { id: params.id },
    });

    if (!payrollLine) {
      return apiError("Payroll line not found", 404);
    }

    if (payrollLine.paymentStatus === "PAID") {
      return apiError("Salary already paid");
    }

    const updated = await prisma.payrollLine.update({
      where: { id: params.id },
      data: {
        paymentStatus: "PAID",
        paidAt: new Date(),
        paymentMethod: body.paymentMethod || "CASH",
        paymentNotes: body.paymentNotes || null,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return apiError("Failed to update payment", 500);
  }
}