'use client';
import dynamic from 'next/dynamic';
import React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'; 
dayjs.extend(utc);
// material-ui
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
// import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import CircularProgress from '@mui/material/CircularProgress';
import MainCard from 'ui-component/cards/MainCard';
import { gridSpacing } from 'store/constant';

// project imports
// import BreathPressureChartPerSet from './BreathPressureChartPerSet';
const BreathPressureChartPerSet = dynamic(
  () => import('./BreathPressureChartPerSet'),
  { ssr: false }
);
// assets
import AirIcon from '@mui/icons-material/Air';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';

// ===========================|| SET INFO CARD ||=========================== //

interface SetInfoType {
  id: string;
  displayId: string;
  index: number;
  sessionId: string;
  sessionIndex: number;
  duration: number;
  breaths: number;
  breathsTarget: number;
  startTime: Date;
  endTime: Date;
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

interface SetInfoProps {
  isLoading: boolean;
  setInfo: SetInfoType;
  prescriptionInfo: PrescriptionInfoType;
  date: Date | null;
  breathData: any[];
  fetchingBreathData: boolean;
}

export default function SetInfo({ 
  isLoading, 
  setInfo, 
  prescriptionInfo, 
  date,
  breathData,
  fetchingBreathData
}: SetInfoProps) {
  // Format date display
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return dayjs.utc(date).format('dddd DD MMM YYYY');
  };
  
  // Format duration in minutes and seconds
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60); // Round to nearest integer
    return `${minutes}m ${remainingSeconds}s`;
  };

  const iconSX = {
    fontSize: '1.25rem',
    marginRight: 1,
    verticalAlign: 'sub',
    color: 'primary.main'
  };

  if (isLoading) {
    return (
      <MainCard title="Set Summary" content={false}>
        <CardContent>
          <Typography>Loading set summary...</Typography>
        </CardContent>
      </MainCard>
    );
  }

  return (
    <MainCard title={`${formatDate(date)} - Session ${setInfo.sessionIndex} - ${setInfo.displayId} Summary`} content={false}>
      <CardContent>
        <Grid container spacing={gridSpacing}>
          <Grid size={12}>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeFilledIcon sx={iconSX} />
                <Typography variant="body1">
                  <strong>Duration:</strong> {formatDuration(setInfo.duration)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AirIcon sx={iconSX} />
                <Typography variant="body1">
                  <strong>Breaths:</strong> {setInfo.breaths}/{setInfo.breathsTarget}
                </Typography>
              </Box>
            </Box>

            {/* Breath Pressure Chart */}
            <Box sx={{ mt: 2 }}>
              
              {fetchingBreathData ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <BreathPressureChartPerSet 
                  data={breathData} 
                  isLoading={isLoading} 
                  prescribedPressureMaximum={prescriptionInfo.breathPressureTarget+prescriptionInfo.breathPressureRange/2}
                  prescribedPressureMinimum={prescriptionInfo.breathPressureTarget-prescriptionInfo.breathPressureRange/2}
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </MainCard>
  );
}