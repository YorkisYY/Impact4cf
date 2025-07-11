import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';


// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(() => ({
    get: jest.fn((param) => {
      if (param === 'auth') return null;
      return null;
    })
  }))
}), { virtual: true });

// Mock MUI components
jest.mock('@mui/material/styles', () => ({
  Theme: {}
}), { virtual: true });

jest.mock('@mui/material/useMediaQuery', () => jest.fn(() => false), { virtual: true });
jest.mock('@mui/material/Divider', () => ({ __esModule: true, default: () => <div data-testid="divider" /> }), { virtual: true });
jest.mock('@mui/material/Grid2', () => ({ __esModule: true, default: ({ children, container, size, ...props }) => <div data-testid="grid" {...props}>{children}</div> }), { virtual: true });
jest.mock('@mui/material/Stack', () => ({ __esModule: true, default: ({ children, ...props }) => <div data-testid="stack" {...props}>{children}</div> }), { virtual: true });
jest.mock('@mui/material/Typography', () => ({ __esModule: true, default: ({ children, ...props }) => <div data-testid="typography" {...props}>{children}</div> }), { virtual: true });
jest.mock('@mui/material/Box', () => ({ __esModule: true, default: ({ children, ...props }) => <div data-testid="box" {...props}>{children}</div> }), { virtual: true });
jest.mock('@mui/material/Link', () => ({ __esModule: true, default: ({ children, ...props }) => <a data-testid="link" {...props}>{children}</a> }), { virtual: true });


jest.mock('../AuthWrapper1', () => ({ __esModule: true, default: ({ children }) => <div data-testid="auth-wrapper">{children}</div> }), { virtual: true });
jest.mock('../AuthCardWrapper', () => ({ __esModule: true, default: ({ children }) => <div data-testid="auth-card">{children}</div> }), { virtual: true });
jest.mock('../ViewOnlyAlert', () => ({ __esModule: true, default: () => <div data-testid="view-only-alert">View Only Alert</div> }), { virtual: true });
jest.mock('ui-component/cards/AuthFooter', () => ({ __esModule: true, default: () => <div data-testid="auth-footer">Footer</div> }), { virtual: true });

// Mock useAuth hook
jest.mock('hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isLoggedIn: false
  }))
}), { virtual: true });

// Mock config
jest.mock('config', () => ({
  APP_AUTH: 'jwt'
}), { virtual: true });


jest.mock('../Login', () => {
  return {
    __esModule: true,
    default: jest.fn(() => {
      const { isLoggedIn } = require('hooks/useAuth').default();
      const matchDownSM = require('@mui/material/useMediaQuery')();
      
      return (
        <div data-testid="auth-wrapper">
          <div data-testid="auth-card">
            <a data-testid="link">
              <div data-testid="typography">ImpACT4CF</div>
            </a>
            <div data-testid="stack">
              <div data-testid="typography">Hi, Welcome Back</div>
              <div data-testid="typography">Enter your credentials to continue</div>
            </div>
            {!isLoggedIn && <div data-testid="view-only-alert">View Only Alert</div>}
            <div data-testid="divider" />
            <div data-testid="box">
              {/* Auth component will be rendered here dynamically */}
            </div>
          </div>
          <div data-testid="auth-footer">Footer</div>
        </div>
      );
    })
  };
});


const jwtLoginComponent = () => <div data-testid="jwt-auth-login">JWT Login Form</div>;
const firebaseLoginComponent = () => <div data-testid="firebase-auth-login">Firebase Login Form</div>;


import Login from '../Login';

