import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

export interface M2mApplication {
  id: string;
  name: string;
  clientId: string;
  clientSecret?: string;
  scopes: string[];
  allowedIps: string[];
  createdAt: string;
}

export function useOrganization(orgSlug: string) {
  return useQuery({
    queryKey: ['organization', orgSlug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/v3/organizations/${orgSlug}`);
      return data.data?.organization ?? data.organization;
    },
    enabled: !!orgSlug,
  });
}

export function useOrganizationWorkspaces(orgSlug: string) {
  return useQuery({
    queryKey: ['organization', orgSlug, 'workspaces'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/v3/organizations/${orgSlug}/workspaces`);
      return data.data?.workspaces ?? data.workspaces;
    },
    enabled: !!orgSlug,
  });
}

export function useOrganizationM2mApplications(orgSlug: string) {
  return useQuery<M2mApplication[]>({
    queryKey: ['organization', orgSlug, 'm2m'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/v3/organizations/${orgSlug}/m2m`);
      return data.data?.applications ?? data.applications;
    },
    enabled: !!orgSlug,
  });
}

export function useCreateM2mApplication(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; scopes?: string[]; allowedIps?: string[] }) => {
      const { data } = await apiClient.post(`/v3/organizations/${orgSlug}/m2m`, payload);
      return data.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', orgSlug, 'm2m'] });
    },
  });
}

export function useUpdateM2mApplication(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; scopes?: string[]; allowedIps?: string[] }) => {
      const { data } = await apiClient.patch(`/v3/organizations/${orgSlug}/m2m/${id}`, payload);
      return data.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', orgSlug, 'm2m'] });
    },
  });
}

export function useUpdateOrganization(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name?: string; logo?: string; banner?: string }) => {
      const { data } = await apiClient.patch(`/v3/organizations/${orgSlug}`, payload);
      return data.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', orgSlug] });
    },
  });
}

export function useDeleteM2mApplication(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/v3/organizations/${orgSlug}/m2m/${id}`);
      return data.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', orgSlug, 'm2m'] });
    },
  });
}
