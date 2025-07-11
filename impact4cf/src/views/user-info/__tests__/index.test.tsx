
import { authFetcherWithRedirect } from "@/utils/withAuthRedirect";
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import { redirect } from "next/navigation";


jest.mock('next/headers', () => ({
  cookies: jest.fn()
}));

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn()
}));

jest.mock('@/utils/withAuthRedirect', () => ({
  authFetcherWithRedirect: jest.fn()
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}));

jest.mock('../components/UserInfoView', () => ({
  __esModule: true,
  // @ts-ignore
  default: function MockUserInfoView(props) {
    const { userData = { name: 'Default Name' } } = props || {};
    return <div data-testid="user-info-view">{userData.name}</div>;
  }
}));


const originalModule = jest.requireActual('../index');
const originalUserInfo = originalModule.default;

describe('UserInfo Component', () => {
  const mockCookiesGet = jest.fn();
  const mockCookies = {
    get: mockCookiesGet
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    

    (cookies as jest.Mock).mockReturnValue(mockCookies);
    mockCookiesGet.mockReturnValue({ value: 'mock-token' });
    (jwtDecode as jest.Mock).mockReturnValue({ user_id: 'user123' });
  });

  it('fetches user data and renders UserInfoView', async () => {
 
    const mockUserData = { 
      uid: 'user123', 
      name: 'Test User',
      email: 'test@example.com'
    };
    
    (authFetcherWithRedirect as jest.Mock).mockResolvedValue(mockUserData);

 
    await originalUserInfo();
    

    expect(cookies).toHaveBeenCalled();
    expect(jwtDecode).toHaveBeenCalledWith('mock-token');
    expect(authFetcherWithRedirect).toHaveBeenCalledWith('api/users/user123');
  });

  it('redirects to error page when user data is not found', async () => {

    (authFetcherWithRedirect as jest.Mock).mockResolvedValue(null);

    await originalUserInfo();
    expect(redirect).toHaveBeenCalledWith('/pages/error');
  });

  it('throws redirect error if authFetcherWithRedirect throws redirect', async () => {

    const redirectError = new Error('Redirect');
    Object.defineProperty(redirectError, 'digest', {
      value: 'NEXT_REDIRECT:some-path'
    });
    
    (authFetcherWithRedirect as jest.Mock).mockRejectedValue(redirectError);

    try {
      await originalUserInfo();
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toEqual(redirectError);
    }
  });

  it('throws error when service token is missing', async () => {

    mockCookiesGet.mockReturnValue(undefined);

    try {
      await originalUserInfo();
      fail('Should have thrown an error');
    } catch (error) {
        // @ts-ignore
      expect(error.message).toBe("Could not get serviceToken @ UserInfo");
    }
  });
});