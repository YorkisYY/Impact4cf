import { redirect } from "next/navigation";
import axiosAuth from "./axiosAuth";



export async function authPut(url: string, payload: any) {
    const res = await axiosAuth.put(url, payload);
    return res.data;
  }
  
  
export default async function putWithAuthRedirect(url: string, payload: any) {
    try {
      return await authPut(url, payload); 
    } catch (err: any) {
      if (err?.response?.status === 401) {
        redirect('/login?logout=true');
      }
      throw err;
    }
  }