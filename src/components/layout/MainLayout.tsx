"use client";

import { useEffect, useState } from "react";
import { PanelLeft, SlidersHorizontal, X } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import ConfigPanel from "@/components/layout/ConfigPanel";
import SearchBar from "@/components/search/SearchBar";

/**
 * MainLayout -- top-level layout wrapper for the Onyx application.
 * Structures the screen into three columns:
 *   [Sidebar (w-64)] | [Content (flex-1)] | [ConfigPanel (w-72)]
 *
 * A sticky search bar sits at the top of the content area.
 * Each panel scrolls independently via overflow-y-auto.
 */
export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    const hasOverlayOpen = isNavOpen || isConfigOpen;
    if (!hasOverlayOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isNavOpen, isConfigOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsNavOpen(false);
        setIsConfigOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex h-dvh overflow-hidden bg-[#1e1e1e]">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Sticky search header */}
        <div className="shrink-0 border-b border-[#333333] bg-[#1e1e1e] px-4 py-3 sm:px-6">
          <div className="mb-3 flex items-center justify-between gap-2 lg:hidden">
            <button
              onClick={() => setIsNavOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-[#333333] bg-[#252525] px-3 py-2 text-xs font-medium uppercase tracking-wide text-[#d4d4d4]"
            >
              <PanelLeft size={14} />
              Navigation
            </button>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-[#333333] bg-[#252525] px-3 py-2 text-xs font-medium uppercase tracking-wide text-[#d4d4d4]"
            >
              <SlidersHorizontal size={14} />
              Target Config
            </button>
          </div>

          <div className="mb-3 hidden justify-end xl:hidden lg:flex">
            <button
              onClick={() => setIsConfigOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-[#333333] bg-[#252525] px-3 py-2 text-xs font-medium uppercase tracking-wide text-[#d4d4d4]"
            >
              <SlidersHorizontal size={14} />
              Target Config
            </button>
          </div>
          <SearchBar />
        </div>
        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <div className="hidden xl:flex">
        <ConfigPanel />
      </div>

      {isNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation panel">
          <button
            onClick={() => setIsNavOpen(false)}
            className="h-full flex-1 bg-black/60"
            aria-label="Close navigation panel"
          />
          <div className="relative h-full animate-[slide-in-right_180ms_ease-out]">
            <button
              onClick={() => setIsNavOpen(false)}
              className="absolute right-2 top-2 z-10 rounded-md border border-[#3a3a3a] bg-[#252525] p-1.5 text-[#d4d4d4]"
              aria-label="Close navigation panel"
            >
              <X size={14} />
            </button>
            <Sidebar
              className="w-[86vw] max-w-sm border-r border-[#333333]"
              onSectionNavigate={() => setIsNavOpen(false)}
            />
          </div>
        </div>
      )}

      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex justify-end xl:hidden" role="dialog" aria-modal="true" aria-label="Target config panel">
          <button
            onClick={() => setIsConfigOpen(false)}
            className="h-full flex-1 bg-black/60"
            aria-label="Close target config panel"
          />
          <div className="relative h-full animate-[slide-in-right_180ms_ease-out]">
            <button
              onClick={() => setIsConfigOpen(false)}
              className="absolute right-2 top-2 z-10 rounded-md border border-[#3a3a3a] bg-[#252525] p-1.5 text-[#d4d4d4]"
              aria-label="Close target config panel"
            >
              <X size={14} />
            </button>
            <ConfigPanel className="h-full w-[88vw] max-w-sm" />
          </div>
        </div>
      )}
    </div>
  );
}
