import { useParams as useRRParams, useNavigate, useLocation, useSearchParams as useRRSearchParams } from 'react-router';

export const useParams = useRRParams;
export const useRouter = () => {
  const navigate = useNavigate();
  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    prefetch: () => {}, // No-op in SPA
  };
};
export const usePathname = () => useLocation().pathname;
export const useSearchParams = () => {
  const [searchParams] = useRRSearchParams();
  return searchParams;
};
