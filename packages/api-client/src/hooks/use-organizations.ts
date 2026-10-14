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

export interface OrganizationMember {
  id: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface OrganizationInvitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  inviter?: {
    id: string;
    name: string;
    email: string;
  };
}

export function useOrganizationMembers(orgSlug: string) {
  return useQuery<OrganizationMember[]>({
    queryKey: ['organization', orgSlug, 'members'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/v3/organizations/${orgSlug}/members`);
      return data.data?.members ?? data.members;
    },
    enabled: !!orgSlug,
  });
}

export function useOrganizationInvitations(orgSlug: string) {
  return useQuery<OrganizationInvitation[]>({
    queryKey: ['organization', orgSlug, 'invitations'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/v3/organizations/${orgSlug}/invitations`);
      return data.data?.invitations ?? data.invitations;
    },
    enabled: !!orgSlug,
  });
}

export function useInviteOrganizationMember(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { email: string; role?: string }) => {
      const { data } = await apiClient.post(`/v3/organizations/${orgSlug}/invitations`, payload);
      return data.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', orgSlug, 'invitations'] });
    },
  });
}

export function useRevokeOrganizationInvitation(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data } = await apiClient.delete(`/v3/organizations/${orgSlug}/invitations/${invitationId}`);
      return data.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', orgSlug, 'invitations'] });
    },
  });
}

export function useOrganizationInvitationByToken(token: string) {
  return useQuery({
    queryKey: ['organization-invitation', token],
    queryFn: async () => {
      const { data } = await apiClient.get(`/v3/organizations/invitations/by-token/${token}`);
      return data.data?.invitation ?? data.invitation;
    },
    enabled: !!token,
  });
}

export function useAcceptOrganizationInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await apiClient.post(`/v3/organizations/invitations/by-token/${token}/accept`);
      return data.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
  });
}
