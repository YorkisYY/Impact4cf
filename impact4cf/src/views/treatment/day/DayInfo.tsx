'use client';

// import React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'; 
import 'dayjs/locale/en-gb';
// material-ui
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import MainCard from 'ui-component/cards/MainCard';
import { gridSpacing } from '../../../store/constant';

// assets
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AirIcon from '@mui/icons-material/Air';

// project imports
import BreathPressureChart from './BreathPressureChart';

dayjs.extend(utc);
dayjs.locale('en-gb');
// ===========================|| DAY INFO CARD ||=========================== //

interface TreatmentInfoType {
  date: string;
  actSessions: number;
  sets: number;
  breaths: number;
}

interface PrescriptionInfoType {
  username: string; 
  actSessionsPerDay: number; 
  setsPerACTSession: number; 
  breathsPerSet: number; 
  breathLength: number; 
  breathPressureTarget: number; 
  breathPressureRange: number; 
}

export interface DayInfoProps {
  isLoading: boolean;
  treatmentInfo: TreatmentInfoType;
  prescriptionInfo: PrescriptionInfoType;
  date: Date | null;
  breathData: any[];
  isLoadingBreathData: boolean;
}

export default function DayInfo({ 
  isLoading, 
  treatmentInfo, 
  prescriptionInfo, 
  date, 
  breathData,
  isLoadingBreathData
}: DayInfoProps) {
  // Calculate total prescribed values based on prescription info
  const totalPrescribedSets = prescriptionInfo.actSessionsPerDay * prescriptionInfo.setsPerACTSession;
  const totalPrescribedBreaths = totalPrescribedSets * prescriptionInfo.breathsPerSet;

  // Format date display
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return dayjs.utc(date).format('dddd DD MMM YYYY');
  };

  const iconSX = {
    fontSize: '1.25rem',
    marginRight: 1,
    verticalAlign: 'sub',
    color: 'primary.main'
  };

  if (isLoading) {
    return (
      <MainCard title="Day Summary" content={false}>
        <CardContent>
          <Typography>Loading day summary...</Typography>
        </CardContent>
      </MainCard>
    );
  }
  console.log('Raw date:', date?.toISOString());
  console.log('Formatted:', formatDate(date));
  

  return (
    <MainCard 
      title={`${formatDate(date)} - Day Summary`} 
      content={false}
    >
      <CardContent>
        <Grid container spacing={gridSpacing}>
          <Grid size={12}>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentTurnedInIcon sx={iconSX} />
                <Typography variant="body1">
                  <strong>ACT Sessions:</strong> {treatmentInfo.actSessions}/{prescriptionInfo.actSessionsPerDay}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FitnessCenterIcon sx={iconSX} />
                <Typography variant="body1">
                  <strong>Sets:</strong> {treatmentInfo.sets}/{totalPrescribedSets}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AirIcon sx={iconSX} />
                <Typography variant="body1">
                  <strong>Breaths:</strong> {treatmentInfo.breaths}/{totalPrescribedBreaths}
                </Typography>
              </Box>
            </Box>

            {/* Pressure Area Chart Section */}
            <Box sx={{ mt: 0.5 }}>
              {/* <Typography variant="subtitle1" sx={{ mb: 1 }}>Breath Pressure Graph</Typography> */}
              <Box sx={{ height: 250 }}>
                {isLoadingBreathData ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography>Loading breath data...</Typography>
                  </Box>
                ) : (
                  <BreathPressureChart 
                    breathData={breathData}
                    prescribedPressureMaximum={prescriptionInfo.breathPressureTarget+prescriptionInfo.breathPressureRange/2}
                    prescribedPressureMinimum={prescriptionInfo.breathPressureTarget-prescriptionInfo.breathPressureRange/2}
                  />
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
      <Divider />
    </MainCard>
  );
}