"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggleButton from "./ThemeToggleButton";
import { 
  Building2, 
  ChevronDown, 
  Search, 
  FileText, 
  CreditCard, 
  ArrowDownLeft, 
  PlusCircle, 
  Check, 
  PowerOff, 
  Settings2, 
  LogOut,
  Shield,
  Briefcase
} from "lucide-react";
import { getCompaniesAction, switchCompanyAction, shutCompanyAction } from "@/server/company/companyActions";
import { getAuthUserAction, logoutAction } from "@/server/auth/authActions";

interface HeaderProps {
  companyName?: string;
  gstin?: string;
}

const Header: React.FC<HeaderProps> = ({
  companyName: defaultName,
  gstin: defaultGstin,
}) => {
  const router = useRouter();
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const companyMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      const coRes = await getCompaniesAction();
      setCompanies(coRes.companies || []);
      const current = coRes.companies?.find((c: any) => c.id === coRes.activeCompanyId) || coRes.companies?.[0] || null;
      setActiveCompany(current);

      const uRes = await getAuthUserAction();
      setUser(uRes.user || null);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    loadData();

    const handleClickOutside = (event: MouseEvent) => {
      if (companyMenuRef.current && !companyMenuRef.current.contains(event.target as Node)) {
        setCompanyDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitchCompany = async (companyId: string) => {
    setCompanyDropdownOpen(false);
    await switchCompanyAction(companyId);
    router.refresh();
    loadData();
  };

  const handleShutCompany = async () => {
    setCompanyDropdownOpen(false);
    await shutCompanyAction();
    router.push("/companies" as any);
    router.refresh();
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    await logoutAction();
    router.push("/auth/login" as any);
    router.refresh();
  };

  const currentCompanyName = activeCompany?.name || defaultName || "Advance Forging Pvt Ltd";
  const currentGstin = activeCompany?.gstin || defaultGstin || "19AAAAA0000A1Z5";
  const fyYear = activeCompany?.financialYearFrom ? new Date(activeCompany.financialYearFrom).getFullYear() : 2025;

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-card/85 backdrop-blur-md px-3 sm:px-6">
      {/* Left: Interactive Company Switcher */}
      <div className="relative" ref={companyMenuRef}>
        <button
          onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
          className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-muted/80 transition-all text-left border border-transparent hover:border-border"
          title="Switch Company (F1)"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold font-mono shrink-0">
            <Building2 className="h-4 w-4" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-foreground tracking-tight line-clamp-1 max-w-[140px] sm:max-w-[220px]">
                {currentCompanyName}
              </span>
              <span className="hidden sm:inline-block rounded px-1.5 py-0.2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-mono">
                FY {fyYear}-{fyYear + 1}
              </span>
              <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${companyDropdownOpen ? "rotate-180" : ""}`} />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">GSTIN: {currentGstin}</span>
          </div>
        </button>

        {/* Company Dropdown Menu */}
        {companyDropdownOpen && (
          <div className="absolute left-0 top-12 w-80 rounded-2xl border border-border bg-card shadow-2xl p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
            <div className="px-3 py-2 border-b border-border/70 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Select Company</span>
              <Link
                href={"/companies" as any}
                onClick={() => setCompanyDropdownOpen(false)}
                className="text-[11px] text-emerald-600 hover:text-emerald-500 font-semibold"
              >
                All Companies
              </Link>
            </div>

            <div className="max-h-56 overflow-y-auto py-1 space-y-1">
              {companies.map((co) => {
                const isSelected = co.id === activeCompany?.id;
                return (
                  <button
                    key={co.id}
                    onClick={() => handleSwitchCompany(co.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                      isSelected 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold" 
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="truncate font-medium">{co.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate">{co.gstin}</div>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border/70 space-y-1">
              <Link
                href={"/companies/create" as any}
                onClick={() => setCompanyDropdownOpen(false)}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Create New Company (F3)
              </Link>

              <Link
                href={"/company" as any}
                onClick={() => setCompanyDropdownOpen(false)}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs text-foreground hover:bg-muted transition-colors"
              >
                <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                Alter Company Profile (Alt+F3)
              </Link>

              <button
                onClick={handleShutCompany}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 transition-colors"
              >
                <PowerOff className="h-3.5 w-3.5" />
                Shut Current Company (Alt+F1)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Middle: Quick Jump Command Trigger */}
      <div className="hidden md:flex items-center">
        <button
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
          }}
          className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-3.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer shadow-xs"
        >
          <Search className="h-3.5 w-3.5 text-emerald-500" />
          <span>Go To (Vouchers, Ledgers, Reports)...</span>
          <kbd className="rounded-md bg-background px-1.5 py-0.5 text-[10px] font-mono border border-border text-foreground">
            Ctrl+K / Alt+G
          </kbd>
        </button>
      </div>

      {/* Right: Quick Vouchers, User Profile & Theme Toggle */}
      <div className="flex items-center gap-2">
        <Link
          href={"/vouchers/sales" as any}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-semibold transition shadow-sm"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Sales (F8)</span>
        </Link>
        <Link
          href={"/vouchers/payment" as any}
          className="hidden xl:inline-flex items-center gap-1.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-muted px-2.5 py-1.5 text-xs font-medium border border-border transition"
        >
          <CreditCard className="h-3.5 w-3.5 text-amber-500" />
          <span>Payment (F5)</span>
        </Link>
        <Link
          href={"/vouchers/receipt" as any}
          className="hidden xl:inline-flex items-center gap-1.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-muted px-2.5 py-1.5 text-xs font-medium border border-border transition"
        >
          <ArrowDownLeft className="h-3.5 w-3.5 text-blue-500" />
          <span>Receipt (F6)</span>
        </Link>

        <div className="h-4 w-px bg-border mx-0.5" />

        {/* User Profile Pill & Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-muted/80 transition-colors border border-transparent hover:border-border"
          >
            <div className="h-8 w-8 rounded-lg bg-zinc-900 dark:bg-zinc-800 text-zinc-100 flex items-center justify-center font-bold text-xs border border-zinc-700/50">
              {user ? user.name.charAt(0) : "U"}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-foreground line-clamp-1 max-w-[110px]">
                {user ? user.name.split(" ")[0] : "Account"}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                {user ? user.role : "Admin"}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground hidden lg:block" />
          </button>

          {/* User Menu Dropdown */}
          {userDropdownOpen && (
            <div className="absolute right-0 top-12 w-64 rounded-2xl border border-border bg-card shadow-2xl p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-border/70">
                <div className="font-bold text-xs text-foreground truncate">{user?.name || "Corporate User"}</div>
                <div className="text-[11px] text-muted-foreground truncate">{user?.email || "admin@zipsbook.com"}</div>
                <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold">
                  <Shield className="h-3 w-3" />
                  Role: {user?.role || "ADMIN"}
                </div>
              </div>

              <div className="py-1 space-y-0.5">
                <Link
                  href={"/companies" as any}
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs text-foreground hover:bg-muted transition-colors"
                >
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  Manage Companies
                </Link>
                <Link
                  href={"/company" as any}
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs text-foreground hover:bg-muted transition-colors"
                >
                  <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Active Company Settings
                </Link>
              </div>

              <div className="pt-1 border-t border-border/70">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 transition-colors font-medium"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out of ZIPS-Book
                </button>
              </div>
            </div>
          )}
        </div>

        <ThemeToggleButton />
      </div>
    </header>
  );
};

export default Header;
