import axios from 'axios';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    // Skip adding token for public endpoints
    const publicEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/verify-reset-otp',
      '/auth/reset-password',
      '/auth/refresh',
      '/locations'
    ];
    
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );
    
    if (!isPublicEndpoint) {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor - Handle errors globally and refresh token
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error('Error Response:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
    });

    const originalRequest = error.config;

    if (error.response) {
      const { status, data } = error.response;

      // Handle 401 Unauthorized with token refresh
      if (status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axiosInstance(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          // No refresh token, clear auth and reject
          console.error('No refresh token available');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_info');
          isRefreshing = false;
          processQueue(error, null);
          return Promise.reject(error);
        }

        try {
          // Try to refresh the token
          const response = await axios.post(
            `${axiosInstance.defaults.baseURL}/auth/refresh`,
            null,
            {
              params: { refreshToken },
            }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          // Update tokens in localStorage
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', newRefreshToken);

          // Update the authorization header
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          // Process queued requests
          processQueue(null, accessToken);

          isRefreshing = false;

          // Retry the original request
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear auth
          console.error('Token refresh failed');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_info');
          processQueue(refreshError, null);
          isRefreshing = false;
          return Promise.reject(refreshError);
        }
      }

      // Handle other error statuses
      switch (status) {
        case 403:
          console.error('Access forbidden:', data.message);
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Internal server error');
          break;
        default:
          console.error('Error:', data.message);
      }
    } else if (error.request) {
      // Request was made but no response received
      if (error.code === 'ECONNABORTED') {
        console.error('Request timeout - server took too long to respond');
      } else {
        console.error('No response from server - network error or server is down');
      }
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
