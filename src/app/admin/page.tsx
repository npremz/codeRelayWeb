import { AdminScreen } from "@/components/admin-screen";
import { requireStaffRole } from "@/lib/staff-auth";

export default async function AdminPage() {
  const session = await requireStaffRole("admin");
  return <AdminScreen staffRole={session.role} />;
}
