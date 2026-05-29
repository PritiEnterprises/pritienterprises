"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { apiFetch } from "@/lib/api";
import { toDateInputValue } from "@/lib/utils";
import { Save } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

interface Employee {
  id: string;
  name: string;
  employeeCode: string;
  dailyWage: number;
}

interface Project {
  id: string;
  name: string;
  projectCode: string;
}

type DayType = "FULL_DAY" | "HALF_DAY" | "ABSENT" | "";

interface Entry {
  employeeId: string;
  dayType: DayType;
  overtimeHours: number;
}

export default function AttendancePage() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [projectId, setProjectId] = useState("");
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<Employee[]>("/api/employees?active=true"),
      apiFetch<Project[]>("/api/projects"),
    ]).then(([emps, projs]) => {
      setEmployees(emps);
      setProjects(projs.filter((p: Project & { status?: string }) => !p.status || p.status === "ACTIVE"));
      const active = projs.find((p: Project & { status?: string }) => p.status === "ACTIVE");
      if (active) setProjectId(active.id);
      const init: Record<string, Entry> = {};
      emps.forEach((e) => {
        init[e.id] = { employeeId: e.id, dayType: "", overtimeHours: 0 };
      });
      setEntries(init);
    });
  }, []);

  useEffect(() => {
    if (!date) return;
    apiFetch<Array<{ employeeId: string; dayType: DayType; overtimeHours: number }>>(
      `/api/attendance?date=${date}`
    ).then((records) => {
      setIsLocked(records.length > 0);
      setEntries(() => {

        const next: Record<string, Entry> = {};

        employees.forEach((e) => {
          next[e.id] = {
            employeeId: e.id,
            dayType: "",
            overtimeHours: 0,
          };
        });

        records.forEach((r) => {
          next[r.employeeId] = {
            employeeId: r.employeeId,
            dayType: r.dayType,
            overtimeHours: r.overtimeHours,
          };
        });

        return next;
      });
    });
  }, [date, employees.length]);

  const saveAll = async () => {

    const unmarked = Object.values(entries).filter(
      (e) => e.dayType === ""
    );

    if (unmarked.length > 0) {
      alert(
        `Please mark attendance for all ${unmarked.length} pending employees.`
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const payload = {
        date,
        projectId: projectId || null,
        entries: Object.values(entries),
      };
      if (payload.entries.length === 0) {
        payload.entries = Object.values(entries);
      }
      const res = await apiFetch<{ count: number }>("/api/attendance/bulk", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage(`Saved attendance for ${res.count} employees.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const setEntry = (id: string, patch: Partial<Entry>) => {
    setEntries((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  return (
    <div>
      <PageHeader
        title={t("dailyAttendance")}
        description={t("attendanceDesc")}
        action={
          <Button
            onClick={saveAll}
            disabled={saving || isLocked}
          >
            <Save className="h-4 w-4" />
            {saving ? t("saving") : t("saveAll")}
          </Button>
        }
      />

      {isLocked && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Attendance for this date has already been saved and is locked.
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      <Card className="mb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t("date")}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <Select
            label={t("projectSite")}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            options={[
              { value: "", label: t("noProject") },
              ...projects.map((p) => ({ value: p.id, label: `${p.projectCode} - ${p.name}` })),
            ]}
          />
        </div>
      </Card>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">{t("employees")}</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">{t("date")}</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">{t("otHrs")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((emp) => {
              const entry = entries[emp.id] || {
                employeeId: emp.id,
                dayType: "" as DayType,
                overtimeHours: 0,
              };
              return (
                <tr key={emp.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{emp.name}</p>
                    <p className="text-xs text-slate-500">{emp.employeeCode}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {(["FULL_DAY", "HALF_DAY", "ABSENT"] as DayType[]).map((dt) => (
                        <button
                          key={dt}
                          type="button"
                          disabled={isLocked}
                          onClick={() => setEntry(emp.id, { dayType: dt })}
                          className={`rounded px-2 py-1 text-xs font-medium ${entry.dayType === dt
                            ? dt === "ABSENT"
                              ? "bg-red-100 text-red-800"
                              : "bg-brand-100 text-brand-800"
                            : "bg-slate-100 text-slate-600"
                            }`}
                        >
                          {dt === "FULL_DAY" ? t("fullDay") : dt === "HALF_DAY" ? t("halfDay") : t("off")}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      disabled={isLocked}
                      min="0"
                      step="0.5"
                      value={entry.overtimeHours === 0 ? "" : entry.overtimeHours}
                      onChange={(e) =>
                        setEntry(emp.id, { overtimeHours: parseFloat(e.target.value) || 0 })
                      }
                      className="w-20 rounded border border-slate-200 px-2 py-1"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
