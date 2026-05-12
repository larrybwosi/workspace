const getEnv = (name: string) => {
    const g = globalThis as any;

    // Try various common locations for env variables
    // Avoid explicit import.meta to prevent TS1470
    const env = g.process?.env ||
                (g.import?.meta?.env) ||
                g.__env__;

    if (!env) return undefined;

    return env[name] ||
           env[`VITE_${name}`] ||
           env[`NEXT_PUBLIC_${name}`] ||
           env[`EXPO_PUBLIC_${name}`] ||
           env[`TAURI_${name}`] ||
           (typeof process !== 'undefined' ? process.env[name] : undefined);
};

export const getBaseURL = () => {
    const url = getEnv('API_URL') ||
                getEnv('NEXT_PUBLIC_API_URL') ||
                getEnv('VITE_API_URL') ||
                getEnv('EXPO_PUBLIC_API_URL') ||
                'http://localhost:3000';

    return url.replace(/\/$/, '');
};
