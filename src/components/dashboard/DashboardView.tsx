"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard, Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { Users, Building2, Wallet, CalendarCheck, TrendingUp, AlertCircle } from "lucide-react";

interface DashboardViewProps {
  activeEmployees: number;
  activeProjects: number;
  pendingAdvancesAmount: number;
  pendingAdvancesCount: number;
  monthAttendance: number;
  totalContract: number;
  totalReceived: number;
  projects: Array<{
    id: string;
    name: string;
    builderName: string;
    totalReceived: number;
    balanceDue: number;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    paymentType: string;
    date: Date | string;
    project: { name: string };
  }>;
  latestPayroll: {
    id: string;
    label: string;
    status: string;
    startDate: Date | string;
    endDate: Date | string;
  } | null;
}

export function DashboardView(props: DashboardViewProps) {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader
        title={t("dashboard")}
        description={t("appFooter")}
        action={
          <Link href="/attendance">
            <Button>{t("markAttendance")}</Button>
          </Link>
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("activeEmployees")}
          value={String(props.activeEmployees)}
          accent="brand"
          icon={<Users className="h-5 w-5 text-brand-600" />}
        />
        <StatCard
          label={t("activeProjects")}
          value={String(props.activeProjects)}
          accent="blue"
          icon={<Building2 className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          label={t("pendingAdvances")}
          value={formatCurrency(props.pendingAdvancesAmount)}
          sub={`${props.pendingAdvancesCount} records`}
          accent="amber"
          icon={<Wallet className="h-5 w-5 text-amber-600" />}
        />
        <StatCard
          label={t("monthAttendance")}
          value={String(props.monthAttendance)}
          sub={t("workDaysLogged")}
          accent="green"
          icon={<CalendarCheck className="h-5 w-5 text-emerald-600" />}
        />
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <StatCard
          label={t("builderReceived")}
          value={formatCurrency(props.totalReceived)}
          sub={`${t("contractValue")}: ${formatCurrency(props.totalContract)}`}
          accent="green"
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          label={t("balanceDue")}
          value={formatCurrency(props.totalContract - props.totalReceived)}
          sub={t("acrossActiveProjects")}
          accent="red"
          icon={<AlertCircle className="h-5 w-5 text-red-600" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t("activeProjectSettlement")}>
          {props.projects.length === 0 ? (
            <p className="text-sm text-slate-500">{t("noRecords")}</p>
          ) : (
            <ul className="space-y-3">
              {props.projects.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between rounded-lg border border-slate-100 p-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.builderName}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold text-emerald-700">
                      {formatCurrency(p.totalReceived)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t("due")}: {formatCurrency(p.balanceDue)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link href="/projects" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
            {t("viewAll")} →
          </Link>
        </Card>

        <Card title={t("recentBuilderPayments")}>
          {props.recentPayments.length === 0 ? (
            <p className="text-sm text-slate-500">{t("noRecords")}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {props.recentPayments.map((pay) => (
                <li
                  key={pay.id}
                  className="flex flex-col gap-2 md:flex-row md:justify-between py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{pay.project.name}</p>
                    <p className="text-xs text-slate-500">
                      {pay.paymentType} · {formatDate(pay.date)}
                    </p>
                  </div>
                  <span className="font-semibold text-emerald-700">
                    {formatCurrency(pay.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {props.latestPayroll && (
        <Card className="mt-6" title={t("latestSalaryPeriod")}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <span className="font-medium">{props.latestPayroll.label}</span>
            <Badge variant={props.latestPayroll.status === "FINALIZED" ? "success" : "warning"}>
              {props.latestPayroll.status === "FINALIZED" ? t("finalized") : t("draft")}
            </Badge>
            <span className="text-sm text-slate-500">
              {formatDate(props.latestPayroll.startDate)} –{" "}
              {formatDate(props.latestPayroll.endDate)}
            </span>
            <Link href={`/payroll/${props.latestPayroll.id}`} className="ml-auto text-sm text-brand-600">
              {t("viewDetails")} →
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
