'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DataGrid, GridColDef, GRID_CHECKBOX_SELECTION_COL_DEF, GridRowParams, GridRowSelectionModel } from '@mui/x-data-grid';
import { CombinedUserData } from '@/types/user-list-data';
import UserListToolBar from './userListToolBar';
import { useTheme } from '@mui/material/styles';
import CustomBreadcrumbs from '@/ui-component/extended/CustomBreadcrumbs';
import { ThemeMode } from '@/config';
import { Box, Paper, Alert, Collapse, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';




const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';
  const parsedDate = date instanceof Date ? date : new Date(date);
  return isNaN(parsedDate.getTime()) ? 'Invalid date' : parsedDate.toLocaleDateString('en-CA');
};

const formatRole = (role: string): string => {
  return role[0].toUpperCase() + role.slice(1);
};

const columns: GridColDef[] = [
  { field: 'email', headerName: 'Username', flex: 1.5, headerAlign: 'center' },
  { field: 'role', headerName: 'User Role', flex: 1, valueFormatter: (value: string) => formatRole(value), headerAlign: 'center' },
  {
    field: 'lastActive',
    headerName: 'Last Seen',
    flex: 1,
    valueFormatter: (value?: string) => formatDate(value),
    headerAlign: 'center'
  },
  {
    field: 'lastTreatment',
    headerName: 'Last ACT',
    flex: 1,
    valueFormatter: (value?: string) => formatDate(value),
    headerAlign: 'center'
  },
  { field: 'trialStage', headerName: 'Trial Stage', flex: 1, headerAlign: 'center' },
  { field: 'deviceMode', headerName: 'Device Mode', flex: 1, headerAlign: 'center' },
  { field: 'totalSessions', headerName: 'Total Sessions', flex: 1.5, headerAlign: 'center' },
  { field: 'totalBreaths', headerName: 'Total Breaths', flex: 1.5, headerAlign: 'center' }
];

export default function UserDataGrid({ rows }: { rows: CombinedUserData[] }) {
  const [paginationModel, setPaginationModel] = useState({ pageSize: 15, page: 0 });
  const router = useRouter();
  const theme = useTheme();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);

  const CustomToolbarWithProps = () => (
    <UserListToolBar 
    selectedRows={selectedRows} 
    setSelectedRows={setSelectedRows}
    setSuccessMessage={setSuccessMessage}
    setErrorMessage={setErrorMessage}/>
  );
  

  useEffect(() => {
    if (searchParams.get('success') === 'true' && !successMessage) {
      setSuccessMessage('User added successfully!');
      router.replace(pathname)
    }
  
    // 2) If successMessage is now non-empty, auto-clear after 5s
    if (successMessage || errorMessage) {
      const timeout = setTimeout(() => {
        if (successMessage) setSuccessMessage('');
        if (errorMessage) setErrorMessage('');
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [searchParams, router, successMessage, errorMessage]);
  


  const handleCloseBanner = () => {
    if (successMessage) setSuccessMessage('');
    if (errorMessage) setErrorMessage('');
  };

  const handleRowClick = (params: GridRowParams) => {
    router.push(`/${params.row.id}/all`);
  };

  const getTogglableColumns = (columns: GridColDef[]) => {
    return columns.filter((column) => column.field != GRID_CHECKBOX_SELECTION_COL_DEF.field).map((column) => column.field);
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          bgcolor: theme.palette.mode === ThemeMode.DARK ? 'dark.main' : theme.palette.background.paper,
          pt: 0.3,
          pb: 0.3,
          px: 2,
          borderRadius: 1,
          borderColor: theme.palette.divider,
          height: '65px'
        }}
      >
        <CustomBreadcrumbs
          custom={true}
          titleBottom
          card={false}
          sx={{ mb: '0px !important', fontSize: '13.5rem' }}
          links={[{ title: 'Users', to: '/' }]}
        />
      </Box>

      <Collapse in={!!successMessage}>
        <Alert
          severity="success"
          action={
            <IconButton onClick={handleCloseBanner} color="inherit" size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          }
          sx={{ mb: 2 }}
        >
          {successMessage}
        </Alert>
      </Collapse>



      <Collapse in={!!errorMessage}>
        <Alert
          severity="error"
          action={
            <IconButton onClick={handleCloseBanner} color="inherit" size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          }
          sx={{ mb: 2 }}
        >
          {errorMessage}
        </Alert>
      </Collapse>

      <Box sx={{ width: '100%' }}>
        <Paper sx={{ width: '100%', mb: 2, padding: 2 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 25]}
            pagination
            checkboxSelection
            disableRowSelectionOnClick
            autoHeight
            onRowClick={handleRowClick}
            rowSelectionModel={selectedRows}
            onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection)}
            slotProps={{
              columnsManagement: { getTogglableColumns },
            }}
            slots={{ toolbar: CustomToolbarWithProps }}
            sx={{
              borderRadius: 0,
              '& .MuiDataGrid-toolbarContainer .MuiButton-root': { color: '#697586' },
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: theme.palette.mode === ThemeMode.DARK ? 'dark.dark' : 'primary.dark',
                textAlign: 'center'
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                color: 'white',
                justifyContent: 'center',
                display: 'flex',
                width: '100%'
              },
              '& .MuiDataGrid-cell': {
                textAlign: 'center',
                justifyContent: 'center',
                display: 'flex',
                cursor: 'pointer',
              },
              '& .MuiDataGrid-columnHeader .MuiSvgIcon-root': { color: 'white' }
            }}
          />
        </Paper>
      </Box>
    </>
  );
}
