// src/utils/api.js

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const fetchWithAuth = async (url, options = {}) => {
  let accessToken = localStorage.getItem('saturn_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const finalOptions = {
    ...options,
    headers,
    credentials: 'include'
  };

  let response = await fetch(url, finalOptions);

  // FIX 1: Only attempt refresh if the user actually HAD a token.
  // This prevents unauthenticated guests from getting caught in a reload loop.
  if (response.status === 401 && accessToken) {
    
    // FIX 2: Concurrent Refresh Lock (Promise Queue)
    if (isRefreshing) {
      // If a refresh is already happening, pause this request and queue it
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: async (newToken) => {
            finalOptions.headers['Authorization'] = `Bearer ${newToken}`;
            try {
              const retryResponse = await fetch(url, finalOptions);
              resolve(retryResponse);
            } catch (err) {
              reject(err);
            }
          },
          reject: (err) => reject(err)
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        localStorage.setItem('saturn_token', refreshData.accessToken);
        
        // Wake up all other paused requests in the queue with the new token
        processQueue(null, refreshData.accessToken);
        
        // Retry the original request that triggered the refresh
        finalOptions.headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
        response = await fetch(url, finalOptions);
      } else {
        // Refresh token died. Reject the queue, clear memory, and downgrade to guest
        processQueue(new Error('Refresh failed'));
        localStorage.removeItem('saturn_token');
        localStorage.removeItem('saturn_user');
        window.location.replace('/');
      }
    } catch (error) {
      processQueue(error);
      localStorage.removeItem('saturn_token');
      localStorage.removeItem('saturn_user');
      window.location.replace('/');
    } finally {
      // Release the lock
      isRefreshing = false;
    }
  }

  return response;
};