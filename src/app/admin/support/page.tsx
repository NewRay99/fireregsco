import SupportTicketsManagement from "@/components/SupportTicketsManagement";
import AdminLayout from "@/components/AdminLayout";

export default function SupportPage() {
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold pb-6">Support Tickets Management</h1>
        <SupportTicketsManagement />
      </div>
    </AdminLayout>
  );
} 