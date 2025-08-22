// src/pages/SetNewPassword.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import beautifulFood from "@/assets/beautiful-delicious-fast-food.jpg";
import vasLogo from "@/assets/vasLogo.png";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToast } from "@/hooks/use-toast"; // import your toast hook

export default function SetNewPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const email = useAuthStore((state) => state.email);
  const code = useAuthStore((state) => state.code);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code) {
      toast({
        title: "Missing code",
        description: "Please verify your email first.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please enter matching passwords.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL;
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const apiBaseUrl = isLocalhost ? "http://localhost/vasfood/auth" : `https://${baseUrl}/auth`;

      const response = await fetch(`${apiBaseUrl}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success!",
          description: data.message || "Password updated successfully",
        });
        navigate("/login");
      } else {
        toast({
          title: "Failed",
          description: data.message || "Could not update password",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Network error",
        description: "Could not connect to server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-w-screen w-screen h-screen overflow-hidden relative bg-white flex items-center justify-center">
      <div className="flex w-full h-full items-center justify-center">
        {/* Left: Image */}
        <div className="hidden md:flex w-1/2 h-full relative">
          <img src={beautifulFood} alt="Background" className="object-cover w-full h-full" />
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>

        {/* Right Form */}
        <div className="w-full max-w-xl mx-auto px-6 py-6 flex flex-col justify-center">
          {/* Logo */}
          <div className="flex justify-center items-center mb-6 gap-2">
            <img src={vasLogo} alt="VasFood Logo" className="h-10 w-auto mr-2" />
            <span className="text-3xl font-extrabold text-red-700 tracking-tight">
              Vas<span className="text-black">Food</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 text-left">Set New Password</h2>
          <p className="mb-4 text-gray-700 text-left">
            Enter a new password for <span className="font-semibold">{email}</span>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="new-password"
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 placeholder-gray-400 text-gray-900 font-normal"
            />
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 placeholder-gray-400 text-gray-900 font-normal"
            />
            <Button
              type="submit"
              className="w-full bg-red-900 text-white px-4 py-3 rounded-lg font-semibold text-base hover:bg-red-800 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Password"}
            </Button>

            {/* Back Button */}
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-2 flex items-center text-red-700 hover:text-red-900 font-medium focus:outline-none"
              >
                <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
