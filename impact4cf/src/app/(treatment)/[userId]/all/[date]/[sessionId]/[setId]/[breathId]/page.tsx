import React from 'react';
import BreathProfilePage from 'views/treatment/breath';
import { authFetcherWithRedirect } from '@/utils/withAuthRedirect';

interface ExhaleData {
  uid: string;
  setId: string;
  userId: string;
  startTime: string;
  endTime: string;
  duration: number;
  qualityScore: number;
  completion: number;
  values: any; // Binary data
  rawSessionStartIndex: number;
  rawSessionEndIndex: number;
  sequenceNumber: number;
  createdAt: string;
  updatedAt: string;
}

type Params= Promise<{
    userId: string;
    date: string;
    sessionId: string;
    setId: string;
    breathId: string;
  }>;

// ==============================|| PAGE ||============================== //

export default async function BreathPage(props: { params : Params}) {
  // Await the params to satisfy the Next.js requirement
  const { userId, date, sessionId, setId, breathId } = await props.params;
  const userIdValue = userId || "ngCHGLIWOdPYumRJybB7D9qd2El1"; 
  const dateValue = date;
  const sessionIdValue = sessionId;
  const setIdValue = setId;
  const breathIdValue = breathId;
  
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
    participantInfo = { 
      username: "NaN", 
      trialStage: "NaN", 
      deviceMode: "NaN", 
      lastSeen: new Date(), 
      lastACT: new Date() 
    };
  }
  
  // Find session index
  let sessionIndex = 1;
  let sessionsOfDay: any[] = [];
  let prescriptionInfo: any;
  try {
    sessionsOfDay = await authFetcherWithRedirect(`api/treatments/${userIdValue}/sessions/${dateValue}?include=treatmentSessions,treatmentSets,treatmentExhales,treatmentExhaleGaps,values`);
    sessionIndex = sessionsOfDay.findIndex((s: any) => s.uid === sessionIdValue) + 1;
    if (sessionIndex <= 0) sessionIndex = 1;

    // Use prescriptionId from session data to fetch prescription
    if (sessionsOfDay && sessionsOfDay[0].prescriptionId) {
      const prescriptionId = sessionsOfDay[0].prescriptionId;
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
      // Fallback to fetching by user ID if no prescriptionId is available
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
  }
  
  // Fetch set information
  let setsInSession: any[] = [];
  setsInSession = sessionsOfDay[sessionIndex - 1].treatmentSets;
  // Find set index within session
  let setIndex;
  setIndex = setsInSession.findIndex((s: any) => s.uid === setIdValue) + 1;
  if (setIndex <= 0) setIndex = 1;

  
  // Calculate duration in seconds
  const setData = setsInSession[setIndex - 1];
  const durationSeconds = Math.round(setData.duration / 1000);
  
  const setInfo = {
    id: setIdValue,
    displayId: `Set ${setIndex}`,
    index: setIndex,
    sessionId: sessionIdValue, 
    sessionIndex: sessionIndex,
    duration: durationSeconds,
    breaths: setData.totalExhales || 0,
    breathsTarget: prescriptionInfo.breathsPerSet,
    startTime: new Date(setData.startTime),
    endTime: new Date(setData.endTime)
  };
    
  
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

  // Fetch specific breath data using the new consolidated API endpoint
  let breathInfo;
  let breathData: ExhaleData[] = [];
  let breathsInSet: any[] = [];
  try {
    // Find breath index within set
    let breathIndex = 1;
    breathsInSet = setData.treatmentExhales;
    // Sort breaths by sequence number for more reliable indexing
    if (Array.isArray(breathsInSet)) {
      breathsInSet.sort((a: any, b: any) => {
        const seqA = a.sequenceNumber || 0;
        const seqB = b.sequenceNumber || 0;
        return seqA - seqB;
      });
    }
    
    breathIndex = breathsInSet.findIndex((b: any) => b.uid === breathIdValue) + 1;
    if (breathIndex <= 0) breathIndex = 1;

    // Get the specific exhale (breath) with values included using the new endpoint
    const exhaleData = breathsInSet[breathIndex - 1];
    
    // Check if exhaleData exists before accessing its properties
    if (exhaleData) {
      // Process breath data (both for display info and chart)
      const durationSeconds = Math.round(exhaleData.duration / 1000);
      const avgPressure = calculateAveragePressure(exhaleData.values);
      
      // Create the breath info object
      breathInfo = {
        id: exhaleData.uid,
        index: breathIndex,
        displayId: `Breath ${breathIndex}`,
        duration: durationSeconds,
        durationTarget: prescriptionInfo.breathLength,
        pressure: avgPressure,
        pressureTarget: prescriptionInfo.breathPressureTarget,
        pressureTargetRange: prescriptionInfo.breathPressureRange,
        startTime: new Date(exhaleData.startTime),
        endTime: new Date(exhaleData.endTime),
        qualityScore: exhaleData.qualityScore || 0,
        completion: exhaleData.completion || 0
      };
      
      // Add the raw breath data for chart visualization
      breathData = [exhaleData]; // Single breath data
    } else {
      // Handle case where exhaleData is null
      throw new Error("No exhale data returned from API");
    }
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('Error fetching breath data:', error);
    // Create placeholder data
    breathInfo = {
      id: breathIdValue,
      index: 1,
      displayId: 'NaN',
      duration: 0,
      durationTarget: prescriptionInfo.breathLength,
      pressure: 0,
      pressureTarget: prescriptionInfo.breathPressureTarget,
      pressureTargetRange: prescriptionInfo.breathPressureRange,
      startTime: new Date(),
      endTime: new Date(Date.now() + 6000),
      qualityScore: 0,
      completion: 0
    };
    
    breathData = [];
  }

  return (
    <BreathProfilePage
      initialData={{
        participantInfo,
        prescriptionInfo,
        setInfo,
        breathInfo,
        breathData
      }}
      userId={userIdValue}
      date={dateValue}
      sessionId={sessionIdValue}
      setId={setIdValue}
      breathId={breathIdValue}
    />
  );
}