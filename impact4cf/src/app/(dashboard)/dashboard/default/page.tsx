import DefaultDashboard from 'views/dashboard/Default';
import { authFetcherWithRedirect } from '@/utils/withAuthRedirect';
export const dynamic = 'force-dynamic';
// ==============================|| PAGE ||============================== //
interface User {
  uid: string;
  name?: string; // Optional since it may not always be present
  // Add other properties as needed
}

export function getCurrentWeekDates() {
  const now = new Date();
  const currentDay = now.getDay(); // Get current day of week (0-6)

  const monday = new Date(now);
  // If it's Sunday (0), subtract 6 days; for other days, subtract (currentDay - 1)
  const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
  monday.setDate(now.getDate() - daysToSubtract);
  monday.setHours(0, 0, 0, 0); // Set to beginning of day

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6); // Add 6 days to get to Sunday
  sunday.setHours(23, 59, 59, 999); // Set to end of day

  return { startDate: monday, endDate: sunday };
}

export function getPreviousWeekDates() {
  const { startDate } = getCurrentWeekDates();
  const previousMonday = new Date(startDate);
  previousMonday.setDate(previousMonday.getDate() - 7); // Go back 7 days to previous Monday

  const previousSunday = new Date(previousMonday);
  previousSunday.setDate(previousMonday.getDate() + 6); // Add 6 days to get to previous Sunday
  previousSunday.setHours(23, 59, 59, 999); // Set to end of day

  return { startDate: previousMonday, endDate: previousSunday };
}

