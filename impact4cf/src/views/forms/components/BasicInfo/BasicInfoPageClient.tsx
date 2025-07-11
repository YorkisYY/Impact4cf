// src/app/(basic-info)/users/[userId]/basicinfo/BasicInfoPageClient.tsx
'use client';

import { useTheme, Container, Box, Card, Typography } from '@mui/material';
import CustomBreadcrumbs from '@/views/forms/components/Prescription/CustomBreadcrumbs'; 
import MainCard from 'ui-component/cards/MainCard'
import BasicInfoForm from './BasicInfoForm';
interface BasicInfoPageClientProps {
  userData: any;
}

export default function BasicInfoPageClient({ userData }: BasicInfoPageClientProps) {
  const theme = useTheme();



  const targetUid = userData.uid;


  const breadcrumbLinks = [
    { title: 'Users', to: '/' },
    { title: userData.name || 'Unnamed User', to: `/${targetUid}/all` },
    { title: 'Basic Information' }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          bgcolor: theme.palette.background.paper,
          pt: 0.3,
          pb: 0.3,
          px: 2,
          borderRadius: 1,
          borderColor: theme.palette.divider,
          mt: -2,
          height: '46px',
        }}
      >
        <CustomBreadcrumbs
          custom={true}
          titleBottom
          card={false}
          sx={{ mb: '0px !important' }}
          links={breadcrumbLinks}
        />
      </Box>


      <MainCard title="Basic Information" content={false}>
        <Box sx={{ p: 0 }}>
          <BasicInfoForm userId={targetUid} userData={userData} />
        </Box>
      </MainCard>
    </Container>
  );
}
