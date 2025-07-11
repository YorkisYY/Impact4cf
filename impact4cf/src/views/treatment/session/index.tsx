'use client';
import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// material-ui
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import CustomBreadcrumbs from 'ui-component/extended/CustomBreadcrumbs';
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
import SessionInfo from './SessionInfo';
import SetsList from './SetsList';
import { ExhaleWithContext } from 'types';
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

interface SetInfoType {
  id: string;
  uid: string;
  duration: number;
  breaths: number;
  qualityScore: number;
  completion: number;
  startTime: Date;
  endTime: Date;
  sessionId: string;
  userId: string;
  totalExhales: number;
  rawSessionStartIndex: number;
  rawSessionEndIndex: number;
}

interface SessionViewInitialData {
  participantInfo: ParticipantInfoType;
  prescriptionInfo: PrescriptionInfoType;
  sessionInfo: SessionInfoType;
  setsInfo: SetInfoType[];
  breathData: ExhaleWithContext[];
  csvData: any[];
  csvHeaders: { label: string, key: string }[];
}

interface SessionProfileProps {
  initialData: SessionViewInitialData;
  userId: string;
  date: string;
  sessionId: string;
}

// ==============================|| SESSION PROFILE ||============================== //

export default function SessionProfile({ initialData, userId, date, sessionId }: SessionProfileProps) {
  const router = useRouter();
  const theme = useTheme();
  const [isLoading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs.utc(date));
  const [currentParticipantInfo, setCurrentParticipantInfo] = useState(initialData.participantInfo);
  const [currentPrescriptionInfo, setCurrentPrescriptionInfo] = useState(initialData.prescriptionInfo);
  const [currentSessionInfo, setCurrentSessionInfo] = useState(initialData.sessionInfo);
  const [currentSetsInfo, setCurrentSetsInfo] = useState(initialData.setsInfo);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const [breathData, setBreathData] = useState<ExhaleWithContext[]>(initialData.breathData);
  const [csvData, setCsvData] = useState(initialData.csvData);
  const [csvHeaders, setCsvHeaders] = useState(initialData.csvHeaders);
  const [fetchingBreathData, setFetchingBreathData] = useState(false);
  const dateFormatList = ['DD-MM-YYYY', 'DD/MM/YYYY', 'DD/MM/YY', 'DD-MM-YY'];
  
  /**
   * Process breath data from consolidated session response
   */
  const processBreathDataFromResponse = useCallback((
    sessionData: any, 
    targetSessionId: string, 
    setsInfo: SetInfoType[]
  ) => {
      try {
        setFetchingBreathData(true);
        
        if (!sessionData || !sessionData.treatmentSets || !Array.isArray(sessionData.treatmentSets) || sessionData.treatmentSets.length === 0) {
          console.log("No sets found in session data");
          setBreathData([]);
          setFetchingBreathData(false);
          return;
        }
        
        console.log(`Processing ${sessionData.treatmentSets.length} sets from consolidated response`);
        
        // Create new breath data array
        let allBreathData: ExhaleWithContext[] = [];
        
        // First, add placeholder data for all sets to ensure they all appear in the chart
        const setPlaceholders = setsInfo.map((set: any, index: number) => {
          // Create a properly formatted placeholder that matches the ExhaleWithContext interface
          const placeholder: ExhaleWithContext = {
            uid: `placeholder-${set.uid}`,
            sessionId: targetSessionId,
            userId: userId,
            setId: set.uid,
            startTime: typeof set.startTime === 'string' ? set.startTime : set.startTime.toISOString(),
            endTime: typeof set.startTime === 'string' ? set.startTime : set.startTime.toISOString(),
            duration: 0,
            values: {
              type: 'float32',
              data: [0, 0, 0, 0]
            },
            sequenceNumber: 0,
            sequenceType: 'exhale',
            isGap: false,
            setIndex: index + 1,
            isPlaceholder: true
          };
          return placeholder;
        });
        
        // Add placeholders to allBreathData
        allBreathData = [...setPlaceholders];
        
        // Process all sets from the consolidated response
        for (const set of sessionData.treatmentSets) {
          const setId = set.uid;
          const setIndex = setsInfo.findIndex(s => s.uid === setId) + 1;
          
          // Process exhales if available
          if (set.treatmentExhales && Array.isArray(set.treatmentExhales) && set.treatmentExhales.length > 0) {
            const exhalesWithContext: ExhaleWithContext[] = set.treatmentExhales.map((exhale: any) => {
              const typedExhale: ExhaleWithContext = {
                ...exhale,
                sessionId: targetSessionId,
                userId: userId,
                setId: setId,
                setIndex: setIndex,
                sequenceType: 'exhale',
                isGap: false,
                // Ensure startTime and endTime are strings
                startTime: typeof exhale.startTime === 'string' ? exhale.startTime : new Date(exhale.startTime).toISOString(),
                endTime: typeof exhale.endTime === 'string' ? exhale.endTime : new Date(exhale.endTime).toISOString()
              };
              return typedExhale;
            });
            
            // Add all exhales from this set to our collection
            allBreathData = [...allBreathData, ...exhalesWithContext];
          }
          
          // Process gaps if available
          if (set.treatmentExhaleGaps && Array.isArray(set.treatmentExhaleGaps) && set.treatmentExhaleGaps.length > 0) {
            const gapsWithContext: ExhaleWithContext[] = set.treatmentExhaleGaps.map((gap: any) => {
              const typedGap: ExhaleWithContext = {
                ...gap,
                sessionId: targetSessionId,
                userId: userId,
                setId: setId,
                setIndex: setIndex,
                // Normalize sequence number property
                sequenceNumber: gap.sequenceNumber || gap.sequenceNum,
                sequenceType: 'gap',
                isGap: true,
                // Ensure startTime and endTime are strings
                startTime: typeof gap.startTime === 'string' ? gap.startTime : new Date(gap.startTime).toISOString(),
                endTime: typeof gap.endTime === 'string' ? gap.endTime : new Date(gap.endTime).toISOString()
              };
              return typedGap;
            });
            
            // Add all gaps from this set to our collection
            allBreathData = [...allBreathData, ...gapsWithContext];
          }
        }
        
        console.log(`Total breath-related items collected: ${allBreathData.length}`);
        setBreathData(allBreathData);
        
      } catch (error: any) {
        if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
        console.error("Error processing breath data from response:", error);
        setBreathData([]);
      } finally {
        setFetchingBreathData(false);
      }
    },
    [userId, setBreathData, setFetchingBreathData]
  );

  /**
   * Fetch CSV data for a session
   * This function fetches the CSV data from the server and processes it into a usable format.
   */
  const fetchCsvData = useCallback(async (sessionId: string) => {
    try {
      const response = await authFetcherWithRedirect(`/api/treatments/session/${sessionId}/export`);
      const csvText = response.data; // Get the raw CSV text
  
      const lines = csvText.split('\n').filter((line: string) => line.trim() !== ''); // Split into lines and remove empty ones
  
      if (lines.length === 0) {
        console.warn('CSV data is empty.');
        setCsvHeaders([]);
        setCsvData([]);
        return;
      }
  
      // 1. Extract the header row (first line)
      const headerRow = lines[0];
      const headers = headerRow.split(','); // Split the header row by commas
  
      // 2. Convert headers to the format expected by react-csv
      const reactCsvHeaders = headers.map((header: string) => ({ label: header.trim(), key: header.trim() }));
  
      // 3. Process the data rows (starting from the second line)
      const dataRows = lines.slice(1);
  
      const processedData = dataRows.map((row: string) => {
        const values = row.split(','); // Split row by commas
        const rowObject: { [key: string]: string } = {}; // Create an object to store key-value pairs
  
        // Map each value to its corresponding header
        headers.forEach((header: string, index: number) => {
          const cleanedHeader = header.trim();
          rowObject[cleanedHeader] = values[index] !== undefined ? values[index].trim() : '';
        });
  
        return rowObject;
      });
  
      // 4. Update state
      setCsvHeaders(reactCsvHeaders);
      setCsvData(processedData);
  
    } catch (error: any) {
      if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
      console.error('Error fetching CSV data:', error);
      setCsvHeaders([]);
      setCsvData([]);
    }
  }, []);

  /**
   * Fetch all data when selected date changes
   */
  useEffect(() => {
    // Skip initial load as we already have server-side data
    const isInitialLoad = dayjs.utc(date).format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD');
    if (isInitialLoad) return;

    const fetchDataForNewDate = async () => {
      setLoading(true);
      try {
        // 1. First, get sessions for the new date
        const formattedDate = selectedDate.format('YYYY-MM-DD');
        
        const sessionsResponse = await authFetcherWithRedirect(`api/treatments/${userId}/sessions/${formattedDate}`);
        const sessionsData = sessionsResponse;

        if (!sessionsData || sessionsData.length === 0) {
          // No sessions for this date
          console.log(`No sessions found for date ${formattedDate}`);
          router.replace(`/${userId}/all/${formattedDate}`);
          setLoading(false);
          return;
        }

        // 2. Select the first session of the day
        const firstSession = sessionsData[0];
        const newSessionId = firstSession.uid;
        setCurrentSessionId(newSessionId);

        // 3. Update URL without full navigation
        router.replace(`/${userId}/all/${formattedDate}/${newSessionId}`);
        
        // 4. Fetch session data with all related data using the new consolidated API
        const sessionResponse = await authFetcherWithRedirect(
          `api/treatments/session/${newSessionId}?include=treatmentSessions,treatmentSets,treatmentExhales,treatmentExhaleGaps,values`
        );
        const sessionData = sessionResponse;
        if (!sessionData) {
          // Authentication failed and redirected, just return
          return;
        }
        const sessionIndex = sessionsData.findIndex((s: any) => s.uid === newSessionId) + 1;
        const durationSeconds = Math.round(sessionData.duration / 1000);

        const newSessionInfo = {
          id: newSessionId,
          index: sessionIndex || 1,
          duration: durationSeconds,
          sets: sessionData.totalSets || 0,
          breaths: sessionData.totalExhales || 0,
          startTime: new Date(sessionData.startTime),
          endTime: new Date(sessionData.endTime),
          qualityScore: sessionData.qualityScore || 0,
          completion: sessionData.completion || 0
        };

        setCurrentSessionInfo(newSessionInfo);
        
        // 5. Process sets from consolidated response
        let newSetsInfo: SetInfoType[] = [];
        
        if (sessionData.treatmentSets && Array.isArray(sessionData.treatmentSets)) {
          newSetsInfo = sessionData.treatmentSets.map((set: any, index: number) => {
            const durationSeconds = Math.round(set.duration / 1000);
            
            return {
              id: `Set ${index + 1}`,
              uid: set.uid,
              duration: durationSeconds,
              breaths: set.totalExhales || 0,
              qualityScore: set.qualityScore || 0,
              completion: set.completion || 0,
              startTime: new Date(set.startTime),
              endTime: new Date(set.endTime),
              sessionId: newSessionId,
              userId: userId,
              totalExhales: set.totalExhales || 0,
              rawSessionStartIndex: set.rawSessionStartIndex,
              rawSessionEndIndex: set.rawSessionEndIndex
            };
          });
          
          setCurrentSetsInfo(newSetsInfo);
        } else {
          // If treatmentSets is not available in response, fetch sets separately
          const setsResponse = await authFetcherWithRedirect(`api/treatments/sets/${newSessionId}`);
          const setsData = setsResponse;
          if (!setsData || setsData.length === 0) {
            // Authentication failed and redirected, just return
            return;
          }
          newSetsInfo = setsData.map((set: any, index: number) => {
            const durationSeconds = Math.round(set.duration / 1000);
            
            return {
              id: `Set ${index + 1}`,
              uid: set.uid,
              duration: durationSeconds,
              breaths: set.totalExhales || 0,
              qualityScore: set.qualityScore || 0,
              completion: set.completion || 0,
              startTime: new Date(set.startTime),
              endTime: new Date(set.endTime),
              sessionId: newSessionId,
              userId: userId,
              totalExhales: set.totalExhales || 0,
              rawSessionStartIndex: set.rawSessionStartIndex,
              rawSessionEndIndex: set.rawSessionEndIndex
            };
          });
          
          setCurrentSetsInfo(newSetsInfo);
        }

        // 6. Fetch participant info if needed
        const userResponse = await authFetcherWithRedirect(`api/users/${userId}`);
        const userData = userResponse;
        if (!userData) {
          // Authentication failed and redirected, just return
          return;
        }
        if (userData) {
          const newParticipantInfo = {
            username: userData.name || "User",
            trialStage: userData.trialStage,
            deviceMode: userData.deviceMode || "Unknown",
            lastSeen: userData.lastActive,
            lastACT: userData.lastTreatment
          };
          setCurrentParticipantInfo(newParticipantInfo);
        }
        
        // 7. Fetch prescription data using the prescriptionId from session data
        const prescriptionId = sessionData.prescriptionId;
        if (!prescriptionId) {
          console.error("No prescription ID found in session data");
          return;
        }
        
        const prescriptionResponse = await authFetcherWithRedirect(`api/prescriptions/${prescriptionId}`);
        const prescriptionData = prescriptionResponse;
        if (!prescriptionData) {
          // Authentication failed and redirected, just return
          return;
        }
        
        const newPrescriptionInfo = {
          username: currentParticipantInfo.username, 
          actSessionsPerDay: prescriptionData.sessionsPerDay,
          setsPerACTSession: prescriptionData.setsPerSession,
          breathsPerSet: prescriptionData.exhalesPerSet,
          breathLength: prescriptionData.exhaleDuration,
          breathPressureTarget: prescriptionData.exhaleTargetPressure,
          breathPressureRange: prescriptionData.exhaleTargetRange
        };
        setCurrentPrescriptionInfo(newPrescriptionInfo);
          
        // 8. Process breath data directly from consolidated response
        processBreathDataFromResponse(sessionData, newSessionId, newSetsInfo);

      } catch (error: any) {
        if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
        console.error("Error fetching data for new date:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDataForNewDate();

    if (sessionId) {
      fetchCsvData(sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, userId, router, currentParticipantInfo.username, date, processBreathDataFromResponse, fetchCsvData]);
  
  /**
   * Fetch breath data for a session when we don't have breath data
   */
  const fetchSessionBreathData = useCallback(
    async (targetSessionId: string = currentSessionId) => {
      try {
        setFetchingBreathData(true);
        // Use the new consolidated API endpoint
        const response = await authFetcherWithRedirect(
          `api/treatments/session/${targetSessionId}?include=treatmentSessions,treatmentSets,treatmentExhales,treatmentExhaleGaps,values`
        );
        const sessionData = response;
        if (!sessionData) {
          return;
        }
        // Process the data from the consolidated response
        processBreathDataFromResponse(sessionData, targetSessionId, currentSetsInfo);
      } catch (error: any) {
        if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
        console.error("Error fetching breath data:", error);
        setBreathData([]);
      } finally {
        setFetchingBreathData(false);
      }
    }, [
      currentSessionId,
      currentSetsInfo,
      processBreathDataFromResponse,
      setBreathData,
      setFetchingBreathData
  ]);

  /**
   * Fetch initial breath data when component mounts
   */
  useEffect(() => {
    // Only run this if we don't have breath data from SSR
    if (!initialData.breathData || initialData.breathData.length === 0) {
      fetchSessionBreathData(sessionId);
    }
  }, [sessionId, initialData.breathData, fetchSessionBreathData]);

  /**
   * Handles the change in date
   */
  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (!date) return;
    setSelectedDate(date.utc());
    // The useEffect will trigger data fetching
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
            { title: initialData.participantInfo.username, to: `/${userId}/all` },
            { title: 'ACT Sessions', to: `/${userId}/all/${date}` },
            { title: `ACT Session ${currentSessionInfo.index}` }
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
          {/* Session Info */}
          <Grid container spacing={2}>
            <Grid size={12}>
              <SessionInfo
                isLoading={isLoading}
                sessionInfo={currentSessionInfo}
                prescriptionInfo={currentPrescriptionInfo}
                date={selectedDate.toDate()}
                breathData={breathData}
                fetchingBreathData={fetchingBreathData}
                csvData={csvData}
                csvHeaders={csvHeaders}
              />
            </Grid>
            
            {/* Sets List */}
            <Grid size={12}>
              <SetsList
                isLoading={isLoading}
                sets={currentSetsInfo}
                sessionId={currentSessionId}
                userId={userId}
                date={date}
                prescribedBreathsPerSet={currentPrescriptionInfo.breathsPerSet}
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