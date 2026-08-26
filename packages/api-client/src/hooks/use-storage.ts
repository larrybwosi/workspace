import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../client';

export function useStorageUpload() {
  return useMutation({
    mutationFn: async (file: File | { uri: string; name: string; type: string }) => {
      const formData = new FormData();
      if (file instanceof File) {
        formData.append('file', file);
      } else {
        formData.append('file', new Blob([file.uri], { type: file.type }), file.name);
      }

      const { data } = await apiClient.post('/storage/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
  });
}
