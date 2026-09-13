"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Film, Ticket, ShieldAlert, User, LogOut, Search, MapPin, Menu, X, Compass } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const navLinks = [
    { label: "Movies", href: "/#now-showing", icon: Film },
    { label: "Cinemas", href: "/cinemas", icon: MapPin },
    { label: "Experiences", href: "/#experiences", icon: Compass },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform duration-200">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Cine<span className="text-primary">Book</span>
                </span>
                <span className="text-[10px] tracking-widest uppercase text-slate-400 -mt-1 font-medium">
                  Premier Cinema Experience
                </span>
              </div>
            </Link>

            {/* Navigation links (desktop) */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "text-white bg-white/10"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-primary" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Search bar & User controls */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Quick Search */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies, genres..."
                className="w-64 pl-10 pr-4 py-2 rounded-full bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </form>

            {/* My Bookings Pill */}
            {user && (
              <Link
                href="/my-bookings"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-raised border border-white/10 text-xs font-semibold text-slate-200 hover:text-white hover:border-primary/50 transition-all"
              >
                <Ticket className="w-4 h-4 text-primary" />
                <span>My Bookings</span>
              </Link>
            )}

            {/* Admin Dashboard Pill */}
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-all"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Admin Center</span>
              </Link>
            )}

            {/* Auth Buttons / Profile Dropdown */}
            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-white truncate max-w-[100px]">
                      {user.fullName.split(" ")[0]}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">{user.role.toLowerCase()}</span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-xs font-bold text-white shadow-lg shadow-primary/30 transition-all duration-200 hover:scale-105"
                >
                  Get Tickets
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex lg:hidden items-center gap-2">
            {user && (
              <Link
                href="/my-bookings"
                className="p-2 text-primary hover:bg-white/5 rounded-lg"
              >
                <Ticket className="w-5 h-5" />
              </Link>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-surface px-4 pt-3 pb-6 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-sm text-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>

          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-200 hover:bg-white/5"
            >
              <link.icon className="w-4 h-4 text-primary" />
              {link.label}
            </Link>
          ))}

          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 font-medium"
            >
              <ShieldAlert className="w-4 h-4" />
              Admin Center
            </Link>
          )}

          {user && (
            <Link
              href="/my-bookings"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-200 hover:bg-white/5"
            >
              <Ticket className="w-4 h-4 text-primary" />
              My Bookings
            </Link>
          )}

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            {user ? (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-red-400 bg-red-500/10 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                Sign Out ({user.fullName})
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center py-2.5 text-sm text-slate-200 bg-white/5 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-bold text-white bg-primary rounded-lg"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
