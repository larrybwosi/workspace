'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { User } from '@repo/types';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  current: () => [...userKeys.all, 'current'] as const,
  socialProfile: (id: string) => [...userKeys.detail(id), 'social-profile'] as const,
};

// Fetch all users
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: async () => {
      const { data } = await apiClient.get<User[]>('/users');
      return data;
    },
  });
}

// Fetch current user
export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: async () => {
      const { data } = await apiClient.get<User>('/users/me');
      return data;
    },
  });
}

// Fetch single user
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<User>(`/users/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// Fetch social profile for a user
export function useUserSocialProfile(id: string) {
  return useQuery({
    queryKey: userKeys.socialProfile(id),
    queryFn: async () => {
      const { data } = await apiClient.get<any>(`/users/${id}/social-profile`);
      return data;
    },
    enabled: !!id,
  });
}

// Update user
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<User> & { id: string }) => {
      const { data } = await apiClient.patch<User>(`/users/${id}`, updates);
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

// Update user status
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ status }: { status: User['status'] }) => {
      const { data } = await apiClient.patch<User>('/users/me/status', { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.current() });
    },
  });
}

// Block a user
export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<any>(`/users/${id}/block`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.socialProfile(id) });
    },
  });
}

// Unblock a user
export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<any>(`/users/${id}/block`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.socialProfile(id) });
    },
  });
}
