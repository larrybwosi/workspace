import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { POST, GET, PATCH, PUT, DELETE } = toNextJsHandler(auth);
