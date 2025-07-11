
export type BasicUser = {
  uid: string | null;
  name: string | null;
  email: string | null;
  prescriptionId: string | null;
  timezone: string | null;
  trialStage: number;
  deviceMode: string | null;
  deviceRecordingMode: string | null;
  role: 'super_user' | 'admin' | 'researcher' | 'clinician' | 'patient' | 'device' | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastTreatment: string | null;
};

export type UserActivity = {
  uid: string | null;
  name: string | null;
  email: string | null;
  lastActive: string | null;
  isActiveDuringPeriod: boolean;
  activity: {
    totalSessions: number;
    totalSets: number;
    totalBreaths: number;
  };
};

export type CombinedUserData = {
  id: string | null;
  name: string | null;
  email: string | null;
  prescriptionId: string | null;
  timezone: string | null;
  trialStage: number;
  deviceMode: string | null;
  deviceRecordingMode: string | null;
  role: string | null;
  lastActive: Date | null;
  lastTreatment: Date | null;
  totalSessions: number;
  totalBreaths: number;
  totalSets: number;
};
