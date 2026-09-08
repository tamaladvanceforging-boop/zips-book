"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface AppLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  badge?: string;
  href?: string;
  className?: string;
}

export const AppLogo = ({
  size = "md",
  showText = true,
  subtitle = "Enterprise ERP",
  badge,
  href,
  className,
}: AppLogoProps) => {
  const sizeMap = {
    xs: { icon: "h-5 w-5", text: "text-xs", sub: "text-[9px]" },
    sm: { icon: "h-7 w-7", text: "text-sm", sub: "text-[10px]" },
    md: { icon: "h-9 w-9", text: "text-base", sub: "text-xs" },
    lg: { icon: "h-11 w-11", text: "text-xl", sub: "text-xs" },
    xl: { icon: "h-14 w-14", text: "text-2xl", sub: "text-xs" },
  };

  const currentSize = sizeMap[size];

  const logoMark = (
    <div
      className={cn(
        "relative shrink-0 select-none transition-transform hover:scale-105",
        currentSize.icon
      )}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id="zipsLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
          <linearGradient id="zipsRibbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Squircle Badge */}
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="12"
          fill="url(#zipsLogoGrad)"
        />
        <rect
          x="2.5"
          y="2.5"
          width="43"
          height="43"
          rx="11.5"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
          fill="none"
        />

        {/* Ledger Base / Shadow */}
        <path
          d="M10 33.5C14.5 32 19 32.5 24 34.5C29 32.5 33.5 32 38 33.5V17C33.5 15.5 29 16 24 18C19 16 14.5 15.5 10 17V33.5Z"
          fill="rgba(0,0,0,0.22)"
        />

        {/* Left Open Page */}
        <path
          d="M11 16C15.5 14.5 20 15 23.5 17.5V33.5C20 31.5 15.5 31 11 32.5V16Z"
          fill="#ffffff"
        />

        {/* Right Open Page */}
        <path
          d="M37 16C32.5 14.5 28 15 24.5 17.5V33.5C28 31.5 32.5 31 37 32.5V16Z"
          fill="#f1f5f9"
        />

        {/* Left Page Ledger Lines */}
        <line
          x1="14"
          y1="20"
          x2="20.5"
          y2="20.8"
          stroke="#059669"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="14"
          y1="24"
          x2="20.5"
          y2="24.8"
          stroke="#64748b"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.65"
        />
        <line
          x1="14"
          y1="28"
          x2="18.5"
          y2="28.8"
          stroke="#64748b"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.65"
        />

        {/* Right Page Ledger Lines */}
        <line
          x1="27.5"
          y1="20.8"
          x2="34"
          y2="20"
          stroke="#059669"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="27.5"
          y1="24.8"
          x2="34"
          y2="24"
          stroke="#64748b"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.65"
        />
        <line
          x1="27.5"
          y1="28.8"
          x2="32"
          y2="28"
          stroke="#64748b"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.65"
        />

        {/* Center Spine Book Shadow */}
        <line
          x1="24"
          y1="17.5"
          x2="24"
          y2="34"
          stroke="#94a3b8"
          strokeWidth="1"
          strokeLinecap="round"
        />

        {/* Golden Bookmark Ribbon */}
        <path
          d="M22.5 12H25.5V23L24 21.5L22.5 23V12Z"
          fill="url(#zipsRibbonGrad)"
        />
      </svg>
    </div>
  );

  const content = (
    <div className={cn("inline-flex items-center gap-3", className)}>
      {logoMark}

      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-black tracking-tight leading-none text-foreground",
                currentSize.text
              )}
            >
              ZIPS-Book
            </span>
            {badge && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p
              className={cn(
                "text-muted-foreground font-medium tracking-wide mt-0.5",
                currentSize.sub
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href as any} className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
};
