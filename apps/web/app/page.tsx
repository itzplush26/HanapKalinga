'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">HanapKalinga</span>
            </Link>

            {/* Desktop Navigation Links - Center */}
            <div className="hidden lg:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
              <Link href="/" className="text-sm font-medium text-slate-900 hover:text-brand-600 transition-colors">
                Home
              </Link>
              <Link href="#about" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
                About
              </Link>
              <Link href="#services" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
                Services
              </Link>
              <Link href="#contact" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
                Contact
              </Link>
            </div>

            {/* Desktop Action Buttons - Right */}
            <div className="hidden sm:flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="text-sm font-medium">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="text-sm font-medium shadow-lg shadow-brand-600/20">
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white/95 backdrop-blur-lg">
            <div className="px-4 py-6 space-y-4">
              <Link 
                href="/" 
                className="block px-4 py-2 text-base font-medium text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="#about" 
                className="block px-4 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="#services" 
                className="block px-4 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Services
              </Link>
              <Link 
                href="#contact" 
                className="block px-4 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <div className="pt-4 space-y-2 border-t border-slate-200">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/register">Sign Up</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-32 pb-8 sm:pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 via-blue-500/5 to-transparent"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5 sm:space-y-8">
              {/* Brand Badge - Mobile First */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 border border-brand-100">
                <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse"></span>
                <span className="text-xs sm:text-sm font-semibold text-brand-700 uppercase tracking-wider">HANAPKALINGA</span>
              </div>

              {/* Main Heading - Mobile First Typography */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                Trusted nurses and caregivers, ready when your family needs them.
              </h1>

              {/* Description - Mobile First */}
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-xl">
                Find trusted nurses and caregivers across the Philippines. Book directly, coordinate simply, and keep care personal.
              </p>

              {/* CTA Buttons - Mobile First Full Width */}
              <div className="flex flex-col gap-3 sm:gap-4 pt-2">
                <Button asChild size="lg" className="w-full sm:w-auto text-base sm:text-lg px-8 py-5 sm:py-7 rounded-full shadow-lg shadow-brand-600/25">
                  <Link href="/register?role=family">I need a nurse or caregiver</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-base sm:text-lg px-8 py-5 sm:py-7 rounded-full border-2">
                  <Link href="/register?role=provider">I am a nurse or caregiver</Link>
                </Button>
                <Link href="/login" className="text-sm text-slate-500 hover:text-brand-600 underline text-center sm:text-left transition-colors mt-2">
                  Log in
                </Link>
              </div>
            </div>

            {/* Hero Image - Hidden on Mobile, Shown on Desktop */}
            <div className="relative hidden lg:block">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <div className="aspect-[4/5] bg-gradient-to-br from-brand-500 via-blue-500 to-purple-500 flex items-center justify-center">
                  <svg className="w-32 h-32 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-brand-400 rounded-full blur-3xl opacity-50"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-400 rounded-full blur-3xl opacity-50"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Search/Quick Start Card */}
      <section className="px-6 pb-12 sm:pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-5 sm:p-8 md:p-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 sm:mb-6">Start Your Search</h2>
            <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Location</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Enter city or region"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                  />
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Service Type</label>
                <select className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all appearance-none bg-white">
                  <option>Home Care Nurse</option>
                  <option>Live-in Caregiver</option>
                  <option>Hourly Caregiver</option>
                  <option>Specialized Care</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Start Date</label>
                <input 
                  type="date"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                />
              </div>
            </div>
            <Button asChild className="w-full mt-6" size="lg">
              <Link href="/register?role=family">Search Caregivers</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 pb-12 sm:pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-3">Why Choose Us</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Everything You Need for Quality Care</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 sm:gap-8">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: "Verified Professionals",
                description: "All nurses and caregivers undergo thorough background checks and credential verification."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Flexible Scheduling",
                description: "Book care on your schedule - hourly, daily, or long-term arrangements available."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
                title: "Direct Communication",
                description: "Message providers directly through our secure platform before booking."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-5 sm:p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Insights Section */}
      <section className="px-6 pb-12 sm:pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-6 sm:mb-10">
            <div>
              <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-2">Latest Insights</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Care Tips & Resources</h2>
            </div>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="grid md:grid-cols-3 gap-5 sm:gap-8">
            {[
              {
                category: "Care Guide",
                title: "Choosing the Right Home Care Nurse",
                excerpt: "Essential factors to consider when selecting a healthcare professional for your loved ones.",
                date: "May 15, 2024"
              },
              {
                category: "Health Tips",
                title: "Managing Elderly Care at Home",
                excerpt: "Best practices for creating a safe and comfortable environment for senior family members.",
                date: "May 12, 2024"
              },
              {
                category: "Provider Story",
                title: "A Day in the Life of a Home Care Nurse",
                excerpt: "Meet Maria, a dedicated nurse helping families across Metro Manila with compassionate care.",
                date: "May 8, 2024"
              }
            ].map((article, index) => (
              <article key={index} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer">
                <div className="aspect-[16/10] bg-gradient-to-br from-brand-400 via-blue-400 to-purple-400 flex items-center justify-center">
                  <svg className="w-16 h-16 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <div className="p-5 sm:p-6">
                  <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">{article.category}</span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1 sm:mt-2 mb-2 sm:mb-3">{article.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">{article.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{article.date}</span>
                    <span className="text-brand-600 text-sm font-medium hover:underline">Read more →</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 pb-12 sm:pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-brand-600 via-blue-600 to-purple-700 rounded-3xl p-6 sm:p-12 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-10"></div>
            {/* Animated gradient orbs */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">Ready to Get Started?</h2>
              <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of families and healthcare professionals connecting through HanapKalinga
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="default" className="text-base px-8 shadow-lg hover:shadow-xl transition-shadow">
                  <Link href="/register?role=family">Find Care Now</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-base px-8 bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm">
                  <Link href="/register?role=provider">Become a Provider</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
