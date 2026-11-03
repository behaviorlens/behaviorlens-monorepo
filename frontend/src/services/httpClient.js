import axios from 'axios';

export function createAxiosInstance(baseURL, withCredentials = true) {
  const instance = axios.create({ baseURL, withCredentials });

  instance.interceptors.response.use(
    response => {
      if (response.config?.interceptorConfig?.disableResponseNormalizer) {
        return response;
      }

      const { data } = response;

      if (data && typeof data.responseCode === 'number' && (data.responseCode < 200 || data.responseCode > 299)) {
        return Promise.reject(response);
      }

      return data?.content || data;
    },
    error => Promise.reject(error)
  );

  return instance;
}
