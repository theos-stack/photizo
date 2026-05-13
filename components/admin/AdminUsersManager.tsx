"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { FormInput } from "@/components/forms/FormInput";
import { FormSelect } from "@/components/forms/FormSelect";
import { adminUserCreateSchema } from "@/lib/schemas";
import type { AdminRole, AdminUser } from "@/lib/types";

type FormValues = z.input<typeof adminUserCreateSchema>;

function RoleUpdateForm({
  admin,
  disableRoleChange,
}: {
  admin: AdminUser;
  disableRoleChange?: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState<AdminRole>(admin.role);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const response = await fetch(`/api/admin/admin-users/${admin.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: admin.full_name || "",
        role,
      }),
    });

    setSaving(false);

    if (response.ok) {
      router.refresh();
    }
  }

  if (disableRoleChange || admin.is_bootstrap) {
    return (
      <div className="text-xs text-[rgba(11,11,11,0.55)]">
        Bootstrap super admin
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={(event) => setRole(event.target.value as AdminRole)}
        className="min-h-10 rounded-full border border-[rgba(72,108,38,0.14)] px-3 text-xs"
      >
        <option value="admin">admin</option>
        <option value="super_admin">super admin</option>
      </select>
      <Button type="button" size="sm" variant="ghost" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}

export function AdminUsersManager({
  admins,
  currentUserEmail,
}: {
  admins: AdminUser[];
  currentUserEmail: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"success" | "error">("success");
  const form = useForm<FormValues>({
    resolver: zodResolver(adminUserCreateSchema),
    defaultValues: {
      email: "",
      full_name: "",
      role: "admin",
      password: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setMessage("");
    const response = await fetch("/api/admin/admin-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();

    if (!response.ok) {
      setTone("error");
      setMessage(payload.error || "Unable to add this admin right now.");
      return;
    }

    setTone("success");
    setMessage(
      payload.createdAuthUser
        ? "Admin access created and login account provisioned successfully."
        : "Admin access saved successfully.",
    );
    form.reset();
    router.refresh();
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-[var(--honeydew)] p-3 text-[var(--dark-moss-green)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-2xl font-bold text-[var(--black)]">
              Admin access control
            </h3>
            <p className="max-w-3xl text-sm leading-7 text-[rgba(11,11,11,0.68)]">
              Super admins can create admins, promote trusted team members to
              super admin, and remove dashboard access when needed. Ordinary
              admins can manage the ministry platform, but they cannot change
              who has admin access.
            </p>
            <p className="text-xs uppercase tracking-[0.28em] text-[rgba(72,108,38,0.72)]">
              Current super admin session: {currentUserEmail}
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-5 rounded-[32px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft md:grid-cols-2"
      >
        <div className="md:col-span-2">
          <h3 className="font-display text-2xl font-bold text-[var(--black)]">
            Add or approve an admin
          </h3>
          <p className="mt-2 text-sm leading-7 text-[rgba(11,11,11,0.68)]">
            If the person already has a Supabase Auth login, just add their email
            here. If they do not, set a temporary password and the dashboard will
            create the login account too.
          </p>
        </div>
        <FormInput
          label="Admin email"
          placeholder="leader@photizonetwork.com"
          error={form.formState.errors.email?.message}
          {...form.register("email")}
        />
        <FormInput
          label="Full name"
          placeholder="Ministry Leader"
          error={form.formState.errors.full_name?.message}
          {...form.register("full_name")}
        />
        <FormSelect
          label="Role"
          error={form.formState.errors.role?.message}
          {...form.register("role")}
        >
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </FormSelect>
        <FormInput
          label="Temporary password"
          type="password"
          placeholder="Leave blank if the login already exists"
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        <div className="md:col-span-2 flex items-center gap-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save Admin Access"}
          </Button>
          {message ? (
            <p className={`text-sm ${tone === "success" ? "text-emerald-700" : "text-rose-600"}`}>
              {message}
            </p>
          ) : null}
        </div>
      </form>

      <DataTable
        columns={[
          { key: "email", label: "Admin" },
          { key: "role", label: "Role" },
          { key: "source", label: "Source" },
          { key: "actions", label: "Actions", className: "text-right" },
        ]}
        data={admins}
        emptyTitle="No admins found"
        emptyDescription="Once an admin is added, their access will appear here."
        renderRow={(admin) => {
          const isCurrentUser = admin.email.toLowerCase() === currentUserEmail.toLowerCase();
          const disableCriticalActions = admin.is_bootstrap || isCurrentUser;

          return (
            <tr key={admin.id} className="border-t border-[rgba(72,108,38,0.08)]">
              <td className="px-5 py-4 align-top">
                <div className="font-medium text-[var(--black)]">{admin.full_name || "Admin user"}</div>
                <div className="mt-1 text-sm text-[rgba(11,11,11,0.58)]">{admin.email}</div>
              </td>
              <td className="px-5 py-4 align-top">
                <StatusBadge status={admin.role} />
              </td>
              <td className="px-5 py-4 align-top text-sm text-[rgba(11,11,11,0.6)]">
                {admin.is_bootstrap ? "Bootstrap super admin" : "Dashboard-managed"}
              </td>
              <td className="px-5 py-4 align-top">
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <RoleUpdateForm
                    admin={admin}
                    disableRoleChange={disableCriticalActions}
                  />
                  {!disableCriticalActions ? (
                    <ConfirmDeleteButton
                      endpoint={`/api/admin/admin-users/${admin.id}`}
                      label="Remove"
                      confirmMessage={`Remove admin access for ${admin.email}?`}
                    />
                  ) : (
                    <div className="text-xs text-[rgba(11,11,11,0.55)]">
                      {isCurrentUser ? "Current session" : "Protected"}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          );
        }}
      />
    </section>
  );
}
