import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { Note, NoteFolder } from "@/lib/types"

// Fetch all notes
export function useNotes(folderId?: string) {
  return useQuery({
    queryKey: ["notes", folderId],
    queryFn: async () => {
      const params = folderId ? { folderId } : {}
      const response = await apiClient.get<Note[]>("/notes", { params })
      return response.data
    },
  })
}

// Fetch single note
export function useNote(noteId: string) {
  return useQuery({
    queryKey: ["notes", noteId],
    queryFn: async () => {
      const response = await apiClient.get<Note>(`/notes/${noteId}`)
      return response.data
    },
    enabled: !!noteId,
  })
}

// Create note
export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Note>) => {
      const response = await apiClient.post<Note>("/notes", data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
    },
  })
}

// Update note
export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId, data }: { noteId: string; data: Partial<Note> }) => {
      const response = await apiClient.patch<Note>(`/notes/${noteId}`, data)
      return response.data
    },
    onMutate: async ({ noteId, data }) => {
      await queryClient.cancelQueries({ queryKey: ["notes", noteId] })
      const previousNote = queryClient.getQueryData<Note>(["notes", noteId])

      queryClient.setQueryData<Note>(["notes", noteId], (old) => {
        if (!old) return old
        return { ...old, ...data }
      })

      return { previousNote }
    },
    onError: (err, { noteId }, context) => {
      if (context?.previousNote) {
        queryClient.setQueryData(["notes", noteId], context.previousNote)
      }
    },
    onSettled: (data, error, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: ["notes", noteId] })
      queryClient.invalidateQueries({ queryKey: ["notes"] })
    },
  })
}

// Delete note
export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (noteId: string) => {
      await apiClient.delete(`/notes/${noteId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
    },
  })
}

// Search notes
export function useSearchNotes(query: string) {
  return useQuery({
    queryKey: ["notes", "search", query],
    queryFn: async () => {
      const response = await apiClient.get<Note[]>("/notes/search", {
        params: { q: query },
      })
      return response.data
    },
    enabled: query.length > 2,
  })
}

// Get note backlinks
export function useNoteBacklinks(noteId: string) {
  return useQuery({
    queryKey: ["notes", noteId, "backlinks"],
    queryFn: async () => {
      const response = await apiClient.get<Note[]>(`/notes/${noteId}/backlinks`)
      return response.data
    },
    enabled: !!noteId,
  })
}

// Fetch folders
export function useNoteFolders() {
  return useQuery({
    queryKey: ["note-folders"],
    queryFn: async () => {
      const response = await apiClient.get<NoteFolder[]>("/notes/folders")
      return response.data
    },
  })
}

// Create folder
export function useCreateNoteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<NoteFolder>) => {
      const response = await apiClient.post<NoteFolder>("/notes/folders", data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note-folders"] })
    },
  })
}

// Share note
export function useShareNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId, userIds, permission }: { noteId: string; userIds: string[]; permission: string }) => {
      const response = await apiClient.post(`/notes/${noteId}/share`, {
        userIds,
        permission,
      })
      return response.data
    },
    onSuccess: (data, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: ["notes", noteId] })
    },
  })
}

// Toggle favorite note
export function useToggleFavoriteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (noteId: string) => {
      const response = await apiClient.post(`/notes/${noteId}/favorite`)
      return response.data
    },
    onSuccess: (data, noteId) => {
      queryClient.invalidateQueries({ queryKey: ["notes", noteId] })
      queryClient.invalidateQueries({ queryKey: ["notes"] })
    },
  })
}

// Duplicate note
export function useDuplicateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (noteId: string) => {
      const response = await apiClient.post<Note>(`/notes/${noteId}/duplicate`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
    },
  })
}

// Move note to folder
export function useMoveNoteToFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId, folderId }: { noteId: string; folderId: string }) => {
      const response = await apiClient.patch(`/notes/${noteId}/move`, { folderId })
      return response.data
    },
    onSuccess: (data, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: ["notes", noteId] })
      queryClient.invalidateQueries({ queryKey: ["notes"] })
    },
  })
}

// Rename folder
export function useRenameNoteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ folderId, name }: { folderId: string; name: string }) => {
      const response = await apiClient.patch(`/notes/folders/${folderId}`, { name })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note-folders"] })
    },
  })
}

// Delete folder
export function useDeleteNoteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (folderId: string) => {
      await apiClient.delete(`/notes/folders/${folderId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note-folders"] })
      queryClient.invalidateQueries({ queryKey: ["notes"] })
    },
  })
}

// Add collaborator to note
export function useAddNoteCollaborator() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId, userId, permission }: { noteId: string; userId: string; permission: string }) => {
      const response = await apiClient.post(`/notes/${noteId}/collaborators`, { userId, permission })
      return response.data
    },
    onSuccess: (data, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: ["notes", noteId] })
    },
  })
}

// Remove collaborator from note
export function useRemoveNoteCollaborator() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId, userId }: { noteId: string; userId: string }) => {
      await apiClient.delete(`/notes/${noteId}/collaborators/${userId}`)
    },
    onSuccess: (data, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: ["notes", noteId] })
    },
  })
}
