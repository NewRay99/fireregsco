import SalesManagement from "@/components/SalesManagement";
import AdminLayout from "@/components/AdminLayout";

export default function SalesPage() {
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Sales Management</h1>
        <SalesManagement />
      </div>
    </AdminLayout>
  );
} 