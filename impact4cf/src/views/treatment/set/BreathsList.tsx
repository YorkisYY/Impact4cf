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
import SkeletonPopularCard from 'ui-component/cards/Skeleton/PopularCard';

// types
import { ArrangementOrder, EnhancedTableHeadProps, KeyedObject, GetComparator, HeadCell } from 'types';

interface BreathType {
  id: string;
  index: number;
  displayId: string;
  duration: number;
  durationTarget: number;
  pressure: number;
  pressureTarget: number;
  pressureTargetRange: number;
  startTime: Date;
  endTime: Date;
  qualityScore: number;
  completion: number;
}

// table sort
function descendingComparator(a: KeyedObject, b: KeyedObject, orderBy: string) {
  // Special case for index - use numeric comparison
  if (orderBy === 'index' && 'index' in a && 'index' in b) {
    return (b.index as number) - (a.index as number);
  }
  
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

function stableSort(array: BreathType[], comparator: (a: BreathType, b: BreathType) => number) {
  const stabilizedThis: [BreathType, number][] = array.map((el: BreathType, index: number) => [el, index]);
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
    id: 'displayId',
    numeric: false,
    label: 'Breath ID',
    align: 'left'
  },
  {
    id: 'duration',
    numeric: true,
    label: 'Duration',
    align: 'center'
  },
  {
    id: 'pressure',
    numeric: true,
    label: 'Mean Pressure',
    align: 'center'
  }
];

// ==============================|| TABLE HEADER ||============================== //

interface BreathsListEnhancedTableHeadProps extends EnhancedTableHeadProps {
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
}: BreathsListEnhancedTableHeadProps) {
  const createSortHandler = (property: string) => (event: React.SyntheticEvent<Element, Event>) => {
    onRequestSort(event, property);
  };

  // Set column widths
  const getColumnWidth = (index: number): string => {
    const widths = ['33%', '33%', '33%']; // Even column widths
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

// ==============================|| BREATHS LIST ||============================== //

interface BreathsListProps {
  isLoading: boolean;
  breaths: BreathType[];
  setId: string;
  sessionId: string;
  userId: string;
  date: string;
  prescribedBreathDuration: number;
  prescribedBreathPressureTarget: number;
  prescribedBreathPressureRange: number;
}

export default function BreathsList({ 
  isLoading, 
  breaths, 
  setId, 
  sessionId,
  userId, 
  date, 
  prescribedBreathDuration,
  prescribedBreathPressureTarget,
  prescribedBreathPressureRange
}: BreathsListProps) {
  const router = useRouter();
  const [order, setOrder] = useState<ArrangementOrder>('asc');
  const [orderBy, setOrderBy] = useState<string>('index');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [processedBreaths, setProcessedBreaths] = useState<BreathType[]>([]);

  // Process breaths data to ensure correct format
  useEffect(() => {
    if (breaths && breaths.length > 0) {
      const processedData = breaths.map((breath) => ({
        ...breath,
        // Ensure dates are Date objects
        startTime: breath.startTime instanceof Date ? breath.startTime : new Date(breath.startTime),
        endTime: breath.endTime instanceof Date ? breath.endTime : new Date(breath.endTime),
        // Set prescribed values if not already set
        durationTarget: prescribedBreathDuration,
        pressureTarget: prescribedBreathPressureTarget,
        pressureTargetRange: prescribedBreathPressureRange
      }));
      setProcessedBreaths(processedData);
    } else {
      setProcessedBreaths([]);
    }
  }, [breaths, prescribedBreathDuration,prescribedBreathPressureTarget, prescribedBreathPressureRange]); 

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
        const newSelectedId = processedBreaths.map((n) => n.displayId);
        setSelected(newSelectedId);
      }
      return;
    }
    setSelected([]);
  };

  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement> | undefined) => {
    if (event?.target.value) setRowsPerPage(Number(event?.target.value));
    setPage(0);
  };

  // Handle breath selection if needed
  const handleViewDetails = (breathId: string) => {
    const breathUrl = `/${userId}/all/${date}/${sessionId}/${setId}/${breathId}`;
    router.push(breathUrl);
  };

  const isSelected = (displayId: string) => selected.indexOf(displayId) !== -1;
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - processedBreaths.length) : 0;

  // Set column widths (matching table header)
  const getColumnWidth = (index: number): string => {
    const widths = ['33%', '33%', '33%']; // Even column widths
    return widths[index] || 'auto';
  };

  // Format duration in seconds
  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0s';
    return `${seconds.toFixed(1)}s`;
  };

  return (
    <>
      {isLoading ? (
        <SkeletonPopularCard />
      ) : (
        <MainCard contentSX={{ p: 0 }} title="Breaths">
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table 
              stickyHeader
              sx={{ 
                width: '100%', 
                tableLayout: 'fixed' 
              }} 
              aria-label="breaths table"
            >
              <EnhancedTableHead
                numSelected={selected.length}
                order={order}
                orderBy={orderBy}
                onSelectAllClick={handleSelectAllClick}
                onRequestSort={handleRequestSort}
                rowCount={processedBreaths.length}
                selected={selected}
              />
              <TableBody>
                {processedBreaths.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                      <Typography variant="h6">No breaths found for this set</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  stableSort(processedBreaths, getComparator(order, orderBy))
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) => {
                      const isItemSelected = isSelected(row.displayId);
                      const labelId = `enhanced-table-checkbox-${index}`;
                      
                      return (
                        <TableRow 
                          hover 
                          role="checkbox" 
                          aria-checked={isItemSelected} 
                          tabIndex={-1} 
                          key={row.id} 
                          selected={isItemSelected}
                          onClick={() => handleViewDetails(row.id)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell
                            component="th"
                            id={labelId}
                            scope="row"
                            sx={{ width: getColumnWidth(0) }}
                          >
                            <Typography variant="body2">
                              {row.displayId}
                            </Typography>
                          </TableCell>
                          <TableCell 
                            align="center"
                            sx={{ width: getColumnWidth(1) }}
                          >
                            <Typography variant="body2">
                              {formatDuration(row.duration)}
                              {/* {formatDuration(row.duration)} / {formatDuration(row.durationTarget)} */}
                            </Typography>
                          </TableCell>
                          <TableCell 
                            align="center"
                            sx={{ width: getColumnWidth(2) }}
                          >
                            <Typography variant="body2">
                              {Math.ceil(row.pressure)} cmH₂O
                              {/* {Math.ceil(row.pressure)} / ({row.pressureTarget - row.pressureTargetRange/2}-{row.pressureTarget + row.pressureTargetRange/2}) cmH₂O */}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
                {emptyRows > 0 && (
                  <TableRow sx={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={3} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={processedBreaths.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </MainCard>
      )}
    </>
  );
}