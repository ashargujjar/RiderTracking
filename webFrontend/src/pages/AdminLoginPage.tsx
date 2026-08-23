import { useState, type FormEvent } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  User,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { loginAdmin } from "../api/adminApi";
import { ApiError, setToken } from "../api/client";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);
    try {
      const token = await loginAdmin(username, password);
      setToken(token);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Login failed. Please try again.";
      toast.error(message);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-primary lg:flex">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-secondary/30" />

        <div className="relative z-10 flex flex-col items-center px-10 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
            <ShieldCheck className="h-10 w-10 text-primary" strokeWidth={2} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-wide text-secondary">
            Catkin
          </h1>
          <p className="mt-2 text-sm text-white/85">Admin Portal</p>
          <p className="mt-8 max-w-xs text-sm leading-relaxed text-white/80">
            Manage complaints, assign riders, monitor live locations, and keep
            every customer update in one place.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="flex w-full max-w-sm flex-col">
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
              <ShieldCheck className="h-8 w-8 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-extrabold text-primary">Catkin</h1>
            <p className="text-xs text-gray">Admin Portal</p>
          </div>

          <h2 className="text-2xl font-bold text-text-darker">Welcome Back</h2>
          <p className="mt-1 mb-8 text-sm text-gray">
            Sign in to manage complaints and riders.
          </p>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="username"
                className="text-xs font-semibold text-text-dark"
              >
                Username
              </label>
              <div className="flex h-12 items-center gap-2 rounded-lg border border-border px-3 focus-within:border-primary">
                <User className="h-4 w-4 shrink-0 text-gray" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  className="h-full w-full bg-transparent text-sm text-text-darker outline-none placeholder:text-gray"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold text-text-dark"
              >
                Password
              </label>
              <div className="flex h-12 items-center gap-2 rounded-lg border border-border px-3 focus-within:border-primary">
                <Lock className="h-4 w-4 shrink-0 text-gray" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="h-full w-full bg-transparent text-sm text-text-darker outline-none placeholder:text-gray"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="shrink-0 text-gray hover:text-text-dark"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-link-blue hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="mt-2 flex h-12 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white shadow-md shadow-accent/30 transition hover:brightness-95 active:scale-[0.98] disabled:opacity-75"
            >
              {isLoggingIn ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-xs text-gray">
            © {new Date().getFullYear()} Catkin. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
