'use client';

// import React from 'react';
import { useRouter } from 'next/navigation'; // Import for router

// material-ui
import Button from '@mui/material/Button';
import CardActions from '@mui/material/CardActions';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import useAuth from '@/hooks/useAuth';
import { Roles } from '@/utils/constants';
// ===========================|| PRESCRIPTION INFORMATION CARD ||=========================== //

interface PrescriptionInfoItemProps {
  username: string; 
  actSessionsPerDay: number; 
  setsPerACTSession: number; 
  breathsPerSet: number; 
  breathLength: number; 
  breathPressureTarget: number; 
  breathPressureRange: number;
  id?: string;
  appliedFrom?: string;
  appliedTo?: string;
}

export interface PrescriptionInfoProps {
  isLoading: boolean;
  PrescriptionInfo: PrescriptionInfoItemProps[] | PrescriptionInfoItemProps; // Can be an array or a single object
  dateRange?: { startDate: Date; endDate: Date };
  userId: string; 
}

export default function PrescriptionInfo({ isLoading, PrescriptionInfo, userId }: PrescriptionInfoProps) {
  const router = useRouter();
  
  // Handle navigation to prescription details page
  const handleViewPrescriptionDetails = (prescriptionId?: string) => {
    if (userId) {
      router.push(`/users/${userId}/prescription`);
    } else {
      // If userId is not provided, use a more generic fallback URL
      router.push('/users');
      console.warn('UserId not provided for prescription details navigation');
    }
  };

  if (isLoading) {
    return (
      <MainCard title="Prescription Information" content={false}>
        <Typography sx={{ p: 2 }}>Loading prescription information...</Typography>
      </MainCard>
    );
  }

  // Convert to array for consistent handling
  const prescriptionList = Array.isArray(PrescriptionInfo) 
    ? PrescriptionInfo 
    : [PrescriptionInfo];
  
  // If there's only one prescription and it doesn't have explicit date ranges,
  // we don't need to show date ranges in the title
  const showDateRangesInTitle = prescriptionList.length > 1;
  
  return (
    <Stack spacing={2}>
      {prescriptionList.map((prescription, index) => (
        <PrescriptionCard 
          key={prescription.id || index}
          prescription={{
            ...prescription,
            // Only include date properties if we need to show multiple prescriptions
            appliedFrom: showDateRangesInTitle ? prescription.appliedFrom : undefined,
            appliedTo: showDateRangesInTitle ? prescription.appliedTo : undefined
          }}
          handleViewPrescriptionDetails={handleViewPrescriptionDetails}
        />
      ))}
    </Stack>
  );
}

function PrescriptionCard({ prescription, handleViewPrescriptionDetails }: { 
  prescription: PrescriptionInfoItemProps, 
  handleViewPrescriptionDetails: (id?: string) => void 
}) {
  // Determine title based on date range
  const hasDateRange = prescription.appliedFrom && prescription.appliedTo;
  const isSameDay = prescription.appliedFrom === prescription.appliedTo;
  const { user } = useAuth();

  let title = "Prescription Information";
  
  // Only show date range in title if there's more than one prescription (checked by parent component)
  // or if this is a single prescription with explicit date range
  if (hasDateRange) {
    if (isSameDay) {
      title = `Prescription Information (${prescription.appliedFrom})`;
    } else {
      title = `Prescription Information (${prescription.appliedFrom} to ${prescription.appliedTo})`;
    }
  }

  return (
    <MainCard title={title} content={false}>
      <TableContainer>
        <Table>
          <TableBody>
            {/* ACT Sessions row */}
            <TableRow hover sx={{ '& > td': { py: 0.75 } }}>
              <TableCell sx={{ pl: 3 }}>
                <Typography variant="subtitle1">ACT Sessions</Typography>
                <Typography variant="subtitle2">per day</Typography>
              </TableCell>
              <TableCell align="left" sx={{ pr: 3 }}>
                <Typography variant="h6">{prescription.actSessionsPerDay}</Typography>
              </TableCell>
            </TableRow>
            
            {/* Sets row */}
            <TableRow hover sx={{ '& > td': { py: 0.75 } }}>
              <TableCell sx={{ pl: 3 }}>
                <Typography variant="subtitle1">Sets</Typography>
                <Typography variant="subtitle2">per session</Typography>
              </TableCell>
              <TableCell align="left" sx={{ pr: 3 }}>
                <Typography variant="h6">{prescription.setsPerACTSession}</Typography>
              </TableCell>
            </TableRow>
            
            {/* Breaths row */}
            <TableRow hover sx={{ '& > td': { py: 0.75 } }}>
              <TableCell sx={{ pl: 3 }}>
                <Typography variant="subtitle1">Breaths</Typography>
                <Typography variant="subtitle2">per set</Typography>
              </TableCell>
              <TableCell align="left" sx={{ pr: 3 }}>
                <Typography variant="h6">{prescription.breathsPerSet}</Typography>
              </TableCell>
            </TableRow>
            
            {/* Breath Length row */}
            <TableRow hover sx={{ '& > td': { py: 0.75 } }}>
              <TableCell sx={{ pl: 3 }}>
                <Typography variant="subtitle1">Breath Length</Typography>
                <Typography variant="subtitle2">per breath</Typography>
              </TableCell>
              <TableCell align="left" sx={{ pr: 3 }}>
                <Typography variant="h6">{prescription.breathLength} s</Typography>
              </TableCell>
            </TableRow>
            
            {/* Breath Pressure row */}
            <TableRow hover sx={{ '& > td': { py: 0.75 } }}>
              <TableCell sx={{ pl: 3 }}>
                <Typography variant="subtitle1">Breath Pressure Range</Typography>
                <Typography variant="subtitle2">per breath</Typography>
              </TableCell>
              <TableCell align="left" sx={{ pr: 3 }}>
                <Typography variant="h6">{prescription.breathPressureTarget - prescription.breathPressureRange / 2} - {prescription.breathPressureTarget + prescription.breathPressureRange / 2} cmH₂O</Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end', pt: 1, pb: 1 }}>
        <Button 
          variant="text" 
          size="small"
          onClick={() => handleViewPrescriptionDetails(prescription.id)}
        >
          {user?.role === Roles.ADMIN || user?.role === Roles.SUPER_USER ? "View & Edit Details" : "View Details"}
        </Button>
      </CardActions>
    </MainCard>
  );
}
