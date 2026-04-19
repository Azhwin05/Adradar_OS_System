"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTenant, useTenantUsers, useCreateUser } from "@/hooks/useTenants";
import { useBatches } from "@/hooks/useBatches";
import { StatusPill } from "@/components/shared/StatusPill";
import { formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Min 6 characters"),
});
type UserForm = z.infer<typeof userSchema>;

export default function TenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { data: tenant, isLoading } = useTenant(tenantId);
  const { data: users } = useTenantUsers(tenantId);
  const { data: batches } = useBatches({ tenant_id: tenantId });
  const createUser = useCreateUser();
  const [showModal, setShowModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserForm>({ resolver: zodResolver(userSchema) });

  const onCreateUser = async (data: UserForm) => {
    try {
      await createUser.mutateAsync({
        ...data,
        role: "client",
        tenant_id: tenantId,
      });
      toast.success("Client login created");
      reset();
      setShowModal(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create user");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!tenant) return <p className="text-gray-500">Tenant not found.</p>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/tenants" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
          <p className="text-gray-400 text-sm font-mono">slug: {tenant.slug} · {tenant.plan}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Leads</p>
          <p className="text-2xl font-bold mt-1">{tenant.total_leads}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Published Batches</p>
          <p className="text-2xl font-bold mt-1">{tenant.published_batches}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Niches</p>
          <p className="text-sm font-medium mt-1">{tenant.niche.join(", ") || "—"}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Last Batch</p>
          <p className="text-sm font-medium mt-1">{tenant.last_batch_date ? formatDate(tenant.last_batch_date) : "—"}</p>
        </div>
      </div>

      {/* Batches */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Batches</h2>
          <Link href="/admin/batches/new" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Upload new
          </Link>
        </div>
        {!batches?.length ? (
          <div className="p-8 text-center text-gray-400">No batches yet.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase">
                <th className="px-6 py-3">Label</th>
                <th className="px-6 py-3">Niche</th>
                <th className="px-6 py-3">Leads</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{b.label}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{b.niche}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{b.lead_count}</td>
                  <td className="px-6 py-3"><StatusPill status={b.status} /></td>
                  <td className="px-6 py-3 text-sm text-gray-400">{formatDate(b.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Users */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Client Logins</h2>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Create login
          </button>
        </div>
        {!users?.length ? (
          <div className="p-8 text-center text-gray-400">No client users yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map((u) => (
              <div key={u.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.name || u.email}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <StatusPill status={u.is_active ? "ready" : "archived"} />
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Create Client Login</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit(onCreateUser)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input {...register("name")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input {...register("email")} type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input {...register("password")} type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Login
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
