import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";
import { parseDateInput, startOfDay, endOfDay } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  employeeId: z.string(),
  projectId: z.string().optional().nullable(),
  date: z.string(),
  dayType: z.enum(["FULL_DAY", "HALF_DAY", "ABSENT"]).default("FULL_DAY"),
  overtimeHours: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const dateStr = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const employeeId = searchParams.get("employeeId");
  const projectId = searchParams.get("projectId");

  const where: Record<string, unknown> = {};

  if (dateStr) {
    const d = parseDateInput(dateStr);
    where.date = { gte: startOfDay(d), lte: endOfDay(d) };
  } else if (from && to) {
    where.date = {
      gte: startOfDay(parseDateInput(from)),
      lte: endOfDay(parseDateInput(to)),
    };
  }

  if (employeeId) where.employeeId = employeeId;
  if (projectId) where.projectId = projectId;

  const records = await prisma.attendance.findMany({
    where,
    orderBy: [{ date: "desc" }, { employee: { name: "asc" } }],
    include: {
      employee: { select: { id: true, name: true, employeeCode: true, dailyWage: true } },
      project: { select: { id: true, name: true, projectCode: true } },
    },
  });

  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    const date = startOfDay(parseDateInput(data.date));

    const record = await prisma.attendance.upsert({
      where: {
        employeeId_date: { employeeId: data.employeeId, date },
      },
      create: {
        employeeId: data.employeeId,
        projectId: data.projectId || null,
        date,
        dayType: data.dayType,
        overtimeHours: data.overtimeHours,
        notes: data.notes,
      },
      update: {
        projectId: data.projectId || null,
        dayType: data.dayType,
        overtimeHours: data.overtimeHours,
        notes: data.notes,
      },
      include: {
        employee: true,
        project: true,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.errors[0].message);
    return apiError("Failed to save attendance", 500);
  }
}
