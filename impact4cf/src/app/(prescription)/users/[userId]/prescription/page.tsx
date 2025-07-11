// app/prescription/[userId]/page.tsx (Server Component)
import { authFetcherWithRedirect } from '@/utils/withAuthRedirect';
import PrescriptionPageClient from '@/views/forms/components/Prescription/PrescriptionPageClient';

interface PageProps {
  params: {
    userId?: string;
  };
}

export default async function PrescriptionPage({ params }: PageProps) {
  const userId = params.userId || 'ngCHGLIWOdPYumRJybB7D9qd2El1';

 
  let userData: any;
  try {
    userData = await authFetcherWithRedirect(`api/users/${userId}`);
  } catch (error) {
    console.error('Failed to fetch user:', error);
    userData = {
      uid: userId,
      name: 'Fallback User'
    };
  }

 
  let allPrescriptions: any[] = [];
  try {

    allPrescriptions = await authFetcherWithRedirect(`api/prescriptions/user/${userId}/all`);
    console.log('All prescriptions fetched successfully:', allPrescriptions);
  } catch (error) {
    console.error('Failed to fetch prescriptions:', error);
    allPrescriptions = [];
  }


  const currentPrescription = allPrescriptions.find(p => p.isCurrentPrescription) 
    || allPrescriptions[0] 
    || null;

  return (
    <PrescriptionPageClient
      userData={userData}
      allPrescriptions={allPrescriptions}
      currentPrescription={currentPrescription}
    />
  );
}
