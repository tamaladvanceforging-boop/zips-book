"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerAction } from "@/server/auth/authActions";
import { notify } from "@/lib/notify";
import { AppLogo } from "@/components/UI/AppLogo";
import { 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  ArrowLeft
} from "lucide-react";

const RegisterPage = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill out all fields.");
      notify.error("Please fill out all fields.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await registerAction({ name, email, password, role });
    if (res.success) {
      notify.success("Account created successfully! Welcome to ZIPS-Book ERP.");
      router.push("/companies" as any);
      router.refresh();
    } else {
      const msg = res.error || "Registration failed.";
      setError(msg);
      notify.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-background selection:bg-emerald-500/20 selection:text-emerald-500">
      {/* Left Column: Brand summary */}
      <div className="hidden lg:flex lg:col-span-6 relative flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-zinc-900 to-emerald-950 text-white border-r border-emerald-500/20 overflow-hidden">
        <div className="relative z-10">
          <AppLogo
            size="lg"
            showText
            subtitle="Enterprise ERP & Accounting"
            badge="ERP Prime"
          />
        </div>

        <div className="relative z-10 max-w-lg space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            Instant Onboarding
          </div>
          <h2 className="text-3xl font-extrabold text-zinc-100 tracking-tight">
            Create your accounting profile and provision enterprise books in seconds.
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Every account gets instant access to multi-company creation, automated double-entry Day Book, Trial Balance, and GST reports.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-800 pt-6">
          <span>Authored & Owned by <strong className="text-zinc-200">Tamal Roy Chowdhury</strong></span>
          <span>Proprietary Software • © 2026 Tamal Roy Chowdhury</span>
        </div>
      </div>

      {/* Right Column: Register Form */}
      <div className="lg:col-span-6 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Brand */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <AppLogo size="md" showText subtitle="Enterprise ERP" />
          </div>

          <Link href={"/auth/login" as any} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Register User Profile</h2>
            <p className="text-xs text-muted-foreground">
              Sign up as an Administrator, Chief Accountant, or Data Operator.
            </p>
          </div>

          {error && (
            <div className="p-3.5 text-xs rounded-xl bg-destructive/10 border border-destructive/30 text-destructive font-medium flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tamal Roy Chowdhury"
                required
                className="w-full h-10 px-3.5 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@zipsbook.com"
                required
                className="w-full h-10 px-3.5 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Password (min 6 chars)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-10 px-3.5 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                User Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input"
              >
                <option value="ADMIN">Administrator (Full Access)</option>
                <option value="ACCOUNTANT">Chief Accountant (Vouchers & Ledgers)</option>
                <option value="OPERATOR">Data Entry Operator (Invoicing Only)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Register & Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 text-center text-xs text-muted-foreground border-t border-border">
            Already have an account?{" "}
            <Link href={"/auth/login" as any} className="font-semibold text-emerald-600 hover:text-emerald-500 underline underline-offset-4">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
