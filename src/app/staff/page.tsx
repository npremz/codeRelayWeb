import { StaffLoginScreen } from "@/components/staff-login-screen";

type StaffPageProps = {
  searchParams?: Promise<{
    role?: string;
    next?: string;
  }>;
};

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const resolvedParams = (await searchParams) ?? {};
  const preferredRole = resolvedParams.role === "judge" ? "judge" : "admin";
  const nextPath =
    resolvedParams.next && resolvedParams.next.startsWith("/")
      ? resolvedParams.next
      : preferredRole === "admin"
        ? "/admin"
        : "/judge";

  return <StaffLoginScreen preferredRole={preferredRole} nextPath={nextPath} />;
}
