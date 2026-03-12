"use client";

import MainLayout from "@/components/layout/MainLayout";
import CategoryView from "@/components/commands/CategoryView";
import type { OnyxDatabase } from "@/types/onyx";
import onyxDb from "@/data/onyx-db.json";
import { ArrowUpRight, Github, HeartHandshake, Star } from "lucide-react";

const db = onyxDb as unknown as OnyxDatabase;
const REPO_URL = "https://github.com/Okymi-X/onyx";

/**
 * Home page -- renders all documents, categories and commands
 * inside the MainLayout three-panel structure.
 * Commands are hydrated in real time via the Zustand store.
 */
export default function Home() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="mb-8 rounded-3xl border border-[#333333] bg-[#202020] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:mb-10 sm:p-7">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="border-l-2 border-[#7d7af7] pl-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a97ff]">
                Open Source Red Team Knowledge Base
              </div>
              <h1 className="max-w-3xl text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl">
                Onyx is open source. Contribute commands, improve notes, and
                help turn the repo into a sharper field reference.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-[#b5b5b5] md:text-base">
                If it saves you time during labs, assessments, or internal ops,
                leave a star on GitHub and contribute fixes or new cheat sheets.
                Better visibility brings better contributions.
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-[#cfcfcf]">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#3a3a3a] bg-black/20 px-3 py-2">
                  <span className="font-semibold text-white">{db.documentCount}</span>
                  <span>documents</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#3a3a3a] bg-black/20 px-3 py-2">
                  <span className="font-semibold text-white">{db.commandCount}</span>
                  <span>commands indexed</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#3a3a3a] bg-black/20 px-3 py-2">
                  <HeartHandshake size={14} className="text-[#9a97ff]" />
                  <span>Community contributions welcome</span>
                </div>
              </div>
            </div>

            <div className="w-full shrink-0 lg:max-w-[280px]">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-[#4b48a8] bg-[linear-gradient(180deg,#27205a,#1d173f)] p-5 text-[#f4f3ff] shadow-[0_14px_30px_rgba(56,40,140,0.25)] transition-colors hover:bg-[linear-gradient(180deg,#30296a,#221b49)]"
              >
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#c9c6ff]">
                  <Github size={15} />
                  GitHub
                </div>
                <p className="mt-4 text-2xl font-semibold leading-tight text-white">
                  Star the repo and contribute.
                </p>
                <p className="mt-3 text-sm leading-6 text-[#d5d2ff]">
                  Open issues, improve commands, and help keep the reference accurate.
                </p>
                <div className="mt-5 flex items-center gap-3 text-sm font-medium text-white">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                    <Star size={14} />
                    Leave a star
                  </span>
                  <span className="inline-flex items-center gap-2 text-[#d5d2ff]">
                    <ArrowUpRight size={14} />
                    Open repo
                  </span>
                </div>
              </a>
            </div>
          </div>
        </section>

        {db.documents.map((doc) => (
          <div key={doc.fileName} className="mb-12 sm:mb-16">
            {/* Document title */}
            <h2 className="mb-5 border-b border-[#333333] pb-3 text-2xl font-bold text-[#7d7af7] sm:mb-6 sm:text-3xl">
              {doc.fileName}
            </h2>
            {doc.categories.map((cat) => (
              <CategoryView
                key={cat.title}
                category={cat}
                docName={doc.fileName}
              />
            ))}
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
