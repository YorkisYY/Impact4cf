import MainLayout from '@/layout/MainLayout';
import AuthGuard from 'utils/route-guard/AuthGuard';

// ==============================|| USERS LIST LAYOUT||============================== //


//remember to put authguard back
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <MainLayout>{children}</MainLayout>
    </AuthGuard>
  );
}
