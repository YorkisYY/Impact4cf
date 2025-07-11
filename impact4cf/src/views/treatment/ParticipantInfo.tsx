'use client';

// import React from 'react';
import { useRouter } from 'next/navigation'; // Import for router
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'; 
import 'dayjs/locale/en-gb';
// material-ui
// import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import { gridSpacing } from '../../store/constant';
import useAuth from '../../hooks/useAuth';
import { Roles } from '../../utils/constants';
// assets
import WatchLaterTwoToneIcon from '@mui/icons-material/WatchLaterTwoTone';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

dayjs.extend(utc);
dayjs.locale('en-gb');
// ===========================|| DATA WIDGET - USER ACTIVITY CARD ||=========================== //

export interface ParticipantInfoProps {
  isLoading: boolean;
  participantInfo: { 
    username: string; 
    trialStage: string; 
    deviceMode: string; 
    lastSeen: string; 
    lastACT: string 
  };
  dateRange: { startDate: Date; endDate: Date };
  userId: string; 
}

export default function ParticipantInfo({ isLoading, participantInfo, dateRange, userId }: ParticipantInfoProps) {
  const { user } = useAuth();
  const router = useRouter();
    // Handle navigation to prescription details page
    const handleViewPrescriptionDetails = () => {
      if (userId) {
        router.push(`/users/${userId}/basicinfo`);
      } else {
        // If userId is not provided, use a more generic fallback URL
        router.push('/users-list');
        console.warn('UserId not provided for prescription details navigation');
      }
    };


  const iconSX = {
    fontSize: '0.875rem',
    marginRight: 0.2,
    verticalAlign: 'sub'
  };

  /**
   * Get initials from username
   * Takes the username as input
   * Splits it into parts by spaces
   * If there's only one part (single name), returns the first two letters
   * If there are multiple parts, returns first letter of first + first letter of last name
    Converts the result to uppercase
   * @param name 
   * @returns first letter of first name and first letter of last name
   * If there's only one part (single name), returns the first two letters
   * If there are multiple parts, returns first letter of first + first letter of last name

   */
  const getInitials = (name: string): string => {
    if (!name) return 'NA';
    
    // Split the name by spaces
    const nameParts = name.split(' ');
    
    // If only one part, return the first two characters capitalized
    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }
    
    // Return first letter of first name and first letter of last name
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  // Calculate time difference for "X min ago" label
  const getTimeDifference = (dateString: string) => {
    const date = dayjs.utc(dateString);
    const now = dayjs.utc();
    const diffMins = now.diff(date, 'minute');
    
    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  // Badge color based on last seen time
  const getBadgeColor = () => {
    if (!participantInfo.lastACT) return 'error.main';
  
    const lastAct = dayjs(participantInfo.lastACT);
    const now = dayjs();
    const diffHours = now.diff(lastAct, 'hour');
    
    if (diffHours < 12) return 'success.main';
    if (diffHours < 48) return 'warning.main';
    return 'error.main';
  };

  if (isLoading) {
    return (
      <MainCard title="Participant Information" content={false}>
        <CardContent>
          <Typography>Loading participant information...</Typography>
        </CardContent>
      </MainCard>
    );
  }

  return (
    <MainCard title="Participant Information" content={false}>
      <CardContent>
        <Grid container spacing={gridSpacing} sx={{ alignItems: 'center' }}>
          <Grid size={12}>
            <Grid container spacing={2}>
              <Grid>
                <Box sx={{ position: 'relative' }}>
                  <Badge
                    overlap="circular"
                    badgeContent={<FiberManualRecordIcon sx={{ color: getBadgeColor(), fontSize: '0.875rem' }} />}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right'
                    }}
                  >
                    <Avatar color="primary" sx={{ fontSize: '1rem' }}>
                      {getInitials(participantInfo.username)}
                    </Avatar>
                  </Badge>
                </Box>
              </Grid>
              <Grid size="grow">
                <Typography variant="subtitle1">{participantInfo.username}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 0.5 }}>
                  <Typography variant="subtitle2">
                    <strong>Trial stage:</strong> {participantInfo.trialStage}&nbsp;&nbsp;&nbsp;&nbsp;
                    <strong>Device Mode:</strong> {participantInfo.deviceMode}
                  </Typography>
                  {/* <Typography variant="subtitle2">
                    <strong>Last ACT:</strong> {dayjs(participantInfo.lastACT).format('DD MMM YYYY')}
                  </Typography>
                  <Typography variant="subtitle2">
                    <strong>Last Seen:</strong> {dayjs(participantInfo.lastSeen).format('DD MMM YYYY')}
                  </Typography> */}
                </Box>
              </Grid>
              <Grid>
                <Typography variant="caption">
                  <WatchLaterTwoToneIcon sx={iconSX} />
                  {getTimeDifference(participantInfo.lastACT)}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end', pt: 1, pb: 1 }}>
        <Button 
          variant="text" 
          size="small"
          onClick={handleViewPrescriptionDetails}
        >
          {user?.role === Roles.ADMIN || user?.role === Roles.SUPER_USER ? "View & Edit Details" : "View Details"}
        </Button>
      </CardActions>
    </MainCard>
  );
}
