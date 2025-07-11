'use client';

import React, { createContext, useEffect, useReducer } from 'react';

// third party
import { Chance } from 'chance';
import { jwtDecode } from 'jwt-decode';

// reducer - state management
import { LOGIN, LOGOUT } from 'store/actions';
import accountReducer from 'store/accountReducer';

// project imports
import Loader from 'ui-component/Loader';
import axios from 'utils/axios';

// types
import { KeyedObject } from 'types';
import { InitialLoginContextProps, JWTContextType } from 'types/auth';
import Cookies from 'js-cookie';


const chance = new Chance();

// constant
const initialState: InitialLoginContextProps = {
  isLoggedIn: false,
  isInitialized: false,
  user: null
};

const verifyToken = (serviceToken?: string | null): boolean => {

  if (!serviceToken) return false;

  try {
    const decoded: KeyedObject = jwtDecode(serviceToken);
    return decoded.exp > Date.now() / 1000;
  } catch (error) {
    console.log(error)
    return false;
  }
};

const setSession = (serviceToken?: string | null, remember: boolean = true) => {
  if (serviceToken) {
    Cookies.set('serviceToken', serviceToken, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      ...(remember ? { expires: 7 } : {}) 
    });

    axios.defaults.headers.common.Authorization = `Bearer ${serviceToken}`;
  } else {
    Cookies.remove('serviceToken');
    delete axios.defaults.headers.common.Authorization;
  }
};





// ==============================|| JWT CONTEXT & PROVIDER ||============================== //
const JWTContext = createContext<JWTContextType | null>(null);

export const JWTProvider = ({ children }: { children: React.ReactElement }) => {  
  const [state, dispatch] = useReducer(accountReducer, initialState);

  useEffect(() => {
    const init = async () => {
      try {
        //retreive token
        const serviceToken = Cookies.get('serviceToken');

        const rememberMe = typeof window !== 'undefined'
        ? localStorage.getItem('rememberMe') === 'true'
        : true;


        //verify token
        if (serviceToken && verifyToken(serviceToken)) {
          setSession(serviceToken, rememberMe);
          const decodedToken: any = jwtDecode(serviceToken);
          const user = { 
            uid: decodedToken.user_id,
            email: decodedToken.email, 
            role: decodedToken.role 
          };
          dispatch({
            type: LOGIN,
            payload: {
              isLoggedIn: true,
              user
            }
          });
        } else {
          dispatch({
            type: LOGOUT
          });
        }
      } catch (err) {
        console.error(err);
        dispatch({
          type: LOGOUT
        });
      }
    };

    init();
  }, []);

  const login = async (email: string, password: string, remember: boolean = true) => {

    try {
      const response = await axios.post('api/auth/login', { email, password });
      const serviceToken = response.data['idToken'];
      const user = response.data["user"];
      setSession(serviceToken, remember);

      if (typeof window !== 'undefined') {
        localStorage.setItem('rememberMe', remember ? 'true' : 'false');
      }


      dispatch({
        type: LOGIN,
        payload: {
          isLoggedIn: true,
          user
        }
      });
    
      // Check for a saved redirect path from both localStorage and URL query
      const savedRedirectPath = typeof window !== 'undefined' ? localStorage.getItem('auth_redirect') : null;
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const queryRedirect = urlParams ? urlParams.get('redirect') : null;
      
      // Use localStorage redirect path first, then URL query redirect, default to dashboard
      const redirectPath = savedRedirectPath || queryRedirect || '/dashboard/default';
      
      // Clear the saved redirect path
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_redirect');
        
        // Use router (if available) or direct window location
        if (redirectPath && redirectPath !== '/login') {
          window.location.href = redirectPath;
        }
      }

    } catch (err: any) {
      throw err;
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    // todo: this flow need to be recode as it not verified
    const id = chance.bb_pin();
    const response = await axios.post('/api/account/register', {
      id,
      email,
      password,
      firstName,
      lastName
    });
    let users = response.data;

    if (window.localStorage.getItem('users') !== undefined && window.localStorage.getItem('users') !== null) {
      const localUsers = window.localStorage.getItem('users');
      users = [
        ...JSON.parse(localUsers!),
        {
          id,
          email,
          password,
          name: `${firstName} ${lastName}`
        }
      ];
    }

    window.localStorage.setItem('users', JSON.stringify(users));
  };

  const logout = async() => {
    setSession(null);
    Cookies.remove('serviceToken');
    if (typeof window !== 'undefined') localStorage.removeItem('rememberMe');
    dispatch({ type: LOGOUT });
  };

  const resetPassword = async (email: string) => {};

  const updateProfile = () => {};

  if (state.isInitialized !== undefined && !state.isInitialized) {
    return <Loader />;
  }

  return <JWTContext.Provider value={{ ...state, login, logout, register, resetPassword, updateProfile }}>{children}</JWTContext.Provider>;
};

export default JWTContext;
