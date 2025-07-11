import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';


jest.mock('store/actions', () => ({
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT'
}), { virtual: true });

jest.mock('store/accountReducer', () => ({
  __esModule: true,
  default: (state, action) => {
    switch (action.type) {
      case 'LOGIN':
        return {
          ...state,
          isLoggedIn: true,
          isInitialized: true,
          user: action.payload.user
        };
      case 'LOGOUT':
        return {
          ...state,
          isLoggedIn: false,
          isInitialized: true,
          user: null
        };
      default:
        return state;
    }
  }
}), { virtual: true });

jest.mock('ui-component/Loader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader">Loading...</div>
}), { virtual: true });

jest.mock('utils/axios', () => ({
  defaults: {
    headers: {
      common: {}
    }
  },
  post: jest.fn()
}), { virtual: true });

jest.mock('js-cookie');
jest.mock('jwt-decode');
jest.mock('chance', () => {
  return {
    Chance: jest.fn().mockImplementation(() => ({
      bb_pin: jest.fn().mockReturnValue('12345')
    }))
  };
});


import { JWTProvider, default as JWTContext } from '../JWTContext';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';


const axios = require('utils/axios');


const TestComponent = () => {
  const context = React.useContext(JWTContext);
  return (
    <div>
      <div data-testid="login-status">{context?.isLoggedIn ? 'logged-in' : 'logged-out'}</div>
      <div data-testid="user-email">{context?.user?.email || 'no-user'}</div>
      <button onClick={() => context?.login('test@example.com', 'password')} data-testid="login-button">
        Login
      </button>
      <button onClick={() => context?.logout()} data-testid="logout-button">
        Logout
      </button>
    </div>
  );
};

describe('JWTContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    

    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    

    delete window.location;
    window.location = { href: '' } as Location;
  });

  it('should initialize with logged out state', async () => {

    (Cookies.get as jest.Mock).mockReturnValue(null);
    
    await act(async () => {
      render(
        <JWTProvider>
          <TestComponent />
        </JWTProvider>
      );
    });
    
    expect(screen.getByTestId('login-status')).toHaveTextContent('logged-out');
    expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
  });

  it('should initialize with logged in state if valid token exists', async () => {
  
    const mockToken = 'valid-token';
    (Cookies.get as jest.Mock).mockReturnValue(mockToken);
    (jwtDecode as jest.Mock).mockReturnValue({
      exp: Date.now() / 1000 + 3600, 
      user_id: 'user123',
      email: 'user@example.com',
      role: 'USER'
    });
    
    await act(async () => {
      render(
        <JWTProvider>
          <TestComponent />
        </JWTProvider>
      );
    });
    
    expect(screen.getByTestId('login-status')).toHaveTextContent('logged-in');
    expect(screen.getByTestId('user-email')).toHaveTextContent('user@example.com');
  });

  it('should handle login successfully', async () => {

    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        idToken: 'new-token',
        user: {
          uid: 'user123',
          email: 'test@example.com',
          role: 'USER'
        }
      }
    });
    
    await act(async () => {
      render(
        <JWTProvider>
          <TestComponent />
        </JWTProvider>
      );
    });
    
 
    await act(async () => {
      screen.getByTestId('login-button').click();
    });
    

    await waitFor(() => {
      expect(screen.getByTestId('login-status')).toHaveTextContent('logged-in');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
    
    expect(axios.post).toHaveBeenCalledWith('api/auth/login', {
      email: 'test@example.com',
      password: 'password'
    });
    

    expect(Cookies.set).toHaveBeenCalledWith('serviceToken', 'new-token', expect.any(Object));
  });


});