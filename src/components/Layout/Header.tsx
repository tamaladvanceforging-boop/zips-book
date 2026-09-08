"use client";

import React from "react";
import Link from "next/link";
import ThemeToggleButton from "./ThemeToggleButton";
import { Search, FileText, CreditCard, ArrowDownLeft } from "lucide-react";

interface HeaderProps {
  companyName?: string;
  gstin?: string;
}

const Header: React.FC<HeaderProps> = ({
  companyName = "Your Company Pvt Ltd",
  gstin = "19AAAAA0000A1Z5",
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6">
      {/* Left: Active Company Indicator */}
      <div className="flex items-center gap-3">
        <Link href="/company" className="group flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-bold font-mono">
            ZC
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-foreground group-hover:text-primary transition">
                {companyName}
              </span>
              <span className="hidden sm:inline-block rounded-xs bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Active
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">GSTIN: {gstin}</span>
          </div>
        </Link>
      </div>

      {/* Middle: Tally "Go To" Command Trigger */}
      <div className="hidden md:flex items-center">
        <button
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
          }}
          className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer shadow-xs"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Go To (Pages, Vouchers, Reports)...</span>
          <kbd className="rounded bg-background px-1.5 py-0.5 text-[10px] font-mono border border-border">
            Ctrl+K / Alt+G
          </kbd>
        </button>
      </div>

      {/* Right: Quick Action Buttons & Theme Toggle */}
      <div className="flex items-center gap-2">
        <Link
          href="/vouchers/sales"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 px-2.5 py-1.5 text-xs font-medium transition shadow-xs"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Sales (F8)</span>
        </Link>
        <Link
          href="/vouchers/payment"
          className="hidden lg:inline-flex items-center gap-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-muted px-2.5 py-1.5 text-xs font-medium border border-border transition"
        >
          <CreditCard className="h-3.5 w-3.5 text-amber-500" />
          <span>Payment (F5)</span>
        </Link>
        <Link
          href="/vouchers/receipt"
          className="hidden lg:inline-flex items-center gap-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-muted px-2.5 py-1.5 text-xs font-medium border border-border transition"
        >
          <ArrowDownLeft className="h-3.5 w-3.5 text-blue-500" />
          <span>Receipt (F6)</span>
        </Link>

        <div className="h-4 w-px bg-border mx-1" />

        <ThemeToggleButton />
      </div>
    </header>
  );
};

export default Header;
