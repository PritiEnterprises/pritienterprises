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
import { Plus, X } from "lucide-react";

interface Project {
  id: string;
  name: string;
  projectCode: string;
  builderName: string;
  status: string;
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
  const [editingId, setEditingId] = useState<string | null>(null);
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
    apiFetch<Project[]>("/api/projects").then((data) =>
      setProjects(
        data.filter((p) => p.status === "ACTIVE")
      )
    );
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...form,
      amount: parseFloat(form.amount),
    };

    if (editingId) {
      await apiFetch(`/api/builder-payments/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch("/api/builder-payments", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    setEditingId(null);

    setForm({
      projectId: "",
      paymentType: "ADVANCE",
      amount: "",
      date: toDateInputValue(new Date()),
      reference: "",
      notes: "",
    });

    setShowForm(false);

    load();
  };

  const editPayment = (payment: Payment) => {
    setEditingId(payment.id);

    setForm({
      projectId: payment.project.id,
      paymentType: payment.paymentType,
      amount: String(payment.amount),
      date: toDateInputValue(payment.date),
      reference: payment.reference || "",
      notes: payment.notes || "",
    });

    setShowForm(true);
  };

  const deletePayment = async (id: string) => {
    const confirmed = confirm(
      "Delete this payment permanently?"
    );

    if (!confirmed) return;

    try {
      await apiFetch(`/api/builder-payments/${id}`, {
        method: "DELETE",
      });

      load();
    } catch {
      alert("Failed to delete payment");
    }
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
          <Button
            onClick={() => {
              setShowForm(!showForm);

              if (showForm) {
                setEditingId(null);

                setForm({
                  projectId: "",
                  paymentType: "ADVANCE",
                  amount: "",
                  date: toDateInputValue(new Date()),
                  reference: "",
                  notes: "",
                });
              }
            }}
          >
            {showForm ? (
              <X className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}

            {showForm ? "Cancel" : "Record Payment"}
          </Button>
        }
      />

      {showForm && (
        <Card
          className="mb-6"
          title={
            editingId
              ? "Edit Builder Payment"
              : "New Builder Payment"
          }
        >
          <form
            onSubmit={submit}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
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
            <Button type="submit" className="md:col-span-2">
              {editingId ? "Update Payment" : "Save Payment"}
            </Button>
          </form>
        </Card>
      )}

      <DataTable
        headers={[
          "Date",
          "Project",
          "Builder",
          "Type",
          "Amount",
          "Reference",
          "Notes",
          "Actions",
        ]}
      >
        {payments.length === 0 ? (
          <EmptyRow colSpan={8} />
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
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 text-xs">

                  <button
                    onClick={() => editPayment(p)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deletePayment(p.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>

                </div>
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </div>
  );
}
