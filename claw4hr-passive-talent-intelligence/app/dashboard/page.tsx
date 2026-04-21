import AuthGuard from "@/app/components/AuthGuard";
import Dashboard from "@/app/components/Dashboard";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}
