import { useState, useEffect, useCallback } from 'react';
import { apiCache } from '@/lib/apiCache';

const activeRequests = new Map<string, Promise<any>>();

export function useApiRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { enabled?: boolean; cacheTime?: number } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!(options.enabled ?? true)) return;

    // Check cache first
    const cached = apiCache.get(key);
    if (cached) {
      setData(cached);
      setLoading(false);
      return cached;
    }

    // Check if request is already in flight
    if (activeRequests.has(key)) {
      const data = await activeRequests.get(key);
      setData(data);
      setLoading(false);
      return data;
    }

    setLoading(true);
    setError(null);

    const request = fetcher().then(result => {
      apiCache.set(key, result, options.cacheTime);
      setData(result);
      setLoading(false);
      activeRequests.delete(key);
      return result;
    }).catch(err => {
      setError(err.message);
      setLoading(false);
      activeRequests.delete(key);
      throw err;
    });

    activeRequests.set(key, request);
    return request;
  }, [key, fetcher, options.enabled, options.cacheTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}