import { BatchUploadForm } from "@/components/admin/BatchUploadForm";

export default function NewBatchPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upload New Batch</h1>
        <p className="text-gray-500 text-sm mt-1">CSV upload with scoring and AI email generation</p>
      </div>
      <BatchUploadForm />
    </div>
  );
}
