import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="pl-56 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
