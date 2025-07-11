'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import useAuth from 'hooks/useAuth';
import { DASHBOARD_PATH } from 'config';
import Loader from 'ui-component/Loader';
import type { GuardProps } from 'types';

export default function GuestGuard({ children }: GuardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, logout } = useAuth();

  const shouldLogout = searchParams.get('logout') === 'true';
  const [hasLoggedOut, setHasLoggedOut] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  console.log(`GuestGuard-> isLoggedIn: ${isLoggedIn}`)

  // Handle ?logout=true
  useEffect(() => {
    const run = async () => {
      if (shouldLogout && isLoggedIn && !hasLoggedOut) {
        console.log('Running logout...');
        await logout();
        setHasLoggedOut(true);
        router.replace('/login');
      }
    };

    run();
  }, [shouldLogout, isLoggedIn, hasLoggedOut, logout, router]);

  // Redirect if user is already logged in (and not logging out)
  useEffect(() => {
    if (isLoggedIn && !shouldLogout) {
      console.log('Redirecting to dashboard...');
      setRedirecting(true);
      router.replace(DASHBOARD_PATH);
    }
  }, [isLoggedIn, shouldLogout, router]);

  if ((shouldLogout && isLoggedIn && !hasLoggedOut) || (isLoggedIn && !shouldLogout && redirecting)) {
    return <Loader />;
  }

  return children;
}
