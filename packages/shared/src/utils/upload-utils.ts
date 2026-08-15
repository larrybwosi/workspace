export interface UploadedFile {
  id: string;
  url: string;
  name: string;
  type: string;
  size: string;
  assetId: string;
  metadata?: {
    dimensions?: { width: number; height: number };
    duration?: number;
  };
}

// Helper to safely access env variables across Vite, Next.js and React Native
const getEnv = (name: string) => {
  const g = globalThis as any;
  const env = g.process?.env || g.import?.meta?.env || g.__env__;
  if (!env) return undefined;
  return (
    env[name] || env[`VITE_${name}`] || env[`NEXT_PUBLIC_${name}`] || env[`EXPO_PUBLIC_${name}`] || env[`TAURI_${name}`]
  );
};

const getBaseURL = () => {
  let url = '';
  if (typeof window !== 'undefined') {
    const customUrl = window.localStorage.getItem('CUSTOM_API_URL');
    if (customUrl) {
      url = customUrl;
    }
  }
  if (!url) {
    const isProd =
      (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') ||
      getEnv('NODE_ENV') === 'production' ||
      (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');
    url =
      getEnv('API_URL') ||
      getEnv('NEXT_PUBLIC_API_URL') ||
      getEnv('VITE_API_URL') ||
      getEnv('EXPO_PUBLIC_API_URL') ||
      (isProd ? 'https://api.chat.scryme.tech' : 'http://localhost:3000');
  }
  return url.replace(/\/$/, '') + '/api';
};

const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };

    return (
      window.localStorage.getItem('better-auth.session-token') ||
      window.localStorage.getItem('better-auth.session_token') ||
      window.localStorage.getItem('bearer_token') ||
      getCookie('better-auth.session_token') ||
      getCookie('better-auth.session-token') ||
      getCookie('bearer_token') ||
      ''
    );
  }
  return '';
};

export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseURL = getBaseURL();
  const uploadUrl = typeof window !== 'undefined' && window.location.pathname.startsWith('/api') ? '/api/upload' : `${baseURL}/storage/upload`;
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload file');
  }

  return response.json();
}

export async function deleteFile(assetId: string): Promise<void> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseURL = getBaseURL();
  const deleteUrl = typeof window !== 'undefined' && window.location.pathname.startsWith('/api') ? `/api/upload?assetId=${assetId}` : `${baseURL}/storage/upload?assetId=${assetId}`;
  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete file');
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎥';
  if (type.startsWith('audio/')) return '🎵';
  if (type.includes('pdf')) return '/pdf.svg';
  if (type.includes('word') || type.includes('document')) return '/word.svg';
  if (type.includes('excel') || type.includes('spreadsheet')) return '/xls.svg';
  if (type.includes('powerpoint') || type.includes('presentation')) return '/ppt.svg';
  if (type.includes('zip') || type.includes('rar')) return '🗜️';
  return '📎';
}
