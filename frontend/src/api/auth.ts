import apiClient from './client';

interface ApiResponse<T> {
  data: T;
  message: string | null;
}

export interface BackendAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
  };
}

export type AuthResponse = BackendAuthResponse;

export interface RegisterParams {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface RegisterAgencyParams {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  agencyName: string;
  agencyEmail: string;
  agencyPhone: string;
  agencyDescription?: string;
}

export async function register(params: RegisterParams): Promise<BackendAuthResponse> {
  const res = await apiClient.post<ApiResponse<BackendAuthResponse>>('/auth/register', {
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
    phone: params.phone,
    password: params.password,
  });
  return res.data.data;
}

export async function registerAgency(params: RegisterAgencyParams): Promise<BackendAuthResponse> {
  const res = await apiClient.post<ApiResponse<BackendAuthResponse>>('/auth/register-agency', {
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
    phone: params.phone,
    password: params.password,
    agencyName: params.agencyName,
    agencyEmail: params.agencyEmail,
    agencyPhone: params.agencyPhone,
    agencyDescription: params.agencyDescription ?? '',
  });
  return res.data.data;
}

export async function login(email: string, password: string): Promise<BackendAuthResponse> {
  const res = await apiClient.post<ApiResponse<BackendAuthResponse>>('/auth/login', { email, password });
  return res.data.data;
}