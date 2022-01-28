import { renderHook, act } from '@testing-library/react-hooks';
import fetchMock from 'jest-fetch-mock';
import { mocked } from 'ts-jest/utils'
import { startAsync } from 'expo-auth-session'

import { AuthProvider, useAuth } from './auth';

fetchMock.enableMocks();

const userTest = {
  id: 'any_id',
  email: 'gabrielmartins@g.globo.com',
  name: 'Gabriel',
  photo: 'any_photo.png'
};

jest.mock('expo-auth-session')

describe('Auth Hook', () => {
  it('should be able to sign in with Google account existing', async () => {
    const googleMocked = mocked(startAsync as any)
    googleMocked.mockReturnValueOnce({
      type: 'success',
      params: {
        access_token: 'any_token',
      }
    })
    fetchMock.mockResponseOnce(JSON.stringify(userTest));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await act(() => result.current.signInWithGoogle());

    expect(result.current.user.email).toBe(userTest.email);
  });

  it('should not connect if cancel authentication with Google', async () => {
    const googleMocked = mocked(startAsync as any)
    googleMocked.mockReturnValueOnce({
      type: 'cancel',
    })
    fetchMock.mockResponseOnce(JSON.stringify(userTest));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await act(() => result.current.signInWithGoogle());

    expect(result.current.user).not.toHaveProperty('id');
  });
});