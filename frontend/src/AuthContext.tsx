import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, register as apiRegister, RegisterParams, BackendAuthResponse } from './api/auth';
import apiClient, { setNavigationRef } from './api/client';
import { getFamilyProfile } from './api/family';

interface AuthState {
  token: string | null;
  id: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: 'FAMILY' | 'AGENCY_ADMIN' | 'ADMIN' | null;
  agencyId: string | null;
  familyId: string | null;
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
  agencyId?: string | null;
  familyId?: string | null;
  subscriptionStatus?: string;
}

interface AuthContextValue extends AuthState {
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
  name: null, email: null, role: null, agencyId: null, familyId: null,
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

// Decode JWT and extract agencyId — backend embeds it in the token payload
function extractAgencyIdFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.agencyId ?? null;
  } catch {
    return null;
  }
}

// familyId is NOT embedded in the JWT — it's a separate entity id from the
// family profile record, distinct from the user/auth id. Must be fetched
// from GET /family/me for FAMILY-role users.
async function resolveFamilyId(role: string | undefined): Promise<string | null> {
  if (role !== 'FAMILY') return null;
  try {
    const profile = await getFamilyProfile();
    return profile.id ?? null;
  } catch {
    return null;
  }
}

function computeName(firstName: string | null, lastName: string | null): string | null {
  if (firstName && lastName) return `${firstName} ${lastName}`;
  return firstName ?? lastName ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null, id: null, firstName: null, lastName: null,
    email: null, role: null, agencyId: null, familyId: null,
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
            const agencyId = user.agencyId ?? extractAgencyIdFromToken(token);
            if (agencyId) await AsyncStorage.setItem('agencyId', agencyId);

            let familyId = user.familyId ?? null;
            if (!familyId && user.role === 'FAMILY') {
              familyId = await resolveFamilyId(user.role);
              if (familyId) {
                await AsyncStorage.setItem('familyId', familyId);
                await AsyncStorage.setItem('user', JSON.stringify({ ...user, familyId }));
              }
            }

            setState({
              token,
              id: user.id ?? null,
              firstName: user.firstName ?? null,
              lastName: user.lastName ?? null,
              email: user.email,
              role: user.role as AuthState['role'],
              agencyId,
              familyId,
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
              const newToken = res.data?.data?.accessToken ?? res.data?.accessToken;
              const agencyId = user.agencyId ?? extractAgencyIdFromToken(newToken);
              if (agencyId) await AsyncStorage.setItem('agencyId', agencyId);

              let familyId = user.familyId ?? null;
              if (!familyId && user.role === 'FAMILY') {
                familyId = await resolveFamilyId(user.role);
                if (familyId) await AsyncStorage.setItem('familyId', familyId);
              }

              const updated: StoredUser = { ...user, token: newToken, agencyId, familyId };
              await AsyncStorage.setItem('user', JSON.stringify(updated));
              await AsyncStorage.setItem('token', newToken);
              setState({
                token: newToken,
                id: user.id ?? null,
                firstName: user.firstName ?? null,
                lastName: user.lastName ?? null,
                email: user.email,
                role: user.role as AuthState['role'],
                agencyId,
                familyId,
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
    const agencyId = extractAgencyIdFromToken(res.accessToken);
    const familyId = await resolveFamilyId(res.user.role);

    const stored: StoredUser = {
      token: res.accessToken,
      refreshToken: res.refreshToken,
      id: res.user.id,
      firstName: (res.user as any).firstName ?? null,
      lastName: (res.user as any).lastName ?? null,
      email: res.user.email,
      role: res.user.role,
      agencyId,
      familyId,
    };

    await AsyncStorage.setItem('user', JSON.stringify(stored));
    await AsyncStorage.setItem('token', res.accessToken);
    if (res.refreshToken) {
      await AsyncStorage.setItem('refreshToken', res.refreshToken);
    }
    if (agencyId) {
      await AsyncStorage.setItem('agencyId', agencyId);
    } else {
      await AsyncStorage.removeItem('agencyId');
    }
    if (familyId) {
      await AsyncStorage.setItem('familyId', familyId);
    } else {
      await AsyncStorage.removeItem('familyId');
    }

    setState({
      token: res.accessToken,
      id: res.user.id,
      firstName: (res.user as any).firstName ?? null,
      lastName: (res.user as any).lastName ?? null,
      email: res.user.email,
      role: res.user.role as AuthState['role'],
      agencyId,
      familyId,
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
    await AsyncStorage.multiRemove(['token', 'user', 'refreshToken', 'pendingEmail', 'agencyId', 'familyId']);
    setState({
      token: null, id: null, firstName: null, lastName: null,
      email: null, role: null, agencyId: null, familyId: null,
      subscriptionStatus: null, isLoading: false,
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
    try {
      await apiClient.patch('/users/me', patch);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status && status !== 404 && status !== 405) throw e;
    }
    setState(s => ({
      ...s,
      firstName: patch.firstName ?? s.firstName,
      lastName:  patch.lastName  ?? s.lastName,
      email:     patch.email     ?? s.email,
    }));
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