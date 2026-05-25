import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  employeeCode: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  role: z.string().optional(),
  dailyWage: z.number().positive().optional(),
  overtimeRate: z.number().min(0).optional(),
  address: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  joinDate: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    include: {
      advances: { orderBy: { date: "desc" }, take: 10 },
      attendances: { orderBy: { date: "desc" }, take: 15, include: { project: true } },
    },
  });
  if (!employee) return apiError("Employee not found", 404);
  return NextResponse.json(employee);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        ...data,
        joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
      },
    });
    return NextResponse.json(employee);
  } catch {
    return apiError("Failed to update employee", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.employee.update({
    where: { id: params.id },
    data: { isActive: false },
  });
  return NextResponse.json({ success: true });
}

/** Reactivate a deactivated employee */
export async function PUT(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const employee = await prisma.employee.update({
    where: { id: params.id },
    data: { isActive: true },
  });
  return NextResponse.json(employee);
}
