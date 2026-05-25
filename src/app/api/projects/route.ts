import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";
import { calculateProjectSettlement } from "@/modules/projects/settlement";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  projectCode: z.string().min(1),
  name: z.string().min(1),
  siteAddress: z.string().optional(),
  builderName: z.string().min(1),
  builderPhone: z.string().optional(),
  contractAmount: z.number().min(0).default(0),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).default("ACTIVE"),
  startDate: z.string().optional(),
  expectedEndDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      builderPayments: true,
      _count: { select: { attendances: true } },
    },
  });

  const enriched = projects.map((p) => ({
    ...p,
    settlement: calculateProjectSettlement(p.contractAmount, p.builderPayments),
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    const project = await prisma.project.create({
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        expectedEndDate: data.expectedEndDate
          ? new Date(data.expectedEndDate)
          : undefined,
      },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.errors[0].message);
    return apiError("Failed to create project", 500);
  }
}
