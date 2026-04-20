'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Github, BookOpen, Flag, StickyNote, Terminal } from 'lucide-react';
import GlobalSearchBar from '@/components/search/GlobalSearchBar';

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  match: (path: string) => boolean;
}

const NAV_LINKS: NavLink[] = [
  {
    href: '/cheatsheets',
    label: 'Cheat Sheets',
    icon: <Terminal size={13} />,
    color: '#569CD6',
    match: (p) => p.startsWith('/cheatsheets'),
  },
  {
    href: '/blog?type=article',
    label: 'Articles',
    icon: <BookOpen size={13} />,
    color: '#4EC9B0',
    match: (p) => p.startsWith('/blog') && (typeof window === 'undefined' || !window.location.search.includes('type=') || window.location.search.includes('type=article')),
  },
  {
    href: '/blog?type=writeup',
    label: 'Write-ups',
    icon: <Flag size={13} />,
    color: '#7D7AF7',
    match: (p) => p.startsWith('/blog') && typeof window !== 'undefined' && window.location.search.includes('type=writeup'),
  },
  {
    href: '/blog?type=note',
    label: 'Notes',
    icon: <StickyNote size={13} />,
    color: '#D7BA7D',
    match: (p) => p.startsWith('/blog') && typeof window !== 'undefined' && window.location.search.includes('type=note'),
  },
];

export default function TopNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[#252525] bg-[#141414]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          onClick={() => setMobileOpen(false)}
        >
          <Image
            src="/logo-mark.png"
            alt="Onyx"
            width={28}
            height={28}
            className="rounded-md"
            priority
          />
          <span className="text-sm font-bold tracking-wide text-white">Onyx</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = link.match(pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150"
                style={{
                  color: isActive ? link.color : '#6b6b6b',
                  backgroundColor: isActive ? `${link.color}15` : 'transparent',
                }}
              >
                <span style={{ color: isActive ? link.color : '#484848' }}>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <GlobalSearchBar />
          <a
            href="https://github.com/Okymi-X/onyx"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-[#6b6b6b] transition-colors hover:bg-[#1e1e1e] hover:text-[#9e9e9e] md:flex"
          >
            <Github size={13} />
            GitHub
          </a>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#6b6b6b] transition-colors hover:bg-[#1e1e1e] hover:text-[#9e9e9e] md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[#252525] bg-[#141414] px-4 pb-4 pt-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = link.match(pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
                  style={{
                    color: isActive ? link.color : '#9e9e9e',
                    backgroundColor: isActive ? `${link.color}15` : 'transparent',
                  }}
                >
                  <span style={{ color: isActive ? link.color : '#6b6b6b' }}>{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
            <a
              href="https://github.com/Okymi-X/onyx"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-[#6b6b6b]"
              onClick={() => setMobileOpen(false)}
            >
              <Github size={13} />
              GitHub
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