export default async function DefaultDashboardPage() {
  const currentWeek = getCurrentWeekDates();
  const previousWeek = getPreviousWeekDates();

  // Format dates for API requests
  const formattedCurrentStartDate = currentWeek.startDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const formattedCurrentEndDate = currentWeek.endDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const formattedPrevStartDate = previousWeek.startDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const formattedPrevEndDate = previousWeek.endDate.toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    // Fetch data for current week and previous week
    const [currentWeekResponse, previousWeekResponse, allUsers] = await Promise.all([
      authFetcherWithRedirect(`api/analytics/participants?startDate=${formattedCurrentStartDate}&endDate=${formattedCurrentEndDate}`),
      authFetcherWithRedirect(`api/analytics/participants?startDate=${formattedPrevStartDate}&endDate=${formattedPrevEndDate}`),
      authFetcherWithRedirect('api/users')
    ]);

    const currentWeekData = currentWeekResponse;
    const previousWeekData = previousWeekResponse;

    // Calculate week-over-week changes
    const totalUsersChange = currentWeekData.participants.total - previousWeekData.participants.total;
    const activeUsersChange = currentWeekData.participants.active - previousWeekData.participants.active;
    const inactiveUsersChange = currentWeekData.participants.inactive - previousWeekData.participants.inactive;

    // Calculate session count changes
    const sessionsChange = currentWeekData.activity.totalSessions - previousWeekData.activity.totalSessions;
    const setsChange = currentWeekData.activity.totalSets - previousWeekData.activity.totalSets;
    const breathsChange = currentWeekData.activity.totalBreaths - previousWeekData.activity.totalBreaths;

    // Fetch daily data for all participants graph
    const days: Array<{
      date: string;
      data: {
        sessions: number;
        sets: number;
        breaths: number;
      }
    }> = [];
    const startDate = new Date(currentWeek.startDate);
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const formattedDate = currentDate.toISOString().split('T')[0];
      
      // Fetch data for this specific day
      const dayResponse = await authFetcherWithRedirect(
        `api/analytics/participants?startDate=${formattedDate}&endDate=${formattedDate}`
      );
      
      days.push({
        date: formattedDate,
        data: {
          sessions: dayResponse.activity.totalSessions || 0,
          sets: dayResponse.activity.totalSets || 0,
          breaths: dayResponse.activity.totalBreaths || 0
        }
      });
    }

    // Get default participant for individual graph (first user)
    let defaultParticipantData: {
      days: Array<{
        date: string;
        data: {
          sessions: number;
          sets: number;
          breaths: number;
        }
      }>;
      prescription: any;
    } = { 
      days: [], 
      prescription: null 
    };
    if (allUsers && allUsers.length > 0) {
      const defaultUser = allUsers[0];
      
      // Fetch prescription for default user
      const defaultUserPrescription = await authFetcherWithRedirect(`api/prescriptions/user/${defaultUser.uid}`);
      
      // Fetch daily activity data for default user
      const userDays: Array<{
        date: string;
        data: {
          sessions: number;
          sets: number;
          breaths: number;
        }
      }> = [];
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const formattedDate = currentDate.toISOString().split('T')[0];
        
        const dayResponse = await authFetcherWithRedirect(
          `api/analytics/users/${defaultUser.uid}/activity?startDate=${formattedDate}&endDate=${formattedDate}`
        );
        
        userDays.push({
          date: formattedDate,
          data: {
            sessions: dayResponse.activity.totalSessions || 0,
            sets: dayResponse.activity.totalSets || 0,
            breaths: dayResponse.activity.totalBreaths || 0
          }
        });
      }
      
      defaultParticipantData = {
        days: userDays,
        prescription: defaultUserPrescription
      };
    }

    // Calculate average prescription values
    let totalPrescribedSessions = 0;
    let totalPrescribedSets = 0;
    let totalPrescribedBreaths = 0;
    let userCount = 0;

    if (allUsers && allUsers.length > 0) {
      // We'll fetch all prescriptions in parallel to be efficient
      const prescriptionPromises = allUsers.map((user: User) => 
        authFetcherWithRedirect(`api/prescriptions/user/${user.uid}`)
      );
      
      const prescriptions = await Promise.all(prescriptionPromises);
      
      for (const prescription of prescriptions) {
        if (prescription) {
          totalPrescribedSessions += prescription.sessionsPerDay || 0;
          totalPrescribedSets += prescription.setsPerSession || 0;
          totalPrescribedBreaths += prescription.exhalesPerSet || 0;
          userCount++;
        }
      }
    }

    const averagePrescribed = {
      sessions: userCount > 0 ? Math.round(totalPrescribedSessions / userCount) : 0,
      sets: userCount > 0 ? Math.round(totalPrescribedSets / userCount) : 0,
      breaths: userCount > 0 ? Math.round(totalPrescribedBreaths / userCount) : 0
    };

    // Transform API response to match our component's expected data structure
    return (
      <DefaultDashboard
        initialData={{
          totalUsers: currentWeekData.participants.total,
          totalActiveUsers: currentWeekData.participants.active,
          totalInactiveUsers: currentWeekData.participants.inactive,
          totalTreatmentData: {
            sessions: currentWeekData.activity.totalSessions,
            sets: currentWeekData.activity.totalSets,
            breaths: currentWeekData.activity.totalBreaths
          },
          dateRange: {
            startDate: new Date(currentWeekData.dateRange.startDate),
            endDate: new Date(currentWeekData.dateRange.endDate)
          },
          changes: {
            totalUsers: totalUsersChange,
            activeUsers: activeUsersChange,
            inactiveUsers: inactiveUsersChange,
            sessions: sessionsChange,
            sets: setsChange,
            breaths: breathsChange
          },
          // Add data for graphs
          users: allUsers,
          participantsDaily: days,
          defaultParticipant: allUsers.length > 0 ? allUsers[0] : null,
          defaultParticipantData: defaultParticipantData,
          averagePrescribed,
        }}
      />
    );

  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('Error fetching analytics data:', error);

    // Fallback to default data if API call fails
    return (
      <DefaultDashboard
        initialData={{
          totalUsers: 0,
          totalActiveUsers: 0,
          totalInactiveUsers: 0,
          totalTreatmentData: {
            sessions: 0,
            sets: 0,
            breaths: 0
          },
          dateRange: { startDate: currentWeek.startDate, endDate: currentWeek.endDate },
          changes: {
            totalUsers: 0,
            activeUsers: 0,
            inactiveUsers: 0,
            sessions: 0,
            sets: 0,
            breaths: 0
          },
          users: [],
          participantsDaily: [],
          defaultParticipant: null,
          defaultParticipantData: {
            days: [] as Array<{
              date: string;
              data: {
                sessions: number;
                sets: number;
                breaths: number;
              }
            }>,
            prescription: null
          },
          averagePrescribed: {
            sessions: 0,
            sets: 0,
            breaths: 0
          },
        }}
      />
    );
  }
}