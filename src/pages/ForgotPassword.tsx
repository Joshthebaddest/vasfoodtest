import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { sendResetPasswordCode } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import beautifulFood from "@/assets/beautiful-delicious-fast-food.jpg";
import vasLogo from "@/assets/vasLogo.png";
import { useToast } from "@/hooks/use-toast"; // import toast

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setMail = useAuthStore((state) => state.setMail);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await sendResetPasswordCode(email);
      toast({
        title: "Success",
        description: data.message || "Password reset code sent to your email.",
      });

      setMail(email);

      setTimeout(() => navigate("/reset-password"), 1500);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-w-screen w-screen h-screen overflow-hidden relative bg-white flex items-center justify-center">
      <div className="flex w-full h-full items-center justify-center">
        {/* Left: Image (hidden on mobile) */}
        <div className="hidden md:flex w-1/2 h-full relative">
          <img src={beautifulFood} alt="Background" className="object-cover w-full h-full" />
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>

        {/* Right: Forgot Password Form */}
        <div className="w-full max-w-xl mx-auto px-6 py-6 flex flex-col justify-center">
          {/* Logo */}
          <div className="flex justify-center items-center mb-6 gap-2">
            <img src={vasLogo} alt="VasFood Logo" className="h-10 w-auto mr-2" />
            <span className="text-3xl font-extrabold text-red-700 tracking-tight">
              Vas<span className="text-black">Food</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 text-left">Forgot Password</h2>
          <p className="mb-4 text-gray-700 text-left">Enter your email to receive a password reset code.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 placeholder-gray-400 text-gray-900 font-normal"
            />

            <Button
              type="submit"
              className="w-full bg-red-900 text-white px-4 py-3 rounded-lg font-semibold text-base hover:bg-red-800 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send"}
            </Button>

            {/* Back Button */}
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-2 flex items-center text-red-700 hover:text-red-900 font-medium focus:outline-none"
              >
                <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
