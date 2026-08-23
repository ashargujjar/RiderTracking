import { useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1200);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-primary lg:flex">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-secondary/30" />

        <div className="relative z-10 flex flex-col items-center px-10 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
            <ShieldCheck className="h-10 w-10 text-primary" strokeWidth={2} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-wide text-secondary">Catkin</h1>
          <p className="mt-2 text-sm text-white/85">Admin Portal</p>
          <p className="mt-8 max-w-xs text-sm leading-relaxed text-white/80">
            Manage complaints, assign riders, monitor live locations, and keep every customer update in one place.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-1 flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="flex w-full max-w-sm flex-col">
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
              <ShieldCheck className="h-8 w-8 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-extrabold text-primary">Catkin</h1>
            <p className="text-xs text-gray">Admin Portal</p>
          </div>

          {isSubmitted ? (
            <div className="animate-fade-in-up">
              <div className="animate-scale-in mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-text-darker">Check your inbox</h2>
              <p className="mt-2 mb-8 text-sm text-gray">
                If an account exists for <span className="font-semibold text-text-dark">{identifier}</span>, a
                password reset link has been sent to it.
              </p>
              <Link
                to="/login"
                className="flex h-12 items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-bold text-text-dark transition hover:bg-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-text-darker">Forgot Password?</h2>
              <p className="mt-1 mb-8 text-sm text-gray">
                Enter your admin username or email and we'll send you a link to reset your password.
              </p>

              <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="identifier" className="text-xs font-semibold text-text-dark">
                    Username or Email
                  </label>
                  <div className="flex h-12 items-center gap-2 rounded-lg border border-border px-3 focus-within:border-primary">
                    <Mail className="h-4 w-4 shrink-0 text-gray" />
                    <input
                      id="identifier"
                      type="text"
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      placeholder="Enter your username or email"
                      autoComplete="username"
                      required
                      className="h-full w-full bg-transparent text-sm text-text-darker outline-none placeholder:text-gray"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 flex h-12 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white shadow-md shadow-accent/30 transition hover:brightness-95 active:scale-[0.98] disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>

                <Link
                  to="/login"
                  className="flex items-center justify-center gap-1.5 text-xs font-semibold text-link-blue hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </form>
            </>
          )}

          <p className="mt-10 text-center text-xs text-gray">© {new Date().getFullYear()} Catkin. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
