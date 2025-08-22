// API utility functions with JWT authentication and automatic token refresh
import { useAuthStore } from "@/stores/useAuthStore";




// Helper function to get auth headers
const getAuthHeaders = () => {
  const { accessToken } = useAuthStore.getState();
  return accessToken
    ? {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }
    : { "Content-Type": "application/json" };
};


// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  let token = useAuthStore.getState().accessToken;

  console.log("isAuthenticated: Checking token:", token ? "EXISTS" : "NOT FOUND");
  console.log("isAuthenticated: Token length:", token?.length);

  if (token) {
    return true;
  }

  // Try to refresh if no token
  console.log("isAuthenticated: No token found, attempting refresh...");
  const newToken = await refreshToken();
  
  if (newToken) {
    console.log("isAuthenticated: Got new token from refresh");
    return true;
  }

  console.log("isAuthenticated: No valid token found, user not authenticated");
  return false;
};


// Helper function to logout user
export const logout = async () => {
  const { email, resetAuth } = useAuthStore.getState();

  try {
    const apiBaseUrl = getApiBaseUrl();

    const response = await fetch(`${apiBaseUrl}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Logout successful:", data.message);
      resetAuth(); 
      // navigate("/login");
      window.location.href = "/login"; 
    } else {
      console.warn("Logout failed:", data.message || "Unknown error");
      // Optionally show a toast or message to user
    }
  } catch (err) {
    console.error("Logout API error:", err);
    // Optionally show a toast or message to user
  }
};

// Helper function to get API base URL
export const getApiBaseUrl = () => {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const baseUrl = import.meta.env.VITE_API_URL;

  if (isLocalhost) {
    // Configure your local backend URL here
    // Change this to match your actual backend URL
    const LOCAL_BACKEND_URL = "http://localhost/vasfood"; // Back to base URL
    
    return LOCAL_BACKEND_URL;
  }
  
  return `https://${baseUrl}`;
  
};

// Token refresh function
const refreshToken = async (): Promise<string | null> => {
  const store = useAuthStore.getState();
  
  // If already refreshing, wait for existing promise
  if (store.isRefreshing && store.refreshPromise) {
    console.log("refreshToken: Already refreshing, waiting for existing promise...");
    return await store.refreshPromise;
  }

  // Set refreshing state and create promise
  store.setRefreshing(true);
  
  const refreshPromise = (async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("refreshToken: response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        // console.log("refreshToken: response data:", data);

        const newToken = data.accessToken || data.token;
        if (!newToken) {
          console.warn("refreshToken: no token field in response!");
          return null;
        }

        useAuthStore.getState().setAccessToken(newToken);
        return newToken;
      } else {
        console.warn("refreshToken: failed with status", response.status);
        return null;
      }
    } catch (error) {
      console.error("refreshToken: network or server error:", error);
      return null;
    } finally {
      // Reset refreshing state
      useAuthStore.getState().setRefreshing(false);
      useAuthStore.getState().setRefreshPromise(null);
    }
  })();

  // Store the promise so other calls can wait for it
  store.setRefreshPromise(refreshPromise);
  
  return await refreshPromise;
};

