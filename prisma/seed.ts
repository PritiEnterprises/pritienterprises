import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const forceReset = process.argv.includes("--force");

async function ensureAdmin() {
  const adminPassword = process.env.ADMIN_PASSWORD || "priti@2025";
  const existing = await prisma.user.findUnique({ where: { username: "admin" } });
  if (existing) return;

  await prisma.user.create({
    data: {
      username: "admin",
      name: "Priti Enterprises Admin",
      passwordHash: await bcrypt.hash(adminPassword, 12),
    },
  });
  console.log("Admin user created (admin / see ADMIN_PASSWORD in .env)");
}

async function wipeAllData() {
  await prisma.payrollLine.deleteMany();
  await prisma.employeeAdvance.deleteMany();
  await prisma.salaryPeriod.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.builderPayment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
}

async function seedDemoData() {
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        employeeCode: "EMP001",
        name: "Ramesh Kumar",
        phone: "9876543210",
        role: "Mason",
        dailyWage: 800,
        overtimeRate: 100,
        joinDate: new Date("2024-01-15"),
      },
    }),
    prisma.employee.create({
      data: {
        employeeCode: "EMP002",
        name: "Suresh Patel",
        phone: "9876543211",
        role: "Helper",
        dailyWage: 600,
        overtimeRate: 75,
        joinDate: new Date("2024-03-01"),
      },
    }),
    prisma.employee.create({
      data: {
        employeeCode: "EMP003",
        name: "Anil Singh",
        phone: "9876543212",
        role: "Carpenter",
        dailyWage: 900,
        overtimeRate: 112,
        joinDate: new Date("2024-02-10"),
      },
    }),
    prisma.employee.create({
      data: {
        employeeCode: "EMP004",
        name: "Vijay Sharma",
        role: "Electrician",
        dailyWage: 950,
        overtimeRate: 120,
      },
    }),
  ]);

  const project = await prisma.project.create({
    data: {
      projectCode: "PRJ001",
      name: "Green Valley Apartments - Block A",
      siteAddress: "Sector 12, Noida",
      builderName: "Sharma Constructions Pvt Ltd",
      builderPhone: "9811000000",
      contractAmount: 2500000,
      status: "ACTIVE",
      startDate: new Date("2025-01-01"),
      expectedEndDate: new Date("2025-12-31"),
    },
  });

  await prisma.project.create({
    data: {
      projectCode: "PRJ002",
      name: "Commercial Complex - Phase 1",
      siteAddress: "MG Road, Ghaziabad",
      builderName: "Metro Build Developers",
      builderPhone: "9811000001",
      contractAmount: 1800000,
      status: "ACTIVE",
      startDate: new Date("2025-03-01"),
    },
  });

  await prisma.builderPayment.createMany({
    data: [
      {
        projectId: project.id,
        paymentType: "ADVANCE",
        amount: 500000,
        date: new Date("2025-01-05"),
        reference: "CHQ-4521",
        notes: "Mobilization advance",
      },
      {
        projectId: project.id,
        paymentType: "INTERIM",
        amount: 400000,
        date: new Date("2025-03-15"),
        reference: "RTGS-8832",
        notes: "After slab completion",
      },
    ],
  });

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  for (let d = 1; d <= Math.min(today.getDate(), 10); d++) {
    const date = new Date(today.getFullYear(), today.getMonth(), d);
    if (date.getDay() === 0) continue;

    for (const emp of employees.slice(0, 3)) {
      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          projectId: project.id,
          date,
          dayType: "FULL_DAY",
          overtimeHours: d % 3 === 0 ? 2 : 0,
        },
      });
    }
  }

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 5);

  await prisma.employeeAdvance.createMany({
    data: [
      {
        employeeId: employees[0].id,
        amount: 2000,
        date: weekAgo,
        notes: "Weekly advance",
      },
      {
        employeeId: employees[1].id,
        amount: 1500,
        date: weekAgo,
        notes: "Weekly advance",
      },
      {
        employeeId: employees[2].id,
        amount: 2500,
        date: new Date(startOfMonth.getTime() + 86400000 * 3),
        notes: "Emergency advance",
      },
    ],
  });

  console.log("Demo data loaded (4 employees, 2 projects, sample attendance).");
}

async function main() {
  const employeeCount = await prisma.employee.count();

  if (forceReset) {
    console.log("WARNING: --force will delete ALL your data and reload demo samples.");
    await wipeAllData();
    await ensureAdmin();
    await seedDemoData();
    console.log("Database reset complete.");
    return;
  }

  await ensureAdmin();

  if (employeeCount > 0) {
    console.log(
      `Seed skipped: ${employeeCount} employee(s) already in database. Your data is safe.`
    );
    console.log("To wipe everything and reload demo data only, run: npm run db:reset");
    return;
  }

  await seedDemoData();
  console.log("First-time seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
