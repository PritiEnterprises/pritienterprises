"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, EmptyRow } from "@/components/layout/DataTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Plus, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  phone: string | null;
  role: string;
  dailyWage: number;
  overtimeRate: number;
  isActive: boolean;
}

const emptyForm = {
  employeeCode: "",
  name: "",
  phone: "",
  role: "Mason",
  dailyWage: "",
  overtimeRate: "",
};

export default function EmployeesPage() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch<Employee[]>("/api/employees")
      .then(setEmployees)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await apiFetch("/api/employees", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          dailyWage: parseFloat(form.dailyWage),
          overtimeRate: parseFloat(form.overtimeRate) || 0,
        }),
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  const deactivate = async (id: string) => {
    if (!confirm(t("confirmDeactivate"))) return;
    await apiFetch(`/api/employees/${id}`, { method: "DELETE" });
    load();
  };

  const reactivate = async (id: string) => {
    await apiFetch(`/api/employees/${id}`, { method: "PUT" });
    load();
  };

  const deleteEmployee = async (id: string) => {
    const confirmed = confirm(
      "Permanently delete this employee? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      await apiFetch(`/api/employees/${id}/permanent`, {
        method: "DELETE",
      });

      load();
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert(
          "Cannot delete employee with existing records. Deactivate instead."
        );
      }
    }
  };

  const visible = showInactive ? employees : employees.filter((e) => e.isActive);

  return (
    <div>
      <PageHeader
        title={t("employees")}
        description={t("employeesDesc")}
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? t("cancel") : t("addEmployee")}
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <p className="mb-4 text-sm text-slate-500">{t("deactivateNote")}</p>
      <label className="mb-4 flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={showInactive}
          onChange={(e) => setShowInactive(e.target.checked)}
          className="rounded border-slate-300"
        />
        {t("showInactive")}
      </label>

      {showForm && (
        <Card className="mb-6" title={t("addEmployee")}>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label={t("employeeCode")} name="employeeCode" required value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} placeholder="EMP005" />
            <Input label={t("fullName")} name="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label={t("phone")} name="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label={t("role")} name="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            <Input label={t("dailyWage")} name="dailyWage" type="number" required min="1" value={form.dailyWage} onChange={(e) => setForm({ ...form, dailyWage: e.target.value })} />
            <Input label={t("overtimeRate")} name="overtimeRate" type="number" min="0" value={form.overtimeRate} onChange={(e) => setForm({ ...form, overtimeRate: e.target.value })} placeholder={t("otAuto")} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit">{t("saveEmployee")}</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-slate-500">{t("loading")}</p>
      ) : (
        <DataTable headers={[t("employeeCode"), t("fullName"), t("role"), t("dailyWage"), t("overtimeRate"), t("status"), t("actions")]}>
          {visible.length === 0 ? (
            <EmptyRow colSpan={7} />
          ) : (
            visible.map((emp) => (
              <tr key={emp.id} className="transition hover:bg-brand-50/40">
                <td className="px-4 py-3 font-mono text-xs">{emp.employeeCode}</td>
                <td className="px-4 py-3 font-medium">{emp.name}</td>
                <td className="px-4 py-3">{emp.role}</td>
                <td className="px-4 py-3">{formatCurrency(emp.dailyWage)}</td>
                <td className="px-4 py-3">
                  {emp.overtimeRate > 0 ? formatCurrency(emp.overtimeRate) : "Auto"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={emp.isActive ? "success" : "default"}>
                    {emp.isActive ? t("active") : t("inactive")}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {emp.isActive ? (
                      <button
                        onClick={() => deactivate(emp.id)}
                        className="text-xs text-yellow-600 hover:underline"
                      >
                        {t("deactivate")}
                      </button>
                    ) : (
                      <button
                        onClick={() => reactivate(emp.id)}
                        className="text-xs text-emerald-600 hover:underline"
                      >
                        {t("reactivate")}
                      </button>
                    )}

                    <button
                      onClick={() => deleteEmployee(emp.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </DataTable>
      )}
    </div>
  );
}
