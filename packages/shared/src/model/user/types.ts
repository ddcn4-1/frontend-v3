export type UserRole = 'USER' | 'ADMIN' | 'DEV' | 'DEVOPS';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface UserResponse {
  userId: number;
  username: string;
  email?: string;
  name?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  created_at?: string;
  last_login?: string;
}

export interface User {
  userId: number;
  username: string;
  email?: string;
  name?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  createdAt?: string;
  lastLogin?: string;
}

export interface UserInfo {
  userId: number | string; // Support both numeric IDs (legacy) and UUID strings (Cognito)
  username: string;
  email?: string;
  name?: string;
  role?: UserRole;
}
