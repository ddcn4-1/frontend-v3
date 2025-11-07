import { apiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import type { User, UserResponse } from '@packages/shared';

const transformUser = (response: UserResponse): User => ({
  userId: response.userId,
  email: response.email,
  username: response.username,
  name: response.name,
  phone: response.phone,
  role: response.role,
  status: response.status,
  createdAt: response.created_at,
  lastLogin: response.last_login,
});

const buildSearchQuery = (params: Record<string, string | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value.trim()) {
      searchParams.append(key, value.trim());
    }
  });
  return searchParams.toString();
};

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await apiClient.get<UserResponse[]>(API_CONFIG.ENDPOINTS.USERS);

    if (!Array.isArray(response)) {
      return [];
    }

    return response.map(transformUser);
  },

  async searchUsers(params: {
    username?: string;
    role?: string;
    status?: string;
  }): Promise<User[]> {
    const query = buildSearchQuery(params);
    const endpoint = query
      ? `${API_CONFIG.ENDPOINTS.USERS}/search?${query}`
      : API_CONFIG.ENDPOINTS.USERS;

    const response = await apiClient.get<UserResponse[]>(endpoint);
    if (!Array.isArray(response)) {
      return [];
    }

    return response.map(transformUser);
  },

  async createUser(userData: {
    email: string;
    username: string;
    name: string;
    phone: string;
    role: 'USER' | 'ADMIN' | 'DEVOPS' | 'DEV';
    password: string;
  }): Promise<User | undefined> {
    try {
      const response = await apiClient.post<UserResponse>(API_CONFIG.ENDPOINTS.USERS, userData);
      return transformUser(response);
    } catch (error) {
      console.error('Failed to create user:', error);
      return undefined;
    }
  },

  async deleteUser(userId: number): Promise<boolean> {
    try {
      await apiClient.delete(`${API_CONFIG.ENDPOINTS.USERS}/${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete user:', error);
      return false;
    }
  },
};

export type UserService = typeof userService;
