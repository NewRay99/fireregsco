/**
 * Cache utility for Google Sheets data
 * Implements server-side caching to reduce API calls and improve performance
 */

// Types for cache data
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
}

/**
 * Cache singleton class to store API responses
 */
class SheetDataCache {
  private static instance: SheetDataCache;
  private cache: Map<string, CacheItem<any>>;
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default TTL

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): SheetDataCache {
    if (!SheetDataCache.instance) {
      SheetDataCache.instance = new SheetDataCache();
    }
    return SheetDataCache.instance;
  }

  /**
   * Set data in the cache
   * @param key Cache key
   * @param data Data to cache
   * @param options Cache options
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const now = Date.now();
    const ttl = options.ttl || this.defaultTTL;
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });
    
    console.log(`[Cache] Set ${key}, expires in ${ttl/1000}s`);
  }

  /**
   * Get data from the cache
   * @param key Cache key
   * @returns Cached data or null if not found or expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key) as CacheItem<T>;
    
    if (!item) {
      console.log(`[Cache] Miss: ${key} (not in cache)`);
      return null;
    }
    
    // Check if the item has expired
    if (Date.now() > item.expiresAt) {
      console.log(`[Cache] Miss: ${key} (expired)`);
      this.cache.delete(key);
      return null;
    }
    
    console.log(`[Cache] Hit: ${key}`);
    return item.data;
  }

  /**
   * Invalidate a specific cache entry
   * @param key Cache key to invalidate
   */
  invalidate(key: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      console.log(`[Cache] Invalidated: ${key}`);
    }
  }

  /**
   * Invalidate all keys that start with a given prefix
   * @param keyPrefix Prefix to match
   */
  invalidateByPrefix(keyPrefix: string): void {
    const invalidatedKeys: string[] = [];
    const keys = Array.from(this.cache.keys());
    
    for (const key of keys) {
      if (key.startsWith(keyPrefix)) {
        this.cache.delete(key);
        invalidatedKeys.push(key);
      }
    }
    
    if (invalidatedKeys.length > 0) {
      console.log(`[Cache] Invalidated keys with prefix '${keyPrefix}':`, invalidatedKeys);
    }
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    console.log('[Cache] Cleared all cache data');
  }

  /**
   * Get stats about the cache
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const sheetDataCache = SheetDataCache.getInstance();

// Cache keys for different types of data
export const CACHE_KEYS = {
  LEADS: 'leads',
  LEAD_BY_ID: (id: string) => `lead_${id}`,
  LEAD_BY_EMAIL: (email: string) => `lead_email_${email.toLowerCase()}`,
  ALL_LEADS: 'all_leads',
}; 