"use client";

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
  return (
    <div className="flex h-screen overflow-hidden bg-[#1e1e1e]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Sticky search header */}
        <div className="shrink-0 border-b border-[#333333] bg-[#1e1e1e] px-6 py-3">
          <SearchBar />
        </div>
        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <ConfigPanel />
    </div>
  );
}
