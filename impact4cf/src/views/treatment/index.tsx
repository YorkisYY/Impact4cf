'use client';
// import * as React from 'react';
import { useState } from 'react';
import { authFetcherWithRedirect } from '@/utils/withAuthRedirect';
// material-ui
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import CustomBreadcrumbs from '@/ui-component/extended/CustomBreadcrumbs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc'; 
import 'dayjs/locale/en-gb';
// project imports
import CustomDateRangePicker from './CustomDateRangePicker';
import DaysList from './DaysList';
import ParticipantInfo from './ParticipantInfo';
import PrescriptionInfo from './PrescriptionInfo';

// theme imports
import { useTheme } from '@mui/material/styles';
import { ThemeMode } from 'config';

// types
import { ExhaleWithContext } from 'types';
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.locale('en-gb');
// ==============================|| PARTICIPANT INFO ||============================== //

interface ParticipantInfoType {
  username: string;
  trialStage: string;
  deviceMode: string;
  lastSeen: string;
  lastACT: string;
}

interface PrescriptionInfoType {
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

interface TreatmentInfoType {
  date: string;
  actSessions: number; // all sessions for the day
  sets: number; // all sets for the day
  breaths: number; // all breaths for the day
  breathData: ExhaleWithContext[]; // Use the imported ExhaleWithContext type
}

interface ParticipantInfoInitialData {
  participantInfo: ParticipantInfoType;
  prescriptionInfo: PrescriptionInfoType[]; // Change to always be an array
  participantTreatmentInfo: TreatmentInfoType[];
  dateRange: { startDate: Date; endDate: Date };
}

export interface ProfileProps {
  initialData: ParticipantInfoInitialData;
  userId: string; 
}
  
// ==============================|| PROFILE ||============================== //

export default function Profile({ initialData, userId }: ProfileProps) {
  const [isLoading, setLoading] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: dayjs.utc(initialData.dateRange.startDate).toDate(),
    endDate: dayjs.utc(initialData.dateRange.endDate).toDate()
  });
  const [currentParticipantInfo, setCurrentParticipantInfo] = useState(initialData.participantInfo);
  const [currentPrescriptionInfo, setCurrentPrescriptionInfo] = useState<PrescriptionInfoType[]>(initialData.prescriptionInfo);
  const [currentTreatmentInfo, setCurrentTreatmentInfo] = useState(initialData.participantTreatmentInfo);
  
  const theme = useTheme();
  
  /**
   * Handles the change in date range and fetches new data based on the selected date range.
   */
  const handleDateRangeChange = async (dateRange: { startDate: Date; endDate: Date } | null) => {
    if (!dateRange) return;

    setLoading(true);
    try {
      // Format dates for API
      const startDateFormatted = dayjs.utc(dateRange.startDate).format('YYYY-MM-DD');
      const endDateFormatted = dayjs.utc(dateRange.endDate).format('YYYY-MM-DD');
      
      // Fetch participant data from API
      const userResponse = await authFetcherWithRedirect(`api/users/${userId}`);
      const userData = userResponse;
      if (!userData) {
        // Authentication failed and redirected, just return
        return;
      }
      // Convert API data structure to our component's expected format
      const updatedParticipantInfo = {
        username: userData.name || "User",
        trialStage: userData.trialStage,
        deviceMode: userData.deviceMode || "Unknown",
        lastSeen: userData.lastActive,
        lastACT: userData.lastTreatment
      };
      
      // First, get all days with treatment data in the date range
      const daysData = await authFetcherWithRedirect(`api/treatments/${userId}/days?startDate=${startDateFormatted}&endDate=${endDateFormatted}`);
      if (!daysData) {
        // Authentication failed and redirected, just return
        return;
      }
      console.log("Fetched days with treatment data:", daysData);
      
      // If no days with treatment data, get the user's current prescription
      if (daysData.length === 0) {
        try {
          const prescriptionResponse = await authFetcherWithRedirect(`api/prescriptions/user/${userId}`);
          if (prescriptionResponse) {
            const prescriptionData = prescriptionResponse;
            
            // Use the current prescription data
            const updatedPrescriptionInfo = [{
              id: prescriptionData.uid,
              username: updatedParticipantInfo.username,
              actSessionsPerDay: prescriptionData.sessionsPerDay,
              setsPerACTSession: prescriptionData.setsPerSession,
              breathsPerSet: prescriptionData.exhalesPerSet,
              breathLength: prescriptionData.exhaleDuration,
              breathPressureTarget: prescriptionData.exhaleTargetPressure,
              breathPressureRange: prescriptionData.exhaleTargetRange
            }];
            
            setCurrentParticipantInfo(updatedParticipantInfo);
            setCurrentPrescriptionInfo(updatedPrescriptionInfo);
            setCurrentTreatmentInfo([]);
            setSelectedDateRange(dateRange);
            setLoading(false);
            return;
          }
        } catch (error: any) {
          if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
          console.error('Error fetching user prescription data:', error);
        }
      }
      
      // Track prescriptions by ID to avoid duplicate fetches
      const prescriptionsMap = new Map<string, PrescriptionInfoType>();
      // Track which days use which prescription
      const prescriptionDays = new Map<string, { firstDay: string, lastDay: string }>();
      
      // For each day that has treatment data, fetch detailed activity using new endpoint
      const treatmentPromises = daysData.map(async (day: any) => {
        // Extract the date portion only (YYYY-MM-DD)
        const dayDate = dayjs.utc(day.date).format('YYYY-MM-DD');
        
        try {
          // Use the new API endpoint that includes all data in one call
          const dayDetailsResponse = await authFetcherWithRedirect(
            `api/treatments/${userId}/days/${dayDate}?include=treatmentSessions,treatmentSets,treatmentExhales,treatmentExhaleGaps,values`
          );
          
          console.log(`Fetched all data for day ${dayDate}:`, dayDetailsResponse);
          
          // Get prescription data if treatment sessions exist
          if (dayDetailsResponse?.treatmentSessions && dayDetailsResponse.treatmentSessions.length > 0 && 
              dayDetailsResponse.treatmentSessions[0].prescriptionId) {
                
            const prescriptionId = dayDetailsResponse.treatmentSessions[0].prescriptionId;
            
            // Fetch prescription data based on the prescription Id from this day's first session information
            if (!prescriptionsMap.has(prescriptionId)) {
              const prescriptionResponse = await authFetcherWithRedirect(`api/prescriptions/${prescriptionId}`);
              if (prescriptionResponse) {
                const prescriptionData = {
                  id: prescriptionId,
                  username: updatedParticipantInfo.username,
                  actSessionsPerDay: prescriptionResponse.sessionsPerDay,
                  setsPerACTSession: prescriptionResponse.setsPerSession,
                  breathsPerSet: prescriptionResponse.exhalesPerSet,
                  breathLength: prescriptionResponse.exhaleDuration,
                  breathPressureTarget: prescriptionResponse.exhaleTargetPressure,
                  breathPressureRange: prescriptionResponse.exhaleTargetRange,
                  appliedFrom: dayDate,
                  appliedTo: dayDate
                };
                prescriptionsMap.set(prescriptionId, prescriptionData);
                prescriptionDays.set(prescriptionId, { firstDay: dayDate, lastDay: dayDate });
              }
            } else {
              // Update the date range for this prescription
              const currentRange = prescriptionDays.get(prescriptionId)!;
              // Update first day if this day is earlier
              if (dayDate < currentRange.firstDay) {
                currentRange.firstDay = dayDate;
              }
              // Update last day if this day is later
              if (dayDate > currentRange.lastDay) {
                currentRange.lastDay = dayDate;
              }
              prescriptionDays.set(prescriptionId, currentRange);
            }
          }
          
          // Process breath data from the response
          let breathData: ExhaleWithContext[] = [];
          
          // If we have valid treatment sessions
          if (dayDetailsResponse?.treatmentSessions && dayDetailsResponse.treatmentSessions.length > 0) {
            dayDetailsResponse.treatmentSessions.forEach((session: any) => {
              if (session.treatmentSets && session.treatmentSets.length > 0) {
                session.treatmentSets.forEach((set: any) => {
                  // Process exhales
                  if (set.treatmentExhales && set.treatmentExhales.length > 0) {
                    const exhalesWithContext = set.treatmentExhales.map((exhale: any) => ({
                      ...exhale,
                      sessionId: session.uid,
                      setId: set.uid,
                      sequenceType: 'exhale', // Mark as exhale for visualization
                      isGap: false
                    })) as ExhaleWithContext[];
                    
                    breathData = [...breathData, ...exhalesWithContext];
                  }
                  
                  // Process gaps between exhales
                  if (set.treatmentExhaleGaps && set.treatmentExhaleGaps.length > 0) {
                    const gapsWithContext = set.treatmentExhaleGaps.map((gap: any) => ({
                      ...gap,
                      sessionId: session.uid,
                      setId: set.uid,
                      sequenceNumber: gap.sequenceNum, // Normalize property name
                      sequenceType: 'gap', // Mark as gap for visualization
                      isGap: true
                    })) as ExhaleWithContext[];
                    
                    breathData = [...breathData, ...gapsWithContext];
                  }
                });
              }
            });
          }
          
          // Get activity counts from the response
          return {
            date: dayDate,
            actSessions: dayDetailsResponse.totalSessions || 0,
            sets: dayDetailsResponse.totalSets || 0,
            breaths: dayDetailsResponse.totalExhales || 0,
            breathData: breathData
          };
        } catch (error: any) {
          if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
          console.warn(`Error fetching details for day ${dayDate}:`, error);
          // Fall back to basic data from the days API response
          return {
            date: dayDate,
            actSessions: day.totalSessions || 0,
            sets: day.totalSets || 0,
            breaths: day.totalExhales || 0,
            breathData: [] as ExhaleWithContext[]
          };
        }
      });
      
      // Wait for all day detail fetches to complete
      const updatedTreatmentInfo = await Promise.all(treatmentPromises);
      console.log("Processed treatment data for all days:", updatedTreatmentInfo);
      
      // Update prescription dates with the date ranges they apply to
      const prescriptionsList: PrescriptionInfoType[] = [];
      prescriptionsMap.forEach((prescription, id) => {
        const days = prescriptionDays.get(id);
        if (days) {
          prescription.appliedFrom = days.firstDay;
          prescription.appliedTo = days.lastDay;
          prescriptionsList.push(prescription);
        }
      });
      
      // If we have prescription data, set it
      const updatedPrescriptionInfo = prescriptionsList.length > 0 
          ? prescriptionsList 
          : [{ 
                username: updatedParticipantInfo.username,
                actSessionsPerDay: 0, 
                setsPerACTSession: 0, 
                breathsPerSet: 0, 
                breathLength: 0, 
                breathPressureTarget: 0, 
                breathPressureRange: 0
            }];
      
      setCurrentParticipantInfo(updatedParticipantInfo);
      setCurrentPrescriptionInfo(updatedPrescriptionInfo);
      setCurrentTreatmentInfo(updatedTreatmentInfo);
      setSelectedDateRange(dateRange);
      
    } catch (error: any) {
      if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          bgcolor: theme.palette.mode === ThemeMode.DARK ? 'dark.main' : theme.palette.background.paper,
          pt: 0.3,
          pb: 0.3,
          px: 2,
          borderRadius: 1,
          borderColor: theme.palette.divider,
        }}
      >
        <CustomBreadcrumbs
          custom={true}
          titleBottom
          card={false} 
          sx={{ mb: '0px !important' }}
          links={[
            { title: 'Users', to: '/users-list' },
            { title: initialData.participantInfo.username },
          ]}
        />
        
        <Box sx={{ width: 'auto', minWidth: 'fit-content' }}>
          <CustomDateRangePicker
            onDateRangeChange={handleDateRangeChange}
            initialDateRange={initialData.dateRange}
          />
        </Box>
      </Box>
      
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <DaysList
            isLoading={isLoading}
            treatmentInfo={currentTreatmentInfo}
            prescriptionInfo={currentPrescriptionInfo}
            dateRange={selectedDateRange}
            userId={userId} 
          />
        </Grid>
        
        <Grid size={{ xs: 12, md: 5 }}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <ParticipantInfo
                isLoading={isLoading}
                participantInfo={currentParticipantInfo}
                dateRange={selectedDateRange}
                userId={userId} 
              />
            </Grid>
            
            <Grid size={12}>
              <PrescriptionInfo
                isLoading={isLoading}
                PrescriptionInfo={currentPrescriptionInfo}
                dateRange={selectedDateRange}
                userId={userId} 
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}