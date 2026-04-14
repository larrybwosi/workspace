declare module 'next/navigation' {
  export const useParams: () => any;
  export const useRouter: () => any;
  export const usePathname: () => string;
  export const useSearchParams: () => any;
}
declare module 'next/dynamic' {
  const dynamic: any;
  export default dynamic;
}
