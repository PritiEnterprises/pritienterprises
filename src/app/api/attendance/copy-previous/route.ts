import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";
import { parseDateInput, startOfDay, endOfDay } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { subDays } from "date-fns";

const schema = z.object({
  date: z.string(),
  projectId: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, projectId } = schema.parse(body);
    const targetDate = startOfDay(parseDateInput(date));
    const sourceDate = subDays(targetDate, 1);

    const previous = await prisma.attendance.findMany({
      where: {
        date: { gte: startOfDay(sourceDate), lte: endOfDay(sourceDate) },
        dayType: { not: "ABSENT" },
      },
    });

    if (previous.length === 0) {
      return apiError("No attendance found for previous day", 404);
    }

    const results = await prisma.$transaction(
      previous.map((rec) =>
        prisma.attendance.upsert({
          where: {
            employeeId_date: { employeeId: rec.employeeId, date: targetDate },
          },
          create: {
            employeeId: rec.employeeId,
            projectId: projectId ?? rec.projectId,
            date: targetDate,
            dayType: rec.dayType,
            overtimeHours: rec.overtimeHours,
          },
          update: {
            projectId: projectId ?? rec.projectId,
            dayType: rec.dayType,
            overtimeHours: rec.overtimeHours,
          },
        })
      )
    );

    return NextResponse.json({ count: results.length });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.errors[0].message);
    return apiError("Copy failed", 500);
  }
}
