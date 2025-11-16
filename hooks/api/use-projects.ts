import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { Project, Sprint, CalendarEvent, TimeEntry, Milestone } from "@/lib/types"

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters: string) => [...projectKeys.lists(), { filters }] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  sprints: (id: string) => [...projectKeys.detail(id), "sprints"] as const,
  calendar: (id: string) => [...projectKeys.detail(id), "calendar"] as const,
  settings: (id: string) => [...projectKeys.detail(id), "settings"] as const,
  timeEntries: (id: string) => [...projectKeys.detail(id), "timeEntries"] as const,
}

// Fetch all projects
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: async () => {
      const { data } = await apiClient.get<Project[]>("/projects")
      return data
    },
  })
}

// Fetch single project
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Project>(`/projects/${id}`)
      return data
    },
    enabled: !!id,
  })
}

// Create project
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newProject: Omit<Project, "id">) => {
      const { data } = await apiClient.post<Project>("/projects", newProject)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

// Update project
export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { data } = await apiClient.patch<Project>(`/projects/${id}`, updates)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

// Delete project
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/projects/${id}`)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

// Fetch project sprints
export function useProjectSprints(projectId: string) {
  return useQuery({
    queryKey: projectKeys.sprints(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<Sprint[]>(`/projects/${projectId}/sprints`)
      return data
    },
    enabled: !!projectId,
  })
}

// Create sprint
export function useCreateSprint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, ...sprintData }: Omit<Sprint, "id"> & { projectId: string }) => {
      const { data } = await apiClient.post<Sprint>(`/projects/${projectId}/sprints`, sprintData)
      return { data, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.sprints(projectId) })
    },
  })
}

// Update sprint
export function useUpdateSprint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      sprintId,
      ...updates
    }: Partial<Sprint> & { projectId: string; sprintId: string }) => {
      const { data } = await apiClient.patch<Sprint>(`/projects/${projectId}/sprints/${sprintId}`, updates)
      return { data, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.sprints(projectId) })
    },
  })
}

// Start sprint
export function useStartSprint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, sprintId }: { projectId: string; sprintId: string }) => {
      const { data } = await apiClient.post<Sprint>(`/projects/${projectId}/sprints/${sprintId}/start`)
      return { data, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.sprints(projectId) })
    },
  })
}

// End sprint
export function useEndSprint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, sprintId }: { projectId: string; sprintId: string }) => {
      const { data } = await apiClient.post<Sprint>(`/projects/${projectId}/sprints/${sprintId}/end`)
      return { data, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.sprints(projectId) })
    },
  })
}

// Fetch project calendar
export function useProjectCalendar(projectId: string) {
  return useQuery({
    queryKey: projectKeys.calendar(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<CalendarEvent[]>(`/projects/${projectId}/calendar`)
      return data
    },
    enabled: !!projectId,
  })
}

// Create calendar event
export function useCreateCalendarEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, ...eventData }: Omit<CalendarEvent, "id"> & { projectId: string }) => {
      const { data } = await apiClient.post<CalendarEvent>(`/projects/${projectId}/calendar`, eventData)
      return { data, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.calendar(projectId) })
    },
  })
}

// Update calendar event
export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      eventId,
      ...updates
    }: Partial<CalendarEvent> & { projectId: string; eventId: string }) => {
      const { data } = await apiClient.patch<CalendarEvent>(`/projects/${projectId}/calendar/${eventId}`, updates)
      return { data, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.calendar(projectId) })
    },
  })
}

// Delete calendar event
export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, eventId }: { projectId: string; eventId: string }) => {
      await apiClient.delete(`/projects/${projectId}/calendar/${eventId}`)
      return { eventId, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.calendar(projectId) })
    },
  })
}

// Fetch project time entries
export function useProjectTimeEntries(projectId: string) {
  return useQuery({
    queryKey: projectKeys.timeEntries(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<TimeEntry[]>(`/projects/${projectId}/time-entries`)
      return data
    },
    enabled: !!projectId,
  })
}

// Create time entry
export function useCreateTimeEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, ...entryData }: Omit<TimeEntry, "id"> & { projectId: string }) => {
      const { data } = await apiClient.post<TimeEntry>(`/projects/${projectId}/time-entries`, entryData)
      return { data, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.timeEntries(projectId) })
    },
  })
}

// Update time entry
export function useUpdateTimeEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      entryId,
      ...updates
    }: Partial<TimeEntry> & { projectId: string; entryId: string }) => {
      const { data } = await apiClient.patch<TimeEntry>(`/projects/${projectId}/time-entries/${entryId}`, updates)
      return { data, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.timeEntries(projectId) })
    },
  })
}

// Delete time entry
export function useDeleteTimeEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, entryId }: { projectId: string; entryId: string }) => {
      await apiClient.delete(`/projects/${projectId}/time-entries/${entryId}`)
      return { entryId, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.timeEntries(projectId) })
    },
  })
}

// Fetch project milestones
export function useProjectMilestones(projectId: string) {
  return useQuery({
    queryKey: [...projectKeys.detail(projectId), "milestones"],
    queryFn: async () => {
      const { data } = await apiClient.get<Milestone[]>(`/projects/${projectId}/milestones`)
      return data
    },
    enabled: !!projectId,
  })
}

// Create milestone
export function useCreateMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, ...milestoneData }: Omit<Milestone, "id"> & { projectId: string }) => {
      const { data } = await apiClient.post<Milestone>(`/projects/${projectId}/milestones`, milestoneData)
      return { data, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: [...projectKeys.detail(projectId), "milestones"] })
    },
  })
}

// Update milestone
export function useUpdateMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      milestoneId,
      ...updates
    }: Partial<Milestone> & { projectId: string; milestoneId: string }) => {
      const { data } = await apiClient.patch<Milestone>(`/projects/${projectId}/milestones/${milestoneId}`, updates)
      return { data, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: [...projectKeys.detail(projectId), "milestones"] })
    },
  })
}

// Delete milestone
export function useDeleteMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, milestoneId }: { projectId: string; milestoneId: string }) => {
      await apiClient.delete(`/projects/${projectId}/milestones/${milestoneId}`)
      return { milestoneId, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: [...projectKeys.detail(projectId), "milestones"] })
    },
  })
}

// Fetch project settings
export function useProjectSettings(projectId: string) {
  return useQuery({
    queryKey: projectKeys.settings(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/projects/${projectId}/settings`)
      return data
    },
    enabled: !!projectId,
  })
}

