import Profile from 'views/treatment/day';
import { authFetcherWithRedirect } from '@/utils/withAuthRedirect';
import { ExhaleWithContext } from 'types';

// Define interfaces for our data structures
interface TreatmentInfoType {
  date: string;
  actSessions: number;
  sets: number;
  breaths: number;
}

interface SessionInfoType {
  id: string;
  displayId: string;
  index: number;
  duration: number;
  sets: number;
  breaths: number;
  startTime: Date;
  endTime: Date;
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

// ==============================|| PAGE ||============================== //

function parseDateFromPath(date: string) {
  try {
    // Assuming date is in format YYYY-MM-DD
    return new Date(date);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('Invalid date format in URL:', error);
    return new Date(); // Fallback to current date
  }
}

export default async function DayProfilePage({ params }: { params: Promise<{ userId: string, date: string }> }) {
  // Await the params to satisfy the Next.js requirement
  const { userId, date } = await Promise.resolve(params);

  const userIdValue = userId || "ngCHGLIWOdPYumRJybB7D9qd2El1"; 
  const dateValue = date;
  
  const selectedDate = parseDateFromPath(dateValue);
  const formattedDate = selectedDate.toISOString().split('T')[0];
  
  // Fetch real participant data
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
    participantInfo = { 
      username: "NaN", 
      trialStage: "NaN", 
      deviceMode: "NaN", 
      lastSeen: new Date(), 
      lastACT: new Date() 
    };
  }
  
  // Use the new consolidated API to fetch all day data at once
  let dayData: any = null;
  let participantTreatmentInfo: TreatmentInfoType[] = [];
  let sessionInfo: SessionInfoType[] = [];
  let breathData: ExhaleWithContext[] = [];
  
  // Initialize prescriptionInfo with a default value to ensure it's never undefined
  let prescriptionInfo: PrescriptionInfoType = { 
    username: participantInfo.username, 
    actSessionsPerDay: 2,
    setsPerACTSession: 5,
    breathsPerSet: 20,
    breathLength: 8, 
    breathPressureTarget: 15,
    breathPressureRange: 10
  };
  
  try {
    console.log(`Fetching consolidated day data for ${userIdValue} on ${formattedDate}`);
    const dayResponse = await authFetcherWithRedirect(
      `api/treatments/${userIdValue}/days/${formattedDate}?include=treatmentSessions,treatmentSets,treatmentExhales,treatmentExhaleGaps,values`
    );
    dayData = dayResponse;
    
    // Get treatment summary info directly from day data
    participantTreatmentInfo = [{
      date: formattedDate,
      actSessions: dayData.totalSessions || 0,
      sets: dayData.totalSets || 0,
      breaths: dayData.totalExhales || 0,
    }];
    
    console.log(`Found ${dayData.totalSessions} sessions, ${dayData.totalSets} sets, ${dayData.totalExhales} breaths`);
    
    // Fetch prescription data based on session ID
    // Check if there are sessions with a prescription ID
    if (dayData.treatmentSessions && 
        dayData.treatmentSessions.length > 0 && 
        dayData.treatmentSessions[0].prescriptionId) {
      
      // Get the prescription ID from the session
      const prescriptionId = dayData.treatmentSessions[0].prescriptionId;
      console.log(`Found prescriptionId ${prescriptionId} from session data`);
      
      // Fetch the specific prescription data for this session
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
      // Fallback to user's general prescription if no session prescription is found
      console.log('No session prescription found, falling back to user prescription');
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
    
    // Process session information from the nested data
    if (dayData.treatmentSessions && dayData.treatmentSessions.length > 0) {
      sessionInfo = dayData.treatmentSessions.map((session: any, index: number) => {
        const durationSeconds = Math.round(session.duration / 1000);
        
        return {
          id: session.uid,
          displayId: `Session ${index + 1}`,
          index: index + 1,
          duration: durationSeconds,
          sets: session.totalSets || 0,
          breaths: session.totalExhales || 0,
          startTime: new Date(session.startTime),
          endTime: new Date(session.endTime)
        };
      });
      
      // Process breath data (both exhales and gaps) for visualization
      // // First add placeholder data for all sessions to ensure they appear in the chart
      // const sessionPlaceholders = dayData.treatmentSessions.map((session: any) => ({
      //   uid: `placeholder-${session.uid}`,
      //   values: {
      //     data: [0, 0, 0, 0] // Simple placeholder data
      //   },
      //   startTime: session.startTime,
      //   sessionId: session.uid,
      //   isPlaceholder: true
      // }));
      
      // // Start with placeholders
      // breathData = [...sessionPlaceholders];
      
      // Process all sessions, sets, exhales, and gaps
      dayData.treatmentSessions.forEach((session: any) => {
        if (session.treatmentSets && session.treatmentSets.length > 0) {
          session.treatmentSets.forEach((set: any) => {
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
              })) as ExhaleWithContext[];
              
              breathData = [...breathData, ...exhalesWithContext];
            }
            
            // Process gaps between exhales
            if (set.treatmentExhaleGaps && set.treatmentExhaleGaps.length > 0) {
              const gapsWithContext = set.treatmentExhaleGaps.map((gap: any) => ({
                ...gap,
                sessionId: session.uid,
                sessionStartTime: session.startTime,
                setId: set.uid,
                setStartTime: set.startTime,
                sequenceNumber: gap.sequenceNum || gap.sequenceNumber, // Normalize property name
                sequenceType: 'gap',
                isGap: true
              })) as ExhaleWithContext[];
              
              breathData = [...breathData, ...gapsWithContext];
            }
          });
        }
      });
      
      console.log(`Processed ${breathData.length} breath events (exhales and gaps)`);
    }
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('Error fetching consolidated day data:', error);
    participantTreatmentInfo = [{ 
      date: formattedDate,
      actSessions: 0,
      sets: 0,
      breaths: 0
    }];
    sessionInfo = [];
    breathData = [];
    // prescriptionInfo already has a fallback value from initialization
  }

  return (
    <Profile
      initialData={{
        participantInfo,
        prescriptionInfo,
        participantTreatmentInfo,
        sessionInfo,
        breathData,
        date: selectedDate
      }}
      userId={userIdValue}
      date={dateValue}
    />
  );
}