// Enhanced fetch wrapper with automatic token refresh
const authenticatedFetch = async (
  url: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<Response> => {
  const maxRetries = 1; // Only retry once after token refresh

  // Add auth headers if not already present
  if (!options.headers) {
    options.headers = {};
  }
  
  const headers = { ...options.headers, ...getAuthHeaders() };
  options.headers = headers;

  try {
    const response = await fetch(url, options);

    // If we get a 401 and haven't retried yet, try to refresh the token
    if (response.status === 401 && retryCount < maxRetries) {
      const newToken = await refreshToken();
      
      if (newToken) {
        // Retry the original request with the new token
        const newHeaders = { ...options.headers, "Authorization": `Bearer ${newToken}` };
        const retryOptions = { ...options, headers: newHeaders };
        
        return authenticatedFetch(url, retryOptions, retryCount + 1);
      } else {
        // Refresh failed, return the original 401 response
        return response;
      }
    }

    return response;
  } catch (error) {
    // If it's a network error and we haven't retried, try to refresh token
    if (retryCount < maxRetries) {
      const newToken = await refreshToken();
      
      if (newToken) {
        // Retry the original request with the new token
        const newHeaders = { ...options.headers, "Authorization": `Bearer ${newToken}` };
        const retryOptions = { ...options, headers: newHeaders };
        
        return authenticatedFetch(url, retryOptions, retryCount + 1);
      }
    }
    
    throw error;
  }
};

// src/lib/api.ts (continuing)
export async function sendResetPasswordCode(email: string) {
  const response = await fetch(`${getApiBaseUrl()}/auth/send-reset-password-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error("Failed to send reset password code");
  }

  return response.json(); // { message: "Link sent successfuly check your email" }
}


export interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  department: string | null;
  role: string;
  is_verified: number;
}

export interface ProfileResponse {
  success: boolean;
  data: UserProfile;
  message?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: {
    department: string;
    updated_at: string;
  };
}

// Get profile API call with automatic token refresh
export const getProfile = async () => {
  const url = `${getApiBaseUrl()}/auth/profile`;
  console.log('getProfile: Calling API URL:', url);
  
  try {
    const response = await authenticatedFetch(url, {
      method: "GET",
    });
    
    console.log('getProfile: Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('getProfile: Error response:', errorText);
      throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
    }
    
    // Return your exact API response
    const data = await response.json();
    console.log('getProfile: Success response:', data);
    return data;
  } catch (error) {
    console.error('getProfile: Fetch error:', error);
    throw error;
  }
};

// Update profile API call with automatic token refresh
export const updateProfile = async (department: string): Promise<UpdateProfileResponse> => {
  const response = await authenticatedFetch(`${getApiBaseUrl()}/auth/profile`, {
    method: "POST",
    body: JSON.stringify({ department }),
  });
  
  if (!response.ok) {
    throw new Error("Failed to update profile");
  }
  
  const data = await response.json();
  
  // Transform the response to match our expected format
  return {
    success: true,
    message: data.message || "Profile updated successfully",
    data: {
      department: department,
      updated_at: new Date().toISOString()
    }
  };
};

// Place order API call
export interface PlaceOrderRequest {
  meal: string;
  fallback_meal?: string;
}

export interface PlaceOrderResponse {
  status: "success" | "error";
  message: string;
  data?: {
    order_id: number;
    meal: string;
    status: string;
    created_at: string;
  };
  errors?: string;
}

export const placeOrder = async (userId: number, orderData: PlaceOrderRequest): Promise<PlaceOrderResponse> => {
  const url = `${getApiBaseUrl()}/api/order/place-order/${userId}`;
  console.log('placeOrder: Calling API URL:', url);
  console.log('placeOrder: Order data:', orderData);
  
  try {
    const response = await authenticatedFetch(url, {
      method: "POST",
      body: JSON.stringify(orderData),
    });
    
    console.log('placeOrder: Response status:', response.status);
    
    const data = await response.json();
    console.log('placeOrder: Response data:', data);
    
    // Check if the response indicates an error (even with 200 status)
    if (data.status === "error") {
      const errorMessage = data.errors || data.message || "An error occurred";
      console.error('placeOrder: API returned error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // If response is not ok (4xx, 5xx status codes) but we have JSON data
    if (!response.ok) {
      // If we have error data in the response body, use that
      if (data.errors || data.message) {
        const errorMessage = data.errors || data.message || "An error occurred";
        throw new Error(errorMessage);
      }
      // Otherwise use generic error
      throw new Error(`Failed to place order: ${response.status} ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error('placeOrder: Fetch error:', error);
    // Re-throw the error with the original message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Network error - please check your connection');
    }
  }
};

// Collect order API call
export interface CollectOrderResponse {
  status: "success" | "error";
  message: string;
  data?: any;
  errors?: string;
}

