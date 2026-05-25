import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  employeeCode: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional(),
  role: z.string().default("Mason"),
  dailyWage: z.number().positive(),
  overtimeRate: z.number().min(0).default(0),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
  joinDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const activeOnly = request.nextUrl.searchParams.get("active") === "true";
  const employees = await prisma.employee.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { attendances: true, advances: true } },
    },
  });
  return NextResponse.json(employees);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    const existing = await prisma.employee.findUnique({
      where: { employeeCode: data.employeeCode },
    });
    if (existing) return apiError("Employee code already exists", 409);

    const employee = await prisma.employee.create({
      data: {
        ...data,
        joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
      },
    });
    return NextResponse.json(employee, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.errors[0].message);
    return apiError("Failed to create employee", 500);
  }
}
