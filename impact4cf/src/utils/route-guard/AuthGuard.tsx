'use client';

import { useRouter } from 'next/navigation';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

// project imports
import useAuth from 'hooks/useAuth';
import Loader from 'ui-component/Loader';

// types
import { GuardProps } from 'types';

// ==============================|| AUTH GUARD ||============================== //

/**
 * Authentication guard for routes
 * @param {PropTypes.node} children children element/node
 */
export default function AuthGuard({ children }: GuardProps) {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoggedIn) {
      // Don't redirect if already on login page to prevent loops
      if (pathname.startsWith('/login')) {
        return;
      }
      
      // Store current path before redirecting
      const currentPath = window.location.pathname + window.location.search;
      // Save to localStorage (more reliable than query params for complex paths)
      localStorage.setItem('auth_redirect', currentPath);
      router.replace('/login');
    } else {
      // We are logged in - check if we need to redirect back to saved path
      
      // Handle direct login page access - redirect to saved path or default
      if (pathname.startsWith('/login')) {
        // Priority: 
        // 1. URL redirect param
        // 2. localStorage saved path
        // 3. Default dashboard
        
        const redirectParam = searchParams.get('redirect');
        const savedRedirect = localStorage.getItem('auth_redirect');
        
        if (redirectParam) {
          router.replace(decodeURIComponent(redirectParam));
        } else if (savedRedirect && savedRedirect !== '/login') {
          localStorage.removeItem('auth_redirect');
          router.replace(savedRedirect);
        } else {
          router.replace('/dashboard/default');
        }
      }
    }
  }, [isLoggedIn, router, pathname, searchParams]);

  if (!isLoggedIn) return <Loader />;

  return children;
}