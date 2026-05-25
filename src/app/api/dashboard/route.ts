import { prisma } from "@/lib/prisma";
import { calculateProjectSettlement } from "@/modules/projects/settlement";
import { NextResponse } from "next/server";

export async function GET() {
  const [
    activeEmployees,
    activeProjects,
    pendingAdvances,
    thisMonthAttendance,
    recentBuilderPayments,
    projects,
  ] = await Promise.all([
    prisma.employee.count({ where: { isActive: true } }),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.employeeAdvance.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.attendance.count({
      where: {
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
        dayType: { not: "ABSENT" },
      },
    }),
    prisma.builderPayment.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: { project: { select: { name: true, projectCode: true } } },
    }),
    prisma.project.findMany({
      where: { status: "ACTIVE" },
      include: { builderPayments: true },
    }),
  ]);

  const projectSummaries = projects.map((p) => {
    const s = calculateProjectSettlement(p.contractAmount, p.builderPayments);
    return {
      id: p.id,
      name: p.name,
      projectCode: p.projectCode,
      builderName: p.builderName,
      ...s,
    };
  });

  const totalContract = projectSummaries.reduce((a, p) => a + p.contractAmount, 0);
  const totalReceived = projectSummaries.reduce((a, p) => a + p.totalReceived, 0);

  return NextResponse.json({
    stats: {
      activeEmployees,
      activeProjects,
      pendingAdvancesAmount: pendingAdvances._sum.amount ?? 0,
      pendingAdvancesCount: pendingAdvances._count,
      thisMonthAttendance,
      totalContract,
      totalReceived,
      totalBalanceDue: totalContract - totalReceived,
    },
    projectSummaries,
    recentBuilderPayments,
  });
}
