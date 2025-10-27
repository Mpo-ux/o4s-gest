import NodeCache from "node-cache";

// Cache global para o backend
export const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Helper para cachear queries frequentes
export async function cacheQuery(key: string, fetcher: () => Promise<any>) {
  const cached = cache.get(key);
  if (cached) return cached;
  const data = await fetcher();
  cache.set(key, data);
  return data;
}
