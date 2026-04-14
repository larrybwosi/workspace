import { useMemo } from 'react';

// This hook is intended to be used in environments where 'next/navigation'
// might be aliased (like Vite/Tauri) or where it is native (Next.js).

/**
 * A hook that tries to use 'next/navigation' hooks.
 * If they are aliased to our shim (in Vite), it will use the shim.
 * If they are native (in Next.js), it will use the native ones.
 */
export function useUniversalRouter() {
  // We import from 'next/navigation' directly.
  // The bundler (Vite or Next.js) will resolve this to the correct place.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nextNav = require('next/navigation');

  return {
    router: nextNav.useRouter(),
    params: nextNav.useParams(),
    pathname: nextNav.usePathname(),
    searchParams: nextNav.useSearchParams(),
  };
}

// Individual exports for convenience
export function useRouter() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('next/navigation').useRouter();
}

export function useParams() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('next/navigation').useParams();
}

export function usePathname() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('next/navigation').usePathname();
}

export function useSearchParams() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('next/navigation').useSearchParams();
}
