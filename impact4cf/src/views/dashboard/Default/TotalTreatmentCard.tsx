'use client';

// import Image from 'next/image';
import React, { useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
// import Avatar from '@mui/material/Avatar';
// import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

// project imports
import { ThemeMode } from 'config';
import MainCard from 'ui-component/cards/MainCard';
import SkeletonTotalParticipantsCard from '@/ui-component/cards/Skeleton/TotalParticipantsCard';

// assets
// import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

// ===========================|| DASHBOARD DEFAULT - TOTAL PARTICIPANTS CARD ||=========================== //

interface TotalTreatmentData {
  sessions: number;
  sets: number;
  breaths: number;
}

interface TreatmentChanges {
  sessions: number;
  sets: number;
  breaths: number;
}

interface TotalTreatmentCardProps {
  isLoading: boolean;
  totalTreatmentData: TotalTreatmentData;
  dateRange: { startDate: Date; endDate: Date };
  changes: TreatmentChanges;
}

export default function TotalTreatmentCard({ isLoading, totalTreatmentData, dateRange, changes }: TotalTreatmentCardProps) {
  const theme = useTheme();
  const [selectedMetric, setSelectedMetric] = useState('sessions');

  const treatmentOptions = [
    { value: 'sessions', label: 'ACT sessions' },
    { value: 'sets', label: 'Sets' },
    { value: 'breaths', label: 'Breaths' },
  ];

  const getValue = () => totalTreatmentData[selectedMetric as keyof TotalTreatmentData];
  
  // Get the weekly change for the currently selected metric
  const getWeeklyChange = () => {
    if (!changes) return 0;
    return changes[selectedMetric as keyof TreatmentChanges] || 0;
  };

  // Get the appropriate text and color for the weekly change
  const getChangeDisplay = () => {
    const change = getWeeklyChange();
    
    if (change > 0) {
      return {
        text: `+${change} this week`,
        color: '#1EFF00' // Green for positive change
      };
    }

    if (change == 0) {
      return {
        text: `+0 this week`,
        color: '#FFAE00' // Green for positive change
      };
    }
    
    return {
      text: `${change} this week`,
      color: '#FFAE00' // Red for negative change
    };
  };

  const changeDisplay = getChangeDisplay();

  return (
    <>
      {isLoading ? (
        <SkeletonTotalParticipantsCard />
      ) : (
        <MainCard
          border={false}
          content={false}
          sx={{
            bgcolor: theme.palette.mode === ThemeMode.DARK ? 'dark.dark' : 'primary.dark',
            color: '#fff',
            overflow: 'hidden',
            position: 'relative',
            height: '100%',
            minHeight: '180px'
          }}
        >
          <Box
            sx={{
              p: 2.25,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography
                sx={{
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  color: '#fff',
                  mr: 1
                }}
              >
                Number of
              </Typography>
              <TextField
                select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                sx={{
                  '& .MuiInputBase-input': { color: '#000' },
                  '& .MuiSelect-icon': { color: '#000' }
                }}
              >
                {treatmentOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
              <Typography
                sx={{
                  fontSize: '2.125rem',
                  fontWeight: 600,
                  mr: 1,
                  color: '#fff'
                }}
              >
                {getValue()}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: changeDisplay.color
                }}
              >
                {changeDisplay.text}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 400,
                color: theme.palette.mode === ThemeMode.DARK ? 'text.secondary' : 'primary.200'
              }}
            >
              Performed by participants enrolled in study
            </Typography>
          </Box>
        </MainCard>
      )}
    </>
  );
}