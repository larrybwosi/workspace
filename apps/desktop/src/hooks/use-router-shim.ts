import { useParams as useRRParams, useNavigate, useLocation, useSearchParams as useRRSearchParams } from 'react-router';

export const useParams = useRRParams;
export const useRouter = () => {
  const navigate = useNavigate();
  return {
    push: navigate,
    replace: navigate,
    back: () => navigate(-1),
    forward: () => navigate(1),
  };
};
export const usePathname = () => useLocation().pathname;
export const useSearchParams = useRRSearchParams;
