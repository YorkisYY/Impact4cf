// project import
import GuestGuard from '@/utils/route-guard/GuestGuard';
import Login from '@/views/pages/authentication/Login';
import MinimalLayout from 'layout/MinimalLayout';


// ==============================|| HOME PAGE ||============================== //

export default function HomePage() {
  return (
    <MinimalLayout>
      <GuestGuard>
        <Login />
      </GuestGuard>
    </MinimalLayout>
  );
}
