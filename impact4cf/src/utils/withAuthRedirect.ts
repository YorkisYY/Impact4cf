'use server';
import { redirect } from 'next/navigation';
import { authFetcher } from './axiosAuth';


export async function authFetcherWithRedirect(url: string) {
  try {
    return await authFetcher(url);
  } catch (err: any) {
    if (err?.response?.status === 401) {
      redirect('/login?logout=true'); 
    }
    throw err;
  }
}
