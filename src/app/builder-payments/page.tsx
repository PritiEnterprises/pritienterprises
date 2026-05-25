"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, EmptyRow } from "@/components/layout/DataTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate, toDateInputValue } from "@/lib/utils";
import { Plus } from "lucide-react";

interface Project {
  id: string;
  name: string;
  projectCode: string;
  builderName: string;
}

interface Payment {
  id: string;
  paymentType: string;
  amount: number;
  date: string;
  reference: string | null;
  notes: string | null;
  project: Project;
}

export default function BuilderPaymentsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    projectId: "",
    paymentType: "ADVANCE",
    amount: "",
    date: toDateInputValue(new Date()),
    reference: "",
    notes: "",
  });

  const load = () => {
    apiFetch<Payment[]>("/api/builder-payments").then(setPayments);
    apiFetch<Project[]>("/api/projects").then(setProjects);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch("/api/builder-payments", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
      }),
    });
    setShowForm(false);
    load();
  };

  const typeVariant = (t: string) => {
    if (t === "ADVANCE") return "info";
    if (t === "INTERIM") return "warning";
    if (t === "FINAL") return "success";
    return "default";
  };

  return (
    <div>
      <PageHeader
        title="Builder Payments"
        description="Record advances, interim, and final payments from builders for settlement tracking"
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" /> Record Payment
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6" title="New Builder Payment">
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Project"
              required
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              options={[
                { value: "", label: "Select project" },
                ...projects.map((p) => ({
                  value: p.id,
                  label: `${p.projectCode} - ${p.name}`,
                })),
              ]}
            />
            <Select
              label="Payment Type"
              value={form.paymentType}
              onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
              options={[
                { value: "ADVANCE", label: "Advance (Mobilization)" },
                { value: "INTERIM", label: "Interim / Running Bill" },
                { value: "FINAL", label: "Final Payment" },
                { value: "OTHER", label: "Other" },
              ]}
            />
            <Input label="Amount (INR)" type="number" required min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Input label="Reference (Cheque/RTGS)" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <Button type="submit" className="sm:col-span-2">Save Payment</Button>
          </form>
        </Card>
      )}

      <DataTable headers={["Date", "Project", "Builder", "Type", "Amount", "Reference", "Notes"]}>
        {payments.length === 0 ? (
          <EmptyRow colSpan={7} />
        ) : (
          payments.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3">{formatDate(p.date)}</td>
              <td className="px-4 py-3 font-medium">{p.project.name}</td>
              <td className="px-4 py-3">{p.project.builderName}</td>
              <td className="px-4 py-3">
                <Badge variant={typeVariant(p.paymentType)}>{p.paymentType}</Badge>
              </td>
              <td className="px-4 py-3 font-semibold text-emerald-700">{formatCurrency(p.amount)}</td>
              <td className="px-4 py-3">{p.reference || "—"}</td>
              <td className="px-4 py-3 text-slate-500">{p.notes || "—"}</td>
            </tr>
          ))
        )}
      </DataTable>
    </div>
  );
}
