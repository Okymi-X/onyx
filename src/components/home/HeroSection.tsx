import Link from 'next/link';
import { Terminal, BookOpen, Flag } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="mb-12 px-4 pt-10 sm:px-6 sm:pt-14">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#333333] bg-[#252525] px-3 py-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-[#4EC9B0]" />
          <span className="text-[11px] font-medium uppercase tracking-widest text-[#9e9e9e]">
            Open Source Red Team Knowledge Base
          </span>
        </div>

        <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
          Everything you need,{' '}
          <span className="text-[#7d7af7]">in one place.</span>
        </h1>

        <p className="mb-8 max-w-2xl text-sm leading-7 text-[#9e9e9e] sm:text-base">
          Onyx aggregates offensive security knowledge into a searchable, structured reference.
          Browse command cheat sheets, read detailed write-ups, and explore articles on AD exploitation, web security, and DFIR.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/cheatsheets"
            className="flex items-center gap-2 rounded-lg border border-[#569CD6]/30 bg-[#569CD6]/10 px-4 py-2.5 text-sm font-medium text-[#569CD6] transition-colors hover:bg-[#569CD6]/20"
          >
            <Terminal size={14} />
            Command Cheat Sheets
          </Link>
          <Link
            href="/blog"
            className="flex items-center gap-2 rounded-lg border border-[#4EC9B0]/30 bg-[#4EC9B0]/10 px-4 py-2.5 text-sm font-medium text-[#4EC9B0] transition-colors hover:bg-[#4EC9B0]/20"
          >
            <BookOpen size={14} />
            Articles
          </Link>
          <Link
            href="/blog?type=writeup"
            className="flex items-center gap-2 rounded-lg border border-[#7d7af7]/30 bg-[#7d7af7]/10 px-4 py-2.5 text-sm font-medium text-[#7d7af7] transition-colors hover:bg-[#7d7af7]/20"
          >
            <Flag size={14} />
            Write-ups
          </Link>
        </div>
      </div>
    </section>
  );
}
