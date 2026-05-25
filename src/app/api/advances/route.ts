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

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const employeeId = request.nextUrl.searchParams.get("employeeId");

  const advances = await prisma.employeeAdvance.findMany({
    where: {
      ...(status ? { status: status as "PENDING" | "DEDUCTED" | "WAIVED" } : {}),
      ...(employeeId ? { employeeId } : {}),
    },
    orderBy: { date: "desc" },
    include: {
      employee: { select: { id: true, name: true, employeeCode: true } },
    },
  });

  const summary = await prisma.employeeAdvance.groupBy({
    by: ["status"],
    _sum: { amount: true },
    _count: true,
  });

  return NextResponse.json({ advances, summary });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    const advance = await prisma.employeeAdvance.create({
      data: {
        employeeId: data.employeeId,
        amount: data.amount,
        date: data.date ? new Date(data.date) : new Date(),
        notes: data.notes,
        status: "PENDING",
      },
      include: { employee: true },
    });

    return NextResponse.json(advance, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.errors[0].message);
    return apiError("Failed to record advance", 500);
  }
}
