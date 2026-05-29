import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  employeeId: z.string(),
  amount: z.number().positive(),
  date: z.string().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const advance = await prisma.employeeAdvance.findUnique({
      where: { id: params.id },
    });

    if (!advance) {
      return apiError("Advance not found", 404);
    }

    if (advance.status !== "PENDING") {
      return apiError(
        "Only pending advances can be edited",
        400
      );
    }

    const body = await request.json();
    const data = schema.parse(body);

    const updated = await prisma.employeeAdvance.update({
      where: { id: params.id },
      data: {
        employeeId: data.employeeId,
        amount: data.amount,
        date: data.date
          ? new Date(data.date)
          : advance.date,
        notes: data.notes,
      },
      include: {
        employee: true,
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return apiError(e.errors[0].message);
    }

    return apiError("Failed to update advance", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const advance = await prisma.employeeAdvance.findUnique({
      where: { id: params.id },
    });

    if (!advance) {
      return apiError("Advance not found", 404);
    }

    if (advance.status !== "PENDING") {
      return apiError(
        "Only pending advances can be deleted",
        400
      );
    }

    await prisma.employeeAdvance.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch {
    return apiError("Failed to delete advance", 500);
  }
}