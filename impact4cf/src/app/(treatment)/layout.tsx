// project imports
import TreatmentLayout from 'layout/MainLayout';
import AuthGuard from 'utils/route-guard/AuthGuard';

// ==============================|| DASHBOARD LAYOUT ||============================== //

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <TreatmentLayout>{children}</TreatmentLayout>
    </AuthGuard>
  );
}
