import { prisma } from "@/lib/prisma";
import { calculateProjectSettlement } from "@/modules/projects/settlement";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    activeEmployees,
    activeProjects,
    pendingAdvances,
    thisMonthStart,
    projects,
    recentPayments,
    latestPayroll,
  ] = await Promise.all([
    prisma.employee.count({ where: { isActive: true } }),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.employeeAdvance.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
      _count: true,
    }),
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    prisma.project.findMany({
      where: { status: "ACTIVE" },
      take: 5,
      include: { builderPayments: true },
    }),
    prisma.builderPayment.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: { project: { select: { name: true } } },
    }),
    prisma.salaryPeriod.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);

  const monthAttendance = await prisma.attendance.count({
    where: { date: { gte: thisMonthStart }, dayType: { not: "ABSENT" } },
  });

  const projectSummaries = projects.map((p) => {
    const s = calculateProjectSettlement(p.contractAmount, p.builderPayments);
    return {
      id: p.id,
      name: p.name,
      builderName: p.builderName,
      totalReceived: s.totalReceived,
      balanceDue: s.balanceDue,
    };
  });

  const totalReceived = projectSummaries.reduce((a, p) => a + p.totalReceived, 0);
  const totalContract = projects.reduce((a, p) => a + p.contractAmount, 0);

  return (
    <DashboardView
      activeEmployees={activeEmployees}
      activeProjects={activeProjects}
      pendingAdvancesAmount={pendingAdvances._sum.amount ?? 0}
      pendingAdvancesCount={pendingAdvances._count}
      monthAttendance={monthAttendance}
      totalContract={totalContract}
      totalReceived={totalReceived}
      projects={projectSummaries}
      recentPayments={recentPayments}
      latestPayroll={latestPayroll}
    />
  );
}
