import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import beautifulFood from "@/assets/beautiful-delicious-fast-food.jpg";
import vasLogo from "@/assets/vasLogo.png";
import { useAuthStore } from "@/stores/useAuthStore"; // Adjust path as needed

export default function Verify() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const email = useAuthStore((state) => state.email);
  const setMail = useAuthStore((state) => state.setMail);
  const [isLoading, setIsLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownMessage, setCountdownMessage] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

    useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const oauthEmail = urlParams.get("email");
  const unverified = urlParams.get("unverified");

  if (oauthEmail && unverified === "true") {
    setMail(oauthEmail);
    setOtpSent(true);
    handleSendOtp(oauthEmail); // ✅ Only send once for OAuth
    window.history.replaceState({}, document.title, window.location.pathname);

    toast({
      title: "Email Verification Required",
      description:
        "Please verify your email address to continue with Google sign-in.",
      variant: "destructive",
    });
  } else if (email && !otpSent) {
    setOtpSent(true);
    handleSendOtp(email); // ✅ Send once for standard signup flow
  }
}, []);

  // Countdown effect
  useEffect(() => {
    if (countdown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        const minutes = Math.floor((countdown - 1) / 60);
        const seconds = (countdown - 1) % 60;
        setCountdownMessage(`${minutes}m ${seconds}s`);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
      setCountdownMessage("");
    }
  }, [countdown]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length > 1) return;
    const newCode = [...code];
    newCode[idx] = val;
    setCode(newCode);
    // Move to next input if value entered
    if (val && idx < 5) {
      const next = document.getElementById(`code-${idx + 1}`);
      if (next) (next as HTMLInputElement).focus();
    }
    // Move to previous input if deleted
    if (!val && idx > 0) {
      const prev = document.getElementById(`code-${idx - 1}`);
      if (prev) (prev as HTMLInputElement).focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeValue = code.join("");

    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (codeValue.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit code.",
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
      const response = await fetch(`${apiBaseUrl}/confirm-verification-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code: codeValue,
        }),
      });
      const data = await response.json();
      setIsLoading(false);
      if (response.status === 200) {
        // Ensure display name is saved
        const displayName = localStorage.getItem("vasfood_display_name");
        if (!displayName) {
          localStorage.setItem("vasfood_display_name", email.split("@")[0]);
        }

        toast({
          title: "Success!",
          description:
            data.message ||
            "Email verified successfully. Please log in to continue.",
        });
        navigate("/login");
      } else {
        toast({
          title: "Verification failed",
          description: data.message || "Invalid code.",
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

  const handleSendOtp = async (sendEmail?: string) => {
    const emailToUse = sendEmail || email;
    if (!emailToUse || !emailToUse.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setOtpLoading(true);

    // Your existing API URL detection logic
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const apiBaseUrl = isLocalhost
      ? "http://localhost/vasfood/auth"
      : "https://vas-food.onrender.com/auth";

    try {
      const response = await fetch(`${apiBaseUrl}/send-verification-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse }),
      });
      const data = await response.json();
      setOtpLoading(false);

      if (response.status === 200) {
        setOtpSent(true);

        // Set 2-minute countdown (120 seconds)
        setCountdown(120);
        const minutes = 2;
        const seconds = 0;
        setCountdownMessage(`${minutes}m ${seconds}s`);

        toast({
          title: "OTP sent!",
          description: data.message || "Verification email sent successfully.",
        });
      } else if (
        response.status === 400 &&
        data.message &&
        data.message.includes("please wait")
      ) {
        // Parse countdown from error message (existing logic)
        const match = data.message.match(/(\d+)m (\d+)s/);
        if (match) {
          const minutes = parseInt(match[1]);
          const seconds = parseInt(match[2]);
          const totalSeconds = minutes * 60 + seconds;
          setCountdown(totalSeconds);
          setCountdownMessage(`${minutes}m ${seconds}s`);
        }
        toast({
          title: "Please wait",
          description: data.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to send OTP",
          description: data.message || "Could not send verification email.",
          variant: "destructive",
        });
      }
    } catch (err) {
      setOtpLoading(false);
      toast({
        title: "Network error",
        description: "Could not send verification email.",
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
        {/* Right: Verification Form */}
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
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 text-left">
            Verify your email
          </h2>

          {/* Email Input Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setMail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 placeholder-gray-400 text-gray-900 font-normal"
              required
            />
          </div>

          <p className="mb-4 text-gray-700 text-left">
            {otpSent ? (
              <>
                A 6-digit verification code has been sent to{" "}
                <span className="font-semibold">{email}</span>. Please enter the
                code below to verify your email. The code will expire in 10
                minutes.
              </>
            ) : (
              <>
                To verify your email address, click the button below to receive
                a 6-digit verification code at{" "}
                <span className="font-semibold">{email}</span>. Make sure to
                check your inbox (and spam folder) for the code.
              </>
            )}
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
                  onChange={(e) => handleInput(e, idx)}
                  className="w-12 h-12 text-center text-2xl border-2 border-gray-300 rounded focus:border-red-600 focus:ring-2 focus:ring-red-600"
                  autoFocus={idx === 0}
                />
              ))}
            </div>
            {/* Send OTP Button */}
            <div className="flex justify-end mb-2 items-center gap-2">
              {countdown && (
                <span className="text-sm text-gray-600">
                  Please wait{" "}
                  <span className="font-semibold text-red-600">
                    {countdownMessage}
                  </span>{" "}
                  before requesting another code.
                </span>
              )}
              <Button
                type="button"
                onClick={() => handleSendOtp()}
                className="bg-red-100 text-red-700 hover:bg-red-200"
                disabled={otpLoading || countdown !== null}
              >
                {otpLoading
                  ? "Sending..."
                  : countdown
                  ? `Wait (${countdownMessage})`
                  : otpSent
                  ? "Re-send OTP"
                  : "Send OTP"}
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full bg-red-900 text-white px-4 py-3 rounded-lg font-semibold text-base hover:bg-red-800 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
            {/* Back Button below verify */}
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="mt-2 flex items-center text-red-700 hover:text-red-900 font-medium focus:outline-none"
              >
                <svg
                  className="h-5 w-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
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
