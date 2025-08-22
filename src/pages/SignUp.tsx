import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ChefHat, Mail, Lock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
// import foodBg from "@/assets/food-bg.jpg";
import beautifulFood from "@/assets/beautiful-delicious-fast-food.jpg";
import vasLogo from "@/assets/vasLogo.png";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const setMail = useAuthStore((state) => state.setMail);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const baseUrl = import.meta.env.VITE_API_URL;
    // Determine API URL based on environment
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const apiBaseUrl = isLocalhost
      ? "http://localhost/vasfood/auth"
      : `https://${baseUrl}/auth`;

    try {
      const response = await fetch(`${apiBaseUrl}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
        }),
      });
      const data = await response.json();
      setIsLoading(false);
      if (response.status === 201) {
        setMail(email);
        toast({
          title: "Success!",
          description:
            data.message ||
            "User registered successfully. Please verify your email.",
        });
        navigate("/verify");
      } else {
        toast({
          title: "Registration failed",
          description: data.message || "An error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Network error",
        description: "Could not connect to server.",
        variant: "destructive",
      });
    }
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
        {/* Right: Sign Up Form */}
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
            Create your account
          </h2>
          <form
            onSubmit={handleSignUp}
            className="space-y-4"
            autoComplete="off"
          >
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 placeholder-gray-400 text-gray-900 font-normal"
              />
            </div>
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

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 placeholder-gray-400 text-gray-900 font-normal pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-red-900 text-white px-4 py-3 rounded-lg font-semibold text-base hover:bg-red-800 transition-all duration-200 mt-2"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?
            <Link
              to="/login"
              className="text-red-900 hover:underline font-medium transition-colors ml-1"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
