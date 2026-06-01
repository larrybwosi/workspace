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
      const { data } = await apiClient.get(`/organizations/${orgSlug}`);
      return data.organization;
    },
    enabled: !!orgSlug,
  });
}

export function useOrganizationWorkspaces(orgSlug: string) {
  return useQuery({
    queryKey: ['organization', orgSlug, 'workspaces'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/organizations/${orgSlug}/workspaces`);
      return data.workspaces;
    },
    enabled: !!orgSlug,
  });
}

export function useOrganizationM2mApplications(orgSlug: string) {
  return useQuery<M2mApplication[]>({
    queryKey: ['organization', orgSlug, 'm2m'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/organizations/${orgSlug}/m2m`);
      return data.applications;
    },
    enabled: !!orgSlug,
  });
}

export function useCreateM2mApplication(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; scopes?: string[]; allowedIps?: string[] }) => {
      const { data } = await apiClient.post(`/organizations/${orgSlug}/m2m`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', orgSlug, 'm2m'] });
    },
  });
}

export function useDeleteM2mApplication(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/organizations/${orgSlug}/m2m/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', orgSlug, 'm2m'] });
    },
  });
}
