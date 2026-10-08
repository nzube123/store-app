import type { UserDto } from '@shop/shared';
import { apiRequest, apiUrl } from './api';

export const getCurrentUser = async (): Promise<UserDto | null> => (await apiRequest<{ user: UserDto | null }>('/auth/me')).user;
export const logout = (): Promise<void> => apiRequest('/auth/logout', { method: 'POST' });
export const googleLoginUrl = (): string => apiUrl('/auth/google');
