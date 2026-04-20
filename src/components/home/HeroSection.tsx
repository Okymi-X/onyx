import Link from 'next/link';
import Image from 'next/image';
import { Terminal, BookOpen, Flag, ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-[#7d7af7]/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        {/* Logo mark */}
        <div className="mb-7 flex justify-center">
          <Image
            src="/logo-mark.png"
            alt="Onyx"
            width={72}
            height={72}
            className="rounded-2xl shadow-[0_0_40px_rgba(125,122,247,0.25)]"
            priority
          />
        </div>

        {/* Badge */}
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#7d7af7]/25 bg-[#7d7af7]/8 px-3.5 py-1.5">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7d7af7]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9a97ff]">
            Open Source · Red Team
          </span>
        </div>

        {/* Heading */}
        <h1 className="mb-5 text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl md:text-6xl">
          One place for{' '}
          <span className="bg-gradient-to-r from-[#7d7af7] to-[#4EC9B0] bg-clip-text text-transparent">
            everything
          </span>
          .
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-10 max-w-xl text-base leading-7 text-[#6b6b6b] sm:text-lg">
          Command cheat sheets, CTF write-ups, articles, and security notes — searchable,
          live-hydrated, and open source.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/cheatsheets"
            className="flex items-center gap-2 rounded-lg bg-[#7d7af7] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(125,122,247,0.3)] transition-all hover:bg-[#9b99ff] hover:shadow-[0_0_30px_rgba(125,122,247,0.4)]"
          >
            <Terminal size={14} />
            Cheat Sheets
            <ArrowRight size={13} className="opacity-70" />
          </Link>
          <Link
            href="/blog"
            className="flex items-center gap-2 rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-[#9e9e9e] transition-all hover:border-[#3e3e3e] hover:text-white"
          >
            <BookOpen size={14} />
            Blog
          </Link>
          <Link
            href="/blog?type=writeup"
            className="flex items-center gap-2 rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-[#9e9e9e] transition-all hover:border-[#3e3e3e] hover:text-white"
          >
            <Flag size={14} />
            Write-ups
          </Link>
        </div>
      </div>
    </section>
  );
}
