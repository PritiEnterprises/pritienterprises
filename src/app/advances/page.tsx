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
import { useTranslation } from "@/lib/i18n/context";

interface Employee {
  id: string;
  name: string;
  employeeCode: string;
}

interface Advance {
  id: string;
  amount: number;
  date: string;
  status: string;
  notes: string | null;
  employee: Employee;
}

export default function AdvancesPage() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    employeeId: "",
    amount: "",
    date: toDateInputValue(new Date()),
    notes: "",
  });
  const [error, setError] = useState("");

  const load = () => {
    const q = filter ? `?status=${filter}` : "";
    apiFetch<{ advances: Advance[] }>(`/api/advances${q}`).then((d) =>
      setAdvances(d.advances)
    );
  };

  useEffect(() => {
    apiFetch<Employee[]>("/api/employees?active=true").then(setEmployees);
  }, []);

  useEffect(() => { load(); }, [filter]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {

      const payload = {
        ...form,
        amount: parseFloat(form.amount),
      };

      if (editingId) {

        await apiFetch(`/api/advances/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

      } else {

        await apiFetch("/api/advances", {
          method: "POST",
          body: JSON.stringify(payload),
        });

      }

      setEditingId(null);

      setForm({
        employeeId: "",
        amount: "",
        date: toDateInputValue(new Date()),
        notes: "",
      });

      setShowForm(false);

      load();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  const editAdvance = (a: Advance) => {
    setEditingId(a.id);

    setForm({
      employeeId: a.employee.id,
      amount: String(a.amount),
      date: toDateInputValue(new Date(a.date)),
      notes: a.notes || "",
    });

    setShowForm(true);
  };

  const deleteAdvance = async (id: string) => {
    if (!confirm("Delete this advance?")) return;

    try {
      await apiFetch(`/api/advances/${id}`, {
        method: "DELETE",
      });

      load();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Delete failed"
      );
    }
  };

  const statusVariant = (s: string) => {
    if (s === "PENDING") return "warning";
    if (s === "DEDUCTED") return "success";
    return "default";
  };

  return (
    <div>
      <PageHeader
        title={t("employeeAdvances")}
        description={t("advancesDesc")}
        action={
          <Button
            onClick={() => {
              setShowForm(!showForm);

              if (showForm) {

                setEditingId(null);

                setForm({
                  employeeId: "",
                  amount: "",
                  date: toDateInputValue(new Date()),
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

            {showForm ? "Cancel" : "Record Advance"}
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { s: "PENDING", label: t("pending") },
          { s: "DEDUCTED", label: t("deducted") },
          { s: "WAIVED", label: t("waived") },
          { s: "", label: t("all") },
        ].map(({ s, label }) => (
          <button
            key={s || "all"}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filter === s ? "bg-brand-600 text-white" : "bg-white border border-slate-200 text-slate-600"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {showForm && (
        <Card
          className="mb-6"
          title={
            editingId
              ? "Edit Advance"
              : "New Advance Payment"
          }
        >
          <form
            onSubmit={submit}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <Select
              label="Employee"
              required
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              options={[
                { value: "", label: "Select employee" },
                ...employees.map((e) => ({
                  value: e.id,
                  label: `${e.employeeCode} - ${e.name}`,
                })),
              ]}
            />
            <Input label="Amount (INR)" type="number" required min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Weekly advance" />
            {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
            <div className="md:col-span-2">
              <Button type="submit">
                {editingId
                  ? "Update Advance"
                  : "Save Advance"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <DataTable
        headers={[
          "Date",
          "Employee",
          "Amount",
          "Status",
          "Notes",
          "Actions",
        ]}
      >
        {advances.length === 0 ? (
          <EmptyRow colSpan={6} />
        ) : (
          advances.map((a) => (
            <tr key={a.id}>
              <td className="px-4 py-3">{formatDate(a.date)}</td>
              <td className="px-4 py-3 font-medium">{a.employee.name}</td>
              <td className="px-4 py-3 font-semibold">{formatCurrency(a.amount)}</td>
              <td className="px-4 py-3">
                <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
              </td>
              <td className="px-4 py-3 text-slate-500">{a.notes || "—"}</td>
              <td className="px-4 py-3">
                {a.status === "PENDING" ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => editAdvance(a)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteAdvance(a.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">
                    —
                  </span>
                )}
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </div>
  );
}
