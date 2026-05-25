"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n/context";
import { apiFetch } from "@/lib/api";

export default function SettingsPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (form.newPassword.length < 6) {
      setError(t("passwordMin"));
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }
    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      setMessage(t("passwordChanged"));
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div>
      <PageHeader title={t("settingsTitle")} description={t("settingsDesc")} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t("language")}>
          <LanguageSwitcher />
        </Card>

        <Card title={t("changePassword")}>
          <form onSubmit={changePassword} className="space-y-4">
            <Input
              label={t("currentPassword")}
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              required
            />
            <Input
              label={t("newPassword")}
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              required
            />
            <Input
              label={t("confirmPassword")}
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-emerald-600">{message}</p>}
            <Button type="submit">{t("save")}</Button>
          </form>
        </Card>
      </div>

      <Card className="mt-6" title="Backup">
        <p className="text-sm text-slate-600">{t("backupTip")}</p>
      </Card>
    </div>
  );
}
