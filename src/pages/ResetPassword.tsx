import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import beautifulFood from "@/assets/beautiful-delicious-fast-food.jpg";
import vasLogo from "@/assets/vasLogo.png";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToast } from "@/hooks/use-toast"; // import toast

export default function ResetPassword() {
  const email = useAuthStore((state) => state.email);
  const setMail = useAuthStore((state) => state.setMail);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Countdown logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setCountdown(null);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const countdownMessage = countdown ? `${countdown}s` : "";

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length > 1) return;
    const newCode = [...code];
    newCode[idx] = val;
    setCode(newCode);
    if (val && idx < 5) {
      const next = document.getElementById(`code-${idx + 1}`);
      if (next) (next as HTMLInputElement).focus();
    }
    if (!val && idx > 0) {
      const prev = document.getElementById(`code-${idx - 1}`);
      if (prev) (prev as HTMLInputElement).focus();
    }
  };

  const handleSendOtp = async () => {
    setOtpLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL;
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const apiBaseUrl = isLocalhost ? "http://localhost/vasfood/auth" : `https://${baseUrl}/auth`;

      const response = await fetch(`${apiBaseUrl}/send-reset-password-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setCountdown(60); // 60s cooldown for resend
        toast({
          title: "OTP Sent!",
          description: data.message || "Verification code sent to your email.",
        });
      } else {
        toast({
          title: "Failed",
          description: data.message || "Failed to send OTP.",
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
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const codeString = code.join("");

    if (codeString.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit verification code.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL;
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const apiBaseUrl = isLocalhost ? "http://localhost/vasfood/auth" : `https://${baseUrl}/auth`;

      const response = await fetch(`${apiBaseUrl}/confirm-reset-password-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeString }),
      });

      const data = await response.json();

      if (response.ok) {
        useAuthStore.getState().setCode(codeString);
        toast({
          title: "Verified!",
          description: data.message || "Code verified successfully.",
        });
        navigate("/set-new-password");
      } else {
        toast({
          title: "Verification failed",
          description: data.message || "Invalid code",
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
        {/* Left Image */}
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

          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 text-left">Verify your email</h2>

          <p className="mb-4 text-gray-700 text-left">
            A 6-digit verification code has been sent to <span className="font-semibold">{email}</span>.
            Please enter it below. The code will expire in 10 minutes.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between gap-2 mb-2">
              {code.map((digit, idx) => (
                <Input
                  key={idx}
                  id={`code-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleInput(e, idx)}
                  className="w-12 h-12 text-center text-2xl border-2 border-gray-300 rounded focus:border-red-600 focus:ring-2 focus:ring-red-600"
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <div className="flex justify-end mb-2 items-center gap-2">
              {countdown && (
                <span className="text-sm text-gray-600">
                  Please wait <span className="font-semibold text-red-600">{countdownMessage}</span> before requesting another code.
                </span>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-red-900 text-white px-4 py-3 rounded-lg font-semibold text-base hover:bg-red-800 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>

            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
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
