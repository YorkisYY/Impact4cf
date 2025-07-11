'use client';

import React from 'react';

// material-ui
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
// import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import CircularProgress from '@mui/material/CircularProgress';
import MainCard from 'ui-component/cards/MainCard';
import { gridSpacing } from 'store/constant';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'; 
dayjs.extend(utc);
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

// project imports
import BreathPressureChartPerSession from './BreathPressureChartPerSession';

// assets
// import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AirIcon from '@mui/icons-material/Air';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import { CSVExport } from '@/views/forms/tables/TableExports';
// import CheckCircleIcon from '@mui/icons-material/CheckCircle';
// import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';

// ===========================|| SESSION INFO CARD ||=========================== //

interface SessionInfoType {
  id: string;
  index: number;
  duration: number;
  sets: number;
  breaths: number;
  startTime: Date;
  endTime: Date;
  qualityScore: number;
  completion: number;
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

interface SessionInfoProps {
  isLoading: boolean;
  sessionInfo: SessionInfoType;
  prescriptionInfo: PrescriptionInfoType;
  date: Date | null;
  breathData: any[];
  fetchingBreathData: boolean;
  csvData: any[];
  csvHeaders: { label: string, key: string }[];
}

export default function SessionInfo({ 
  isLoading, 
  sessionInfo, 
  prescriptionInfo, 
  date,
  breathData,
  fetchingBreathData,
  csvData,
  csvHeaders
}: SessionInfoProps) {
  // Calculate total prescribed values
  const totalPrescribedSets = prescriptionInfo.setsPerACTSession;
  const totalPrescribedBreaths = totalPrescribedSets * prescriptionInfo.breathsPerSet;

  // Format date display
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return dayjs.utc(date).format('dddd DD MMM YYYY');
  };
  
  // // Format time display
  // const formatTime = (date: Date | null) => {
  //   if (!date) return 'N/A';
  //   return date.toLocaleTimeString('en-GB', {
  //     hour: '2-digit',
  //     minute: '2-digit'
  //   });
  // };
  
  // Format duration in minutes and seconds
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // // Calculate completion percentage
  // const getCompletionPercentage = () => {
  //   return `${Math.round(sessionInfo.completion * 100)}%`;
  // };

  const iconSX = {
    fontSize: '1.25rem',
    marginRight: 1,
    verticalAlign: 'sub',
    color: 'primary.main'
  };

  if (isLoading) {
    return (
      <MainCard title="Session Summary" content={false}>
        <CardContent>
          <Typography>Loading session summary...</Typography>
        </CardContent>
      </MainCard>
    );
  }

  const csvFilename = `${dayjs(date).format('DD-MM-YYYY')}-ACT Session ${sessionInfo.index}.csv`;
  return (
    <MainCard 
      title={`${formatDate(date)} - ACT Session ${sessionInfo.index} Summary`} 
      content={false}
      secondary={
              <CSVExport 
                data={csvData} 
                filename={csvFilename} 
                headers={csvHeaders} 
              />
      }
      >
      <CardContent>
        <Grid container spacing={gridSpacing}>
          <Grid size={12}>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeFilledIcon sx={iconSX} />
                <Typography variant="body1">
                  <strong>Duration:</strong> {formatDuration(sessionInfo.duration)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FitnessCenterIcon sx={iconSX} />
                <Typography variant="body1">
                  <strong>Sets:</strong> {sessionInfo.sets}/{totalPrescribedSets}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AirIcon sx={iconSX} />
                <Typography variant="body1">
                  <strong>Breaths:</strong> {sessionInfo.breaths}/{totalPrescribedBreaths}
                </Typography>
              </Box>
            </Box>

            {/* <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon sx={iconSX} />
                <Typography variant="body1">
                  <strong>Completion:</strong> {getCompletionPercentage()}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SignalCellularAltIcon sx={iconSX} />
                <Typography variant="body1">
                  <strong>Quality Score:</strong> {Math.round(sessionInfo.qualityScore * 100)/100}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeFilledIcon sx={iconSX} />
                <Typography variant="body1">
                  <strong>Time:</strong> {formatTime(sessionInfo.startTime)} - {formatTime(sessionInfo.endTime)}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 1.5 }} /> */}

            {/* Breath Pressure Chart */}
            <Box sx={{ mt: 2 }}>
              
              {fetchingBreathData ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <BreathPressureChartPerSession 
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