// src/app/(basic-info)/users/[userId]/basicinfo/__tests__/page.test.tsx

import { jest } from '@jest/globals';
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import BasicInfoPage from '../page';
import BasicInfoPageClient from '@/views/forms/components/BasicInfo/BasicInfoPageClient';
import { authFetcherWithRedirect } from '@/utils/withAuthRedirect';

type BasicInfoPageClientProps = {
  userData: {
    uid: string;
    name: string;
    deviceMode: string;
    trialStage: number;
    role?: string;
  };
};

jest.mock('@/views/forms/components/BasicInfo/BasicInfoPageClient', () => ({
  __esModule: true,
  // @ts-ignore
  default: jest.fn().mockImplementation((props: BasicInfoPageClientProps) => (
    <div data-testid="basicinfo-page-client">
      <div data-testid="user-data">{JSON.stringify(props.userData)}</div>
    </div>
  )),
}));

jest.mock('@/utils/withAuthRedirect', () => ({
  authFetcherWithRedirect: jest.fn(),
}));

describe('BasicInfoPage', () => {
  // silence console outputs in tests
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders client with fetched userData and calls analytics for non-super_user', async () => {
    const mockUser = {
      uid: 'u1',
      name: 'Alice',
      deviceMode: 'Play',
      trialStage: 2,
      role: 'regular',
    };
    const mockAnalytics = { visits: 42 };

    // first call for user, second for analytics
    (authFetcherWithRedirect as jest.Mock)// @ts-ignore
      .mockResolvedValueOnce(mockUser)// @ts-ignore
      .mockResolvedValueOnce(mockAnalytics);

    const result = await BasicInfoPage({ params: { userId: 'u1' } });
    if (!React.isValidElement(result)) throw new Error('Invalid React element');

    const { findByTestId } = render(result);
    const client = await findByTestId('basicinfo-page-client');
    expect(client).toBeInTheDocument();

    // authFetcher should be called twice
    expect(authFetcherWithRedirect).toHaveBeenCalledTimes(2);
    expect(authFetcherWithRedirect).toHaveBeenNthCalledWith(1, 'api/users/u1');
    expect(authFetcherWithRedirect).toHaveBeenNthCalledWith(2, 'api/analytics/users/activity');

    // client received correct props
    const props = (BasicInfoPageClient as jest.Mock).mock.calls[0][0] as BasicInfoPageClientProps;
    expect(props.userData).toEqual(mockUser);
  });

  test('uses fallback userData on fetch error and still attempts analytics', async () => {
    // first call throws, second returns analytics
    (authFetcherWithRedirect as jest.Mock)// @ts-ignore
      .mockRejectedValueOnce(new Error('User API failed'))// @ts-ignore
      .mockResolvedValueOnce({ visits: 0 });

    const result = await BasicInfoPage({ params: { userId: 'bob' } });
    if (!React.isValidElement(result)) throw new Error('Invalid React element');

    const { findByTestId } = render(result);
    await findByTestId('basicinfo-page-client');

    // authFetcher still called twice
    expect(authFetcherWithRedirect).toHaveBeenCalledTimes(2);
    expect(authFetcherWithRedirect).toHaveBeenCalledWith('api/users/bob');
    expect(authFetcherWithRedirect).toHaveBeenCalledWith('api/analytics/users/activity');

    // fallback userData
    const props = (BasicInfoPageClient as jest.Mock).mock.calls[0][0] as BasicInfoPageClientProps;
    expect(props.userData).toEqual({
      uid: 'bob',
      name: 'Fallback User',
      deviceMode: 'Record',
      trialStage: 0,
    });
  });

  test('skips analytics fetch for super_user', async () => {
    const superUser = {
      uid: 'su',
      name: 'Super',
      deviceMode: 'Admin',
      trialStage: 9,
      role: 'super_user',
    };
    // @ts-ignore
    (authFetcherWithRedirect as jest.Mock).mockResolvedValueOnce(superUser);

    const result = await BasicInfoPage({ params: { userId: 'su' } });
    if (!React.isValidElement(result)) throw new Error('Invalid React element');

    const { findByTestId } = render(result);
    await findByTestId('basicinfo-page-client');

    // called exactly once (only user fetch)
    expect(authFetcherWithRedirect).toHaveBeenCalledTimes(1);
    expect(authFetcherWithRedirect).toHaveBeenCalledWith('api/users/su');

    // client received super_user data
    const props = (BasicInfoPageClient as jest.Mock).mock.calls[0][0] as BasicInfoPageClientProps;
    expect(props.userData).toEqual(superUser);
  });
});