// Update project settings
export function useUpdateProjectSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, ...settings }: { projectId: string; [key: string]: any }) => {
      const { data } = await apiClient.patch(`/projects/${projectId}/settings`, settings)
      return { data, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.settings(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
    },
  })
}

// Fetch project analytics
export function useProjectAnalytics(projectId: string) {
  return useQuery({
    queryKey: [...projectKeys.detail(projectId), "analytics"],
    queryFn: async () => {
      const { data } = await apiClient.get(`/projects/${projectId}/analytics`)
      return data
    },
    enabled: !!projectId,
  })
}

// Fetch project members
export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: [...projectKeys.detail(projectId), "members"],
    queryFn: async () => {
      const { data } = await apiClient.get(`/projects/${projectId}/members`)
      return data
    },
    enabled: !!projectId,
  })
}

// Add project member
export function useAddProjectMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, userId, role }: { projectId: string; userId: string; role: string }) => {
      const { data } = await apiClient.post(`/projects/${projectId}/members`, { userId, role })
      return { data, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: [...projectKeys.detail(projectId), "members"] })
    },
  })
}

// Remove project member
export function useRemoveProjectMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
      await apiClient.delete(`/projects/${projectId}/members/${userId}`)
      return { userId, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: [...projectKeys.detail(projectId), "members"] })
    },
  })
}

// Fetch project risks
export function useProjectRisks(projectId: string) {
  return useQuery({
    queryKey: [...projectKeys.detail(projectId), "risks"],
    queryFn: async () => {
      const { data } = await apiClient.get(`/projects/${projectId}/risks`)
      return data
    },
    enabled: !!projectId,
  })
}

// Create risk
export function useCreateRisk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, ...riskData }: any) => {
      const { data } = await apiClient.post(`/projects/${projectId}/risks`, riskData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...projectKeys.detail(variables.projectId), "risks"] })
    },
  })
}

// Fetch project budget
export function useProjectBudget(projectId: string) {
  return useQuery({
    queryKey: [...projectKeys.detail(projectId), "budget"],
    queryFn: async () => {
      const { data } = await apiClient.get(`/projects/${projectId}/budget`)
      return data
    },
    enabled: !!projectId,
  })
}

// Update budget
export function useUpdateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, ...budgetData }: any) => {
      const { data } = await apiClient.patch(`/projects/${projectId}/budget`, budgetData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...projectKeys.detail(variables.projectId), "budget"] })
    },
  })
}

// Fetch project resources
export function useProjectResources(projectId: string) {
  return useQuery({
    queryKey: [...projectKeys.detail(projectId), "resources"],
    queryFn: async () => {
      const { data } = await apiClient.get(`/projects/${projectId}/resources`)
      return data
    },
    enabled: !!projectId,
  })
}
