import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL: prefer app.json extra.apiBaseUrl, then platform default
const DEFAULT_BASE_URL =
  Platform.OS === 'android'
    ? 'https://carenest-2k59.onrender.com'
    : 'http://localhost:8080';

export const BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? DEFAULT_BASE_URL;

// Extract host for WebSocket URL (strip http:// prefix)
export const BASE_HOST = BASE_URL.replace(/^https?:\/\//, '');

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Navigation ref — set by App.tsx after NavigationContainer mounts
export let navigationRef: { navigate: (screen: string) => void } | null = null;
export function setNavigationRef(ref: { navigate: (screen: string) => void }) {
  navigationRef = ref;
}

// Request interceptor — attach Bearer token
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle auth failures and add retry on network errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as typeof error.config & { _retryCount?: number };
    const isNetworkError = !error.response && error.code !== 'ECONNABORTED';

    // Retry once on network errors (not on 4xx/5xx)
    if (isNetworkError && (!config._retryCount || config._retryCount < 1)) {
      config._retryCount = (config._retryCount ?? 0) + 1;
      await new Promise(r => setTimeout(r, 800));
      return apiClient(config);
    }

    // FIX: previously only handled 401. Your backend appears to return 403
    // for invalid/expired/missing tokens too, so those auth failures were
    // never triggering a logout/redirect — the app just kept resending the
    // stale token and looping on the "Request failed / Retry" screen.
    if (error.response?.status === 401 || error.response?.status === 403) {
      await AsyncStorage.multiRemove(['token', 'user']);
      navigationRef?.navigate('Login');
    }
    return Promise.reject(error);
  }
);

export default apiClient;