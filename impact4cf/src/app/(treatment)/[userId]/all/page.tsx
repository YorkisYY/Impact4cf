import Profile from 'views/treatment'; 
import { ExhaleWithContext } from 'types';
import { authFetcherWithRedirect } from '@/utils/withAuthRedirect';

// ==============================|| PAGE ||============================== //
interface AllDaysTreatmentPageProps {
  params: {
    userId: string;
  };
}

/**

 * Get the date range for the current week (Monday to Sunday or current day if earlier)

 * @returns Object containing startDate (Monday) and endDate (Sunday or current day)

 */
export function getCurrentWeekDates() {
  const now = new Date();
  const currentDay = now.getDay(); // Get current day of week (0-6)

  const monday = new Date(now);
  // If it's Sunday (0), subtract 6 days; for other days, subtract (currentDay - 1)
  const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
  monday.setDate(now.getDate() - daysToSubtract);
  monday.setHours(0, 0, 0, 0); // Set to beginning of day

  // Sunday is 6 days after Monday
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999); // Set to end of day
  
  // If Sunday is in the future, cap at today
  const endDate = sunday > now ? now : sunday;

  return { startDate: monday, endDate };
}

/**

 * Profile page component that fetches and transforms user treatment data

 * @param params Object containing userId for the profile to display

 */
export default async function AllDaysTreatmentPage({ params }: AllDaysTreatmentPageProps) {
  
  // FIX: Properly handle the params object by ensuring it's resolved before using
  const { userId } = await Promise.resolve(params);
  const userIdValue = userId || "ngCHGLIWOdPYumRJybB7D9qd2El1"; // Use from URL or fallback to test ID
  
  const { startDate, endDate } = getCurrentWeekDates();
  
  const startDateFormatted = startDate.toISOString().split('T')[0];
  const endDateFormatted = endDate.toISOString().split('T')[0];

  // Fetch real participant data
  let userData: any;
  let participantInfo;
  try {
    const userResponse = await authFetcherWithRedirect(`api/users/${userIdValue}`);
    userData = userResponse;
    
    // Convert API data structure to our component's expected format
    participantInfo = {
      username: userData.name || "User",
      trialStage: userData.trialStage,
      deviceMode: userData.deviceMode || "Unknown",
      lastSeen: userData.lastActive,
      lastACT: userData.lastTreatment
    };
    
    console.log("Fetched user data:", userData);
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
  
  // Track prescriptions by ID to avoid duplicate fetches
  const prescriptionsMap = new Map<string, any>();
  // Track which days use which prescription
  const prescriptionDays = new Map<string, { firstDay: string, lastDay: string }>();
  
  // Fetch treatment data for the date range
  let participantTreatmentInfo: {
    date: string;
    actSessions: number;
    sets: number;
    breaths: number;
    breathData: ExhaleWithContext[];
  }[] = [];

  // Fetch all days with treatment data in the date range
  let daysData: any;
  try {
    const daysResponse = await authFetcherWithRedirect(`api/treatments/${userIdValue}/days?startDate=${startDateFormatted}&endDate=${endDateFormatted}`);
    daysData = daysResponse;
    console.log("Fetched days with treatment data:", daysData);
    
    // For each day that has treatment data, fetch detailed activity using new endpoint
    const treatmentPromises = daysData.map(async (day: any) => {
      // Extract the date portion only (YYYY-MM-DD)
      const dayDate = new Date(day.date).toISOString().split('T')[0];
      
      try {
        // Use the new API endpoint that includes all data in one call
        const dayDetailsResponse = await authFetcherWithRedirect(
          `api/treatments/${userIdValue}/days/${dayDate}?include=treatmentSessions,treatmentSets,treatmentExhales,treatmentExhaleGaps,values`
        );
        
        console.log(`Fetched all data for day ${dayDate}:`, dayDetailsResponse);
        
        // Get prescription data if treatment sessions exist
        if (dayDetailsResponse?.treatmentSessions && dayDetailsResponse.treatmentSessions.length > 0 && 
            dayDetailsResponse.treatmentSessions[0].prescriptionId) {
              
          const prescriptionId = dayDetailsResponse.treatmentSessions[0].prescriptionId;
          
          // Fetch prescription data if we haven't already
          if (!prescriptionsMap.has(prescriptionId)) {
            const prescriptionResponse = await authFetcherWithRedirect(`api/prescriptions/${prescriptionId}`);
            if (prescriptionResponse) {
              prescriptionsMap.set(prescriptionId, prescriptionResponse);
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
        console.error(`Error fetching details for day ${dayDate}:`, error);
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
    participantTreatmentInfo = await Promise.all(treatmentPromises);
    console.log("Processed treatment data for all days:", participantTreatmentInfo);
    
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    participantTreatmentInfo = [];
  }


  // Convert prescription map to the format our component expects
  let prescriptionInfo: any[] = [];
  prescriptionsMap.forEach((prescription, id) => {
    const days = prescriptionDays.get(id);
    if (days) {
      prescriptionInfo.push({
        id: id,
        username: participantInfo.username,
        actSessionsPerDay: prescription.sessionsPerDay,
        setsPerACTSession: prescription.setsPerSession,
        breathsPerSet: prescription.exhalesPerSet,
        breathLength: prescription.exhaleDuration,
        breathPressureTarget: prescription.exhaleTargetPressure,
        breathPressureRange: prescription.exhaleTargetRange,
        appliedFrom: days.firstDay,
        appliedTo: days.lastDay
      });
    }
  });
  
  // If no prescriptions were found, fetch the user's current prescription
  if (prescriptionInfo.length === 0) {
    try {
      const prescriptionResponse = await authFetcherWithRedirect(`api/prescriptions/user/${userIdValue}`);
      const prescriptionData = prescriptionResponse;
      
      if (prescriptionData) {
        prescriptionInfo = [{
          id: prescriptionData.uid,
          username: participantInfo.username,
          actSessionsPerDay: prescriptionData.sessionsPerDay,
          setsPerACTSession: prescriptionData.setsPerSession,
          breathsPerSet: prescriptionData.exhalesPerSet,
          breathLength: prescriptionData.exhaleDuration,
          breathPressureTarget: prescriptionData.exhaleTargetPressure,
          breathPressureRange: prescriptionData.exhaleTargetRange
        }];
      }
    } catch (error: any) {
      if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
      console.error('Error fetching user prescription data:', error);
      // Fallback to fake data if API fails
      prescriptionInfo = [{ 
        username: participantInfo.username, 
        actSessionsPerDay: 0,
        setsPerACTSession: 0,
        breathsPerSet: 0,
        breathLength: 0, 
        breathPressureTarget: 0,
        breathPressureRange: 0
      }];
    }
  }

  return (
    <Profile
      initialData={{
        participantInfo: participantInfo,
        prescriptionInfo: prescriptionInfo,
        participantTreatmentInfo: participantTreatmentInfo,
        dateRange: { startDate, endDate }
      }}
      userId={userIdValue}
    />
  );
}