export const collectOrder = async (userId: number): Promise<CollectOrderResponse> => {
  const url = `${getApiBaseUrl()}/api/order/collect-order/${userId}`;
  console.log('collectOrder: Calling API URL:', url);
  
  try {
    const response = await authenticatedFetch(url, {
      method: "PUT",
    });
    
    console.log('collectOrder: Response status:', response.status);
    
    const data = await response.json();
    console.log('collectOrder: Response data:', data);
    
    // Check if the response indicates an error (even with 200 status)
    if (data.status === "error") {
      const errorMessage = data.errors || data.message || "An error occurred";
      console.error('collectOrder: API returned error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // If response is not ok (4xx, 5xx status codes) but we have JSON data
    if (!response.ok) {
      // If we have error data in the response body, use that
      if (data.errors || data.message) {
        const errorMessage = data.errors || data.message || "An error occurred";
        throw new Error(errorMessage);
      }
      // Otherwise use generic error
      throw new Error(`Failed to collect order: ${response.status} ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error('collectOrder: Fetch error:', error);
    // Re-throw the error with the original message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Network error - please check your connection');
    }
  }
};

// Order history API call
export interface OrderHistoryItem {
  id: number;
  user_id: number;
  meal: string;
  fallback_meal: string;
  collected: number;
  ordered_at: string;
  updated_at: string;
}

export interface OrderHistoryResponse {
  status: "success" | "error";
  message: string;
  data: OrderHistoryItem[];
  errors?: string;
}

export const getOrderHistory = async (userId: number): Promise<OrderHistoryResponse> => {
  const url = `${getApiBaseUrl()}/api/order/order-history/${userId}`;
  console.log('getOrderHistory: Calling API URL:', url);
  
  try {
    const response = await authenticatedFetch(url, {
      method: "GET",
    });
    
    console.log('getOrderHistory: Response status:', response.status);
    
    const data = await response.json();
    console.log('getOrderHistory: Response data:', data);
    
    // Check if the response indicates an error (even with 200 status)
    if (data.status === "error") {
      const errorMessage = data.errors || data.message || "An error occurred";
      console.error('getOrderHistory: API returned error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // If response is not ok (4xx, 5xx status codes) but we have JSON data
    if (!response.ok) {
      // If we have error data in the response body, use that
      if (data.errors || data.message) {
        const errorMessage = data.errors || data.message || "An error occurred";
        throw new Error(errorMessage);
      }
      // Otherwise use generic error
      throw new Error(`Failed to fetch order history: ${response.status} ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error('getOrderHistory: Fetch error:', error);
    // Re-throw the error with the original message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Network error - please check your connection');
    }
  }
};

// Get today's order API call
export interface TodayOrderResponse {
  status: "success" | "error";
  message: string;
  data?: {
    meal: string;
    fallback_meal?: string;
    ordered_at: string;
    collected: number;
  };
  errors?: string;
}

export const getTodayOrder = async (userId: number): Promise<TodayOrderResponse> => {
  const url = `${getApiBaseUrl()}/api/order/today-order/${userId}`;
  console.log('getTodayOrder: Calling API URL:', url);
  
  try {
    const response = await authenticatedFetch(url, {
      method: "GET",
    });
    
    console.log('getTodayOrder: Response status:', response.status);
    
    const data = await response.json();
    console.log('getTodayOrder: Response data:', data);
    
    // Check if the response indicates an error (even with 200 status)
    if (data.status === "error") {
      const errorMessage = data.errors || data.message || "An error occurred";
      console.error('getTodayOrder: API returned error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // If response is not ok (4xx, 5xx status codes) but we have JSON data
    if (!response.ok) {
      // If we have error data in the response body, use that
      if (data.errors || data.message) {
        const errorMessage = data.errors || data.message || "An error occurred";
        throw new Error(errorMessage);
      }
      // Otherwise use generic error
      throw new Error(`Failed to fetch today's order: ${response.status} ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error('getTodayOrder: Fetch error:', error);
    // Re-throw the error with the original message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Network error - please check your connection');
    }
  }
};

// Interface for staff list response
export interface StaffListResponse {
  status: "success" | "error";
  message: string;
  data: {
    id: number;
    full_name: string;
    department: string | null;
  }[];
  errors?: string;
}

// Function to fetch all users (staff list)
export const getStaffList = async (): Promise<StaffListResponse> => {
  const url = `${getApiBaseUrl()}/auth/users`;
  console.log('getStaffList: Calling API URL:', url);
  
  try {
    const response = await authenticatedFetch(url, {
      method: "GET",
    });
    
    console.log('getStaffList: Response status:', response.status);
    
    const data = await response.json();
    console.log('getStaffList: Response data:', data);
    
    // Check if the response indicates an error (even with 200 status)
    if (data.status === "error") {
      const errorMessage = data.errors || data.message || "An error occurred";
      console.error('getStaffList: API returned error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // If response is not ok (4xx, 5xx status codes) but we have JSON data
    if (!response.ok) {
      // If we have error data in the response body, use that
      if (data.errors || data.message) {
        const errorMessage = data.errors || data.message || "An error occurred";
        throw new Error(errorMessage);
      }
      // Otherwise use generic error
      throw new Error(`Failed to fetch staff list: ${response.status} ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error('getStaffList: Fetch error:', error);
    // Re-throw the error with the original message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Network error - please check your connection');
    }
  }
};

// Interface for admin order history response
export interface AdminOrderHistoryResponse {
  status: "success" | "error";
  message: string;
  data: {
    id: number;
    user_id: number;
    meal: string;
    fallback_meal: string;
    collected: number;
    ordered_at: string;
    updated_at: string;
  }[];
  errors?: string;
}

// Function to fetch admin order history with date range
// Updated API function to support pagination
export const getAdminOrderHistory = async (
  fromDate: string, 
  toDate: string, 
  page: number = 1, 
  limit: number = 20
): Promise<AdminOrderHistoryResponse> => {
  const url = `${getApiBaseUrl()}/api/admin/orders/history?from=${fromDate}&to=${toDate}&page=${page}&limit=${limit}`;
  console.log('getAdminOrderHistory: Calling API URL:', url);
  
  try {
    const response = await authenticatedFetch(url, {
      method: "GET",
    });
    
    console.log('getAdminOrderHistory: Response status:', response.status);
    
    const data = await response.json();
    console.log('getAdminOrderHistory: Response data:', data);
    
    // Check if the response indicates an error (even with 200 status)
    if (data.status === "error") {
      const errorMessage = data.errors || data.message || "An error occurred";
      console.error('getAdminOrderHistory: API returned error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // If response is not ok (4xx, 5xx status codes) but we have JSON data
    if (!response.ok) {
      // If we have error data in the response body, use that
      if (data.errors || data.message) {
        const errorMessage = data.errors || data.message || "An error occurred";
        throw new Error(errorMessage);
      }
      // Otherwise use generic error
      throw new Error(`Failed to fetch admin order history: ${response.status} ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error('getAdminOrderHistory: Fetch error:', error);
    // Re-throw the error with the original message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Network error - please check your connection');
    }
  }
};

// Interface for today's orders response
export interface TodaysOrdersResponse {
  status: "success" | "error";
  message: string;
  data: {
    id: number;
    user_id: number;
    full_name: string;
    meal: string;
    fallback_meal: string;
    collected: number; // 1 = collected, 0 = ordered
    ordered_at: string;
    department: string;
  }[];
  errors?: string;
}

// Function to fetch today's orders for admin
export const getTodaysOrders = async (): Promise<TodaysOrdersResponse> => {
  const url = `${getApiBaseUrl()}/api/admin/todays-orders`;
  console.log('getTodaysOrders: Calling API URL:', url);
  
  try {
    const response = await authenticatedFetch(url, {
      method: "GET",
    });
    
    console.log('getTodaysOrders: Response status:', response.status);
    
    const data = await response.json();
    console.log('getTodaysOrders: Response data:', data);
    
    // Check if the response indicates an error (even with 200 status)
    if (data.status === "error") {
      const errorMessage = data.errors || data.message || "An error occurred";
      console.error('getTodaysOrders: API returned error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // If response is not ok (4xx, 5xx status codes) but we have JSON data
    if (!response.ok) {
      // If we have error data in the response body, use that
      if (data.errors || data.message) {
        const errorMessage = data.errors || data.message || "An error occurred";
        throw new Error(errorMessage);
      }
      // Otherwise use generic error
      throw new Error(`Failed to fetch today's orders: ${response.status} ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error('getTodaysOrders: Fetch error:', error);
    // Re-throw the error with the original message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Network error - please check your connection');
    }
  }
};

// Interface for admin place order request
export interface AdminPlaceOrderRequest {
  meal: string;
  fallback_meal: string;
}

// Interface for admin place order response
export interface AdminPlaceOrderResponse {
  status: "success" | "error";
  message: string;
  data: null;
  errors?: string;
}

// Interface for editing order (admin function)
export interface AdminEditOrderRequest {
  meal: string;
  fallback_meal: string;
}

export interface AdminEditOrderResponse {
  status: "success" | "error";
  message: string;
  data: null;
  errors?: string;
}

// Interface for getting user ID by name
export interface GetUserIdByNameResponse {
  status: "success" | "error";
  message: string;
  data: {
    id: number;
  };
  errors?: string;
}

// Function to get user ID by name
export const getUserIdByName = async (fullName: string): Promise<number> => {
  const url = `${getApiBaseUrl()}/auth/user-id-by-name?name=${encodeURIComponent(fullName)}`;
  console.log('getUserIdByName: Calling API URL:', url);
  
  try {
    const response = await authenticatedFetch(url, {
      method: "GET",
    });
    
    console.log('getUserIdByName: Response status:', response.status);
    
    const data = await response.json();
    console.log('getUserIdByName: Response data:', data);
    
    // Check if the response indicates an error (even with 200 status)
    if (data.status === "error") {
      const errorMessage = data.errors || data.message || "An error occurred";
      console.error('getUserIdByName: API returned error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // If response is not ok (4xx, 5xx status codes) but we have JSON data
    if (!response.ok) {
      // If we have error data in the response body, use that
      if (data.errors || data.message) {
        const errorMessage = data.errors || data.message || "An error occurred";
        throw new Error(errorMessage);
      }
      // Otherwise use generic error
      throw new Error(`Failed to get user ID: ${response.status} ${response.statusText}`);
    }
    
    return data.data.id;
  } catch (error) {
    console.error('getUserIdByName: Fetch error:', error);
    // Re-throw the error with the original message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Network error - please check your connection');
    }
  }
};

// Function to place order for a user (admin function)
export const adminPlaceOrder = async (userId: string, orderData: AdminPlaceOrderRequest): Promise<AdminPlaceOrderResponse> => {
  console.log('adminPlaceOrder: userId parameter:', userId);
  console.log('adminPlaceOrder: userId type:', typeof userId);
  
  const url = `${getApiBaseUrl()}/api/admin/place-order/${userId}`;
  console.log('adminPlaceOrder: Calling API URL:', url);
  console.log('adminPlaceOrder: Order data:', orderData);
  
  try {
    const response = await authenticatedFetch(url, {
      method: "POST",
      body: JSON.stringify(orderData),
    });
    
    console.log('adminPlaceOrder: Response status:', response.status);
    
    const data = await response.json();
    console.log('adminPlaceOrder: Response data:', data);
    
    // Check if the response indicates an error (even with 200 status)
    if (data.status === "error") {
      const errorMessage = data.errors || data.message || "An error occurred";
      console.error('adminPlaceOrder: API returned error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // If response is not ok (4xx, 5xx status codes) but we have JSON data
    if (!response.ok) {
      // If we have error data in the response body, use that
      if (data.errors || data.message) {
        const errorMessage = data.errors || data.message || "An error occurred";
        throw new Error(errorMessage);
      }
      // Otherwise use generic error
      throw new Error(`Failed to place order: ${response.status} ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error('adminPlaceOrder: Fetch error:', error);
    // Re-throw the error with the original message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Network error - please check your connection');
    }
  }
};

// Function to edit order for a user (admin function)
export const adminEditOrder = async (orderId: string, orderData: AdminEditOrderRequest): Promise<AdminEditOrderResponse> => {
  console.log('adminEditOrder: orderId parameter:', orderId);
  console.log('adminEditOrder: orderId type:', typeof orderId);
  
  const url = `${getApiBaseUrl()}/api/admin/edit-order/${orderId}`;
  console.log('adminEditOrder: Calling API URL:', url);
  console.log('adminEditOrder: Order data:', orderData);
  
  try {
    const response = await authenticatedFetch(url, {
      method: "PUT",
      body: JSON.stringify(orderData),
    });
    
    console.log('adminEditOrder: Response status:', response.status);
    
    const data = await response.json();
    console.log('adminEditOrder: Response data:', data);
    
    // Check if the response indicates an error (even with 200 status)
    if (data.status === "error") {
      const errorMessage = data.errors || data.message || "An error occurred";
      console.error('adminEditOrder: API returned error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // If response is not ok (4xx, 5xx status codes) but we have JSON data
    if (!response.ok) {
      // If we have error data in the response body, use that
      if (data.errors || data.message) {
        const errorMessage = data.errors || data.message || "An error occurred";
        throw new Error(errorMessage);
      }
      // Otherwise use generic error
      throw new Error(`Failed to edit order: ${response.status} ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error('adminEditOrder: Fetch error:', error);
    // Re-throw the error with the original message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Network error - please check your connection');
    }
  }
};

// Function to collect order (admin function)
export interface AdminCollectOrderResponse {
  status: "success" | "error";
  message: string;
  data: null;
  errors?: string;
}

export const adminCollectOrder = async (userId: string): Promise<AdminCollectOrderResponse> => {
  console.log('adminCollectOrder: userId parameter:', userId);
  console.log('adminCollectOrder: userId type:', typeof userId);
  
  const url = `${getApiBaseUrl()}/api/admin/orders/${userId}/collect`;
  console.log('adminCollectOrder: Calling API URL:', url);
  
  try {
    const response = await authenticatedFetch(url, {
      method: "PUT",
    });
    
    console.log('adminCollectOrder: Response status:', response.status);
    
    const data = await response.json();
    console.log('adminCollectOrder: Response data:', data);
    
    // Check if the response indicates an error (even with 200 status)
    if (data.status === "error") {
      const errorMessage = data.errors || data.message || "An error occurred";
      console.error('adminCollectOrder: API returned error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // If response is not ok (4xx, 5xx status codes) but we have JSON data
    if (!response.ok) {
      // If we have error data in the response body, use that
      if (data.errors || data.message) {
        const errorMessage = data.errors || data.message || "An error occurred";
        throw new Error(errorMessage);
      }
      // Otherwise use generic error
      throw new Error(`Failed to collect order: ${response.status} ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error('adminCollectOrder: Fetch error:', error);
    // Re-throw the error with the original message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Network error - please check your connection');
    }
  }
};

// Function to uncollect order (admin function)
export interface AdminUncollectOrderResponse {
  status: "success" | "error";
  message: string;
  data: null;
  errors?: string;
}

export const adminUncollectOrder = async (orderId: string): Promise<AdminUncollectOrderResponse> => {
  console.log('adminUncollectOrder: orderId parameter:', orderId);
  console.log('adminUncollectOrder: orderId type:', typeof orderId);
  
  const url = `${getApiBaseUrl()}/api/admin/unmark-collection/${orderId}`;
  console.log('adminUncollectOrder: Calling API URL:', url);
  
  try {
    const response = await authenticatedFetch(url, {
      method: "PUT",
    });
    
    console.log('adminUncollectOrder: Response status:', response.status);
    
    const data = await response.json();
    console.log('adminUncollectOrder: Response data:', data);
    
    // Check if the response indicates an error (even with 200 status)
    if (data.status === "error") {
      const errorMessage = data.errors || data.message || "An error occurred";
      console.error('adminUncollectOrder: API returned error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // If response is not ok (4xx, 5xx status codes) but we have JSON data
    if (!response.ok) {
      // If we have error data in the response body, use that
      if (data.errors || data.message) {
        const errorMessage = data.errors || data.message || "An error occurred";
        throw new Error(errorMessage);
      }
      // Otherwise use generic error
      throw new Error(`Failed to uncollect order: ${response.status} ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error('adminUncollectOrder: Fetch error:', error);
    // Re-throw the error with the original message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Network error - please check your connection');
    }
  }
};

// Export the authenticated fetch for other components to use
export { authenticatedFetch };

export interface EditOrderRequest {
  meal: string;
  fallback_meal?: string;
}

export interface EditOrderResponse {
  status: "success" | "error";
  message: string;
  data: null;
  errors?: string;
}

export const editOrder = async (
    userId: number,
    orderData: EditOrderRequest
): Promise<EditOrderResponse> => {
  const url = `${getApiBaseUrl()}/api/order/edit-order/${userId}`;
  // console.log('editOrder: Calling API URL:', url);
  // console.log('editOrder: Order data:', orderData);

  try {
    const response = await authenticatedFetch(url, {
      method: "PUT",
      body: JSON.stringify(orderData),
    });

    // console.log('editOrder: Response status:', response.status);

    const data = await response.json();
    // console.log('editOrder: Response data:', data);

    if (data.status === "error") {
      const errorMessage = data.errors || data.message || "An error occurred";
      console.error('editOrder: API returned error:', errorMessage);
      throw new Error(errorMessage);
    }

    if (!response.ok) {
      const errorMessage = data.errors || data.message || "An error occurred";
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('editOrder: Fetch error:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Network error - please check your connection');
    }
  }
};
