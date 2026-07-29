import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, register as apiRegister, RegisterParams, BackendAuthResponse } from './api/auth';
import apiClient, { setNavigationRef } from './api/client';

interface AuthState {
  token: string | null;
  id: string | null;           // UUID from user.id
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: 'FAMILY' | 'AGENCY_ADMIN' | 'ADMIN' | null;
  isLoading: boolean;
  subscriptionStatus: 'inactive' | 'active' | 'past_due' | 'cancelled' | null;
}

interface StoredUser {
  token: string;
  refreshToken?: string;
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  subscriptionStatus?: string;
}

interface AuthContextValue extends AuthState {
  /** Computed display name: "firstName lastName" or whichever is available */
  name: string | null;
  login(email: string, password: string): Promise<void>;
  register(params: RegisterParams): Promise<void>;
  logout(): Promise<void>;
  refreshSession(): Promise<boolean>;
  refreshSubscriptionStatus(): Promise<void>;
  updateProfile(patch: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    location?: string;
    bio?: string;
  }): Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  token: null, id: null, firstName: null, lastName: null,
  name: null, email: null, role: null,
  isLoading: true, subscriptionStatus: null,
  login: async () => {}, register: async () => {},
  logout: async () => {}, refreshSession: async () => false,
  refreshSubscriptionStatus: async () => {},
  updateProfile: async () => {},
});

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function computeName(firstName: string | null, lastName: string | null): string | null {
  if (firstName && lastName) return `${firstName} ${lastName}`;
  return firstName ?? lastName ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null, id: null, firstName: null, lastName: null,
    email: null, role: null,
    isLoading: true, subscriptionStatus: null,
  });

  // Restore session on launch
  useEffect(() => {
    (async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const user: StoredUser = JSON.parse(userJson);
          const token = user.token;
          if (token && !isTokenExpired(token)) {
            setState({
              token,
              id: user.id ?? null,
              firstName: user.firstName ?? null,
              lastName: user.lastName ?? null,
              email: user.email,
              role: user.role as AuthState['role'],
              subscriptionStatus: (user.subscriptionStatus as AuthState['subscriptionStatus']) ?? null,
              isLoading: false,
            });
            return;
          }
          // Token expired — try refresh
          const refreshToken = user.refreshToken ?? await AsyncStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const res = await apiClient.post<any>('/auth/refresh', { refreshToken });
              // Backend wraps in { data: { accessToken }, message }
              const newToken = res.data?.data?.accessToken ?? res.data?.accessToken;
              const updated: StoredUser = { ...user, token: newToken };
              await AsyncStorage.setItem('user', JSON.stringify(updated));
              setState({
                token: newToken,
                id: user.id ?? null,
                firstName: user.firstName ?? null,
                lastName: user.lastName ?? null,
                email: user.email,
                role: user.role as AuthState['role'],
                subscriptionStatus: (user.subscriptionStatus as AuthState['subscriptionStatus']) ?? null,
                isLoading: false,
              });
              return;
            } catch {}
          }
        }
      } catch {}
      setState(s => ({ ...s, isLoading: false }));
    })();
  }, []);

  async function persistAndSetState(res: BackendAuthResponse) {
    const stored: StoredUser = {
      token: res.accessToken,
      refreshToken: res.refreshToken,
      id: res.user.id,
      firstName: (res.user as any).firstName ?? null,
      lastName: (res.user as any).lastName ?? null,
      email: res.user.email,
      role: res.user.role,
    };
    await AsyncStorage.setItem('user', JSON.stringify(stored));
    await AsyncStorage.setItem('token', res.accessToken);
    if (res.refreshToken) {
      await AsyncStorage.setItem('refreshToken', res.refreshToken);
    }
    setState({
      token: res.accessToken,
      id: res.user.id,
      firstName: (res.user as any).firstName ?? null,
      lastName: (res.user as any).lastName ?? null,
      email: res.user.email,
      role: res.user.role as AuthState['role'],
      subscriptionStatus: null,
      isLoading: false,
    });
  }

  async function login(email: string, password: string) {
    const res = await apiLogin(email, password);
    await persistAndSetState(res);
  }

  async function register(params: RegisterParams) {
    await apiRegister(params);
    // After register: do NOT auto-login — show email verification pending screen
    await AsyncStorage.setItem('pendingEmail', params.email);
  }

  async function logout() {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const refreshToken = userJson
        ? (JSON.parse(userJson) as StoredUser).refreshToken
        : await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch {}
    await AsyncStorage.multiRemove(['token', 'user', 'refreshToken', 'pendingEmail']);
    setState({
      token: null, id: null, firstName: null, lastName: null,
      email: null, role: null, subscriptionStatus: null, isLoading: false,
    });
    (setNavigationRef as any)?.navigate?.('Login');
  }

  async function refreshSession(): Promise<boolean> {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const refreshToken = userJson
        ? (JSON.parse(userJson) as StoredUser).refreshToken
        : await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) return false;
      const res = await apiClient.post<any>('/auth/refresh', { refreshToken });
      // Backend wraps in { data: { accessToken }, message }
      const newToken = res.data?.data?.accessToken ?? res.data?.accessToken;
      if (!newToken) return false;
      if (userJson) {
        const user: StoredUser = JSON.parse(userJson);
        await AsyncStorage.setItem('user', JSON.stringify({ ...user, token: newToken }));
      }
      await AsyncStorage.setItem('token', newToken);
      setState(s => ({ ...s, token: newToken }));
      return true;
    } catch {
      return false;
    }
  }

  async function refreshSubscriptionStatus() {
    try {
      const res = await apiClient.get<{ subscriptionStatus: string }>('/subscription/status');
      setState(s => ({ ...s, subscriptionStatus: res.data.subscriptionStatus as AuthState['subscriptionStatus'] }));
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        user.subscriptionStatus = res.data.subscriptionStatus;
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }
    } catch {}
  }

  async function updateProfile(patch: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    location?: string;
    bio?: string;
  }) {
    // Call backend — gracefully ignore 404/405 if endpoint not yet live
    try {
      await apiClient.patch('/users/me', patch);
    } catch (e: any) {
      const status = e?.response?.status;
      // Only re-throw on non-404/405 to allow optimistic updates while backend is pending
      if (status && status !== 404 && status !== 405) throw e;
    }

    // Update local state
    setState(s => ({
      ...s,
      firstName: patch.firstName ?? s.firstName,
      lastName:  patch.lastName  ?? s.lastName,
      email:     patch.email     ?? s.email,
    }));

    // Persist to AsyncStorage
    const userJson = await AsyncStorage.getItem('user');
    if (userJson) {
      const user: StoredUser = JSON.parse(userJson);
      const updated: StoredUser = {
        ...user,
        firstName: patch.firstName ?? user.firstName,
        lastName:  patch.lastName  ?? user.lastName,
        email:     patch.email     ?? user.email,
      };
      await AsyncStorage.setItem('user', JSON.stringify(updated));
    }
  }

  const name = computeName(state.firstName, state.lastName);

  return (
    <AuthContext.Provider value={{
      ...state,
      name,
      login,
      register,
      logout,
      refreshSession,
      refreshSubscriptionStatus,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
