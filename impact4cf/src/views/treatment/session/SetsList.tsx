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

interface SetData {
  uid: string;           // Real UID for API calls
  sessionId: string;     // Session ID this set belongs to
  displayId?: string;    // Display name like "Set 1"
  index?: number;        // Numeric index for sorting
  startTime: Date;       // When set started
  endTime: Date;         // When set ended
  duration: number;      // Duration in seconds
  totalExhales: number;  // Total number of breaths
  breathsPre?: number;   // Prescribed breaths per set
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

function stableSort(array: SetData[], comparator: (a: SetData, b: SetData) => number) {
  const stabilizedThis: [SetData, number][] = array.map((el: SetData, index: number) => [el, index]);
  stabilizedThis.sort((a, b) => {
    // // Handle special sort for Set ID column
    // if (orderBy === 'displayId') {
    //   const aEl = a[0] as any;
    //   const bEl = b[0] as any;
    //   if (aEl.index !== undefined && bEl.index !== undefined) {
    //     return order === 'asc' ? aEl.index - bEl.index : bEl.index - aEl.index;
    //   }
    // }
    
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
    label: 'Set ID',
    align: 'left'
  },
  {
    id: 'duration',
    numeric: true,
    label: 'Duration',
    align: 'center'
  },
  {
    id: 'totalExhales',
    numeric: true,
    label: 'Breaths',
    align: 'center'
  }
];

// ==============================|| TABLE HEADER ||============================== //

interface SetsListEnhancedTableHeadProps extends EnhancedTableHeadProps {
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
}: SetsListEnhancedTableHeadProps) {
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

// ==============================|| SETS LIST ||============================== //

interface SetsListProps {
  isLoading: boolean;
  sets: SetData[];
  sessionId: string;
  userId: string;
  date: string;
  prescribedBreathsPerSet: number;
}

export default function SetsList({ isLoading, sets, sessionId, userId, date, prescribedBreathsPerSet }: SetsListProps) {
  const router = useRouter();
  const [order, setOrder] = useState<ArrangementOrder>('asc');
  const [orderBy, setOrderBy] = useState<string>('displayId');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [processedSets, setProcessedSets] = useState<SetData[]>([]);

  // Process sets data to add displayId, index and prescribed breaths
  useEffect(() => {
    if (sets && sets.length > 0) {
      const processedData = sets.map((set, index) => ({
        ...set,
        // Ensure dates are Date objects
        startTime: set.startTime instanceof Date ? set.startTime : new Date(set.startTime),
        endTime: set.endTime instanceof Date ? set.endTime : new Date(set.endTime),
        // Add display ID and index
        displayId: `Set ${index + 1}`,
        index: index + 1,
        // Set prescribed breaths from prop
        breathsPre: prescribedBreathsPerSet
      }));
      setProcessedSets(processedData);
    } else {
      setProcessedSets([]);
    }
  }, [sets, prescribedBreathsPerSet]);

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
        const newSelectedId = processedSets.map((n) => n.displayId || '');
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

  // Navigate to set details page
  const handleViewDetails = (setId: string) => {
    router.push(`/${userId}/all/${date}/${sessionId}/${setId}`);
  };

  const isSelected = (displayId: string) => selected.indexOf(displayId) !== -1;
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - processedSets.length) : 0;

  // Set column widths (matching table header)
  const getColumnWidth = (index: number): string => {
    const widths = ['33%', '33%', '33%']; // Even column widths
    return widths[index] || 'auto';
  };

  // Format duration in minutes and seconds
  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0m 0s';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <>
      {isLoading ? (
        <SkeletonPopularCard />
      ) : (
        <MainCard contentSX={{ p: 0 }} title="Sets">
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table 
              stickyHeader
              sx={{ 
                width: '100%', 
                tableLayout: 'fixed' 
              }} 
              aria-label="sets table"
            >
              <EnhancedTableHead
                numSelected={selected.length}
                order={order}
                orderBy={orderBy}
                onSelectAllClick={handleSelectAllClick}
                onRequestSort={handleRequestSort}
                rowCount={processedSets.length}
                selected={selected}
              />
              <TableBody>
                {processedSets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                      <Typography variant="h6">No sets found for this session</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  stableSort(processedSets, getComparator(order, orderBy))
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) => {
                      const isItemSelected = isSelected(row.displayId || '');
                      const labelId = `enhanced-table-checkbox-${index}`;
                      
                      return (
                        <TableRow 
                          hover 
                          role="checkbox" 
                          aria-checked={isItemSelected} 
                          tabIndex={-1} 
                          key={row.uid} 
                          selected={isItemSelected}
                          onClick={() => handleViewDetails(row.uid)}
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
                            </Typography>
                          </TableCell>
                          <TableCell 
                            align="center"
                            sx={{ width: getColumnWidth(2) }}
                          >
                            <Typography variant="body2">
                              {row.totalExhales !== undefined ? row.totalExhales : 0} / {row.breathsPre || prescribedBreathsPerSet}
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
            count={processedSets.length}
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