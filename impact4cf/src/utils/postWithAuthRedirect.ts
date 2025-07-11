import { redirect } from "next/navigation";
import axiosAuth from "./axiosAuth";



export async function authPost(url: string, payload: any) {
    const res = await axiosAuth.post(url, payload);
    return res.data;
  }
  
  
export default async function postWithAuthRedirect(url: string, payload: any) {
    try {
      return await authPost(url, payload); 
    } catch (err: any) {
      if (err?.response?.status === 401) {
        redirect('/login?logout=true');
      }
      throw err;
    }
  }