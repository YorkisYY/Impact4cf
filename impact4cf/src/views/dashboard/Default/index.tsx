'use client';

import { useState } from 'react';
import { useTheme } from '@mui/material/styles';

// material-ui
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import CustomBreadcrumbs from 'ui-component/extended/CustomBreadcrumbs';
import { ThemeMode } from 'config';

// project imports
import TotalParticipantsCard from './TotalParticipantsCard';
import TotalActiveParticipantsCard from './TotalActiveParticipantsCard';
import TotalInactiveParticipantsCard from './TotalInactiveParticipantsCard';
import TotalTreatmentCard from './TotalTreatmentCard';
import { AllParticipantsGraph } from './AllParticipantsGraph';
import { IndividualParticipantGraph } from './IndividualParticipantGraph';

import CustomDateRangePicker from './CustomDateRangePicker'; 
import { authFetcherWithRedirect } from '@/utils/withAuthRedirect';


import { gridSpacing } from 'store/constant';

// ==============================|| DEFAULT DASHBOARD ||============================== //

interface DashboardInitialData {
  totalUsers: number;
  totalActiveUsers: number;
  totalInactiveUsers: number;
  dateRange: { startDate: Date; endDate: Date };
  totalTreatmentData: {
    sessions: number;
    sets: number;
    breaths: number;
  };
  changes: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    sessions: number;
    sets: number;
    breaths: number;
  };
  users: any[];
  participantsDaily: Array<{
    date: string;
    data: {
      sessions: number;
      sets: number;
      breaths: number;
    }
  }>;
  defaultParticipant: any;
  defaultParticipantData: {
    days: Array<{
      date: string;
      data: {
        sessions: number;
        sets: number;
        breaths: number;
      }
    }>;
    prescription: any;
  };
  averagePrescribed: {
    sessions: number;
    sets: number;
    breaths: number;
  };
}

export interface DefaultDashboardProps {
  initialData: DashboardInitialData;
}

