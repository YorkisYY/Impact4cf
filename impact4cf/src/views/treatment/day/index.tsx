'use client';
// import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// material-ui
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import CustomBreadcrumbs from '@/ui-component/extended/CustomBreadcrumbs';
import { useTheme } from '@mui/material/styles';
import { ThemeMode } from 'config';

// antd date picker
import { DatePicker, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc'; 
import 'dayjs/locale/en-gb';

// project imports
import ParticipantInfo from '../ParticipantInfo';
import PrescriptionInfo from '../PrescriptionInfo';
import DayInfo from './DayInfo';
import SessionsList from './SessionsList';
import { authFetcherWithRedirect } from '@/utils/withAuthRedirect';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.locale('en-gb');
// ==============================|| INTERFACES ||============================== //

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
}

interface TreatmentInfoType {
  date: string;
  actSessions: number;
  sets: number;
  breaths: number;
}

interface SessionInfoType {
  id: string; // Real UID for API calls
  displayId?: string; // For display in UI
  index?: number; // Numeric index
  duration: number;
  sets: number;
  breaths: number;
  startTime?: Date;
  endTime?: Date;
}

interface DayViewInitialData {
  participantInfo: ParticipantInfoType;
  prescriptionInfo: PrescriptionInfoType;
  participantTreatmentInfo: TreatmentInfoType[];
  sessionInfo: SessionInfoType[];
  breathData: any[];
  date: Date;
}

export interface ProfileProps {
  initialData: DayViewInitialData;
  userId: string;
  date: string;
}

// Interface for API data
interface SessionData {
  uid: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalSets?: number;
  totalExhales?: number;
  treatmentSets?: SetData[];
}

interface SetData {
  uid: string;
  sessionId: string;
  startTime: string;
  endTime: string;
  duration: number;
  treatmentExhales?: any[];
  treatmentExhaleGaps?: any[];
}

// ==============================|| DAY PROFILE ||============================== //

