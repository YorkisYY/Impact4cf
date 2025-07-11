'use client';

// next
// import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { useEffect, useState } from 'react';

// material-ui
import { Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

// project imports
import AuthWrapper1 from './AuthWrapper1';
import AuthCardWrapper from './AuthCardWrapper';
// import LoginProvider from './LoginProvider';
import ViewOnlyAlert from './ViewOnlyAlert';

import AuthFooter from 'ui-component/cards/AuthFooter';

import useAuth from 'hooks/useAuth';
import { APP_AUTH } from 'config';

// Possible auth types
type AuthType = 'firebase' | 'jwt' | 'aws' | 'auth0' | 'supabase';

// A mapping of auth types to dynamic imports
const authLoginImports: Record<AuthType, () => Promise<any>> = {
  firebase: () => import('./firebase/AuthLogin'),
  jwt: () => import('./jwt/AuthLogin'),
  aws: () => import('./aws/AuthLogin'),
  auth0: () => import('./auth0/AuthLogin'),
  supabase: () => import('./supabase/AuthLogin')
};

// ================================|| AUTH3 - LOGIN ||================================ //

export default function Login() {
  const { isLoggedIn } = useAuth();
  const downMD = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
  const [AuthLoginComponent, setAuthLoginComponent] = useState<React.ComponentType | null>(null);

  const searchParams = useSearchParams();
  const authParam = (searchParams.get('auth') as AuthType | null) || '';

  useEffect(() => {
    const selectedAuth = authParam || (APP_AUTH as AuthType);

    const importAuthLoginComponent = authLoginImports[selectedAuth];

    importAuthLoginComponent()
      .then((module) => setAuthLoginComponent(() => module.default))
      .catch((error) => {
        console.error(`Error loading ${selectedAuth} AuthLogin`, error);
      });
  }, [authParam]);

  return (
    <AuthWrapper1>
      <Grid container direction="column" sx={{ justifyContent: 'flex-end', minHeight: '100vh' }}>
        <Grid size={12}>
          <Grid container sx={{ justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 68px)' }}>
            <Grid sx={{ m: { xs: 1, sm: 3 }, mb: 0 }}>
              {!isLoggedIn && <ViewOnlyAlert />}
              <AuthCardWrapper>
                <Grid container spacing={2} sx={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Grid sx={{ mb: 0 }}>
                    <Link href="#" aria-label="logo" sx={{ textDecoration: 'none' }}>
                      <Typography gutterBottom variant="h1" sx={{ color: 'secondary.main', textDecoration: 'none' }}>
                        ImpACT4CF
                      </Typography>
                    </Link>
                  </Grid>
                  <Grid size={12}>
                    <Grid container direction={{ xs: 'column-reverse', md: 'row' }} sx={{ alignItems: 'center', justifyContent: 'center' }}>
                      <Grid>
                        <Stack spacing={1} sx={{ alignItems: 'center', justifyContent: 'center' }}>
                          <Typography gutterBottom variant={downMD ? 'h3' : 'h2'} sx={{ color: 'secondary.main' }}>
                            Hi, Welcome Back
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '16px', textAlign: { xs: 'center', md: 'inherit' } }}>
                            Enter your credentials to continue
                          </Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid size={12}>{AuthLoginComponent && <AuthLoginComponent />}</Grid>
                  <Grid size={12}>
                    <Divider />
                  </Grid>
                </Grid>
              </AuthCardWrapper>
              {!isLoggedIn && (
                <Box
                  sx={{
                    maxWidth: { xs: 400, lg: 475 },
                    margin: { xs: 2.5, md: 3 },
                    '& > *': {
                      flexGrow: 1,
                      flexBasis: '50%'
                    }
                  }}
                ></Box>
              )}
            </Grid>
          </Grid>
        </Grid>
        <Grid sx={{ px: 3, my: 3 }} size={12}>
          <AuthFooter />
        </Grid>
      </Grid>
    </AuthWrapper1>
  );
}
