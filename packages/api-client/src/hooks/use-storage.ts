import { useMutation } from "@tanstack/react-query"
import { apiClient } from "../client"

export function useStorageUpload() {
  return useMutation({
    mutationFn: async (file: { uri: string; name: string; type: string }) => {
      const formData = new FormData()
      // @ts-expect-error - FormData.append in React Native/Expo accepts objects with uri, name, and type
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as Blob)

      const { data } = await apiClient.post("/storage/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return data
    },
  })
}
