// components/Navbar.tsx
'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function Navbar() {
  return (
    <nav
      className="fixed top-4 left-4 right-4 z-50 rounded-2xl border border-[#1E293B] bg-[#0F172A]/80 backdrop-blur-xl px-6 py-3.5"
      style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.5)' }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center transition-colors duration-200 group-hover:bg-[#22C55E]/20">
            <Zap className="w-4 h-4 text-[#22C55E]" strokeWidth={2.5} />
          </div>
          <span className="font-mono font-bold text-[#F8FAFC] text-lg tracking-tight">
            Lead<span className="text-[#22C55E]">Forge</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" aria-hidden="true" />
            <span className="text-xs font-mono text-[#94A3B8]">backend online</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
