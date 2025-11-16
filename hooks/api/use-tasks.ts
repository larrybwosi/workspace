import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { Task, TimeEntry } from "@/lib/types"

export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (projectId: string) => [...taskKeys.lists(), projectId] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
}

// Fetch tasks for a project
export function useTasks(projectId: string) {
  return useQuery({
    queryKey: taskKeys.list(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<Task[]>(`/projects/${projectId}/tasks`)
      return data
    },
    enabled: !!projectId,
  })
}

// Fetch single task
export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Task>(`/tasks/${id}`)
      return data
    },
    enabled: !!id,
  })
}

// Create task
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, ...task }: Omit<Task, "id"> & { projectId: string }) => {
      const { data } = await apiClient.post<Task>(`/projects/${projectId}/tasks`, task)
      return { data, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
    },
  })
}

// Update task
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, projectId, ...updates }: Partial<Task> & { id: string; projectId: string }) => {
      const { data } = await apiClient.patch<Task>(`/tasks/${id}`, updates)
      return { data, projectId }
    },
    onSuccess: ({ data, projectId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
    },
  })
}

// Delete task
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      await apiClient.delete(`/tasks/${id}`)
      return { id, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
    },
  })
}

// Move task (change status/column)
export function useMoveTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      status,
    }: {
      id: string
      projectId: string
      status: Task["status"]
    }) => {
      const { data } = await apiClient.patch<Task>(`/tasks/${id}/move`, { status })
      return { data, projectId }
    },
    onMutate: async ({ id, projectId, status }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: taskKeys.list(projectId) })

      const previousTasks = queryClient.getQueryData(taskKeys.list(projectId))

      queryClient.setQueryData(taskKeys.list(projectId), (old: Task[] | undefined) => {
        if (!old) return old
        return old.map((task) => (task.id === id ? { ...task, status } : task))
      })

      return { previousTasks }
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.list(variables.projectId), context.previousTasks)
      }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
    },
  })
}

// Duplicate task
export function useDuplicateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { data } = await apiClient.post<Task>(`/tasks/${id}/duplicate`)
      return { data, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
    },
  })
}

// Subtask management hooks
export function useTaskSubtasks(taskId: string) {
  return useQuery({
    queryKey: [...taskKeys.detail(taskId), "subtasks"],
    queryFn: async () => {
      const { data } = await apiClient.get<Task[]>(`/tasks/${taskId}/subtasks`)
      return data
    },
    enabled: !!taskId,
  })
}

export function useCreateSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      projectId,
      ...subtaskData
    }: Omit<Task, "id"> & { taskId: string; projectId: string }) => {
      const { data } = await apiClient.post<Task>(`/tasks/${taskId}/subtasks`, subtaskData)
      return { data, taskId, projectId }
    },
    onSuccess: ({ taskId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: [...taskKeys.detail(taskId), "subtasks"] })
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
    },
  })
}

// Task time tracking hooks
export function useTaskTimeEntries(taskId: string) {
  return useQuery({
    queryKey: [...taskKeys.detail(taskId), "timeEntries"],
    queryFn: async () => {
      const { data } = await apiClient.get<TimeEntry[]>(`/tasks/${taskId}/time-entries`)
      return data
    },
    enabled: !!taskId,
  })
}

export function useStartTimer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      const { data } = await apiClient.post<TimeEntry>(`/tasks/${taskId}/time-entries/start`, { userId })
      return { data, taskId }
    },
    onSuccess: ({ taskId }) => {
      queryClient.invalidateQueries({ queryKey: [...taskKeys.detail(taskId), "timeEntries"] })
    },
  })
}

export function useStopTimer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, entryId }: { taskId: string; entryId: string }) => {
      const { data } = await apiClient.post<TimeEntry>(`/tasks/${taskId}/time-entries/${entryId}/stop`)
      return { data, taskId }
    },
    onSuccess: ({ taskId }) => {
      queryClient.invalidateQueries({ queryKey: [...taskKeys.detail(taskId), "timeEntries"] })
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
    },
  })
}

// Task linking and blocker hooks
export function useAddTaskDependency() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      dependencyId,
      projectId,
    }: { taskId: string; dependencyId: string; projectId: string }) => {
      const { data } = await apiClient.post(`/tasks/${taskId}/dependencies`, { dependencyId })
      return { data, taskId, projectId }
    },
    onSuccess: ({ taskId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
    },
  })
}

export function useRemoveTaskDependency() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      dependencyId,
      projectId,
    }: { taskId: string; dependencyId: string; projectId: string }) => {
      await apiClient.delete(`/tasks/${taskId}/dependencies/${dependencyId}`)
      return { taskId, dependencyId, projectId }
    },
    onSuccess: ({ taskId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
    },
  })
}

// Task comment hooks
export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: [...taskKeys.detail(taskId), "comments"],
    queryFn: async () => {
      const { data } = await apiClient.get(`/tasks/${taskId}/comments`)
      return data
    },
    enabled: !!taskId,
  })
}

export function useCreateTaskComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, content, userId }: { taskId: string; content: string; userId: string }) => {
      const { data } = await apiClient.post(`/tasks/${taskId}/comments`, { content, userId })
      return { data, taskId }
    },
    onSuccess: ({ taskId }) => {
      queryClient.invalidateQueries({ queryKey: [...taskKeys.detail(taskId), "comments"] })
    },
  })
}

// Watcher management hooks
export function useTaskWatchers(taskId: string) {
  return useQuery({
    queryKey: [...taskKeys.detail(taskId), "watchers"],
    queryFn: async () => {
      const { data } = await apiClient.get(`/tasks/${taskId}/watchers`)
      return data
    },
    enabled: !!taskId,
  })
}

export function useAddTaskWatcher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      const { data } = await apiClient.post(`/tasks/${taskId}/watchers`, { userId })
      return { data, taskId }
    },
    onSuccess: ({ taskId }) => {
      queryClient.invalidateQueries({ queryKey: [...taskKeys.detail(taskId), "watchers"] })
    },
  })
}

export function useRemoveTaskWatcher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      await apiClient.delete(`/tasks/${taskId}/watchers/${userId}`)
      return { taskId }
    },
    onSuccess: ({ taskId }) => {
      queryClient.invalidateQueries({ queryKey: [...taskKeys.detail(taskId), "watchers"] })
    },
  })
}
