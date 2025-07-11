'use client';

import { GridToolbar, GridToolbarContainer, GridToolbarQuickFilter } from '@mui/x-data-grid';
import { useRouter, usePathname } from 'next/navigation';
import { Box, Button, InputAdornment, Tooltip, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined'
import { ThemeMode } from '@/config';
import useAuth from '@/hooks/useAuth';
import { Roles } from '@/utils/constants';
import deleteUsers from '@/app/actions/deleteUsers';
import { GridRowSelectionModel } from '@/types/user-list-toolbar';





type UserListToolBarProps = {
  selectedRows: GridRowSelectionModel;
  setSelectedRows: (rows: GridRowSelectionModel) => void;
  setSuccessMessage: (message: string) => void; 
  setErrorMessage: (message: string) => void; 

};
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function UserListToolBar(
  { selectedRows, setSelectedRows, setSuccessMessage, setErrorMessage }: UserListToolBarProps) {

  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { user } = useAuth();

  const handleDelete = async () => {
    if (selectedRows.length === 0) return;
  
    const confirmed = confirm(`Are you sure you want to delete ${selectedRows.length} user(s)?`);
    if (!confirmed) return;
    
    const uids: string[] = selectedRows.map((uid) => String(uid));

    //check if current user uid in uids list
    if (user && uids.includes(user.uid)) {
      setErrorMessage('Cannot delete account you are signed in with');
      return;
    }

    try {
      await deleteUsers(uids); 
      setSuccessMessage(`Sucessfully deleted ${selectedRows.length == 1 ? 'User' : 'Users' }`);
    } catch (error: any) {
      if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
      console.error('Delete failed:', error);
      setErrorMessage('Failed to delete all users. Please try again.');
    }
    setSelectedRows([]); 
    router.replace(pathname);
  };
  




  return (
    <GridToolbarContainer
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 1,
        color: 'white',
        minHeight: '100px'
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center'}}>
        <GridToolbarQuickFilter 
          slotProps={{
            input: {
              sx: {
                size: 'medium',
                width: '250px',
                mr: '10px',
                color: theme.palette.mode === ThemeMode.DARK ? 'dark.dark' : 'primary.dark',
                '&.MuiInputBase-root:hover:not(.Mui-disabled, .Mui-error):before': {
                  borderBottomColor: '#697586',
                },
                '&.MuiInputBase-root.Mui-focused:after': {
                  borderBottomColor: theme.palette.mode === ThemeMode.DARK ? 'dark.dark' : 'primary.dark'
                },
              },
              
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="medium" />
                </InputAdornment>
              )
            }
          }}
        />


      {(user?.role == Roles.SUPER_USER || user?.role == Roles.ADMIN) && (
        <>
          <Button
            variant="contained"
            onClick={() => router.push(`${pathname}/add-user`)}
            startIcon={<PersonAddOutlinedIcon />}
            sx={{
              backgroundColor: theme.palette.mode === ThemeMode.DARK ? 'dark.dark' : 'primary.dark',
              color: '#fff !important',
              minWidth: '140px',
              height: '40px',
              textTransform: 'none',
              fontSize: '0.9rem',
              '& .MuiButton-startIcon': {
                color: 'inherit'
              }
            }}
          >
            Add User
          </Button>
          <Tooltip title={selectedRows.length === 0 ? 'Select a user to delete' : ''}>
            <span>
              <Button
                variant="contained"
                onClick={handleDelete}
                disabled={selectedRows.length === 0}
                sx={{
                  backgroundColor: theme.palette.error.main,
                  '&:hover': {
                    backgroundColor: '#c62828'
                  },
                  color: selectedRows.length === 0 ? 'inherit' : '#fff !important',
                  minWidth: '140px',
                  height: '40px',
                  textTransform: 'none',
                  fontSize: '0.9rem'
                }}
              >
                Delete Users
              </Button>
            </span>
        </Tooltip>
        </>
      )}




      </Box>
      <GridToolbar
        csvOptions={{
          fileName: `users-export-${getTodayDate()}`,
          utf8WithBom: true
        }}
        printOptions={{
          fileName: `users-export-${getTodayDate()}`
        }} />
    </GridToolbarContainer>
  );
}
