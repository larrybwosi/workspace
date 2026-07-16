import axios, { AxiosRequestConfig, AxiosError } from 'axios';

export const AXIOS_INSTANCE = axios.create({
  baseURL: typeof window !== 'undefined' ? '/api' : 'http://localhost:3000/api',
});

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const source = axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-ignore
  promise.cancel = () => {
    source.cancel('Query was cancelled by React Query');
  };

  return promise;
};

export type ErrorType<Error> = AxiosError<Error>;
export type BodyType<Body> = Body;
