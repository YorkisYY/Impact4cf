'use client';

// material-ui
import { useTheme } from '@mui/material/styles';
// import Avatar from '@mui/material/Avatar';
// import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import { ThemeMode } from 'config';
import MainCard from 'ui-component/cards/MainCard';
import SkeletonTotalParticipantsCard from '@/ui-component/cards/Skeleton/TotalParticipantsCard';

// assets
// import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

// ===========================|| DASHBOARD DEFAULT - TOTAL PARTICIPANTS CARD ||=========================== //

interface TotalActiveParticipantsCardProps {
  isLoading: boolean;
  totalActiveUsers: number;
  dateRange: { startDate: Date; endDate: Date };
  change: number;
}

export default function TotalActiveParticipantsCard({ isLoading, totalActiveUsers, dateRange, change }: TotalActiveParticipantsCardProps) {
  const theme = useTheme();

  // Helper function to format the change value with sign
  const formatChange = () => {
    if (change > 0) {
      return `+${change} this week`;
    } else if (change < 0) {
      return `${change} this week`; // Negative values already have the minus sign
    } else {
      return `+0 this week`;
    }
  };

  // Determine color based on change value
  const getChangeColor = () => {
    if (change > 0) return '#1EFF00'; // Green for positive change
    if (change < 0) return '#FFAE00'; // Red for negative change
    return '#FFAE00';                 // Orange for no change
  };

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
          <Box sx={{ 
            p: 2.25,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between' 
            }}>
            <Typography
              sx={{
                fontSize: '1.1rem',
                fontWeight: 500,
                color: '#fff',
                mb: 1
              }}
            >
              Total Active Participants
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
              <Typography 
                sx={{ 
                  fontSize: '2.125rem', 
                  fontWeight: 600, 
                  mr: 1,
                  color: '#fff'
                }}
              >
                {totalActiveUsers}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: getChangeColor()
                }}
              >
                {formatChange()}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 400,
                color: theme.palette.mode === ThemeMode.DARK ? 'text.secondary' : 'primary.200'
              }}
            >
              Participants who have recorded at least one ACT session this week
            </Typography>
          </Box>
        </MainCard>
      )}
    </>
  );
}
