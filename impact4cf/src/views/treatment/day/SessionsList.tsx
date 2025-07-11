'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// material-ui
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { visuallyHidden } from '@mui/utils';

// project imports
import MainCard from 'ui-component/cards/MainCard';

// types
import { ArrangementOrder, EnhancedTableHeadProps, KeyedObject, GetComparator, HeadCell } from 'types';

// Interfaces for session data
interface SessionInfo {
  id: string;          // Real UID for API calls
  displayId?: string;  // Display name like "Session 1"
  index?: number;      // Numeric index
  duration: number;
  sets: number;
  breaths: number;
}

interface PrescriptionInfo {
  username: string; 
  actSessionsPerDay: number; 
  setsPerACTSession: number; 
  breathsPerSet: number; 
  breathLength: number; 
  breathPressureTarget: number; 
  breathPressureRange: number;  
}

interface SessionData {
  sessionId: string;    // This will be the display ID ("Session 1", etc.)
  uid: string;          // The real session UID for API calls
  index?: number;       // Numeric index for sorting
  duration: number;
  setsReal: number;
  setsPre: number;
  breathsReal: number;
  breathsPre: number;
}

// table sort
function descendingComparator(a: KeyedObject, b: KeyedObject, orderBy: string) {
  // For Session ID column, use the numeric index for proper sorting
  if (orderBy === 'sessionId' && 'index' in a && 'index' in b) {
    if (b.index < a.index) {
      return -1;
    }
    if (b.index > a.index) {
      return 1;
    }
    return 0;
  }
  
  // Default comparison for other columns
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

const getComparator: GetComparator = (order, orderBy) =>
  order === 'desc' ? (a, b) => descendingComparator(a, b, orderBy) : (a, b) => -descendingComparator(a, b, orderBy);

function stableSort(array: SessionData[], comparator: (a: SessionData, b: SessionData) => number) {
  const stabilizedThis: [SessionData, number][] = array.map((el: SessionData, index: number) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

// table header options
const headCells: HeadCell[] = [
  {
    id: 'sessionId',
    numeric: false,
    label: 'Session ID',
    align: 'left'
  },
  {
    id: 'duration',
    numeric: true,
    label: 'Duration',
    align: 'center'
  },
  {
    id: 'sets',
    numeric: false,
    label: 'Sets',
    align: 'center'
  },
  {
    id: 'breaths',
    numeric: false,
    label: 'Breaths',
    align: 'center'
  }
];

// ==============================|| TABLE HEADER ||============================== //

interface SessionsListEnhancedTableHeadProps extends EnhancedTableHeadProps {
  selected: string[];
}

function EnhancedTableHead({
  onSelectAllClick,
  order,
  orderBy,
  numSelected,
  rowCount,
  onRequestSort,
  selected
}: SessionsListEnhancedTableHeadProps) {
  const createSortHandler = (property: string) => (event: React.SyntheticEvent<Element, Event>) => {
    onRequestSort(event, property);
  };

  // Set column widths
  const getColumnWidth = (index: number): string => {
    const widths = ['25%', '25%', '25%', '25%']; // Even column widths
    return widths[index] || 'auto';
  };

  return (
    <TableHead>
      <TableRow>
        {numSelected <= 0 &&
          headCells.map((headCell, index) => (
            <TableCell
              key={headCell.id}
              align={headCell.align}
              padding={headCell.disablePadding ? 'none' : 'normal'}
              sortDirection={orderBy === headCell.id ? order : false}
              sx={{ width: getColumnWidth(index) }}
            >
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
                {orderBy === headCell.id ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </Box>
                ) : null}
              </TableSortLabel>
            </TableCell>
          ))}
      </TableRow>
    </TableHead>
  );
}

// ==============================|| SESSIONS LIST ||============================== //

export interface SessionsListProps {
  isLoading: boolean;
  sessionInfo: SessionInfo[];
  prescriptionInfo: PrescriptionInfo;
  date: Date | null;
  userId: string;
  sessionDay: string;
}

export default function SessionsList({ isLoading, sessionInfo, prescriptionInfo, date, userId, sessionDay }: SessionsListProps) {
  const router = useRouter();
  const [order, setOrder] = useState<ArrangementOrder>('asc');
  const [orderBy, setOrderBy] = useState<string>('sessionId');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [rows, setRows] = useState<SessionData[]>([]);

  // Transform sessionInfo and prescriptionInfo into SessionData
  useEffect(() => {
    if (sessionInfo && sessionInfo.length > 0 && prescriptionInfo) {
      const transformedData = sessionInfo.map((item, index) => ({
        sessionId: item.displayId || `Session ${index + 1}`, // Use displayId if available, otherwise generate one
        uid: item.id, // Use the real session ID for API calls
        index: item.index || index + 1, // Use the provided index or generate one
        duration: item.duration,
        setsReal: item.sets,
        setsPre: prescriptionInfo.setsPerACTSession,
        breathsReal: item.breaths,
        breathsPre: prescriptionInfo.setsPerACTSession * prescriptionInfo.actSessionsPerDay * prescriptionInfo.breathsPerSet
      }));
      setRows(transformedData);
    } else {
      setRows([]);
    }
  }, [sessionInfo, prescriptionInfo]);

  const handleRequestSort = (event: React.SyntheticEvent<Element, Event>, property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      if (selected.length > 0) {
        setSelected([]);
      } else {
        const newSelectedId = rows.map((n) => n.sessionId);
        setSelected(newSelectedId);
      }
      return;
    }
    setSelected([]);
  };

  // Navigate to session details using the original uid from API
  const handleViewDetails = (uid: string) => {
    router.push(`/${userId}/all/${sessionDay}/${uid}`);
  };

  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement> | undefined) => {
    if (event?.target.value) setRowsPerPage(Number(event?.target.value));
    setPage(0);
  };

  const isSelected = (sessionId: string) => selected.indexOf(sessionId) !== -1;
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;
  
  // Set column widths (matching table header)
  const getColumnWidth = (index: number): string => {
    const widths = ['25%', '25%', '25%', '25%']; // Even column widths
    return widths[index] || 'auto';
  };

  // Format duration in minutes and seconds
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <MainCard contentSX={{ p: 0 }} title="Sessions">
      {isLoading ? (
        <Box sx={{ p: 2 }}>
          <Typography>Loading session data...</Typography>
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table 
              sx={{ 
                width: '100%', 
                tableLayout: 'fixed' 
              }} 
              aria-labelledby="tableTitle"
            >
              <EnhancedTableHead
                numSelected={selected.length}
                order={order}
                orderBy={orderBy}
                onSelectAllClick={handleSelectAllClick}
                onRequestSort={handleRequestSort}
                rowCount={rows.length}
                selected={selected}
              />
              <TableBody>
                {stableSort(rows, getComparator(order, orderBy))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => {
                    const isItemSelected = isSelected(row.sessionId);
                    const labelId = `enhanced-table-checkbox-${index}`;
                    
                    return (
                      <TableRow 
                        hover 
                        role="checkbox" 
                        aria-checked={isItemSelected} 
                        tabIndex={-1} 
                        key={row.sessionId} 
                        selected={isItemSelected}
                        onClick={() => handleViewDetails(row.uid)} // Use uid for navigation
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell
                          component="th"
                          id={labelId}
                          scope="row"
                          sx={{ width: getColumnWidth(0) }}
                        >
                          {row.sessionId}
                        </TableCell>
                        <TableCell 
                          align="center"
                          sx={{ width: getColumnWidth(1) }}
                        >
                          {formatDuration(row.duration)}
                        </TableCell>
                        <TableCell 
                          align="center"
                          sx={{ width: getColumnWidth(2) }}
                        >
                          <Typography variant="body2">{row.setsReal} / {row.setsPre}</Typography>
                        </TableCell>
                        <TableCell 
                          align="center"
                          sx={{ width: getColumnWidth(3) }}
                        >
                          <Typography variant="body2">{row.breathsReal} / {row.breathsPre}</Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {emptyRows > 0 && (
                  <TableRow sx={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={4} />
                  </TableRow>
                )}
                {rows.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <Typography variant="h6">No session data available for the selected date</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={rows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
    </MainCard>
  );
}