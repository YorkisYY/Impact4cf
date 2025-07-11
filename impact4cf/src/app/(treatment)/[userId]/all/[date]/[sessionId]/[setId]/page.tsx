import SetProfile from 'views/treatment/set';
import { authFetcherWithRedirect } from '@/utils/withAuthRedirect';
import { ExhaleWithContext } from 'types';

// Define interfaces for our data structures
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

// ==============================|| PAGE ||============================== //

export default async function SetProfilePage({ params }: { params: Promise<{ userId: string, date: string, sessionId: string, setId: string } >}) {
  // Await the params to satisfy the Next.js requirement
  const { userId, date, sessionId, setId } = await Promise.resolve(params);
  const userIdValue = userId || "ngCHGLIWOdPYumRJybB7D9qd2El1"; 
  const dateValue = date;
  const sessionIdValue = sessionId;
  const setIdValue = setId;
  
  // Use the consolidated API endpoint to get all data in a single request
  let consolidatedData: any[] = [];
  try {
    console.log(`Server: Fetching data with consolidated endpoint for date ${dateValue}`);
    consolidatedData = await authFetcherWithRedirect(
      `api/treatments/${userIdValue}/sessions/${dateValue}?include=treatmentSessions,treatmentSets,treatmentExhales,treatmentExhaleGaps,values`
    );
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error("Error fetching consolidated data:", error);
    // We'll continue with individual API calls as a fallback
    consolidatedData = [];
  }
  
  // Fetch participant data - can be moved to consolidated endpoint in the future
  let participantInfo;
  try {
    const userResponse = await authFetcherWithRedirect(`api/users/${userIdValue}`);
    const userData = userResponse;
    
    participantInfo = {
      username: userData.name || "User",
      trialStage: userData.trialStage,
      deviceMode: userData.deviceMode || "Unknown",
      lastSeen: userData.lastActive,
      lastACT: userData.lastTreatment
    };
    
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('Server: Error fetching user data:', error);
    participantInfo = { 
      username: "NaN", 
      trialStage: "NaN", 
      deviceMode: "NaN", 
      lastSeen: new Date(), 
      lastACT: new Date() 
    };
  }
  
  // Fetch prescription data
  let prescriptionInfo: any;
  try {
    if (consolidatedData.length > 0 && consolidatedData[0].prescriptionId) {
      const prescriptionId = consolidatedData[0].prescriptionId;
      const prescriptionResponse = await authFetcherWithRedirect(`api/prescriptions/${prescriptionId}`);
      const prescriptionData = prescriptionResponse;
      
      prescriptionInfo = {
        username: participantInfo.username,
        actSessionsPerDay: prescriptionData.sessionsPerDay,
        setsPerACTSession: prescriptionData.setsPerSession,
        breathsPerSet: prescriptionData.exhalesPerSet,
        breathLength: prescriptionData.exhaleDuration,
        breathPressureTarget: prescriptionData.exhaleTargetPressure,
        breathPressureRange: prescriptionData.exhaleTargetRange
      };
    } else {
      // Fallback to fetching by user ID if no prescription ID in consolidated data
      const prescriptionResponse = await authFetcherWithRedirect(`api/prescriptions/user/${userIdValue}`);
      const prescriptionData = prescriptionResponse;
      
      prescriptionInfo = {
        username: participantInfo.username,
        actSessionsPerDay: prescriptionData.sessionsPerDay,
        setsPerACTSession: prescriptionData.setsPerSession,
        breathsPerSet: prescriptionData.exhalesPerSet,
        breathLength: prescriptionData.exhaleDuration,
        breathPressureTarget: prescriptionData.exhaleTargetPressure,
        breathPressureRange: prescriptionData.exhaleTargetRange
      };
    }
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('Server: Error fetching prescription data:', error);
    prescriptionInfo = {
      username: participantInfo.username, 
      actSessionsPerDay: 0,
      setsPerACTSession: 0,
      breathsPerSet: 0,
      breathLength: 0, 
      breathPressureTarget: 0,
      breathPressureRange: 0
    };
  }
  
  // Find the session in the consolidated data
  let currentSession: any = null;
  let sessionIndex = 1;
  
  if (consolidatedData.length > 0) {
    // Find the session with matching ID in the consolidated data
    currentSession = consolidatedData.find((session) => session.uid === sessionIdValue);
    
    if (!currentSession) {
      // If session not found, use the first session (as fallback)
      console.log(`Server: Session ${sessionIdValue} not found in consolidated data, using first available`);
      currentSession = consolidatedData[0];
    }
    
    // Find the session index (order within the day)
    sessionIndex = consolidatedData.findIndex((session) => session.uid === currentSession.uid) + 1;
    if (sessionIndex <= 0) sessionIndex = 1;
  } else {
    // If no consolidated data, fetch session separately
    try {
      const sessionResponse = await authFetcherWithRedirect(`api/treatments/session/${sessionIdValue}`);
      currentSession = sessionResponse;
      console.log(`from separate session`)
    } catch (error: any) {
      if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
      console.error(`Error fetching session ${sessionIdValue}:`, error);
      // Continue with minimal session data
      currentSession = {
        uid: sessionIdValue,
        totalSets: 1,
        startTime: new Date(),
        endTime: new Date(),
      };
    }
  }
  
  // Fetch set information - use either consolidated data or dedicated endpoint
  let setInfo;
  let breathsData: ExhaleWithContext[] = [];
  let breathsList: BreathType[] = [];
  
  try {
    // Find the requested set in the consolidated data
    let currentSet: any = null;
    let setsInSession: any[] = [];
    
    if (currentSession && currentSession.treatmentSets) {
      // The session has sets included, find the right one
      setsInSession = currentSession.treatmentSets;
      currentSet = setsInSession.find((s: any) => s.uid === setIdValue);
      
      if (!currentSet && setsInSession.length > 0) {
        // If set not found but sets exist, use the first set
        console.log(`Server: Set ${setIdValue} not found in session, using first available`);
        currentSet = setsInSession[0];
      }
    }
    
    // If not found in consolidated data, fetch separately
    if (!currentSet) {
      console.log(`Server: Set not found in consolidated data, fetching separately: ${setIdValue}`);
      const setResponse = await authFetcherWithRedirect(`api/treatments/set/${setIdValue}?include=treatmentExhales,treatmentExhaleGaps,values`);
      currentSet = setResponse;
      console.log(`server: from separate session`)
      // Get sets for this session if needed
      if (!setsInSession || setsInSession.length === 0) {
        try {
          const setsInSessionResponse = await authFetcherWithRedirect(`api/treatments/sets/${sessionIdValue}`);
          setsInSession = setsInSessionResponse || [];
          console.log(`server: from separate session`)
        } catch (error: any) {
          if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
          console.warn(`Server: Error fetching sets for session ${sessionIdValue}:`, error);
          setsInSession = [currentSet]; // Use at least the current set
        }
      }
    }
    
    // Find set index within session (order within the session)
    let setIndex = 1;
    if (setsInSession && setsInSession.length > 0) {
      // Sort sets by startTime
      setsInSession.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      setIndex = setsInSession.findIndex((s: any) => s.uid === currentSet.uid) + 1;
      if (setIndex <= 0) setIndex = 1;
    }
    
    // Calculate duration in seconds
    const durationSeconds = Number((currentSet.duration / 1000).toFixed(1));
    
    setInfo = {
      id: currentSet.uid,
      displayId: `Set ${setIndex}`,
      index: setIndex,
      sessionId: sessionIdValue, 
      sessionIndex: sessionIndex,
      duration: durationSeconds,
      breaths: currentSet.totalExhales || 0,
      breathsTarget: prescriptionInfo.breathsPerSet,
      startTime: new Date(currentSet.startTime),
      endTime: new Date(currentSet.endTime)
    };
    
    // Process both exhales and gaps for chart data
    const setExhales = currentSet.treatmentExhales || [];
    const setGaps = currentSet.treatmentExhaleGaps || [];
    let allBreathEvents: ExhaleWithContext[] = [];
    
    // Process exhales for chart data
    if (setExhales.length > 0) {
      const exhalesWithContext = setExhales.map((exhale: any) => ({
        ...exhale,
        setId: currentSet.uid,
        sessionId: sessionIdValue,
        userId: userIdValue,
        setIndex: setIndex,
        sequenceType: 'exhale',
        isGap: false
      }));
      
      allBreathEvents = [...allBreathEvents, ...exhalesWithContext];
      console.log(`Server: Processing ${exhalesWithContext.length} exhales for chart data`);
    }
    
    // Process gaps for chart data
    if (setGaps.length > 0) {
      const gapsWithContext = setGaps.map((gap: any) => ({
        ...gap,
        setId: currentSet.uid,
        sessionId: sessionIdValue,
        userId: userIdValue,
        setIndex: setIndex,
        // Make sure sequence property is standardized
        sequenceNumber: gap.sequenceNumber || gap.sequenceNum,
        sequenceType: 'gap',
        isGap: true
      }));
      
      allBreathEvents = [...allBreathEvents, ...gapsWithContext];
      console.log(`Server: Processing ${gapsWithContext.length} gaps for chart data`);
    }
    
    // Sort all breath events by sequence
    allBreathEvents.sort((a: any, b: any) => {
      const seqA = a.isGap ? (a.sequenceNum || 0) : (a.sequenceNumber || 0);
      const seqB = b.isGap ? (b.sequenceNum || 0) : (b.sequenceNumber || 0);
      return seqA - seqB;
    });
    
    breathsData = allBreathEvents;
    
    // Function to calculate average pressure from buffer data
    const calculateAveragePressure = (buffer: any) => {
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
    };
    
    // For breathsList, only include exhales (not gaps)
    if (setExhales.length > 0) {
      // Sort exhales by sequence number
      const sortedExhales = [...setExhales].sort((a: any, b: any) => {
        const seqA = a.sequenceNumber || 0;
        const seqB = b.sequenceNumber || 0;
        return seqA - seqB;
      });
      
      breathsList = sortedExhales.map((exhale: any, index: number) => {
        // Duration in seconds
        const durationSeconds = Number((exhale.duration / 1000).toFixed(1));
        
        // Average pressure from values buffer
        const avgPressure = calculateAveragePressure(exhale.values);
        
        return {
          id: exhale.uid,
          index: index + 1,
          displayId: `Breath ${index + 1}`,
          duration: durationSeconds,
          durationTarget: prescriptionInfo.breathLength,
          pressure: avgPressure,
          pressureTarget: prescriptionInfo.breathPressureTarget,
          pressureTargetRange: prescriptionInfo.breathPressureRange,
          startTime: new Date(exhale.startTime),
          endTime: new Date(exhale.endTime),
          qualityScore: exhale.qualityScore || 0,
          completion: exhale.completion || 0
        };
      });
    }
    
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('Error processing set data:', error);
    // Create fallback data
    setInfo = {
      id: setIdValue,
      displayId: 'Set 1',
      index: 1,
      sessionId: sessionIdValue,
      sessionIndex: sessionIndex,
      duration: 120,
      breaths: 18,
      breathsTarget: prescriptionInfo.breathsPerSet,
      startTime: new Date(),
      endTime: new Date(Date.now() + 120000)
    };
    breathsData = [];
    breathsList = [];
  }
  
  console.log(`Server: Completed data preparation for set ${setIdValue}, found ${breathsList.length} breaths`);

  return (
    <SetProfile
      initialData={{
        participantInfo,
        prescriptionInfo,
        setInfo,
        breathsData,
        breathsList
      }}
      userId={userIdValue}
      date={dateValue}
      sessionId={sessionIdValue}
      setId={setIdValue}
    />
  );
}