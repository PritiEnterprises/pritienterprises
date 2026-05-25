export type AttendanceType = "FULL_DAY" | "HALF_DAY" | "ABSENT";

export interface PayrollCalcInput {
  dailyWage: number;
  overtimeRate: number;
  fullDays: number;
  halfDays: number;
  overtimeHours: number;
  pendingAdvances: number;
  otherDeductions?: number;
}

export interface PayrollCalcResult {
  grossEarnings: number;
  advancesDeducted: number;
  otherDeductions: number;
  netPay: number;
  dayEarnings: number;
  overtimeEarnings: number;
}

export function getOvertimeRate(dailyWage: number, overtimeRate: number): number {
  if (overtimeRate > 0) return overtimeRate;
  return dailyWage / 8;
}

export function dayTypeMultiplier(dayType: AttendanceType): number {
  switch (dayType) {
    case "FULL_DAY":
      return 1;
    case "HALF_DAY":
      return 0.5;
    case "ABSENT":
      return 0;
    default:
      return 0;
  }
}

export function calculatePayroll(input: PayrollCalcInput): PayrollCalcResult {
  const otRate = getOvertimeRate(input.dailyWage, input.overtimeRate);
  const dayEarnings =
    input.fullDays * input.dailyWage + input.halfDays * input.dailyWage * 0.5;
  const overtimeEarnings = input.overtimeHours * otRate;
  const grossEarnings = dayEarnings + overtimeEarnings;
  const advancesDeducted = Math.min(input.pendingAdvances, grossEarnings);
  const otherDeductions = input.otherDeductions ?? 0;
  const netPay = Math.max(0, grossEarnings - advancesDeducted - otherDeductions);

  return {
    grossEarnings,
    advancesDeducted,
    otherDeductions,
    netPay,
    dayEarnings,
    overtimeEarnings,
  };
}

export function aggregateAttendance(
  records: { dayType: string; overtimeHours: number }[]
) {
  let fullDays = 0;
  let halfDays = 0;
  let overtimeHours = 0;

  for (const r of records) {
    if (r.dayType === "FULL_DAY") fullDays++;
    else if (r.dayType === "HALF_DAY") halfDays++;
    overtimeHours += r.overtimeHours;
  }

  return { fullDays, halfDays, overtimeHours };
}
