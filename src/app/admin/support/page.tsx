import SingleLeadSupport from "@/components/SingleLeadSupport";
import AdminLayout from "@/components/AdminLayout";
import { AdminIcons } from '@/lib/admin-icons';
import AdminPageTitle from '@/components/AdminPageTitle';

export default function SupportPage() {
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminPageTitle 
          icon={AdminIcons.Support}
          title="Support"
        />
        <SingleLeadSupport />
      </div>
    </AdminLayout>
  );
} 