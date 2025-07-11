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
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'; 
// third party
// import ReactApexChart from 'react-apexcharts';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import MiniBreathChart from './MiniBreathChart';
// import useConfig from 'hooks/useConfig';

// types
import { ArrangementOrder, EnhancedTableHeadProps, KeyedObject, GetComparator, HeadCell } from 'types';
import { ExhaleWithContext } from 'types';
dayjs.extend(utc);
// Interfaces for treatment data
interface TreatmentInfo {
  date: string;
  actSessions: number;
  sets: number;
  breaths: number;
  breathData?: ExhaleWithContext[]; 
}

interface PrescriptionInfo {
  username: string; 
  actSessionsPerDay: number; 
  setsPerACTSession: number; 
  breathsPerSet: number; 
  breathLength: number; 
  breathPressureTarget: number; 
  breathPressureRange: number;
  id?: string; // Add prescription ID
  appliedFrom?: string; // Add date from which this prescription applies
  appliedTo?: string; // Add date until which this prescription applies
}

interface TreatmentData {
  date: string;
  actSessionsReal: number;
  actSessionsPre: number;
  setsReal: number;
  setsPre: number;
  breathsReal: number;
  breathsPre: number;
  breathData?: ExhaleWithContext[];
}

// table sort
function descendingComparator(a: KeyedObject, b: KeyedObject, orderBy: string) {
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

function stableSort(array: TreatmentData[], comparator: (a: TreatmentData, b: TreatmentData) => number) {
  const stabilizedThis: [TreatmentData, number][] = array.map((el: TreatmentData, index: number) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

// table header options - with added breath graph column
const headCells: HeadCell[] = [
  {
    id: 'date',
    numeric: false,
    label: 'Date',
    align: 'left',
  },
  {
    id: 'sessions',
    numeric: false,
    label: 'ACT sessions',
    align: 'left',
  },
  {
    id: 'sets',
    numeric: false,
    label: 'Sets',
    align: 'left',
  },
  {
    id: 'breaths',
    numeric: false,
    label: 'Breaths',
    align: 'left'
  },
  {
    id: 'breathGraph',
    numeric: false,
    label: 'Breath Graph',
    align: 'center'
  }
];

// ==============================|| TABLE HEADER ||============================== //

interface DaysListEnhancedTableHeadProps extends EnhancedTableHeadProps {
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
}: DaysListEnhancedTableHeadProps) {
  const createSortHandler = (property: string) => (event: React.SyntheticEvent<Element, Event>) => {
    onRequestSort(event, property);
  };

  const getColumnWidth = (index: number): string => {
    const widths = ['17%', '25%', '15%', '15%', '30%']; 
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

// ==============================|| DAYS LIST ||============================== //

export interface DaysListProps {
  isLoading: boolean;
  treatmentInfo: TreatmentInfo[];
  prescriptionInfo: PrescriptionInfo[];
  dateRange: { startDate: Date; endDate: Date };
  userId: string; 
}

export default function DaysList({ isLoading, treatmentInfo, prescriptionInfo, dateRange, userId }: DaysListProps) {
  const router = useRouter();
  const [order, setOrder] = useState<ArrangementOrder>('desc');
  const [orderBy, setOrderBy] = useState<string>('date');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [rows, setRows] = useState<TreatmentData[]>([]);

  // Transform treatmentInfo and prescriptionInfo into TreatmentData
  useEffect(() => {
    if (treatmentInfo && treatmentInfo.length > 0) {
      const transformedData = treatmentInfo.map(item => {
        // Find the applicable prescription for this day
        
        // Find the prescription that applies to this day's date
        const prescriptionForDay = prescriptionInfo.find(p => {
          if (p.appliedFrom && p.appliedTo) {
            // Check if this day falls within this prescription's date range
            return item.date >= p.appliedFrom && item.date <= p.appliedTo;
          }
          return false;
        }) || prescriptionInfo[0]; // Fallback to first prescription if none match
        
        return {
          date: item.date,
          actSessionsReal: item.actSessions,
          actSessionsPre: prescriptionForDay.actSessionsPerDay,
          setsReal: item.sets,
          setsPre: prescriptionForDay.setsPerACTSession * prescriptionForDay.actSessionsPerDay,
          breathsReal: item.breaths,
          breathsPre: prescriptionForDay.breathsPerSet * prescriptionForDay.setsPerACTSession * prescriptionForDay.actSessionsPerDay,
          breathData: item.breathData || []
        };
      });
      setRows(transformedData);
    } else {
      setRows([]);
    }
  }, [treatmentInfo, prescriptionInfo]);

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
        const newSelectedId = rows.map((n) => n.date);
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

  const isSelected = (date: string) => selected.indexOf(date) !== -1;
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  // Format date for display
  const formatDate = (dateString: string) => {
    const utcDate = dayjs.utc(dateString, 'YYYY-MM-DD'); 
    return utcDate.format('DD-MM-YYYY'); 
  };

  // Function to handle view details when row is clicked
  const handleViewDetails = (date: string) => {
    router.push(`/${userId}/all/${date}`);
  };

  return (
    <MainCard contentSX={{ p: 0 }} title="Treatments">
      {isLoading ? (
        <Box sx={{ p: 2 }}>
          <Typography>Loading treatment data...</Typography>
        </Box>
      ) : (
        <>
          <TableContainer title="Treatments">
            <Table sx={{ 
                        width: '100%',  
                        tableLayout: 'fixed' 
                      }}  
                  aria-labelledby="tableTitle">
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
                    const isItemSelected = isSelected(row.date);
                    const labelId = `enhanced-table-checkbox-${index}`;
                    
                    return (
                      <TableRow 
                        hover 
                        role="checkbox" 
                        aria-checked={isItemSelected} 
                        tabIndex={-1} 
                        key={row.date} 
                        selected={isItemSelected}
                        onClick={() => handleViewDetails(row.date)} // Row click event
                        sx={{ cursor: 'pointer' }} // Pointer cursor style
                      >
                        <TableCell
                          component="th"
                          id={labelId}
                          scope="row"
                        >
                          {formatDate(row.date)}
                        </TableCell>
                        <TableCell align="left">
                          <Typography variant="body2">{row.actSessionsReal} / {row.actSessionsPre}</Typography>
                        </TableCell>
                        <TableCell align="left">
                          <Typography variant="body2">{row.setsReal} / {row.setsPre}</Typography>
                        </TableCell>
                        <TableCell align="left">
                          <Typography variant="body2">{row.breathsReal} / {row.breathsPre}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <MiniBreathChart date={row.date} breathData={row.breathData || []} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {emptyRows > 0 && (
                  <TableRow sx={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={5} /> {/* Updated column span from 4 to 5 */}
                  </TableRow>
                )}
                {rows.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}> {/* Updated column span from 4 to 5 */}
                      <Typography variant="h6">No treatment data available for the selected date range</Typography>
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