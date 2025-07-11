'use client';
// import * as React from 'react';
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
import SetInfo from './SetInfo';
import BreathsList from './BreathsList';
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

interface BreathType {
  id: string;
  index: number;
  displayId: string;
  duration: number;
  durationTarget: number;
  pressure: number;
  pressureTarget: number;
  pressureTargetRange: number;
  startTime: Date;
  endTime: Date;
  qualityScore: number;
  completion: number;
}

interface SetViewInitialData {
  participantInfo: ParticipantInfoType;
  prescriptionInfo: PrescriptionInfoType;
  setInfo: SetInfoType;
  breathsData: ExhaleWithContext[];
  breathsList: BreathType[];
}

export interface SetProfileProps {
  initialData: SetViewInitialData;
  userId: string;
  date: string;
  sessionId: string;
  setId: string;
}

// ==============================|| SET PROFILE ||============================== //

export default function SetProfile({ initialData, userId, date, sessionId, setId }: SetProfileProps) {
  const router = useRouter();
  const theme = useTheme();
  const [isLoading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs.utc(date));
  const [currentParticipantInfo, setCurrentParticipantInfo] = useState(initialData.participantInfo);
  const [currentPrescriptionInfo, setCurrentPrescriptionInfo] = useState(initialData.prescriptionInfo);
  const [currentSetInfo, setCurrentSetInfo] = useState(initialData.setInfo);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const [currentSetId, setCurrentSetId] = useState(setId);
  const [breathsData, setBreathsData] = useState<ExhaleWithContext[]>(initialData.breathsData);
  const [breathsList, setBreathsList] = useState<BreathType[]>(initialData.breathsList);
  const [fetchingBreathData, setFetchingBreathData] = useState(false);
  const dateFormatList = ['DD-MM-YYYY', 'DD/MM/YYYY', 'DD/MM/YY', 'DD-MM-YY'];

  /**
   * Calculate average pressure from buffer data
   */
  const calculateAveragePressure = useCallback((buffer: any): number => {
    if (!buffer || !buffer.data || !Array.isArray(buffer.data)) {
      return 0;
    }
    
    try {
      const pressureValues: number[] = [];
      
      // Process 4 bytes at a time to get float values
      for (let i = 0; i < buffer.data.length - 3; i += 4) {
        // Create a buffer to hold 4 bytes
        const bytes = new Uint8Array(4);
        for (let j = 0; j < 4; j++) {
          bytes[j] = buffer.data[i + j];
        }
        
        // Convert to float32 (little-endian)
        const view = new DataView(bytes.buffer);
        const value = view.getFloat32(0, true); // true for little-endian
        
        // Sanity check for the value
        if (!isNaN(value) && isFinite(value)) {
          pressureValues.push(value);
        }
      }
      
      // Calculate average if we have values
      if (pressureValues.length === 0) {
        return 0;
      }
      
      const sum = pressureValues.reduce((acc, val) => acc + val, 0);
      return sum / pressureValues.length;
      
    } catch (error: any) {
      if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
      console.error("Error calculating average pressure:", error);
      return 0;
    }
  },[]);

  /**
   * Fetch breaths data for the selected set using the new consolidated API
   */
  const fetchBreathsForSet = useCallback(
    async (targetSetId: string = currentSetId) => {
      try {
        setFetchingBreathData(true);
        
        // Use the new consolidated API endpoint
        console.log(`Fetching set details with consolidated endpoint for set ${targetSetId}`);
        const response = await authFetcherWithRedirect(`api/treatments/set/${targetSetId}?include=treatmentExhales,treatmentExhaleGaps,values`);
        const setDetailsResponse = response;
        console.log("Set details fetched successfully");
        
        if (!setDetailsResponse) {
          return;
        }
        
        // Process both exhales and gaps for chart data
        let allBreathEvents: ExhaleWithContext[] = [];
        
        // Process exhales for chart data
        if (setDetailsResponse.treatmentExhales && setDetailsResponse.treatmentExhales.length > 0) {
          const exhalesWithContext = setDetailsResponse.treatmentExhales.map((exhale: any) => ({
            ...exhale,
            setId: targetSetId,
            sessionId: currentSessionId,
            userId: userId,
            setIndex: currentSetInfo.index,
            sequenceType: 'exhale',
            isGap: false
          }));
          
          allBreathEvents = [...allBreathEvents, ...exhalesWithContext];
        }
        
        // Process gaps for chart data
        if (setDetailsResponse.treatmentExhaleGaps && setDetailsResponse.treatmentExhaleGaps.length > 0) {
          const gapsWithContext = setDetailsResponse.treatmentExhaleGaps.map((gap: any) => ({
            ...gap,
            setId: targetSetId,
            sessionId: currentSessionId,
            userId: userId,
            setIndex: currentSetInfo.index,
            // Make sure sequence property is standardized
            sequenceNumber: gap.sequenceNumber || gap.sequenceNum,
            sequenceType: 'gap',
            isGap: true
          }));
          
          allBreathEvents = [...allBreathEvents, ...gapsWithContext];
        }
        
        // Sort all breath events by sequence
        allBreathEvents.sort((a: ExhaleWithContext, b: ExhaleWithContext) => {
          const seqA = a.isGap ? (a.sequenceNum || 0) : (a.sequenceNumber || 0);
          const seqB = b.isGap ? (b.sequenceNum || 0) : (b.sequenceNumber || 0);
          return seqA - seqB;
        });
        
        setBreathsData(allBreathEvents);
        
        // For breathsList, only include exhales (not gaps) - as mentioned in requirements
        if (setDetailsResponse.treatmentExhales && setDetailsResponse.treatmentExhales.length > 0) {
          // Sort exhales by sequence number
          const sortedExhales = [...setDetailsResponse.treatmentExhales].sort((a, b) => {
            return (a.sequenceNumber || 0) - (b.sequenceNumber || 0);
          });
          
          const newBreathsList: BreathType[] = sortedExhales.map((exhale: any, index: number) => {
            // Duration in seconds
            const durationSeconds = Number((exhale.duration / 1000).toFixed(1));
            
            // Average pressure from values buffer
            const avgPressure = calculateAveragePressure(exhale.values);
            
            return {
              id: exhale.uid,
              index: index + 1,
              displayId: `Breath ${index + 1}`,
              duration: durationSeconds,
              durationTarget: currentPrescriptionInfo.breathLength,
              pressure: avgPressure,
              pressureTarget: currentPrescriptionInfo.breathPressureTarget,
              pressureTargetRange: currentPrescriptionInfo.breathPressureRange,
              startTime: new Date(exhale.startTime),
              endTime: new Date(exhale.endTime),
              qualityScore: exhale.qualityScore || 0,
              completion: exhale.completion || 0
            };
          });
          
          setBreathsList(newBreathsList);
        } else {
          setBreathsList([]);
        }
        
      } catch (error: any) {
        if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
        console.error("Error fetching breaths data:", error);
        setBreathsData([]);
        setBreathsList([]);
      } finally {
        setFetchingBreathData(false);
      }
    },[
      currentSetId,
      currentSessionId,
      userId,
      currentSetInfo.index,
      currentPrescriptionInfo,
      setBreathsData,
      setBreathsList,
      setFetchingBreathData,
      calculateAveragePressure
  ]);

  /**
   * Fetch initial breaths data when component mounts
   */
  useEffect(() => {
    // Only run this if we don't have breath data from SSR
    if (!initialData.breathsData || initialData.breathsData.length === 0) {
      fetchBreathsForSet(setId);
    }
  }, [setId, initialData.breathsData, fetchBreathsForSet]);

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
        const formattedDate = selectedDate.format('YYYY-MM-DD');
        
        // Use the consolidated endpoint to get all data in a single request
        console.log(`Fetching data with consolidated endpoint for date ${formattedDate}`);
        const consolidatedResponse = await authFetcherWithRedirect(
          `api/treatments/${userId}/sessions/${formattedDate}?include=treatmentSessions,treatmentSets,treatmentExhales,treatmentExhaleGaps,values`
        );
        const consolidatedData = consolidatedResponse;
        console.log("Consolidated data fetched successfully");
        
        // Check if we have sessions data
        if (!consolidatedData || !consolidatedData.treatmentSessions || consolidatedData.treatmentSessions.length === 0) {
          console.log(`No sessions found for date ${formattedDate}`);
          router.replace(`/${userId}/all/${formattedDate}`);
          setLoading(false);
          return;
        }
        
        // Get first session (sorting by startTime if needed)
        const sessionsData = consolidatedData.treatmentSessions;
        sessionsData.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        
        const firstSession = sessionsData[0];
        const newSessionId = firstSession.uid;
        
        // Update the session ID in state
        setCurrentSessionId(newSessionId);
        
        // Find session index
        const sessionIndex = sessionsData.findIndex((s: any) => s.uid === newSessionId) + 1;
        
        // Find sets for this session from consolidated data
        const setsData = consolidatedData.treatmentSets.filter(
          (set: any) => set.treatmentSessionId === newSessionId
        );
        
        if (!setsData || setsData.length === 0) {
          console.log(`No sets found for session ${newSessionId}`);
          router.replace(`/${userId}/all/${formattedDate}/${newSessionId}`);
          setLoading(false);
          return;
        }
        
        // Sort sets by startTime or sequence if available
        setsData.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        
        // Select first set of the session
        const firstSet = setsData[0];
        const newSetId = firstSet.uid;
        setCurrentSetId(newSetId);
        
        // Find set index within session
        const setIndex = setsData.findIndex((s: any) => s.uid === newSetId) + 1;
        
        // Calculate duration in seconds
        const durationSeconds = Number((firstSet.duration / 1000).toFixed(1));
        
        // Fetch prescription data using prescriptionId from consolidated response
        const prescriptionId = consolidatedData[0].prescriptionId;
        if (!prescriptionId) {
          console.error("No prescription ID found in consolidated data");
          return;
        }
        
        const prescriptionResponse = await authFetcherWithRedirect(`api/prescriptions/${prescriptionId}`);
        const prescriptionData = prescriptionResponse;
        if (!prescriptionData) {
          // Authentication failed and redirected, just return
          return;
        }
        let breathsTarget = currentPrescriptionInfo.breathsPerSet; // Default
        
        if (prescriptionData) {
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
          breathsTarget = newPrescriptionInfo.breathsPerSet;
        }
        
        // Update set info with the latest prescription data
        const newSetInfo = {
          id: newSetId,
          displayId: `Set ${setIndex}`,
          index: setIndex,
          sessionId: newSessionId,
          sessionIndex: sessionIndex,
          duration: durationSeconds,
          breaths: firstSet.totalExhales || 0,
          breathsTarget: breathsTarget,
          startTime: new Date(firstSet.startTime),
          endTime: new Date(firstSet.endTime)
        };
        
        setCurrentSetInfo(newSetInfo);
        
        // Fetch participant info in parallel if needed
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
        
        // Process breath data from consolidated response
        // Filter exhales for this set
        const setExhales = consolidatedData.treatmentExhales ? 
          consolidatedData.treatmentExhales.filter((exhale: any) => exhale.setId === newSetId) : 
          [];
        
        // Filter gaps for this set
        const setGaps = consolidatedData.treatmentExhaleGaps ?
          consolidatedData.treatmentExhaleGaps.filter((gap: any) => gap.setId === newSetId) :
          [];
        
        // Process both exhales and gaps for chart data
        let allBreathEvents: ExhaleWithContext[] = [];
        
        // Process exhales for chart data
        if (setExhales.length > 0) {
          const exhalesWithContext = setExhales.map((exhale: any) => ({
            ...exhale,
            setId: newSetId,
            sessionId: newSessionId,
            userId: userId,
            setIndex: setIndex,
            sequenceType: 'exhale',
            isGap: false
          }));
          
          allBreathEvents = [...allBreathEvents, ...exhalesWithContext];
        }
        
        // Process gaps for chart data
        if (setGaps.length > 0) {
          const gapsWithContext = setGaps.map((gap: any) => ({
            ...gap,
            setId: newSetId,
            sessionId: newSessionId,
            userId: userId,
            setIndex: setIndex,
            // Make sure sequence property is standardized
            sequenceNumber: gap.sequenceNumber || gap.sequenceNum,
            sequenceType: 'gap',
            isGap: true
          }));
          
          allBreathEvents = [...allBreathEvents, ...gapsWithContext];
        }
        
        // Sort all breath events by sequence
        allBreathEvents.sort((a: ExhaleWithContext, b: ExhaleWithContext) => {
          const seqA = a.isGap ? (a.sequenceNum || 0) : (a.sequenceNumber || 0);
          const seqB = b.isGap ? (b.sequenceNum || 0) : (b.sequenceNumber || 0);
          return seqA - seqB;
        });
        
        setBreathsData(allBreathEvents);
        
        // For breathsList, only include exhales (not gaps) - as mentioned in requirements
        if (setExhales.length > 0) {
          // Sort exhales by sequence number
          const sortedExhales = [...setExhales].sort((a: any, b: any) => {
            const seqA = a.sequenceNumber || 0;
            const seqB = b.sequenceNumber || 0;
            return seqA - seqB;
          });
          
          const newBreathsList: BreathType[] = sortedExhales.map((exhale: any, index: number) => {
            // Duration in seconds
            const durationSeconds = Number((exhale.duration / 1000).toFixed(1));
            
            // Average pressure from values buffer
            const avgPressure = calculateAveragePressure(exhale.values);
            
            return {
              id: exhale.uid,
              index: index + 1,
              displayId: `Breath ${index + 1}`,
              duration: durationSeconds,
              durationTarget: breathsTarget || currentPrescriptionInfo.breathLength,
              pressure: avgPressure,
              pressureTarget: currentPrescriptionInfo.breathPressureTarget,
              pressureTargetRange: currentPrescriptionInfo.breathPressureRange,
              startTime: new Date(exhale.startTime),
              endTime: new Date(exhale.endTime),
              qualityScore: exhale.qualityScore || 0,
              completion: exhale.completion || 0
            };
          });
          
          setBreathsList(newBreathsList);
        } else {
          setBreathsList([]);
        }
        
        // Update URL AFTER all data is processed
        router.replace(`/${userId}/all/${formattedDate}/${newSessionId}/${newSetId}`);
        
      } catch (error: any) {
        if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
        console.error("Error fetching data for new date:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchDataForNewDate();
  }, [selectedDate, userId, router, calculateAveragePressure, currentParticipantInfo.username, currentPrescriptionInfo.breathLength, currentPrescriptionInfo.breathPressureRange, currentPrescriptionInfo.breathPressureTarget, currentPrescriptionInfo.breathsPerSet, date]);  

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
            { title: `Session ${currentSetInfo.sessionIndex}`, to: `/${userId}/all/${date}/${currentSessionId}` },
            { title: currentSetInfo.displayId }
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
          {/* Set Info */}
          <Grid container spacing={2}>
            <Grid size={12}>
              <SetInfo
                isLoading={isLoading}
                setInfo={currentSetInfo}
                prescriptionInfo={currentPrescriptionInfo}
                date={selectedDate.toDate()}
                breathData={breathsData}
                fetchingBreathData={fetchingBreathData}
              />
            </Grid>
            
            {/* Breaths List */}
            <Grid size={12}>
              <BreathsList
                isLoading={isLoading}
                breaths={breathsList}
                setId={currentSetId}
                sessionId={currentSessionId}
                userId={userId}
                date={date}
                prescribedBreathDuration={currentPrescriptionInfo.breathLength}
                prescribedBreathPressureTarget={currentPrescriptionInfo.breathPressureTarget}
                prescribedBreathPressureRange={currentPrescriptionInfo.breathPressureRange}
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