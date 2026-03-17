import { JudgeScreen } from "@/components/judge-screen";
import { requireStaffRole } from "@/lib/staff-auth";

export default async function JudgePage() {
  const session = await requireStaffRole("judge");
  return <JudgeScreen staffRole={session.role} />;
}
