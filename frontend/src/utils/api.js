// src/utils/api.js
export const fetchWithAuth = async (url, options = {}) => {
  let accessToken = localStorage.getItem('saturn_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  // IMPORTANT: We must tell fetch to include cookies on requests to our backend!
  const finalOptions = {
    ...options,
    headers,
    credentials: 'include' // <-- THIS IS THE MAGIC KEY FOR COOKIES
  };

  let response = await fetch(url, finalOptions);

  // If unauthorized, the browser automatically sends the cookie to the refresh route!
  if (response.status === 401) {
    try {
      const refreshResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // <-- Automatically attaches the httpOnly cookie
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        localStorage.setItem('saturn_token', refreshData.accessToken);
        headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
        
        // Retry the original request
        response = await fetch(url, { ...finalOptions, headers });
      } else {
        localStorage.removeItem('saturn_token');
        localStorage.removeItem('saturn_user');
        window.location.href = '/auth';
      }
    } catch (error) {
      localStorage.removeItem('saturn_token');
      localStorage.removeItem('saturn_user');
      window.location.href = '/auth';
    }
  }

  return response;
};