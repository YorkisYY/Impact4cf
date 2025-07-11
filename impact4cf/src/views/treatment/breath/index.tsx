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
import BreathInfo from './BreathInfo';
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

interface BreathViewInitialData {
  participantInfo: ParticipantInfoType;
  prescriptionInfo: PrescriptionInfoType;
  setInfo: SetInfoType;
  breathInfo: BreathType;
  breathData: any[];
}

interface BreathProfileProps {
  initialData: BreathViewInitialData;
  userId: string;
  date: string;
  sessionId: string;
  setId: string;
  breathId: string;
}

// ==============================|| BREATH PROFILE ||============================== //

export default function BreathProfilePage({ initialData, userId, date, sessionId, setId, breathId }: BreathProfileProps) {
  const router = useRouter();
  const theme = useTheme();
  const [isLoading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs.utc(date));
  const [currentParticipantInfo, setCurrentParticipantInfo] = useState(initialData.participantInfo);
  const [currentPrescriptionInfo, setCurrentPrescriptionInfo] = useState(initialData.prescriptionInfo);
  const [currentSetInfo, setCurrentSetInfo] = useState(initialData.setInfo);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const [currentSetId, setCurrentSetId] = useState(setId);
  const [currentBreathId, setCurrentBreathId] = useState(breathId);
  const [currentBreathInfo, setCurrentBreathInfo] = useState(initialData.breathInfo);
  const [breathData, setBreathData] = useState<any[]>(initialData.breathData);
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
   * Fetch specific breath data using the consolidated API
   */
  const fetchSingleBreathData = useCallback(
    async (targetBreathId: string = currentBreathId) => {
      try {
        setFetchingBreathData(true);
        // Use the new consolidated API endpoint
        const exhaleResponse = await authFetcherWithRedirect(`api/treatments/exhale/${targetBreathId}?include=values`);
        const exhaleData = exhaleResponse;
        if (!exhaleData) {
          return;
        }
        // Find breath index within set
        let breathIndex = 1;
        const breathsInSetResponse = await authFetcherWithRedirect(`api/treatments/exhales/${currentSetId}`);
        const breathsInSet = breathsInSetResponse;
        // Sort breaths by sequence number for more reliable indexing
        if (Array.isArray(breathsInSet)) {
          breathsInSet.sort((a: any, b: any) => {
            const seqA = a.sequenceNumber || 0;
            const seqB = b.sequenceNumber || 0;
            return seqA - seqB;
          });
        }
        breathIndex = breathsInSet.findIndex((b: any) => b.uid === targetBreathId) + 1;
        if (breathIndex <= 0) breathIndex = 1;
        // Process breath data (both for display info and chart)
        const durationSeconds = Math.round(exhaleData.duration / 1000);
        const avgPressure = calculateAveragePressure(exhaleData.values);
        // Create the breath info object
        const newBreathInfo = {
          id: exhaleData.uid,
          index: breathIndex,
          displayId: `Breath ${breathIndex}`,
          duration: durationSeconds,
          durationTarget: currentPrescriptionInfo.breathLength,
          pressure: avgPressure,
          pressureTarget: currentPrescriptionInfo.breathPressureTarget,
          pressureTargetRange: currentPrescriptionInfo.breathPressureRange,
          startTime: new Date(exhaleData.startTime),
          endTime: new Date(exhaleData.endTime),
          qualityScore: exhaleData.qualityScore || 0,
          completion: exhaleData.completion || 0
        };

        setCurrentBreathInfo(newBreathInfo);

        // Update data for chart visualization - already includes values from consolidated endpoint
        setBreathData([exhaleData]);

      } catch (error: any) {
        if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
        console.error("Error fetching breath data:", error);
        setBreathData([]);
      } finally {
        setFetchingBreathData(false);
      }
    },[
      currentBreathId,
      currentSetId,
      calculateAveragePressure,
      currentPrescriptionInfo,
      setCurrentBreathInfo,
      setBreathData,
      setFetchingBreathData
    ]);

  /**
   * Fetch initial breath data when component mounts
   */
  useEffect(() => {
    // Only run this if we don't have breath data from SSR
    if (!initialData.breathData || initialData.breathData.length === 0 || !initialData.breathData[0].values) {
      fetchSingleBreathData(breathId);
    }
  }, [breathId, initialData.breathData, fetchSingleBreathData]);

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

        // Clear existing data first
        setBreathData([]);

        // 1. First, get sessions for the new date
        const sessionsResponse = await authFetcherWithRedirect(`api/treatments/${userId}/sessions/${formattedDate}`);
        const sessionsData = sessionsResponse;

        if (!sessionsData || sessionsData.length === 0) {
          // No sessions for this date
          router.replace(`/${userId}/all/${formattedDate}`);
          setLoading(false);
          return;
        }

        // 2. Select the first session of the day
        const firstSession = sessionsData[0];
        const newSessionId = firstSession.uid;

        // Update the session ID in state
        setCurrentSessionId(newSessionId);

        // Find session index
        const sessionIndex = sessionsData.findIndex((s: any) => s.uid === newSessionId) + 1;

        // 3. Fetch sets for this session
        const setsResponse = await authFetcherWithRedirect(`api/treatments/sets/${newSessionId}`);
        const setsData = setsResponse;

        if (!setsData || setsData.length === 0) {
          router.replace(`/${userId}/all/${formattedDate}/${newSessionId}`);
          setLoading(false);
          return;
        }

        // 4. Select first set of the session
        const firstSet = setsData[0];
        const newSetId = firstSet.uid;
        setCurrentSetId(newSetId);

        // 5. Fetch set information using consolidated API
        const setResponse = await authFetcherWithRedirect(`api/treatments/set/${newSetId}?include=treatmentExhales,treatmentExhaleGaps`);
        const setData = setResponse;
        if (!setData) {
          // Authentication failed and redirected, just return
          return;
        }
        // Find set index within session
        const setIndex = setsData.findIndex((s: any) => s.uid === newSetId) + 1;

        // Calculate duration in seconds
        const durationSeconds = Math.round(setData.duration / 1000);

        // 6. Fetch prescription data using prescriptionId
        const prescriptionId = sessionsData.prescriptionId;
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
        }

        // 7. Update set info
        const newSetInfo = {
          id: newSetId,
          displayId: `Set ${setIndex}`,
          index: setIndex,
          sessionId: newSessionId,
          sessionIndex: sessionIndex,
          duration: durationSeconds,
          breaths: setData.totalExhales || 0,
          breathsTarget: currentPrescriptionInfo.breathsPerSet,
          startTime: new Date(setData.startTime),
          endTime: new Date(setData.endTime)
        };

        setCurrentSetInfo(newSetInfo);

        // 8. Fetch participant info
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

        // 9. Fetch breaths for this set
        let breathsData: any[];

        // First check if we already have exhales from the consolidated set response
        if (setData.treatmentExhales && Array.isArray(setData.treatmentExhales) && setData.treatmentExhales.length > 0) {
          breathsData = setData.treatmentExhales;
        } else {
          // Otherwise fetch them separately
          const breathsResponse = await authFetcherWithRedirect(`api/treatments/exhales/${newSetId}`);
          breathsData = breathsResponse;
        }

        if (!breathsData || breathsData.length === 0) {
          router.replace(`/${userId}/all/${formattedDate}/${newSessionId}/${newSetId}`);
          setLoading(false);
          return;
        }

        // 10. Select first breath and fetch details
        // Sort breaths by sequence number
        breathsData.sort((a: any, b: any) => {
          const seqA = a.sequenceNumber || 0;
          const seqB = b.sequenceNumber || 0;
          return seqA - seqB;
        });

        const firstBreath = breathsData[0];
        const newBreathId = firstBreath.uid;
        setCurrentBreathId(newBreathId);

        // 11. Update URL
        router.replace(`/${userId}/all/${formattedDate}/${newSessionId}/${newSetId}/${newBreathId}`);

        // 12. Fetch specific breath data using consolidated API
        await fetchSingleBreathData(newBreathId);

      } catch (error: any) {
        if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
        console.error("Error fetching data for new date:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDataForNewDate();
  }, [selectedDate, userId, router, currentParticipantInfo.username, currentPrescriptionInfo.breathsPerSet, date, fetchSingleBreathData]);

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
            { title: currentParticipantInfo.username, to: `/${userId}/all` },
            { title: 'ACT Sessions', to: `/${userId}/all/${date}` },
            { title: `Session ${currentSetInfo.sessionIndex}`, to: `/${userId}/all/${date}/${currentSessionId}` },
            { title: `${currentSetInfo.displayId}`, to: `/${userId}/all/${date}/${currentSessionId}/${currentSetId}` },
            { title: currentBreathInfo.displayId }
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
          {/* Breath Info */}
          <Grid container spacing={2}>
            <Grid size={12}>
              <BreathInfo
                isLoading={isLoading}
                setInfo={currentSetInfo}
                prescriptionInfo={currentPrescriptionInfo}
                date={selectedDate.toDate()}
                breathData={breathData}
                fetchingBreathData={fetchingBreathData}
                breathInfo={currentBreathInfo}
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