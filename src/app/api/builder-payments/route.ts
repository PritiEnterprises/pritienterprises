import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  projectId: z.string(),
  paymentType: z.enum(["ADVANCE", "INTERIM", "FINAL", "OTHER"]),
  amount: z.number().positive(),
  date: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");

  const payments = await prisma.builderPayment.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { date: "desc" },
    include: {
      project: {
        select: { id: true, name: true, projectCode: true, builderName: true },
      },
    },
  });

  return NextResponse.json(payments);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    const payment = await prisma.builderPayment.create({
      data: {
        projectId: data.projectId,
        paymentType: data.paymentType,
        amount: data.amount,
        date: data.date ? new Date(data.date) : new Date(),
        reference: data.reference,
        notes: data.notes,
      },
      include: { project: true },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.errors[0].message);
    return apiError("Failed to record payment", 500);
  }
}
