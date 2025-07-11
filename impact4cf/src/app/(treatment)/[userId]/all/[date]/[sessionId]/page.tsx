import SessionProfile from 'views/treatment/session';
import { authFetcherWithRedirect } from '@/utils/withAuthRedirect';
import { ExhaleWithContext } from 'types';

// ==============================|| PAGE ||============================== //

export default async function SessionProfilePage({ params }: { params: Promise<{ userId: string, date: string, sessionId: string }> }) {
  // Await the params to satisfy the Next.js requirement
  const { userId, date, sessionId } = await Promise.resolve(params);
  const userIdValue = userId || "ngCHGLIWOdPYumRJybB7D9qd2El1"; 
  const dateValue = date;
  const sessionIdValue = sessionId;
  

  // Fetch participant data
  let userData: any;
  let participantInfo;
  try {
    const userResponse = await authFetcherWithRedirect(`api/users/${userIdValue}`);
    userData = userResponse;
    
    participantInfo = {
      username: userData.name || "User",
      trialStage: userData.trialStage,
      deviceMode: userData.deviceMode || "Unknown",
      lastSeen: userData.lastActive,
      lastACT: userData.lastTreatment
    };
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('Error fetching user data:', error);
    // Fallback to fake data if API fails
    participantInfo = { 
      username: "NaN", 
      trialStage: "NaN", 
      deviceMode: "NaN", 
      lastSeen: new Date(), 
      lastACT: new Date() 
    };
  }
  
  // Fetch session information with all related data using the new consolidated API endpoint
  let sessionData: any;
  let sessionInfo;
  let setsInfo: any[] = [];
  let breathData: ExhaleWithContext[] = [];
  let prescriptionInfo: any; 
  
  try {
    // Use the new consolidated API endpoint that includes all related data
    const sessionResponse = await authFetcherWithRedirect(
      `api/treatments/session/${sessionIdValue}?include=treatmentSessions,treatmentSets,treatmentExhales,treatmentExhaleGaps,values`
    );
    sessionData = sessionResponse;
    
    // Fetch prescription data from the prescriptionId in the session data
    try {
      const prescriptionId = sessionData.prescriptionId;
      if (!prescriptionId) {
        throw new Error("No prescription ID found in session data");
      }
      
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
    } catch (error: any) {
      if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
      console.error('Error fetching prescription data:', error);
      // Fallback to fake data if API fails
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
    
    // We still need to fetch sessions of day to determine the session index
    const sessionsOfDayResponse = await authFetcherWithRedirect(`api/treatments/${userIdValue}/sessions/${dateValue}`);
    
    const sessionIndex = sessionsOfDayResponse.findIndex((s: any) => s.uid === sessionIdValue);
    
    // Calculate duration in seconds
    const durationSeconds = Math.round(sessionData.duration / 1000);
    
    sessionInfo = {
      id: sessionIdValue,
      index: sessionIndex || 1,
      duration: durationSeconds,
      sets: sessionData.totalSets || 0,
      breaths: sessionData.totalExhales || 0,
      startTime: new Date(sessionData.startTime),
      endTime: new Date(sessionData.endTime),
      qualityScore: sessionData.qualityScore || 0,
      completion: sessionData.completion || 0
    };
    
    // Process the sets from the consolidated response
    if (sessionData.treatmentSets && Array.isArray(sessionData.treatmentSets)) {
      // Map the sets data to our expected format
      setsInfo = sessionData.treatmentSets.map((set: any, index: number) => {
        // Calculate duration in seconds
        const durationSeconds = Math.round(set.duration / 1000);
        
        return {
          id: `Set ${index + 1}`, // Display as "Set 1", "Set 2", etc.
          uid: set.uid,
          duration: durationSeconds,
          breaths: set.totalExhales || 0,
          qualityScore: set.qualityScore || 0,
          completion: set.completion || 0,
          startTime: new Date(set.startTime),
          endTime: new Date(set.endTime),
          sessionId: sessionIdValue,
          userId: userIdValue,
          totalExhales: set.totalExhales || 0,
          rawSessionStartIndex: set.rawSessionStartIndex,
          rawSessionEndIndex: set.rawSessionEndIndex
        };
      });
      
      // First, create placeholder data for all sets for UI clarity
      const setPlaceholders = setsInfo.map((set: any, index: number) => ({
        uid: `placeholder-${set.uid}`,
        sessionId: sessionIdValue,
        userId: userIdValue,
        setId: set.uid,
        startTime: set.startTime,
        endTime: set.startTime,
        duration: 0,
        values: {
          type: 'float32',
          data: [0, 0, 0, 0] // Simple placeholder data
        },
        sequenceNumber: 0,
        sequenceType: 'exhale',
        isGap: false,
        setIndex: index + 1,
        isPlaceholder: true
      })) as ExhaleWithContext[];
      
      // Add placeholders to breathData
      breathData = [...setPlaceholders];
      
      // Process exhales and gaps directly from the consolidated response
      for (const set of sessionData.treatmentSets) {
        // Process exhales
        if (set.treatmentExhales && Array.isArray(set.treatmentExhales)) {
          const setIndex = setsInfo.findIndex(s => s.uid === set.uid) + 1;
          
          const exhalesWithContext = set.treatmentExhales.map((exhale: any) => ({
            ...exhale,
            sessionId: sessionIdValue,
            userId: userIdValue,
            setId: set.uid,
            setIndex: setIndex,
            sequenceType: 'exhale',
            isGap: false
          })) as ExhaleWithContext[];
          
          // Add all exhales from this set to our collection
          breathData = [...breathData, ...exhalesWithContext];
        }
        
        // Process gaps between exhales
        if (set.treatmentExhaleGaps && Array.isArray(set.treatmentExhaleGaps)) {
          const setIndex = setsInfo.findIndex(s => s.uid === set.uid) + 1;
          
          const gapsWithContext = set.treatmentExhaleGaps.map((gap: any) => ({
            ...gap,
            sessionId: sessionIdValue,
            userId: userIdValue,
            setId: set.uid,
            setIndex: setIndex,
            sequenceNumber: gap.sequenceNumber || gap.sequenceNum, // Normalize property name
            sequenceType: 'gap',
            isGap: true
          })) as ExhaleWithContext[];
          
          // Add all gaps from this set to our collection
          breathData = [...breathData, ...gapsWithContext];
        }
      }
    }
      
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('Error fetching session data:', error);
    // Fallback to fake data if API fails
    sessionInfo = {
      id: sessionIdValue,
      index: 1,
      duration: 0,
      sets: 0,
      breaths: 0,
      startTime: new Date(),
      endTime: new Date(Date.now() + 300000),
      qualityScore: 0,
      completion: 0
    };
    setsInfo = [];
    breathData = [];
  }

  console.log(`Total breath-related items collected: ${breathData.length}`);
  
  // Fetch session's csv export data
  let csvData: any[] = [];
  let csvHeaders: { label: string, key: string }[] = []; // Declare variable for dynamic headers

  try {
    const csvResponse = await authFetcherWithRedirect(`api/treatments/session/${sessionIdValue}/export`);
    const csvText = csvResponse; // Get the full CSV text

    const lines = csvText.split('\n').filter((line: string) => line.trim() !== ''); // Split into lines, remove empty

    if (lines.length > 0) {
      // Extract headers (first line)
      const headerRow = lines[0];
      const headers = headerRow.split(',');

      // Transform headers for react-csv
      // Use header string itself as the key, trimming whitespace
      csvHeaders = headers.map((header: string) => ({ label: header.trim(), key: header.trim() }));

      // Process data rows (skip the header row)
      const dataRows = lines.slice(1);

      csvData = dataRows.map((row: string) => {
        const values = row.split(',');
        const rowObject: { [key: string]: string } = {};

        // Map values to headers to create the row object
        headers.forEach((header: string, index: number) => {
          const cleanedHeader = header.trim();
          // Ensure value exists for the given index, trim whitespace
          rowObject[cleanedHeader] = values[index] !== undefined ? values[index].trim() : '';
        });
        return rowObject;
      });

    } else {
      console.warn('CSV export data is empty.');
    }

  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('Error fetching or parsing CSV data:', error);
    // On error, ensure data and headers are empty arrays
    csvData = [];
    csvHeaders = [];
  }


  return (
    <SessionProfile
      initialData={{
        participantInfo,
        prescriptionInfo,
        sessionInfo,
        setsInfo,
        breathData,
        csvData,
        csvHeaders
      }}
      userId={userIdValue}
      date={dateValue}
      sessionId={sessionIdValue}
    />
  );
}