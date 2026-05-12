import { useParams as useRRParams, useNavigate, useLocation, useSearchParams as useRRSearchParams } from 'react-router';
import { useMemo } from 'react';

/**
 * A hook that uses react-router hooks.
 */
export function useUniversalRouter() {
  let navigate: any;
  let location: any = { pathname: '' };
  let params: any = {};
  let searchParams: any = new URLSearchParams();

  try {
    navigate = useNavigate();
    location = useLocation();
    params = useRRParams();
    const [sp] = useRRSearchParams();
    searchParams = sp;
  } catch (e) {
    // Not in a React Router context
  }

  return useMemo(
    () => ({
      router: {
        push: (url: string) => navigate?.(url),
        replace: (url: string) => navigate?.(url, { replace: true }),
        back: () => navigate?.(-1),
        forward: () => navigate?.(1),
      },
      params,
      pathname: location.pathname,
      searchParams: searchParams,
    }),
    [navigate, location, params, searchParams]
  );
}

export function useRouter() {
  let navigate: any;
  try {
    navigate = useNavigate();
  } catch (e) {}

  return useMemo(
    () => ({
      push: (url: string) => navigate?.(url),
      replace: (url: string) => navigate?.(url, { replace: true }),
      back: () => navigate?.(-1),
      forward: () => navigate?.(1),
    }),
    [navigate]
  );
}

export const useParams = () => {
  try {
    return useRRParams();
  } catch (e) {
    return {};
  }
};

export const usePathname = () => {
  try {
    const location = useLocation();
    return location.pathname;
  } catch (e) {
    return '';
  }
};

export const useSearchParams = () => {
  try {
    const [searchParams] = useRRSearchParams();
    return searchParams;
  } catch (e) {
    return new URLSearchParams();
  }
};
