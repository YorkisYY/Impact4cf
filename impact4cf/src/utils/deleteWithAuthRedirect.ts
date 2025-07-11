import { redirect } from "next/navigation";
import axiosAuth from "./axiosAuth";



export async function authDelete(url: string) {
    const res = await axiosAuth.delete(url);
    return res.data;
  }
  
  
export default async function deleteWithAuthRedirect(url: string) {
    try {
      return await authDelete(url);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        redirect('/login?logout=true');
      }
      throw err;
    }
  }