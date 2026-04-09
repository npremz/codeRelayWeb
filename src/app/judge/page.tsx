import { JudgeScreen } from "@/components/judge-screen";
import { requireStaffRole } from "@/lib/staff-auth";

type JudgePageProps = {
  searchParams?: Promise<{
    team?: string;
  }>;
};

export default async function JudgePage({ searchParams }: JudgePageProps) {
  const session = await requireStaffRole("judge");
  const resolvedParams = (await searchParams) ?? {};
  const initialTeamCode = resolvedParams.team?.trim().toUpperCase() || null;

  return <JudgeScreen initialTeamCode={initialTeamCode} staffRole={session.role} />;
}