export default function DefaultDashboard({ initialData }: DefaultDashboardProps) {
  const [isLoading, setLoading] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState(initialData.dateRange);
  const [currentTotalUsers, setCurrentTotalUsers] = useState(initialData.totalUsers);
  const [currentActiveUsers, setCurrentActiveUsers] = useState(initialData.totalActiveUsers);
  const [currentInactiveUsers, setCurrentInactiveUsers] = useState(initialData.totalInactiveUsers);
  const [currentTreatmentData, setCurrentTreatmentData] = useState(initialData.totalTreatmentData);
  const [weeklyChanges, setWeeklyChanges] = useState(initialData.changes);
  const [averagePrescribed] = useState(initialData.averagePrescribed);
  const [users] = useState(initialData.users);
  const [participantsDaily, setParticipantsDaily] = useState(initialData.participantsDaily);
  const [selectedParticipant, setSelectedParticipant] = useState(initialData.defaultParticipant);
  const [participantData, setParticipantData] = useState(initialData.defaultParticipantData);
  const theme = useTheme();

  /**
   * Handles the change in date range and fetches new data based on the selected date range.
   */
  const handleDateRangeChange = async (dateRange: { startDate: Date; endDate: Date } | null) => {
    if (!dateRange) return;

    setLoading(true);
    try {
      // Calculate previous period (same duration as selected period, but prior to it)
      const selectedDuration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
      const prevPeriodEndDate = new Date(dateRange.startDate);
      prevPeriodEndDate.setDate(prevPeriodEndDate.getDate() - 1); // Day before start date
      const prevPeriodStartDate = new Date(prevPeriodEndDate);
      prevPeriodStartDate.setTime(prevPeriodStartDate.getTime() - selectedDuration);

      // Format dates for API request
      const formattedStartDate = dateRange.startDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const formattedEndDate = dateRange.endDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const formattedPrevStartDate = prevPeriodStartDate.toISOString().split('T')[0];
      const formattedPrevEndDate = prevPeriodEndDate.toISOString().split('T')[0];

      // Fetch data for current period and previous period
      const [currentPeriodData, previousPeriodData] = await Promise.all([
        authFetcherWithRedirect(`api/analytics/participants?startDate=${formattedStartDate}&endDate=${formattedEndDate}`),
        authFetcherWithRedirect(`api/analytics/participants?startDate=${formattedPrevStartDate}&endDate=${formattedPrevEndDate}`)
      ]);

      if (!currentPeriodData || !previousPeriodData) {
        // Authentication failed and redirected, or API response is invalid
        return;
      }

      // Calculate period-over-period changes
      const changes = {
        totalUsers: currentPeriodData.participants.total - previousPeriodData.participants.total,
        activeUsers: currentPeriodData.participants.active - previousPeriodData.participants.active,
        inactiveUsers: currentPeriodData.participants.inactive - previousPeriodData.participants.inactive,
        sessions: currentPeriodData.activity.totalSessions - previousPeriodData.activity.totalSessions,
        sets: currentPeriodData.activity.totalSets - previousPeriodData.activity.totalSets,
        breaths: currentPeriodData.activity.totalBreaths - previousPeriodData.activity.totalBreaths
      };

      // Fetch daily data for all participants graph
      const days = [];
      const startDate = new Date(dateRange.startDate);
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const formattedDate = currentDate.toISOString().split('T')[0];
        
        // Fetch data for this specific day
        const dayResponse = await authFetcherWithRedirect(
          `api/analytics/participants?startDate=${formattedDate}&endDate=${formattedDate}`
        );
        
        if (!dayResponse) continue;
        
        days.push({
          date: formattedDate,
          data: {
            sessions: dayResponse.activity.totalSessions || 0,
            sets: dayResponse.activity.totalSets || 0,
            breaths: dayResponse.activity.totalBreaths || 0
          }
        });
      }

      // Fetch data for the currently selected participant
      const updatedParticipantData: {
        days: Array<{
          date: string;
          data: {
            sessions: number;
            sets: number;
            breaths: number;
          }
        }>;
        prescription: any;
      } = { 
        days: [], 
        prescription: participantData.prescription 
      };
      
      if (selectedParticipant) {
        const userDays: Array<{
          date: string;
          data: {
            sessions: number;
            sets: number;
            breaths: number;
          }
        }> = [];
        
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          const formattedDate = currentDate.toISOString().split('T')[0];
          
          const dayResponse = await authFetcherWithRedirect(
            `api/analytics/users/${selectedParticipant.uid}/activity?startDate=${formattedDate}&endDate=${formattedDate}`
          );
          
          if (!dayResponse) continue;
          
          userDays.push({
            date: formattedDate,
            data: {
              sessions: dayResponse.activity.totalSessions || 0,
              sets: dayResponse.activity.totalSets || 0,
              breaths: dayResponse.activity.totalBreaths || 0
            }
          });
        }
        
        updatedParticipantData.days = userDays;
      }

      // Update state with real data from API and the calculated changes
      setCurrentTotalUsers(currentPeriodData.participants.total);
      setCurrentActiveUsers(currentPeriodData.participants.active);
      setCurrentInactiveUsers(currentPeriodData.participants.inactive);
      setCurrentTreatmentData({
        sessions: currentPeriodData.activity.totalSessions,
        sets: currentPeriodData.activity.totalSets,
        breaths: currentPeriodData.activity.totalBreaths
      });
      setSelectedDateRange({
        startDate: new Date(currentPeriodData.dateRange.startDate),
        endDate: new Date(currentPeriodData.dateRange.endDate)
      });
      setWeeklyChanges(changes);
      setParticipantsDaily(days);
      setParticipantData(updatedParticipantData);
    } catch (error: any) {
      if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle participant selection for individual graph
  const handleParticipantChange = async (participant: any, onComplete?: () => void) => {
    if (!participant || participant.uid === selectedParticipant?.uid) {
      if (onComplete) onComplete(); 
      return;
    }

    try {
      // Fetch prescription for selected user
      const userPrescription = await authFetcherWithRedirect(`api/prescriptions/user/${participant.uid}`);
      
      // Fetch daily activity data for selected user
      const userDays: Array<{
        date: string;
        data: {
          sessions: number;
          sets: number;
          breaths: number;
        }
      }> = [];
      const startDate = new Date(selectedDateRange.startDate);
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const formattedDate = currentDate.toISOString().split('T')[0];
        
        const dayResponse = await authFetcherWithRedirect(
          `api/analytics/users/${participant.uid}/activity?startDate=${formattedDate}&endDate=${formattedDate}`
        );
        
        if (!dayResponse) continue;
        
        userDays.push({
          date: formattedDate,
          data: {
            sessions: dayResponse.activity.totalSessions || 0,
            sets: dayResponse.activity.totalSets || 0,
            breaths: dayResponse.activity.totalBreaths || 0
          }
        });
      }
      
      setSelectedParticipant(participant);
      setParticipantData({
        days: userDays,
        prescription: userPrescription
      });
    } catch (error: any) {
      if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
      console.error('Error fetching participant data:', error);
    } finally {
      if (onComplete) onComplete();
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2.5,
          bgcolor: theme.palette.mode === ThemeMode.DARK ? 'dark.main' : theme.palette.background.paper,
          pt: 0.3,
          pb: 0.3,
          px: 2,
          borderRadius: 1,
          borderColor: theme.palette.divider
        }}
      >
        <CustomBreadcrumbs
          custom={true}
          titleBottom
          card={false}
          sx={{ mb: '0px !important' }}
          links={[{ title: 'Overview', to: '/dashboard/default' }]}
        />

        <Box sx={{ width: 'auto', minWidth: 'fit-content' }}>
          <CustomDateRangePicker onDateRangeChange={handleDateRangeChange} initialDateRange={initialData.dateRange} />
        </Box>
      </Box>

      <Grid container spacing={gridSpacing} key="dashboard-main">
        <Grid key="stats-container" size={24}>
          <Grid container spacing={gridSpacing} key="stats-grid">
            <Grid key="total-participants" size={{ lg: 3, md: 4, sm: 6, xs: 12 }}>
              <TotalParticipantsCard
                isLoading={isLoading}
                totalUsers={currentTotalUsers}
                dateRange={selectedDateRange}
                change={weeklyChanges.totalUsers}
              />
            </Grid>
            <Grid key="active-participants" size={{ lg: 3, md: 4, sm: 6, xs: 12 }}>
              <TotalActiveParticipantsCard
                isLoading={isLoading}
                totalActiveUsers={currentActiveUsers}
                dateRange={selectedDateRange}
                change={weeklyChanges.activeUsers}
              />
            </Grid>
            <Grid key="inactive-participants" size={{ lg: 3, md: 4, sm: 6, xs: 12 }}>
              <TotalInactiveParticipantsCard
                isLoading={isLoading}
                totalInactiveUsers={currentInactiveUsers}
                dateRange={selectedDateRange}
                change={weeklyChanges.inactiveUsers}
              />
            </Grid>
            <Grid key="treatment-card" size={{ lg: 3, md: 4, sm: 6, xs: 12 }}>
              <TotalTreatmentCard
                isLoading={isLoading}
                totalTreatmentData={currentTreatmentData}
                dateRange={selectedDateRange}
                changes={{
                  sessions: weeklyChanges.sessions,
                  sets: weeklyChanges.sets,
                  breaths: weeklyChanges.breaths
                }}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid key="charts-container" size={24}>
          <Grid container spacing={gridSpacing} key="charts-grid">
            <Grid key="all-participants-graph" size={{ xs: 12, md: 6 }}>
              <AllParticipantsGraph 
                isLoading={isLoading} 
                dateRange={selectedDateRange} 
                participantsDaily={participantsDaily}
                averagePrescribed={averagePrescribed}
              />
            </Grid>
            <Grid key="individual-participant-graph" size={{ xs: 12, md: 6 }}>
              <IndividualParticipantGraph 
                isLoading={isLoading} 
                dateRange={selectedDateRange} 
                users={users}
                selectedParticipant={selectedParticipant}
                participantData={participantData}
                onParticipantChange={handleParticipantChange}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}