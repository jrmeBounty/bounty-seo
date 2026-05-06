import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { ShoppingCart, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
      />
      <path
        fill="#34A853"
        d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"
      />
      <path
        fill="#FBBC05"
        d="M4.5 10.48A4.8 4.8 0 0 1 4.5 7.5V5.43H1.83a8 8 0 0 0 0 7.14z"
      />
      <path
        fill="#EA4335"
        d="M8.98 3.58c1.32 0 2.5.45 3.44 1.35l2.56-2.56A8 8 0 0 0 1.83 5.43L4.5 7.5a4.77 4.77 0 0 1 4.48-3.92z"
      />
    </svg>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!sessionPending && session?.user) {
      navigate({ to: "/" });
    }
  }, [session, sessionPending, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignUp) {
        const result = await authClient.signUp.email({ email, password, name });
        if (result.error) {
          setError(result.error.message ?? "Sign up failed. Please try again.");
        } else {
          navigate({ to: "/" });
        }
      } else {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) {
          setError(result.error.message ?? "Invalid email or password.");
        } else {
          navigate({ to: "/" });
        }
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch {
      setError(
        "Google sign-in failed. Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are configured.",
      );
    }
  };

  if (sessionPending) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F8F9FA" }}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#D4A017]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F8F9FA" }}>
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ backgroundColor: "#111111" }}
      >
        {/* Decorative gold accent */}
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: "#D4A017" }}
        />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/bounty picture.jpg"
              alt="Bounty Supermarket"
              className="h-16 w-16 rounded-2xl object-cover shadow-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="text-left">
              <p
                className="text-2xl font-black text-white leading-none"
                style={{ fontFamily: "Fraunces, serif" }}
              >
                Bounty
              </p>
              <p className="text-sm font-semibold" style={{ color: "#D4A017" }}>
                Supermarket
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h2
              className="text-3xl font-black text-white"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              SEO Ranking Tracker
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Monitor your Google Maps positions, track customer reviews, and
              manage business directory citations — all in one place.
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="space-y-3 text-left w-full">
            {[
              "Real-time Google Maps position tracking",
              "Customer review management & replies",
              "NAP citation consistency monitoring",
              "Multi-branch performance dashboard",
            ].map((feat) => (
              <li key={feat} className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black"
                  style={{ backgroundColor: "#D4A017", color: "#000" }}
                >
                  ✓
                </span>
                <span className="text-gray-300 text-sm">{feat}</span>
              </li>
            ))}
          </ul>

          <p
            className="text-xs font-semibold tracking-widest uppercase mt-4"
            style={{ color: "#D4A017" }}
          >
            "Great Savings Everyday"
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-6">
            <ShoppingCart size={24} style={{ color: "#D4A017" }} />
            <span
              className="text-xl font-black"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              Bounty Tracker
            </span>
          </div>

          <div>
            <h1
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              {isSignUp ? "Create account" : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isSignUp
                ? "Sign up to start tracking your SEO performance"
                : "Sign in to your Bounty Tracker account"}
            </p>
          </div>

          {/* Google Sign-In */}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-3 h-11 font-medium"
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <Separator className="flex-1" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={
                  isSignUp ? "At least 8 characters" : "Your password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <AlertCircle
                  size={15}
                  className="shrink-0 mt-0.5 text-red-500"
                />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 font-semibold"
              style={{ backgroundColor: "#D4A017", color: "#000" }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                  Please wait…
                </span>
              ) : isSignUp ? (
                "Create account"
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="font-semibold hover:underline"
              style={{ color: "#D4A017" }}
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>

          <p className="text-center text-xs text-gray-400">
            Bounty Supermarket Kenya · Internal SEO Tools
          </p>
        </div>
      </div>
    </div>
  );
}
