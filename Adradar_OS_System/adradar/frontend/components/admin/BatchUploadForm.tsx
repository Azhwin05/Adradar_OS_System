"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, Upload, Loader2, AlertTriangle, ChevronRight } from "lucide-react";
import { useTenants } from "@/hooks/useTenants";
import { useUploadBatch, usePublishBatch } from "@/hooks/useBatches";
import type { Batch } from "@/types";

// ─── Step 1 schema ────────────────────────────────────────────────────────────
const step1Schema = z.object({
  tenant_id: z.string().min(1, "Select a tenant"),
  label: z.string().min(1, "Label is required"),
  niche: z.string().min(1, "Niche is required"),
  expected_count: z.number().optional(),
});
type Step1Form = z.infer<typeof step1Schema>;

// ─── Lead fields for column mapping ──────────────────────────────────────────
const LEAD_FIELDS = [
  { key: "company_name", label: "Company Name", required: true },
  { key: "contact_email", label: "Contact Email", required: false },
  { key: "contact_linkedin", label: "LinkedIn URL", required: false },
  { key: "contact_name", label: "Contact Name", required: false },
  { key: "contact_title", label: "Contact Title", required: false },
  { key: "contact_phone", label: "Phone", required: false },
  { key: "website", label: "Website", required: false },
  { key: "industry", label: "Industry", required: false },
  { key: "niche", label: "Niche", required: false },
  { key: "ad_spend_signal", label: "Ad Spend Signal", required: false },
  { key: "role_bucket", label: "Role Bucket", required: false },
];

type Step = 1 | 2 | 3 | 4 | 5;

