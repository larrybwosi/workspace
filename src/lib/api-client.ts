import axios from 'axios';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || ''}/api` || '/api',
  timeout: 10000,
  withCredentials: true,
});
