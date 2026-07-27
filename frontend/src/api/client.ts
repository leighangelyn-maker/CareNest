import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL: prefer app.json extra.apiBaseUrl, then platform default
const DEFAULT_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8080'
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

// Response interceptor — handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
      navigationRef?.navigate('Login');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
