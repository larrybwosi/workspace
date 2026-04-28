import { useParams as useRRParams, useNavigate, useLocation, useSearchParams as useRRSearchParams } from 'react-router';
import { useMemo } from 'react';

/**
 * A hook that uses react-router hooks.
 */
export function useUniversalRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useRRParams();
  const [searchParams] = useRRSearchParams();

  return useMemo(() => ({
    router: {
      push: (url: string) => navigate(url),
      replace: (url: string) => navigate(url, { replace: true }),
      back: () => navigate(-1),
      forward: () => navigate(1),
    },
    params,
    pathname: location.pathname,
    searchParams: searchParams,
  }), [navigate, location, params, searchParams]);
}

export function useRouter() {
  const navigate = useNavigate();
  return useMemo(() => ({
    push: (url: string) => navigate(url),
    replace: (url: string) => navigate(url, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
  }), [navigate]);
}

export const useParams = useRRParams;
export const usePathname = () => {
  const location = useLocation();
  return location.pathname;
};
export const useSearchParams = () => {
  const [searchParams] = useRRSearchParams();
  return searchParams;
};