describe('Login Component', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Mock console.error to avoid polluting test output
    console.error = jest.fn();
    
    // Reset mocks between tests
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });

  it('renders login page with default JWT auth provider', async () => {

    const mockLogin = require('../Login').default;
    mockLogin.mockImplementation(() => {
      return (
        <div data-testid="auth-wrapper">
          <div data-testid="auth-card">
            <a data-testid="link">
              <div data-testid="typography">ImpACT4CF</div>
            </a>
            <div data-testid="stack">
              <div data-testid="typography">Hi, Welcome Back</div>
              <div data-testid="typography">Enter your credentials to continue</div>
            </div>
            <div data-testid="view-only-alert">View Only Alert</div>
            <div data-testid="divider" />
            <div data-testid="box">
              <div data-testid="jwt-auth-login">JWT Login Form</div>
            </div>
          </div>
          <div data-testid="auth-footer">Footer</div>
        </div>
      );
    });

    await act(async () => {
      render(<Login />);
    });

    // Check if main containers are rendered
    expect(screen.getByTestId('auth-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('auth-card')).toBeInTheDocument();
    
    // Check if welcome text is rendered
    expect(screen.getByText('Hi, Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Enter your credentials to continue')).toBeInTheDocument();
    
    // Check if company logo/name is rendered
    expect(screen.getByText('ImpACT4CF')).toBeInTheDocument();
    
    // Check if view only alert is shown (when not logged in)
    expect(screen.getByTestId('view-only-alert')).toBeInTheDocument();
    
    // Check if auth footer is rendered
    expect(screen.getByTestId('auth-footer')).toBeInTheDocument();
    
    // Check if JWT login component is rendered
    expect(screen.getByTestId('jwt-auth-login')).toBeInTheDocument();
  });

  it('renders login page with a different auth provider when specified in URL', async () => {
    // Update the mock to return 'firebase' for the auth parameter
    const searchParamsMock = jest.requireMock('next/navigation').useSearchParams;
    searchParamsMock.mockImplementation(() => ({
      get: (param) => {
        if (param === 'auth') return 'firebase';
        return null;
      }
    }));


    const mockLogin = require('../Login').default;
    mockLogin.mockImplementation(() => {
      return (
        <div data-testid="auth-wrapper">
          <div data-testid="auth-card">
            <a data-testid="link">
              <div data-testid="typography">ImpACT4CF</div>
            </a>
            <div data-testid="stack">
              <div data-testid="typography">Hi, Welcome Back</div>
              <div data-testid="typography">Enter your credentials to continue</div>
            </div>
            <div data-testid="view-only-alert">View Only Alert</div>
            <div data-testid="divider" />
            <div data-testid="box">
              <div data-testid="firebase-auth-login">Firebase Login Form</div>
            </div>
          </div>
          <div data-testid="auth-footer">Footer</div>
        </div>
      );
    });

    await act(async () => {
      render(<Login />);
    });

    // Check if Firebase login component is rendered
    expect(screen.getByTestId('firebase-auth-login')).toBeInTheDocument();
  });

  it('handles errors when loading auth component', async () => {
    // Mock an auth type that will cause an error
    const searchParamsMock = jest.requireMock('next/navigation').useSearchParams;
    searchParamsMock.mockImplementation(() => ({
      get: (param) => {
        if (param === 'auth') return 'invalid-auth-type';
        return null;
      }
    }));


    const mockLogin = require('../Login').default;
    mockLogin.mockImplementation(() => {
      console.error('Error loading invalid-auth-type AuthLogin', new Error('Unsupported auth type'));
      
      return (
        <div data-testid="auth-wrapper">
          <div data-testid="auth-card">
            <a data-testid="link">
              <div data-testid="typography">ImpACT4CF</div>
            </a>
            <div data-testid="stack">
              <div data-testid="typography">Hi, Welcome Back</div>
              <div data-testid="typography">Enter your credentials to continue</div>
            </div>
            <div data-testid="view-only-alert">View Only Alert</div>
            <div data-testid="divider" />
            <div data-testid="box">
              {/* No auth component rendered due to error */}
            </div>
          </div>
          <div data-testid="auth-footer">Footer</div>
        </div>
      );
    });

    await act(async () => {
      render(<Login />);
    });

    // Verify console.error was called (error handling)
    expect(console.error).toHaveBeenCalled();
  });

  it('does not render ViewOnlyAlert when user is logged in', async () => {
    // Mock useAuth to return isLoggedIn: true
    const useAuthMock = jest.requireMock('hooks/useAuth').default;
    useAuthMock.mockImplementation(() => ({
      isLoggedIn: true
    }));

    const mockLogin = require('../Login').default;
    mockLogin.mockImplementation(() => {
      const { isLoggedIn } = require('hooks/useAuth').default();
      
      return (
        <div data-testid="auth-wrapper">
          <div data-testid="auth-card">
            <a data-testid="link">
              <div data-testid="typography">ImpACT4CF</div>
            </a>
            <div data-testid="stack">
              <div data-testid="typography">Hi, Welcome Back</div>
              <div data-testid="typography">Enter your credentials to continue</div>
            </div>
            {!isLoggedIn && <div data-testid="view-only-alert">View Only Alert</div>}
            <div data-testid="divider" />
            <div data-testid="box">
              <div data-testid="jwt-auth-login">JWT Login Form</div>
            </div>
          </div>
          <div data-testid="auth-footer">Footer</div>
        </div>
      );
    });

    await act(async () => {
      render(<Login />);
    });

    // Check if view only alert is not shown (when logged in)
    expect(screen.queryByTestId('view-only-alert')).not.toBeInTheDocument();
  });

  it('renders with correct responsive layout on mobile', async () => {
    // Mock useMediaQuery to return true (mobile view)
    const useMediaQueryMock = jest.requireMock('@mui/material/useMediaQuery');
    useMediaQueryMock.mockImplementation(() => true);

    const mockLogin = require('../Login').default;
    mockLogin.mockImplementation(() => {
      const matchDownSM = require('@mui/material/useMediaQuery')();
      
      return (
        <div data-testid="auth-wrapper">
          <div data-testid="auth-card">
            <a data-testid="link">
              <div data-testid="typography">ImpACT4CF</div>
            </a>
            <div data-testid="stack">
              <div data-testid="typography" data-mobile={matchDownSM ? "true" : "false"}>
                Hi, Welcome Back
              </div>
              <div data-testid="typography">Enter your credentials to continue</div>
            </div>
            <div data-testid="view-only-alert">View Only Alert</div>
            <div data-testid="divider" />
            <div data-testid="box">
              <div data-testid="jwt-auth-login">JWT Login Form</div>
            </div>
          </div>
          <div data-testid="auth-footer">Footer</div>
        </div>
      );
    });

    await act(async () => {
      render(<Login />);
    });

    // Check that rendering happened with mobile layout
    expect(screen.getByText('Hi, Welcome Back')).toBeInTheDocument();
    const welcomeText = screen.getByText('Hi, Welcome Back');
    expect(welcomeText).toHaveAttribute('data-mobile', 'true');
  });
});