"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronRight, ExternalLink, FileText, Github, Layers, Star } from "lucide-react";
import type { OnyxDatabase, OnyxDocument } from "@/types/onyx";
import onyxDb from "@/data/onyx-db.json";

/** Typed reference to the parsed database */
const db = onyxDb as unknown as OnyxDatabase;
const REPO_URL = "https://github.com/Okymi-X/onyx";

/**
 * CategoryItem -- collapsible navigation group for a single ## category.
 * Renders the category title and its ### sections as clickable links.
 */
function CategoryItem({
  docName,
  title,
  sections,
  onSectionClick,
}: {
  docName: string;
  title: string;
  sections: { title: string }[];
  onSectionClick: (docName: string, catTitle: string, secTitle: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-[#d4d4d4] transition-colors hover:bg-[#333333] hover:text-white"
      >
        <ChevronRight
          size={14}
          className={`shrink-0 text-[#8b8b8b] transition-transform ${expanded ? "rotate-90" : ""}`}
        />
        <span className="truncate">{title}</span>
      </button>

      {expanded && sections.length > 0 && (
        <div className="ml-4 space-y-0.5 border-l border-[#333333] pl-2">
          {sections.map((sec) => (
            <button
              key={sec.title}
              onClick={() => onSectionClick(docName, title, sec.title)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs text-[#8b8b8b] transition-colors hover:bg-[#333333] hover:text-[#d4d4d4]"
            >
              <FileText size={11} className="shrink-0" />
              <span className="truncate">{sec.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * DocumentGroup -- collapsible group for a single Markdown document.
 * Contains all the ## categories found in that document.
 */
function DocumentGroup({
  doc,
  onSectionClick,
}: {
  doc: OnyxDocument;
  onSectionClick: (docName: string, catTitle: string, secTitle: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium text-[#d4d4d4] transition-colors hover:bg-[#333333] hover:text-white"
      >
        <Layers size={14} className="shrink-0 text-[#7d7af7]" />
        <span className="truncate">{doc.fileName}</span>
        <ChevronRight
          size={12}
          className={`ml-auto shrink-0 text-[#8b8b8b] transition-transform ${expanded ? "rotate-90" : ""}`}
        />
      </button>

      {expanded && (
        <div className="ml-2 space-y-0.5">
          {doc.categories.map((cat) => (
            <CategoryItem
              key={cat.title}
              docName={doc.fileName}
              title={cat.title}
              sections={cat.sections}
              onSectionClick={onSectionClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Sidebar -- left navigation panel.
 * Displays a hierarchical tree: Document > Category > Section.
 * Clicking a section scrolls the main content to the relevant block.
 */
export default function Sidebar({
  className = "",
  onSectionNavigate,
}: {
  className?: string;
  onSectionNavigate?: () => void;
}) {
  /** Scroll to the target section in the main content area */
  const handleSectionClick = (
    docName: string,
    catTitle: string,
    secTitle: string,
  ) => {
    const id = `${docName}--${catTitle}--${secTitle}`
      .replace(/\s+/g, "-")
      .toLowerCase();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    onSectionNavigate?.();
  };

  return (
    <aside
      className={`flex h-full w-64 shrink-0 flex-col border-r border-[#333333] bg-[#252525] ${className}`}
    >
      {/* Header */}
      <div className="border-b border-[#333333] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo-mark.png"
            alt="Onyx"
            width={56}
            height={56}
            className="shrink-0"
            priority
          />
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight text-[#7d7af7]">
              Onyx
            </h1>
            <p className="text-xs text-[#8b8b8b]">Command Reference</p>
          </div>
        </div>
      </div>

      {/* Navigation tree */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-1">
          {db.documents.map((doc) => (
            <DocumentGroup
              key={doc.fileName}
              doc={doc}
              onSectionClick={handleSectionClick}
            />
          ))}
        </div>
      </nav>

      {/* Footer stats */}
      <div className="border-t border-[#333333] px-4 py-3 text-xs text-[#8b8b8b]">
        <p>
          {db.documentCount} docs / {db.commandCount} commands
        </p>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-[#b5b5b5] transition-colors hover:text-white"
        >
          <Github size={12} />
          <span>Open source on GitHub</span>
          <Star size={11} className="text-[#7d7af7]" />
          <ExternalLink size={11} />
        </a>
      </div>
    </aside>
  );
}
