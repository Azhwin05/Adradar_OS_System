"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { Plus, X, Loader2 } from "lucide-react";
import { useTenants, useCreateTenant } from "@/hooks/useTenants";
import { StatusPill } from "@/components/shared/StatusPill";
import { formatDate } from "@/lib/utils";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  niche: z.string().optional(),
  plan: z.enum(["starter", "growth", "enterprise"]),
});
type CreateForm = z.infer<typeof createSchema>;

export default function TenantsPage() {
  const { data: tenants, isLoading } = useTenants();
  const createTenant = useCreateTenant();
  const [showModal, setShowModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { plan: "starter" },
  });

  const onSubmit = async (data: CreateForm) => {
    try {
      const niche = data.niche
        ? data.niche.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      await createTenant.mutateAsync({ name: data.name, slug: data.slug, niche, plan: data.plan });
      toast.success("Tenant created");
      reset();
      setShowModal(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create tenant");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-500 text-sm mt-1">Manage client accounts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Tenant
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !tenants?.length ? (
          <div className="p-12 text-center text-gray-400">
            No tenants yet. Create one to get started.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Slug</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Leads</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Last Batch</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <Link
                      href={`/admin/tenants/${t.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {t.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500 font-mono">{t.slug}</td>
                  <td className="px-6 py-3 text-sm text-gray-500 capitalize">{t.plan}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{t.total_leads}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {t.last_batch_date ? formatDate(t.last_batch_date) : "—"}
                  </td>
                  <td className="px-6 py-3">
                    {t.is_active ? (
                      <StatusPill status="published" />
                    ) : (
                      <StatusPill status="archived" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Create Tenant</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  {...register("name")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Facestagram Ltd"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  {...register("slug")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="robin"
                />
                {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niches <span className="text-gray-400">(comma separated)</span>
                </label>
                <input
                  {...register("niche")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="florist, gifting"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select
                  {...register("plan")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Tenant
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
