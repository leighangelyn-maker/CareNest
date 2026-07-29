import apiClient from './client';

// The backend wraps all responses in { data: T, message: string }
interface ApiResponse<T> {
  data: T;
  message: string | null;
}

// Actual auth payload inside the wrapper
export interface BackendAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;      // UUID
    email: string;
    role: string;    // 'FAMILY' | 'AGENCY_ADMIN' | 'ADMIN'
    status: string;
  };
}

// Alias used by AuthContext
export type AuthResponse = BackendAuthResponse;

export interface RegisterParams {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;       // required
  password: string;    // min 8, upper+lower+digit+special
}

export async function register(params: RegisterParams): Promise<BackendAuthResponse> {
  // Backend returns: { data: { accessToken, refreshToken, user }, message }
  const res = await apiClient.post<ApiResponse<BackendAuthResponse>>('/auth/register', {
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
    phone: params.phone,
    password: params.password,
  });
  // Unwrap the ApiResponse wrapper
  return res.data.data;
}

export async function login(email: string, password: string): Promise<BackendAuthResponse> {
  // Backend returns: { data: { accessToken, refreshToken, user }, message }
  const res = await apiClient.post<ApiResponse<BackendAuthResponse>>('/auth/login', { email, password });
  // Unwrap the ApiResponse wrapper
  return res.data.data;
}
