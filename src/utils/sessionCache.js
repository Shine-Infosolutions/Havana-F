const CACHE_PREFIX = 'havana_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const sessionCache = {
  set: (key, data) => {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData));
  },
  
  get: (key) => {
    try {
      const cached = sessionStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_DURATION) {
        sessionCache.remove(key);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },
  
  remove: (key) => {
    sessionStorage.removeItem(CACHE_PREFIX + key);
  },
  
  clear: () => {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  },
  
  // Check if data exists and is valid
  has: (key) => {
    return sessionCache.get(key) !== null;
  },
  
  // Invalidate cache entries matching a pattern
  invalidatePattern: (pattern) => {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX) && key.includes(pattern)) {
        sessionStorage.removeItem(key);
      }
    });
  }
};