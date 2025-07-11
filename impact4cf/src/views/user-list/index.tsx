
'use server';
import * as React from 'react';
import UserDataGrid from './components/userDataGrid';
import { authFetcherWithRedirect } from '@/utils/withAuthRedirect';
import { BasicUser, CombinedUserData, UserActivity,  } from '@/types/user-list-data';






export default async function UsersList() {


  async function fetchCombinedUserData(): Promise<CombinedUserData[]> {
    try {
      const basicUserInfo: BasicUser[] = await authFetcherWithRedirect('api/users');
      const userAnalyticsInfo: { users: UserActivity[] } = await authFetcherWithRedirect('api/analytics/users/activity');

      const analyticsMap = new Map(userAnalyticsInfo.users.map(user => [user.uid, user]));

      const combinedData: CombinedUserData[] = basicUserInfo.map(basic => {
        const analytics = analyticsMap.get(basic.uid);

        return {
          id: basic.uid,
          name: basic.name ?? 'Unknown',
          email: basic.email ?? 'Unknown',
          prescriptionId: basic.prescriptionId ?? 'Unknown',
          timezone: basic.timezone ?? 'Unknown',
          trialStage: basic.trialStage ?? 'Unknown',
          deviceMode: basic.deviceMode ?? 'Unknown',
          deviceRecordingMode: basic.deviceRecordingMode ?? 'Unknown',
          role: basic.role ?? 'Unknown',
          lastActive: analytics?.lastActive ? new Date(analytics.lastActive) : null,
          lastTreatment: basic.lastTreatment ? new Date(basic.lastTreatment) : null,
          totalSessions: analytics?.activity?.totalSessions ?? 0,
          totalBreaths: analytics?.activity?.totalBreaths ?? 0,
          totalSets: analytics?.activity?.totalSets ?? 0
        };
      });
      console.log("fetched");
      return combinedData;
    } catch (error: any) {
      if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
      console.error('Failed to fetch or process user data:', error);
      return []; 
    }
  }


  
  const userData: CombinedUserData[] = await fetchCombinedUserData();

  return (
     <UserDataGrid rows={userData} />
  );
}