export default function Profile({ initialData, userId, date: dateStringFromUrl }: ProfileProps) {
  const router = useRouter();
  const theme = useTheme();
  const [isLoading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(
    () => {
      if (dateStringFromUrl) {
        const initialUtcDayStart = dayjs.utc(dateStringFromUrl, 'YYYY-MM-DD');
        return initialUtcDayStart.isValid() ? initialUtcDayStart : dayjs.utc(); 
      }
      return dayjs.utc(); 
    }
);
  const [currentParticipantInfo, setCurrentParticipantInfo] = useState(initialData.participantInfo);
  const [currentPrescriptionInfo, setCurrentPrescriptionInfo] = useState(initialData.prescriptionInfo);
  const [currentTreatmentInfo, setCurrentTreatmentInfo] = useState(initialData.participantTreatmentInfo);
  const [currentSessionInfo, setCurrentSessionInfo] = useState(initialData.sessionInfo);
  const [breathData, setBreathData] = useState<any[]>(initialData.breathData || []);
  const [fetchingBreathData, setFetchingBreathData] = useState(true);
  const dateFormatList = ['DD-MM-YYYY', 'DD/MM/YYYY', 'DD/MM/YY', 'DD-MM-YY'];

  /**
 * Consolidated function to fetch and process all data for a given date
 */
  const fetchAllDataForDate = useCallback(async (userId: string, date: string, options = {
      updateParticipantInfo: false,
      updateUrl: false,
    }) => {
      try {
        if (options.updateParticipantInfo) setLoading(true);
        setFetchingBreathData(true);
        
        // Update URL if needed
        if (options.updateUrl) {
          router.replace(`/${userId}/all/${date}`);
        }

        // 1. Fetch participant info if needed
        if (options.updateParticipantInfo) {
          const userResponse = await authFetcherWithRedirect(`api/users/${userId}`);
          if (!userResponse) return; // Authentication failed and redirected
          
          const newParticipantInfo = {
            username: userResponse.name || "User",
            trialStage: userResponse.trialStage,
            deviceMode: userResponse.deviceMode || "Unknown",
            lastSeen: userResponse.lastActive,
            lastACT: userResponse.lastTreatment
          };
          setCurrentParticipantInfo(newParticipantInfo);
        }

        // 2. Fetch all treatment data with consolidated API
        const dayResponse = await authFetcherWithRedirect(
          `api/treatments/${userId}/days/${date}?include=treatmentSessions,treatmentSets,treatmentExhales,treatmentExhaleGaps,values`
        );
        
        if (!dayResponse) return; // Authentication failed and redirected
        
        if (!dayResponse.treatmentSessions || dayResponse.treatmentSessions.length === 0) {
          console.log("No sessions found for this day");
          setBreathData([]);
          setCurrentSessionInfo([]);
          
          if (options.updateParticipantInfo) {
            // Set default treatment info
            const newTreatmentInfo = [{
              date: date,
              actSessions: 0,
              sets: 0,
              breaths: 0,
            }];
            setCurrentTreatmentInfo(newTreatmentInfo);
            
            // Try to fetch prescription as fallback
            try {
              const newPrescriptionInfo = await fetchUserPrescriptionAsFallback(userId);
              if (newPrescriptionInfo) {
                setCurrentPrescriptionInfo(newPrescriptionInfo);
              }
            } catch (error: any) {
              if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
              console.error("Error fetching prescription data:", error);
            }
          }
          return;
        }
        
        console.log(`Found ${dayResponse.treatmentSessions.length} sessions`);
        console.log(`Total sessions: ${dayResponse.totalSessions}, sets: ${dayResponse.totalSets}, breaths: ${dayResponse.totalExhales}`);
        
        // 3. Update treatment summary if needed
        if (options.updateParticipantInfo) {
          const newTreatmentInfo = [{
            date: date,
            actSessions: dayResponse.totalSessions || 0,
            sets: dayResponse.totalSets || 0,
            breaths: dayResponse.totalExhales || 0,
          }];
          setCurrentTreatmentInfo(newTreatmentInfo);
          
          // 4. Fetch prescription data if needed
          if (dayResponse.treatmentSessions[0]?.prescriptionId) {
            const prescriptionId = dayResponse.treatmentSessions[0].prescriptionId;
            console.log(`Found prescriptionId ${prescriptionId} from session data`);
            
            try {
              const prescriptionResponse = await authFetcherWithRedirect(`api/prescriptions/${prescriptionId}`);
              const prescriptionData = prescriptionResponse;
              const userResponse = await authFetcherWithRedirect(`api/users/${userId}`);
              const username = userResponse.name || "User";
              const newPrescriptionInfo = {
                username: username,
                actSessionsPerDay: prescriptionData.sessionsPerDay,
                setsPerACTSession: prescriptionData.setsPerSession,
                breathsPerSet: prescriptionData.exhalesPerSet,
                breathLength: prescriptionData.exhaleDuration,
                breathPressureTarget: prescriptionData.exhaleTargetPressure,
                breathPressureRange: prescriptionData.exhaleTargetRange
              };
              setCurrentPrescriptionInfo(newPrescriptionInfo);
            } catch (error: any) {
              if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
              console.error('Error fetching session prescription:', error);
              await fetchUserPrescriptionAsFallback(userId)
                .then(newPrescriptionInfo => {
                  if (newPrescriptionInfo) setCurrentPrescriptionInfo(newPrescriptionInfo);
                })
                .catch(error => {
                  if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
                });
            }
          } else {
            console.log('No session prescription found, falling back to user prescription');
            await fetchUserPrescriptionAsFallback(userId)
              .then(newPrescriptionInfo => {
                if (newPrescriptionInfo) setCurrentPrescriptionInfo(newPrescriptionInfo);
              })
              .catch(error => {
                if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
              });
          }
          
          // 5. Process session information
          const processedSessions = dayResponse.treatmentSessions.map((session: SessionData, index:number) => ({
            id: session.uid,
            displayId: `Session ${index + 1}`,
            index: index + 1,
            duration: Math.round(session.duration / 1000),
            sets: session.totalSets || 0,
            breaths: session.totalExhales || 0,
            startTime: new Date(session.startTime),
            endTime: new Date(session.endTime)
          }));
          
          setCurrentSessionInfo(processedSessions);
        }
        
        // 6. Process breath data (common to both functions)
        let allBreathData: any[] = [];
        
        dayResponse.treatmentSessions.forEach((session: SessionData) => {
          if (session.treatmentSets && session.treatmentSets.length > 0) {
            session.treatmentSets.forEach((set: SetData) => {
              // Process exhales
              if (set.treatmentExhales && set.treatmentExhales.length > 0) {
                const exhalesWithContext = set.treatmentExhales.map((exhale: any) => ({
                  ...exhale,
                  sessionId: session.uid,
                  sessionStartTime: session.startTime,
                  setId: set.uid,
                  setStartTime: set.startTime,
                  sequenceType: 'exhale',
                  isGap: false
                }));
                
                allBreathData = [...allBreathData, ...exhalesWithContext];
              }
              
              // Process gaps between exhales
              if (set.treatmentExhaleGaps && set.treatmentExhaleGaps.length > 0) {
                const gapsWithContext = set.treatmentExhaleGaps.map((gap: any) => ({
                  ...gap,
                  sessionId: session.uid,
                  sessionStartTime: session.startTime,
                  setId: set.uid,
                  setStartTime: set.startTime,
                  sequenceNumber: gap.sequenceNum || gap.sequenceNumber,
                  sequenceType: 'gap',
                  isGap: true
                }));
                
                allBreathData = [...allBreathData, ...gapsWithContext];
              }
            });
          }
        });
        
        console.log(`Total breath items collected: ${allBreathData.length}`);
        setBreathData(allBreathData);
        
      } catch (error: any) {
        if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
        console.error("Error fetching data:", error);
        
        if (options.updateParticipantInfo) {
          setCurrentSessionInfo([]);
          setBreathData([]);
          
          // Set default treatment info on error
          const newTreatmentInfo = [{
            date: date,
            actSessions: 0,
            sets: 0,
            breaths: 0,
          }];
          setCurrentTreatmentInfo(newTreatmentInfo);
          
          // Try to fetch prescription as fallback
          try {
            const newPrescriptionInfo = await fetchUserPrescriptionAsFallback(
              userId
            );
            if (newPrescriptionInfo) {
              setCurrentPrescriptionInfo(newPrescriptionInfo);
            }
          } catch (error: any) {
            if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
            console.error("Error fetching prescription data:", error);
          }
        }
      } finally {
        setFetchingBreathData(false);
        if (options.updateParticipantInfo) setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      // // Include all state variables used inside the function
      // router,
      // setCurrentParticipantInfo,
      // setCurrentPrescriptionInfo,
      // setCurrentSessionInfo,
      // setCurrentTreatmentInfo,
      // setBreathData,
      // setLoading,
      // setFetchingBreathData 
    ]);

  /**
   * Check if breath data needs to be loaded client-side
   */
  useEffect(() => {
    // If we have minimal data from server-side, fetch complete data client-side
    if (!initialData.breathData || initialData.breathData.length < 2) {
      const formattedDate = dayjs.utc(dateStringFromUrl).format('YYYY-MM-DD');
      fetchAllDataForDate(userId, formattedDate, {
        updateParticipantInfo: false,
        updateUrl: false
      });
    } else {
      setFetchingBreathData(false);
    }
  }, [initialData.breathData, userId, dateStringFromUrl, fetchAllDataForDate]);


  /**
   * Fetch current prescription data as fallback
   */
  const fetchUserPrescriptionAsFallback = async (userId: string) => {
    try {
      // First fetch user data to get the username
      const userResponse = await authFetcherWithRedirect(`api/users/${userId}`);
      const username = userResponse.name || "User";
      
      // Then fetch prescription data
      const prescriptionResponse = await authFetcherWithRedirect(`api/prescriptions/user/${userId}`);
      const prescriptionData = prescriptionResponse;
      
      return {
        username: username,
        actSessionsPerDay: prescriptionData.sessionsPerDay,
        setsPerACTSession: prescriptionData.setsPerSession,
        breathsPerSet: prescriptionData.exhalesPerSet,
        breathLength: prescriptionData.exhaleDuration,
        breathPressureTarget: prescriptionData.exhaleTargetPressure,
        breathPressureRange: prescriptionData.exhaleTargetRange
      };
    } catch (error: any) {
      if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
      console.error("Error fetching prescription data:", error);
      return null;
    }
  };

  /**
   * Fetch all data when selected date changes
   */
  useEffect(() => {
    // Skip initial load as we already have server-side data
    const isInitialLoad = dayjs.utc(dateStringFromUrl).format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD');
    if (isInitialLoad) return;
    const formattedDate = selectedDate.format('YYYY-MM-DD');
    fetchAllDataForDate(userId, formattedDate, {
      updateParticipantInfo: true, 
      updateUrl: true
    });
  }, [selectedDate, userId, dateStringFromUrl, fetchAllDataForDate]); 

  /**
   * Handles the change in date
   */
  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (!date) return;
    const dateString = date.format('YYYY-MM-DD'); 
    const utcDayStart = dayjs.utc(dateString, 'YYYY-MM-DD');
    setSelectedDate(utcDayStart);
    // The useEffect will trigger data fetching
  };
  console.log('Passing date to DayInfo:', selectedDate.toDate()); 
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
            { title: initialData.participantInfo.username, to: `/${userId}/all` },
            { title: 'ACT Sessions' }
          ]}
        />
        
        <Box sx={{ width: 'auto', minWidth: 'fit-content' }}>
          <ConfigProvider
            theme={{
              components: {
                DatePicker: {
                  cellHeight: 24,
                  cellWidth: 24,
                  fontSize: 14,
                  controlHeight: 38,
                  controlItemBgActive: '#e8f4ff',
                }
              }
            }}
          >
            <DatePicker
              value={selectedDate}
              onChange={handleDateChange}
              format={dateFormatList}
              allowClear={false}
              disabledDate={(current) => {
                // Disable dates after today
                return current && current > dayjs.utc().endOf('day');
              }}
              size="middle"
              style={{ 
                width: '160px', 
                fontSize: '14px',
                height: '38px' 
              }}
              popupStyle={{ zIndex: 1300 }}
            />
          </ConfigProvider>
        </Box>
      </Box>
      
      <Grid container spacing={2}>
        {/* left range*/}
        <Grid size={{ xs: 12, md: 7 }}>
          {/* DayInfo */}
          <Grid container spacing={2}>
            <Grid size={12}>
              <DayInfo
                isLoading={isLoading}
                treatmentInfo={currentTreatmentInfo[0]}
                prescriptionInfo={currentPrescriptionInfo}
                date={selectedDate.toDate()}
                breathData={breathData}
                isLoadingBreathData={fetchingBreathData}
              />
            </Grid>
            
            {/* SessionsList */}
            <Grid size={12}>
              <SessionsList
                isLoading={isLoading}
                sessionInfo={currentSessionInfo}
                prescriptionInfo={currentPrescriptionInfo}
                date={selectedDate.toDate()}
                userId={userId}
                sessionDay={dateStringFromUrl}
              />
            </Grid>
          </Grid>
        </Grid>
        
        {/* right range: ParticipantInfo and PrescriptionInfo */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <ParticipantInfo
                isLoading={isLoading}
                participantInfo={currentParticipantInfo}
                dateRange={{
                  startDate: selectedDate.toDate() || new Date(),
                  endDate: selectedDate.toDate() || new Date()
                }}
                userId={userId}
              />
            </Grid>
            
            <Grid size={12}>
              <PrescriptionInfo
                isLoading={isLoading}
                PrescriptionInfo={currentPrescriptionInfo}
                dateRange={{
                  startDate: selectedDate.toDate() || new Date(),
                  endDate: selectedDate.toDate() || new Date()
                }}
                userId={userId}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}