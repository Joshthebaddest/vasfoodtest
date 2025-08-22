import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';


const OAuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log('OAuthCallback: Component mounted');
    console.log('OAuthCallback: Current URL:', window.location.href);
    
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('accessToken');
    const refreshToken = urlParams.get('refreshToken');
    
    console.log('OAuthCallback: accessToken exists:', !!accessToken);
    console.log('OAuthCallback: refreshToken exists:', !!refreshToken);
    console.log('OAuthCallback: accessToken length:', accessToken?.length);
    console.log('OAuthCallback: refreshToken length:', refreshToken?.length);

    if (accessToken && refreshToken) {
      try {
        // Store tokens in localStorage
        localStorage.setItem('vasfood_access_token', accessToken);
        localStorage.setItem('vasfood_refresh_token', refreshToken);
        
        console.log('OAuthCallback: Tokens stored successfully');
        console.log('OAuthCallback: Stored access token:', localStorage.getItem('vasfood_access_token') ? 'YES' : 'NO');
        console.log('OAuthCallback: Stored refresh token:', localStorage.getItem('vasfood_refresh_token') ? 'YES' : 'NO');
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        toast({
          title: "Welcome! 🎉",
          description: "Successfully signed in with Google",
        });
        
        console.log('OAuthCallback: Redirecting to dashboard');
        // Redirect to dashboard - DashboardRedirect will handle role-based routing
        navigate('/');
      } catch (error) {
        console.error('OAuthCallback: Error storing tokens:', error);
        toast({
          title: "Authentication failed",
          description: "Error storing authentication tokens",
          variant: "destructive",
        });
        navigate('/login');
      }
    } else {
      console.log('OAuthCallback: Missing tokens, redirecting to login');
      toast({
        title: "Authentication failed",
        description: "Could not complete Google sign-in",
        variant: "destructive",
      });
      
      // Redirect back to login
      navigate('/login');
    }
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign-in...</p>
      </div>
    </div>
  );
};

export default OAuthCallback; 