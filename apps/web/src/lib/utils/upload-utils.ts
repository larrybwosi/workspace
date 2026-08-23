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
  const response = await fetch(`${baseURL}/upload`, {
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
  const response = await fetch(`${baseURL}/upload?assetId=${assetId}`, {
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

export function getDocumentIconPath(fileNameOrType: string): string {
  const str = fileNameOrType.toLowerCase();
  const ext = str.includes('.') ? str.split('.').pop() || '' : str;

  if (ext === 'pdf' || str.includes('pdf')) return '/pdf.svg';
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext) || str.includes('word') || str.includes('document')) return '/word.svg';
  if (['xls', 'xlsx', 'ods', 'csv'].includes(ext) || str.includes('excel') || str.includes('spreadsheet')) return '/xls.svg';
  if (['ppt', 'pptx', 'odp'].includes(ext) || str.includes('powerpoint') || str.includes('presentation')) return '/ppt.svg';
  if (['psd'].includes(ext) || str.includes('photoshop')) return '/psd.svg';
  if (['xd'].includes(ext)) return '/xd.svg';
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext) || str.includes('zip') || str.includes('compressed') || str.includes('archive')) return '/archive.svg';
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'php', 'rb', 'sql', 'sh', 'xml', 'yaml', 'yml'].includes(ext) || str.includes('json') || str.includes('javascript') || str.includes('typescript')) return '/code.svg';
  if (['txt', 'md', 'log'].includes(ext) || str.includes('text/plain')) return '/text.svg';

  return `/${ext}.svg`;
}

export function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎥';
  if (type.startsWith('audio/')) return '🎵';
  const docIcon = getDocumentIconPath(type);
  if (docIcon.startsWith('/')) return docIcon;
  return '📎';
}
