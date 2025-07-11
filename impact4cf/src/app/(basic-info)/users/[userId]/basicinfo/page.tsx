

// src/app/(basic-info)/users/[userId]/basicinfo/page.tsx

import { authFetcherWithRedirect } from '@/utils/withAuthRedirect';
import BasicInfoPageClient from '@/views/forms/components/BasicInfo/BasicInfoPageClient';

interface PageProps {
  params: {
    userId?: string;
  };
}

export default async function BasicInfoPage({ params: { userId } }: PageProps) {
  const uid = userId ?? 'defaultUserId';
  console.log('Final userId to use:', uid);

  let userData: any = {};
  try {
    console.log(`Fetching user data for userId: ${uid}`);
    userData = await authFetcherWithRedirect(`api/users/${uid}`);
    console.log('User data fetched successfully:', userData);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('Failed to fetch user:', error);
    userData = {
      uid,
      name: 'Fallback User',
      deviceMode: 'Record',
      trialStage: 0
    };
  }


  if (userData.role !== 'super_user') {
    try {
      const analyticsData = await authFetcherWithRedirect('api/analytics/users/activity');
      console.log('Analytics data fetched:', analyticsData);
    } catch (error: any) {
      if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;

      console.error('Error fetching analytics data:', error);
    }
  } else {
    console.warn('Super user detected; skipping analytics data fetch.');
  }

 
  return (
    <BasicInfoPageClient userData={userData} />
  );
}