import { useMemo } from "react";
import {
  useLocation,
  useNavigate,
  useSearchParams as useRouterSearchParams,
} from "react-router-dom";

// One navigation API for feature modules, independent of the build tool.
export function useRouter() {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      push: (href: string, options?: { scroll?: boolean }) => {
        void navigate(href, { preventScrollReset: options?.scroll === false });
      },
      replace: (href: string, options?: { scroll?: boolean }) => {
        void navigate(href, { replace: true, preventScrollReset: options?.scroll === false });
      },
      back: () => {
        void navigate(-1);
      },
    }),
    [navigate],
  );
}

export function usePathname() {
  return useLocation().pathname;
}
export function useSearchParams() {
  return useRouterSearchParams()[0];
}
