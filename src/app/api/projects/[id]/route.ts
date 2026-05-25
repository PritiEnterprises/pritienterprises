import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";
import { calculateProjectSettlement } from "@/modules/projects/settlement";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  projectCode: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  siteAddress: z.string().optional().nullable(),
  builderName: z.string().optional(),
  builderPhone: z.string().optional().nullable(),
  contractAmount: z.number().min(0).optional(),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  startDate: z.string().optional().nullable(),
  expectedEndDate: z.string().optional().nullable(),
  actualEndDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      builderPayments: { orderBy: { date: "desc" } },
      attendances: {
        take: 20,
        orderBy: { date: "desc" },
        include: { employee: { select: { name: true, employeeCode: true } } },
      },
    },
  });
  if (!project) return apiError("Project not found", 404);

  return NextResponse.json({
    ...project,
    settlement: calculateProjectSettlement(
      project.contractAmount,
      project.builderPayments
    ),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : data.startDate === null ? null : undefined,
        expectedEndDate: data.expectedEndDate
          ? new Date(data.expectedEndDate)
          : data.expectedEndDate === null
            ? null
            : undefined,
        actualEndDate: data.actualEndDate
          ? new Date(data.actualEndDate)
          : data.actualEndDate === null
            ? null
            : undefined,
      },
    });
    return NextResponse.json(project);
  } catch {
    return apiError("Failed to update project", 500);
  }
}
