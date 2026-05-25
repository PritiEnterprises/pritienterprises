import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";
import { parseDateInput, startOfDay } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const entrySchema = z.object({
  employeeId: z.string(),
  dayType: z.enum(["FULL_DAY", "HALF_DAY", "ABSENT"]).default("FULL_DAY"),
  overtimeHours: z.number().min(0).default(0),
});

const schema = z.object({
  date: z.string(),
  projectId: z.string().optional().nullable(),
  entries: z.array(entrySchema).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    const date = startOfDay(parseDateInput(data.date));

    const results = await prisma.$transaction(
      data.entries.map((entry) =>
        prisma.attendance.upsert({
          where: {
            employeeId_date: { employeeId: entry.employeeId, date },
          },
          create: {
            employeeId: entry.employeeId,
            projectId: data.projectId || null,
            date,
            dayType: entry.dayType,
            overtimeHours: entry.overtimeHours,
          },
          update: {
            projectId: data.projectId || null,
            dayType: entry.dayType,
            overtimeHours: entry.overtimeHours,
          },
        })
      )
    );

    return NextResponse.json({ count: results.length, records: results });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.errors[0].message);
    return apiError("Bulk attendance failed", 500);
  }
}
