'use client';

import React, { createContext, useContext, useMemo, Suspense } from 'react';
import { useRouter as useNextRouter, useParams as useNextParams, usePathname as useNextPathname, useSearchParams as useNextSearchParams } from 'next/navigation';
import { useNavigate, useParams as useRRParams, useLocation, useSearchParams as useRRSearchParams } from 'react-router';

interface UniversalRouter {
  push: (url: string) => void;
  replace: (url: string) => void;
  back: () => void;
  forward: () => void;
  params: Record<string, string | string[] | undefined>;
  pathname: string;
  searchParams: URLSearchParams;
}

const UniversalRouterContext = createContext<UniversalRouter | null>(null);

function NextRouterConfig({ children }: { children: React.ReactNode }) {
  const nextRouter = useNextRouter();
  const nextParams = useNextParams();
  const nextPathname = useNextPathname();
  const nextSearchParams = useNextSearchParams();

  const value = useMemo(() => {
    return {
      push: (url: string) => nextRouter.push(url),
      replace: (url: string) => nextRouter.replace(url),
      back: () => nextRouter.back(),
      forward: () => nextRouter.forward(),
      params: (nextParams as any) || {},
      pathname: nextPathname || '',
      searchParams: (nextSearchParams as any) || new URLSearchParams(),
    };
  }, [nextRouter, nextParams, nextPathname, nextSearchParams]);

  return React.createElement(UniversalRouterContext.Provider, { value }, children);
}

function ReactRouterConfig({ children }: { children: React.ReactNode }) {
  const rrNavigate = useNavigate();
  const rrParams = useRRParams();
  const rrLocation = useLocation();
  const [rrSearchParams] = useRRSearchParams();

  const value = useMemo(() => {
    return {
      push: (url: string) => rrNavigate(url),
      replace: (url: string) => rrNavigate(url, { replace: true }),
      back: () => rrNavigate(-1),
      forward: () => rrNavigate(1),
      params: (rrParams as any) || {},
      pathname: rrLocation.pathname || '',
      searchParams: rrSearchParams || new URLSearchParams(),
    };
  }, [rrNavigate, rrParams, rrLocation, rrSearchParams]);

  return React.createElement(UniversalRouterContext.Provider, { value }, children);
}

export function UniversalRouterConfig({ children, type }: { children: React.ReactNode; type: 'next' | 'react-router' }) {
  if (type === 'next') {
    return React.createElement(Suspense, { fallback: null }, React.createElement(NextRouterConfig, null, children));
  }
  return React.createElement(ReactRouterConfig, null, children);
}

export function useUniversalRouter() {
  const context = useContext(UniversalRouterContext);
  if (!context) {
    throw new Error('useUniversalRouter must be used within a UniversalRouterConfig');
  }
  return {
    router: {
      push: context.push,
      replace: context.replace,
      back: context.back,
      forward: context.forward,
    },
    params: context.params,
    pathname: context.pathname,
    searchParams: context.searchParams,
  };
}

export function useRouter() {
  const { router } = useUniversalRouter();
  return router;
}

export function useParams() {
  const { params } = useUniversalRouter();
  return params;
}

export function usePathname() {
  const { pathname } = useUniversalRouter();
  return pathname;
}

export function useSearchParams() {
  const { searchParams } = useUniversalRouter();
  return searchParams;
}
