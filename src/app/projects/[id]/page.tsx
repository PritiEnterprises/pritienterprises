"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/layout/DataTable";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface ProjectDetail {
  id: string;
  projectCode: string;
  name: string;
  siteAddress: string | null;
  builderName: string;
  builderPhone: string | null;
  contractAmount: number;
  status: string;
  settlement: {
    contractAmount: number;
    totalReceived: number;
    balanceDue: number;
    advanceTotal: number;
    interimTotal: number;
    finalTotal: number;
    otherTotal: number;
  };
  builderPayments: Array<{
    id: string;
    paymentType: string;
    amount: number;
    date: string;
    reference: string | null;
    notes: string | null;
  }>;
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);

  useEffect(() => {
    if (id) apiFetch<ProjectDetail>(`/api/projects/${id}`).then(setProject);
  }, [id]);

  if (!project) return <p className="text-slate-500">Loading...</p>;

  const s = project.settlement;

  return (
    <div>
      <Link href="/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <PageHeader title={project.name} description={`${project.projectCode} · ${project.builderName}`} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><p className="text-sm text-slate-500">Contract Value</p><p className="text-xl font-bold">{formatCurrency(s.contractAmount)}</p></Card>
        <Card><p className="text-sm text-slate-500">Total Received</p><p className="text-xl font-bold text-emerald-700">{formatCurrency(s.totalReceived)}</p></Card>
        <Card><p className="text-sm text-slate-500">Balance Due</p><p className="text-xl font-bold text-red-700">{formatCurrency(s.balanceDue)}</p></Card>
        <Card><p className="text-sm text-slate-500">Status</p><p className="text-xl font-bold">{project.status}</p></Card>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><p className="text-xs text-slate-500">Advances</p><p className="font-semibold">{formatCurrency(s.advanceTotal)}</p></Card>
        <Card><p className="text-xs text-slate-500">Interim</p><p className="font-semibold">{formatCurrency(s.interimTotal)}</p></Card>
        <Card><p className="text-xs text-slate-500">Final</p><p className="font-semibold">{formatCurrency(s.finalTotal)}</p></Card>
        <Card><p className="text-xs text-slate-500">Other</p><p className="font-semibold">{formatCurrency(s.otherTotal)}</p></Card>
      </div>

      <Card title="Payment History">
        <DataTable headers={["Date", "Type", "Amount", "Reference", "Notes"]}>
          {project.builderPayments.map((pay) => (
            <tr key={pay.id}>
              <td className="px-4 py-3">{formatDate(pay.date)}</td>
              <td className="px-4 py-3">{pay.paymentType}</td>
              <td className="px-4 py-3 font-semibold text-emerald-700">{formatCurrency(pay.amount)}</td>
              <td className="px-4 py-3">{pay.reference || "—"}</td>
              <td className="px-4 py-3 text-slate-500">{pay.notes || "—"}</td>
            </tr>
          ))}
        </DataTable>
        <Link href="/builder-payments" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
          Record new payment →
        </Link>
      </Card>
    </div>
  );
}
