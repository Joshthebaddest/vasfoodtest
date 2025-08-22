import { getProfile } from './api';

export interface UserRole {
  role: string;
  full_name: string;
  email: string;
  department: string;
}

export const getDefaultRoute = (role: string): string => {
  if (role === "super_admin") {
    return "/hr";
  }
  return "/staff";
};

export const redirectBasedOnRole = async (navigate: (path: string) => void) => {
  try {
    // Get user profile to determine role
    const response = await getProfile();
    if (response.data && response.data.role) {
      const defaultRoute = getDefaultRoute(response.data.role);
      navigate(defaultRoute);
    } else {
      // Fallback to staff dashboard
      navigate("/");
    }
  } catch (error) {
    console.error("Error getting user profile for redirect:", error);
    // Fallback to staff dashboard
    navigate("/");
  }
}; 