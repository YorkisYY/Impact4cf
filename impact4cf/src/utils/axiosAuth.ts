


/**
 * axios setup to use mock service
*/

'use server';
import axios from 'axios';
import { cookies } from 'next/headers';
// import { headers } from 'next/headers';

const axiosAuth = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/' });




// ==============================|| AXIOS - FOR MOCK SERVICES ||============================== //

axiosAuth.interceptors.request.use(
  async (config) => {
    const accessToken = (await cookies()).get('serviceToken')?.value;
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);







export default axiosAuth;

export async function authFetcher(url: string) {
    const res = await axiosAuth.get(url);
    return res.data;
}
