'use server';

import deleteWithAuthRedirect from "@/utils/deleteWithAuthRedirect";


export default async function deleteUsers(uids: string[]) {
  try {
    await Promise.all(
      uids.map((uid) =>
        deleteWithAuthRedirect(`api/users/${uid}`)
      )
    );

    return true;
  } catch (err: any) {
    console.error('User deletion failed:', err);
    throw err;
  }
}
