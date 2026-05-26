"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, EmptyRow } from "@/components/layout/DataTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";

interface Settlement {
  contractAmount: number;
  totalReceived: number;
  balanceDue: number;
}

interface Project {
  id: string;
  projectCode: string;
  name: string;
  builderName: string;
  contractAmount: number;
  status: string;
  settlement: Settlement;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    projectCode: "",
    name: "",
    siteAddress: "",
    builderName: "",
    builderPhone: "",
    contractAmount: "",
    status: "ACTIVE",
  });

  const load = () => apiFetch<Project[]>("/api/projects").then(setProjects);

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch("/api/projects", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        contractAmount: parseFloat(form.contractAmount) || 0,
      }),
    });
    setShowForm(false);
    load();
  };

  const updateProjectStatus = async (
    id: string,
    status: string
  ) => {
    try {
      await apiFetch(`/api/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      load();
    } catch (err) {
      alert("Failed to update project status");
    }
  };

  const statusColor = (s: string) => {
    if (s === "ACTIVE") return "success";
    if (s === "COMPLETED") return "info";
    if (s === "ON_HOLD") return "warning";
    return "default";
  };

  return (
    <div>
      <PageHeader
        title="Projects / Sites"
        description="Track construction sites, builder contracts, and payment settlement"
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" /> Add Project
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6" title="New Project">
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Input label="Project Code" required value={form.projectCode} onChange={(e) => setForm({ ...form, projectCode: e.target.value })} />
            <Input label="Project Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Site Address" value={form.siteAddress} onChange={(e) => setForm({ ...form, siteAddress: e.target.value })} />
            <Input label="Builder Name" required value={form.builderName} onChange={(e) => setForm({ ...form, builderName: e.target.value })} />
            <Input label="Builder Phone" value={form.builderPhone} onChange={(e) => setForm({ ...form, builderPhone: e.target.value })} />
            <Input label="Contract Amount (INR)" type="number" value={form.contractAmount} onChange={(e) => setForm({ ...form, contractAmount: e.target.value })} />
            <Button type="submit" className="sm:col-span-2">Save Project</Button>
          </form>
        </Card>
      )}

      <DataTable
        headers={["Code", "Project", "Builder", "Contract", "Received", "Balance Due", "Status", ""]}
      >
        {projects.length === 0 ? (
          <EmptyRow colSpan={8} />
        ) : (
          projects.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3 font-mono text-xs">{p.projectCode}</td>
              <td className="px-4 py-3 font-medium">{p.name}</td>
              <td className="px-4 py-3">{p.builderName}</td>
              <td className="px-4 py-3">{formatCurrency(p.contractAmount)}</td>
              <td className="px-4 py-3 text-emerald-700">{formatCurrency(p.settlement.totalReceived)}</td>
              <td className="px-4 py-3 font-semibold text-red-700">{formatCurrency(p.settlement.balanceDue)}</td>
              <td className="px-4 py-3">
                <Badge variant={statusColor(p.status)}>{p.status}</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-3 text-xs">

                  <button
                    onClick={() =>
                      updateProjectStatus(p.id, "COMPLETED")
                    }
                    className="text-emerald-600 hover:underline"
                  >
                    Complete
                  </button>

                  <button
                    onClick={() =>
                      updateProjectStatus(p.id, "ON_HOLD")
                    }
                    className="text-yellow-600 hover:underline"
                  >
                    Hold
                  </button>

                  <button
                    onClick={() =>
                      updateProjectStatus(p.id, "ACTIVE")
                    }
                    className="text-blue-600 hover:underline"
                  >
                    Activate
                  </button>

                  <Link
                    href={`/projects/${p.id}`}
                    className="text-brand-600 hover:underline"
                  >
                    Details →
                  </Link>

                </div>
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </div>
  );
}
