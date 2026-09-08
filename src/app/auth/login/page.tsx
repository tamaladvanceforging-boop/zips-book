"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/server/auth/authActions";
import { notify } from "@/lib/notify";
import { 
  Building2, 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Sparkles,
  UserCheck
} from "lucide-react";

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email and password.");
      notify.error("Please provide both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await loginAction({ email, password });
    if (res.success) {
      notify.success("Welcome back! Loading Tally ERP Workspace...");
      router.push("/dashboard" as any);
      router.refresh();
    } else {
      const msg = res.error || "Login failed. Please check credentials.";
      setError(msg);
      notify.error(msg);
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-background selection:bg-emerald-500/20 selection:text-emerald-500">
      {/* Left Column: Industrial Brand Showcase */}
      <div className="hidden lg:flex lg:col-span-7 relative flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-zinc-900 to-emerald-950 text-white border-r border-emerald-500/20 overflow-hidden">
        {/* Glow backdrop effects */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Building2 className="h-6 w-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white">ZIPS-Book</span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ERP Prime
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium tracking-wide">
                Enterprise GST Billing & Double-Entry Accounting
              </p>
            </div>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            Tally-Speed Keyboard First Architecture
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight text-zinc-100">
            Precision Bookkeeping for Industrial Manufacturing & Trade.
          </h1>

          <p className="text-sm text-zinc-300 leading-relaxed">
            Multi-company ledger isolation, automated CGST/SGST/IGST state splits, instant Day Book, Trial Balance verification, and single-click GSTR returns.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-zinc-200">Strict Double-Entry</p>
                <p className="text-xs text-zinc-400">Guaranteed balanced Dr = Cr across all financial statements.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-zinc-200">Multi-Company Hub</p>
                <p className="text-xs text-zinc-400">Switch companies with Alt+F1 & F1 shortcuts seamlessly.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-800/80 pt-6">
          <span>Authored by <strong className="text-zinc-200">Tamal Roy Chowdhury</strong></span>
          <span>MIT Licensed Open Core</span>
        </div>
      </div>

      {/* Right Column: Modern Login Card */}
      <div className="lg:col-span-5 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Brand */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-black" />
            </div>
            <div>
              <span className="text-xl font-bold text-foreground">ZIPS-Book</span>
              <p className="text-xs text-muted-foreground">Enterprise ERP</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Sign In to Workspace</h2>
            <p className="text-xs text-muted-foreground">
              Enter your corporate credentials to access companies, vouchers, and ledgers.
            </p>
          </div>

          {error && (
            <div className="p-3.5 text-xs rounded-xl bg-destructive/10 border border-destructive/30 text-destructive font-medium flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full h-10 px-3.5 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Password
                </label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-10 px-3.5 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Enter ERP Dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div className="pt-4 border-t border-border space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              1-Click Instant Demo Credentials:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@zipsbook.com", "admin123")}
                className="p-2.5 rounded-xl border border-border hover:border-emerald-500/50 bg-card hover:bg-emerald-500/5 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground group-hover:text-emerald-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Admin
                </div>
                <p className="text-[10px] text-muted-foreground truncate">admin@zipsbook.com</p>
                <p className="text-[10px] text-emerald-500 font-mono mt-0.5">pass: admin123</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("accountant@zipsbook.com", "acc123")}
                className="p-2.5 rounded-xl border border-border hover:border-blue-500/50 bg-card hover:bg-blue-500/5 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground group-hover:text-blue-500">
                  <UserCheck className="h-3.5 w-3.5 text-blue-500" />
                  Accountant
                </div>
                <p className="text-[10px] text-muted-foreground truncate">accountant@zipsbook.com</p>
                <p className="text-[10px] text-blue-500 font-mono mt-0.5">pass: acc123</p>
              </button>
            </div>
          </div>

          <div className="pt-2 text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href={"/auth/register" as any} className="font-semibold text-emerald-600 hover:text-emerald-500 underline underline-offset-4">
              Register New User
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
