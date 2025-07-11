'use server';

import { UpdatePasswordPayload } from "@/types/payloads";
import { DecodedUID } from "@/types/uid";
import { BasicUser } from "@/types/user-list-data";
import putWithAuthRedirect from "@/utils/putWithAuthRedirect";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";



export default async function updateUserPassword(payload: UpdatePasswordPayload) {

  try {

    const serviceToken: string | undefined = (await cookies()).get('serviceToken')?.value;
    if (!serviceToken) throw new Error("Could not get serviceToken @ UserInfo");
    const decodedToken: DecodedUID = jwtDecode<DecodedUID>(serviceToken)
    const uid: string = decodedToken.user_id;
    const updatedUser: BasicUser = await putWithAuthRedirect(`api/users/${uid}`, payload);
    return updatedUser;
  } catch (err: any) {
    console.error('Failed tp Update User Password:', err);
    throw err;
  }
}
