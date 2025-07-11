'use server'

import UserInfoView from "./components/UserInfoView";
import { cookies } from "next/headers";
import { jwtDecode } from 'jwt-decode';
import { authFetcherWithRedirect } from "@/utils/withAuthRedirect";
import { BasicUser } from "@/types/user-list-data";
import { redirect } from "next/navigation";
import { DecodedUID } from "@/types/uid";







export default async function UserInfo() {

    async function fetchUserData(): Promise<BasicUser | null> {
        //get uid from Cookie
        const serviceToken: string | undefined = (await cookies()).get('serviceToken')?.value;
        if (!serviceToken) throw new Error("Could not get serviceToken @ UserInfo");
        const decodedToken: DecodedUID = jwtDecode<DecodedUID>(serviceToken)
        const uid: string = decodedToken.user_id;

        try {
            const userData: BasicUser = await authFetcherWithRedirect(`api/users/${uid}`);
            return userData;
        } catch (err: any) {
            if (err?.digest?.startsWith('NEXT_REDIRECT')) throw err;
            console.error('Failed to fetch current user data', err);
        }

        return null;
    }
    

    const userData: BasicUser | null = await fetchUserData();

    if (!userData) {
        redirect('/pages/error')
    }
    


    
    return <UserInfoView userData={userData}/>

}