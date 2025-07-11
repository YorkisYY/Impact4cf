import MainLayout from '@/layout/MainLayout';
import AuthGuard from 'utils/route-guard/AuthGuard';

// ==============================|| USER INFO LAYOUT||============================== //



export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <MainLayout>{children}</MainLayout>
    </AuthGuard>
  );
}
