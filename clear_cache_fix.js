// Comprehensive cache clearing and debugging fix
// Run this in browser console to clear any cached queries

if (typeof window !== 'undefined') {
  // Clear React Query/TanStack Query cache
  if (window.__REACT_QUERY_CLIENT__ || window.queryClient) {
    try {
      const queryClient = window.__REACT_QUERY_CLIENT__ || window.queryClient;
      queryClient.clear();
      console.log('✅ Cleared React Query cache');
    } catch (e) {
      console.log('⚠️ Could not clear React Query cache:', e);
    }
  }
  
  // Clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ Cleared browser storage');
  
  // Clear service worker cache
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister();
      }
      console.log('✅ Cleared service workers');
    });
  }
  
  // Force reload
  setTimeout(() => {
    window.location.reload(true);
  }, 1000);
  
  console.log('🔄 Page will reload in 1 second to apply cache clearing...');
}