import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

export interface BotData {
  id: string;
  name: string;
  botToken?: string;
  avatar?: string | null;
}

export interface Application {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  clientSecret: string;
  bot?: BotData;
  ownerId: string;
}

export function useApplications() {
  return useQuery<Application[]>({
    queryKey: ["applications"],
    queryFn: async () => {
      const { data } = await apiClient.get("/v2/applications");
      return data;
    },
  });
}

export function useApplication(id: string | undefined) {
  return useQuery<Application>({
    queryKey: ["application", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/v2/applications/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const { data } = await apiClient.post("/v2/applications", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; description?: string }) => {
      const { data } = await apiClient.post(`/v2/applications/${id}`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application", variables.id] });
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/v2/applications/${id}/delete`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useResetBotToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/v2/applications/${id}/reset-token`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["application", id] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}