export function BatchUploadForm() {
  const [step, setStep] = useState<Step>(1);
  const [step1Data, setStep1Data] = useState<Step1Form | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedBatch, setUploadedBatch] = useState<Batch | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: tenants } = useTenants();
  const uploadBatch = useUploadBatch();
  const publishBatch = usePublishBatch();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: { label: `Batch ${new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}` },
  });

  const onStep1Submit = (data: Step1Form) => {
    setStep1Data(data);
    setStep(2);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields ?? [];
        setCsvHeaders(headers);
        setCsvRows(result.data as Record<string, string>[]);
        // Auto-map by exact match
        const autoMap: Record<string, string> = {};
        LEAD_FIELDS.forEach(({ key }) => {
          if (headers.includes(key)) autoMap[key] = key;
        });
        setColumnMapping(autoMap);
        setStep(3);
      },
    });
  };

  const preview = csvRows.slice(0, 10).map((row) => {
    const mapped: Record<string, string> = {};
    Object.entries(columnMapping).forEach(([leadField, csvCol]) => {
      if (csvCol) mapped[leadField] = row[csvCol] ?? "";
    });
    return mapped;
  });

  const validRows = csvRows.filter((row) => {
    const mapped = Object.fromEntries(
      Object.entries(columnMapping).map(([k, v]) => [k, row[v] ?? ""])
    );
    return (
      mapped["company_name"]?.trim() &&
      (mapped["contact_email"]?.trim() || mapped["contact_linkedin"]?.trim())
    );
  });

  const handleUpload = async () => {
    if (!step1Data || !selectedFile) return;
    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("tenant_id", step1Data.tenant_id);
    fd.append("label", step1Data.label);
    fd.append("niche", step1Data.niche);
    if (step1Data.expected_count) fd.append("expected_count", String(step1Data.expected_count));

    try {
      const batch = await uploadBatch.mutateAsync(fd);
      setUploadedBatch(batch);
      setStep(5);
      toast.success("Batch uploaded! AI emails generating in background…");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const handlePublish = async () => {
    if (!uploadedBatch) return;
    try {
      await publishBatch.mutateAsync(uploadedBatch.id);
      toast.success("Batch published to client dashboard");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Publish failed");
    }
  };

  // ─── Step indicators ──────────────────────────────────────────────────────
  const steps = [
    { n: 1, label: "Metadata" },
    { n: 2, label: "Upload CSV" },
    { n: 3, label: "Map Columns" },
    { n: 4, label: "Preview" },
    { n: 5, label: "Confirm" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step bar */}
      <div className="flex items-center mb-8 gap-0">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border-2 transition-colors
              ${step > s.n ? "bg-green-500 border-green-500 text-white" : step === s.n ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-300 text-gray-400"}`}
            >
              {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
            </div>
            <span className={`ml-1.5 text-xs font-medium hidden sm:block ${step === s.n ? "text-blue-600" : "text-gray-400"}`}>{s.label}</span>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      {/* ─── Step 1 ─────────────────────────────────────────────────────── */}
      {step === 1 && (
        <form onSubmit={handleSubmit(onStep1Submit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Batch Metadata</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
            <select {...register("tenant_id")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select tenant…</option>
              {tenants?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {errors.tenant_id && <p className="text-red-500 text-xs mt-1">{errors.tenant_id.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Niche</label>
            <input {...register("niche")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Florist/Gifting" />
            {errors.niche && <p className="text-red-500 text-xs mt-1">{errors.niche.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch Label</label>
            <input {...register("label")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.label && <p className="text-red-500 text-xs mt-1">{errors.label.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Count <span className="text-gray-400">(optional)</span></label>
            <input {...register("expected_count", { valueAsNumber: true })} type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="50" />
          </div>

          <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* ─── Step 2 ─────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV</h2>
          <p className="text-sm text-gray-500 mb-4">
            Required: <code className="bg-gray-100 px-1 rounded">company_name</code> + at least one of <code className="bg-gray-100 px-1 rounded">contact_email</code> or <code className="bg-gray-100 px-1 rounded">contact_linkedin</code>
          </p>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-10 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">Click to select CSV file</span>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
          </label>
          <button onClick={() => setStep(1)} className="mt-4 text-sm text-gray-500 hover:text-gray-700">← Back</button>
        </div>
      )}

      {/* ─── Step 3 ─────────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Map Columns</h2>
          <p className="text-sm text-gray-500 mb-4">{csvHeaders.length} columns detected in CSV</p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {LEAD_FIELDS.map(({ key, label, required }) => (
              <div key={key} className="flex items-center gap-3">
                <div className="w-44 text-sm text-gray-700 flex items-center gap-1">
                  {label}
                  {required && <span className="text-red-500 text-xs">*</span>}
                </div>
                <select
                  value={columnMapping[key] ?? ""}
                  onChange={(e) => setColumnMapping((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— skip —</option>
                  {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">← Back</button>
            <button onClick={() => setStep(4)} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
              Preview <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 4 ─────────────────────────────────────────────────────── */}
      {step === 4 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Validation Preview</h2>
          <div className="flex gap-4 mb-4 text-sm">
            <span className="text-gray-500">Total rows: <strong>{csvRows.length}</strong></span>
            <span className="text-green-600">Valid: <strong>{validRows.length}</strong></span>
            <span className="text-red-500">Invalid: <strong>{csvRows.length - validRows.length}</strong></span>
          </div>
          {validRows.length === 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              No valid rows — check your column mapping.
            </div>
          )}
          <div className="overflow-x-auto max-h-72 border border-gray-100 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {["company_name", "contact_name", "contact_email", "contact_title", "niche"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-gray-500 font-medium">{h}</th>
                  ))}
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">valid?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {preview.map((row, i) => {
                  const isValid = !!row.company_name && (!!row.contact_email || !!row.contact_linkedin);
                  return (
                    <tr key={i} className={isValid ? "" : "bg-red-50"}>
                      {["company_name", "contact_name", "contact_email", "contact_title", "niche"].map((k) => (
                        <td key={k} className="px-3 py-1.5 text-gray-700">{row[k] || <span className="text-gray-300">—</span>}</td>
                      ))}
                      <td className="px-3 py-1.5">{isValid ? "✅" : "❌"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setStep(3)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">← Back</button>
            <button
              onClick={handleUpload}
              disabled={validRows.length === 0 || uploadBatch.isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {uploadBatch.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload {validRows.length} leads
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 5 ─────────────────────────────────────────────────────── */}
      {step === 5 && uploadedBatch && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Batch Uploaded!</h2>
          <p className="text-gray-500 text-sm mb-1">
            <strong>{uploadedBatch.lead_count}</strong> leads saved. AI email generation running in the background.
          </p>
          <p className="text-gray-400 text-xs mb-6">Batch ID: {uploadedBatch.id}</p>

          {uploadedBatch.status === "draft" ? (
            <button
              onClick={handlePublish}
              disabled={publishBatch.isPending}
              className="flex items-center justify-center gap-2 mx-auto bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60"
            >
              {publishBatch.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Publish Batch to Client
            </button>
          ) : (
            <p className="text-green-600 font-medium text-sm">Batch is live on client dashboard</p>
          )}
        </div>
      )}
    </div>
  );
}
