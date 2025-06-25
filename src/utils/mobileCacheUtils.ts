
// Mobile-optimized role cache utilities
const ROLE_CACHE_KEY = 'doublecheck_user_role';
const ROLE_CACHE_EXPIRY = 'doublecheck_role_expiry';
const ROLE_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for mobile

export const getCachedRole = (userId: string): string | null => {
  try {
    const cachedRole = localStorage.getItem(`${ROLE_CACHE_KEY}_${userId}`);
    const expiry = localStorage.getItem(`${ROLE_CACHE_EXPIRY}_${userId}`);
    
    if (cachedRole && expiry && Date.now() < parseInt(expiry)) {
      console.log('📱 Using mobile cached role:', cachedRole);
      return cachedRole;
    }
  } catch (error) {
    console.warn('📱 Mobile role cache read error:', error);
  }
  return null;
};

export const setCachedRole = (userId: string, role: string) => {
  try {
    localStorage.setItem(`${ROLE_CACHE_KEY}_${userId}`, role);
    localStorage.setItem(`${ROLE_CACHE_EXPIRY}_${userId}`, (Date.now() + ROLE_CACHE_DURATION).toString());
    console.log('📱 Mobile cached role:', role);
  } catch (error) {
    console.warn('📱 Mobile role cache write error:', error);
  }
};

export const clearCachedRole = (userId: string) => {
  try {
    localStorage.removeItem(`${ROLE_CACHE_KEY}_${userId}`);
    localStorage.removeItem(`${ROLE_CACHE_EXPIRY}_${userId}`);
  } catch (error) {
    console.warn('📱 Mobile role cache clear error:', error);
  }
};
