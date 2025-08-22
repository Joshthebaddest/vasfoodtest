import { useState, useEffect, useRef } from "react";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Separator } from "@/components/ui/separator";
import { ChefHat, Mail, Lock, Chrome } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
// import { getDefaultRoute } from "@/lib/auth";
// import foodBg from "@/assets/food-bg.jpg";
import beautifulFood from "@/assets/beautiful-delicious-fast-food.jpg";
import vasLogo from "@/assets/vasLogo.png";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // const [googleLoading, setGoogleLoading] = useState(false);
  const [showVerificationButton, setShowVerificationButton] = useState(false);
  // const googleClientId = "414516104038-n1bs477pp4c1v8rur85438ghhifr168o.apps.googleusercontent.com";
  // const googleButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const { setAccessToken, setMail } = useAuthStore.getState();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const baseUrl = import.meta.env.VITE_API_URL;

    // Determine API URL based on environment
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const apiBaseUrl = isLocalhost
      ? "http://localhost/vasfood/auth"
      : `https://${baseUrl}/auth`;

    // Debug logging
    // console.log('Login - Current hostname:', window.location.hostname);
    // console.log('Login - Is localhost:', isLocalhost);
    // console.log('Login - API Base URL:', apiBaseUrl);
    // console.log('Login - Full URL:', `${apiBaseUrl}/login`);
    // console.log('Login - Cache bust timestamp:', Date.now());

    try {
      setIsLoading(true);

      const response = await fetch(`${apiBaseUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // 👈 important: ensures refresh cookie is set
      });

      const data = await response.json();
      setIsLoading(false);

      if (response.status === 200) {
        // Store access token in memory (zustand)
        setAccessToken(data.accessToken);

        // Save user info (email or full profile if returned)
        setMail(email);

        toast({
          title: "Welcome back! 🎉",
          description: data.message || "Successfully logged in.",
        });

        navigate("/");
      } else if (
        response.status === 401 &&
        data.message === "User is not verified"
      ) {
        setShowVerificationButton(true);
        setMail(email);

        toast({
          title: "Email Verification Required",
          description: "Please verify your email address to continue.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login failed",
          description: data.message || "Invalid email or password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsLoading(false);
      // console.error("Login error:", error?.message, error?.stack);
      toast({
        title: "Network error",
        description: "Could not connect to server.",
        variant: "destructive",
      });
    }
  };
  // Google Sign-In handler (OAuth 2.0 redirect)
  const handleGoogleLogin = () => {
    // Determine if we're in development or production
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // Use localhost backend for local development, production for deployed
    const redirectUri = isLocalhost
      ? "http://localhost/vasfood/auth/oauth2/google/callback"
      : "https://vas-food-production.up.railway.app/auth/oauth2/google/callback";

    // Debug logging
    console.log("Current hostname:", window.location.hostname);
    console.log("Is localhost:", isLocalhost);
    console.log("Redirect URI:", redirectUri);

    const params = new URLSearchParams({
      client_id:
        "414516104038-n1bs477pp4c1v8rur85438ghhifr168o.apps.googleusercontent.com",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  return (
    <div className="min-h-screen min-w-screen w-screen h-screen overflow-hidden relative bg-white flex items-center justify-center">
      <div className="flex w-full h-full items-center justify-center">
        {/* Left: Image (hidden on mobile) */}
        <div className="hidden md:flex w-1/2 h-full relative">
          <img
            src={beautifulFood}
            alt="Background"
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>
        {/* Right: Login Form */}
        <div className="w-full max-w-xl mx-auto px-6 py-6 flex flex-col justify-center">
          {/* Logo */}
          <div className="flex justify-center items-center mb-6 gap-2">
            <img
              src={vasLogo}
              alt="VasFood Logo"
              className="h-10 w-auto mr-2"
            />
            <span className="text-3xl font-extrabold text-red-700 tracking-tight">
              Vas<span className="text-black">Food</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900 text-left">
            Welcome back
          </h2>
          {/* Error toast placeholder (if needed) */}
          {/* Form */}
          <form
            onSubmit={handleEmailLogin}
            className="space-y-4"
            autoComplete="off"
          >
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@vas2nets.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 placeholder-gray-400 text-gray-900 font-normal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 placeholder-gray-400 text-gray-900 font-normal pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center mb-2 justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-red-700 hover:underline font-medium transition-colors ml-2"
              >
                Forgot password?
              </Link>
            </div>
            {/* Login Button */}
            <Button
              type="submit"
              className="w-full bg-red-900 text-white px-4 py-3 rounded-lg font-semibold text-base hover:bg-red-800 transition-all duration-200 mt-2"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Login"}
            </Button>

            {/* Verification Button - shown when user is not verified */}
            {showVerificationButton && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm mb-3">
                  Your email address needs to be verified before you can log in.
                </p>
                <Button
                  type="button"
                  onClick={() => navigate("/verify")}
                  className="w-full bg-yellow-500 text-white px-4 py-3 rounded-lg font-semibold text-base hover:bg-yellow-600 transition-all duration-200"
                >
                  Verify Email Address
                </Button>
              </div>
            )}
            {/* Or divider */}
            <div className="flex items-center my-4">
              <div className="flex-grow h-px bg-gray-200"></div>
              <span className="mx-2 text-gray-400 text-xs">or</span>
              <div className="flex-grow h-px bg-gray-200"></div>
            </div>
            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center border border-gray-300 rounded-lg py-2 hover:bg-gray-50 transition mb-2 bg-white shadow-sm"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 48 48">
                <g>
                  <path
                    fill="#4285F4"
                    d="M24 9.5c3.54 0 6.36 1.46 7.82 2.68l5.8-5.8C34.36 3.54 29.64 1.5 24 1.5 14.82 1.5 6.98 7.98 3.68 16.44l6.74 5.23C12.36 15.36 17.7 9.5 24 9.5z"
                  />
                  <path
                    fill="#34A853"
                    d="M46.1 24.5c0-1.64-.15-3.22-.43-4.74H24v9.24h12.4c-.54 2.9-2.18 5.36-4.64 7.04l7.18 5.6C43.82 37.18 46.1 31.36 46.1 24.5z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.42 28.67A14.98 14.98 0 019.5 24c0-1.62.28-3.18.78-4.67l-6.74-5.23A23.94 23.94 0 001.5 24c0 3.82.92 7.44 2.54 10.67l6.38-6z"
                  />
                  <path
                    fill="#EA4335"
                    d="M24 46.5c6.48 0 11.92-2.14 15.9-5.82l-7.18-5.6c-2.02 1.36-4.6 2.17-8.72 2.17-6.3 0-11.64-5.86-13.58-13.44l-6.74 5.23C6.98 40.02 14.82 46.5 24 46.5z"
                  />
                </g>
              </svg>
              <span className="font-medium text-gray-700">
                Sign in with Google
              </span>
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-gray-500">
            Don't have an account?
            <Link
              to="/signup"
              className="text-red-900 hover:underline font-medium transition-colors ml-1"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
