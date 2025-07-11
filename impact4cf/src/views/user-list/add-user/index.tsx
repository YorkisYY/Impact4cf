'use client';

import { usePathname } from 'next/navigation';
import AddUserForm from '@/views/user-list/components/AddUserForm';
import CustomBreadcrumbs from '@/ui-component/extended/CustomBreadcrumbs';
import { Box, useTheme } from '@mui/material';
import { ThemeMode } from '@/config';



export default function AddUserPage() {
  const theme = useTheme();
  const pathname = usePathname();


  return (
    <>


        <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2.5,
              bgcolor: theme.palette.mode === ThemeMode.DARK ? 'dark.main' : theme.palette.background.paper,
              pt: 0.3,
              pb: 0.3,
              px: 2,
              borderRadius: 1,
              borderColor: theme.palette.divider,
            }}
          >

            <CustomBreadcrumbs
                custom={true}
                titleBottom
                card={false} 
                sx={{ mb: '0px !important' }}
                links={[
                    { title: 'Users', to: '/users-list' }, 
                    { title: 'Add User', to: pathname }, 
                ]}
            />


        </Box>
        
        <AddUserForm/>
    </>
    
  );
}
