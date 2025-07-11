import { redirect } from "next/navigation";
import axiosAuth from "./axiosAuth";



export async function authPatch(url: string, payload: any) {
    const res = await axiosAuth.patch(url, payload);
    return res.data;
  }
  
  
export default async function patchWithAuthRedirect(url: string, payload: any) {
    try {
      return await authPatch(url, payload); 
    } catch (err: any) {
      if (err?.response?.status === 401) {
        redirect('/login?logout=true');
      }
      throw err;
    }
  }