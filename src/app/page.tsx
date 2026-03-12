"use client";

import MainLayout from "@/components/layout/MainLayout";
import CategoryView from "@/components/commands/CategoryView";
import type { OnyxDatabase } from "@/types/onyx";
import onyxDb from "@/data/onyx-db.json";

const db = onyxDb as unknown as OnyxDatabase;

/**
 * Home page -- renders all documents, categories and commands
 * inside the MainLayout three-panel structure.
 * Commands are hydrated in real time via the Zustand store.
 */
export default function Home() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl px-8 py-8">
        {db.documents.map((doc) => (
          <div key={doc.fileName} className="mb-16">
            {/* Document title */}
            <h1 className="mb-6 border-b border-[#333333] pb-3 text-3xl font-bold text-[#7d7af7]">
              {doc.fileName}
            </h1>
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
