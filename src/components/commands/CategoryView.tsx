import SectionRenderer from "@/components/commands/SectionRenderer";
import type { OnyxCategory } from "@/types/onyx";

/**
 * Generates a deterministic anchor ID from document + category + section names.
 * Matches the ID format expected by the Sidebar scroll-to-section logic.
 */
function buildAnchorId(
  docName: string,
  catTitle: string,
  secTitle: string,
): string {
  return `${docName}--${catTitle}--${secTitle}`
    .replace(/\s+/g, "-")
    .toLowerCase();
}

/**
 * CategoryView -- renders a full ## category with its title and all sections.
 *
 * Each section is given an anchor ID so the Sidebar navigation can scroll
 * directly to it. The docName is passed through for ID generation.
 */
export default function CategoryView({
  category,
  docName,
}: {
  category: OnyxCategory;
  docName: string;
}) {
  return (
    <div className="mb-12">
      <h2 className="mb-8 text-2xl font-bold text-white">{category.title}</h2>
      {category.sections.map((section) => (
        <SectionRenderer
          key={section.title}
          section={section}
          anchorId={buildAnchorId(docName, category.title, section.title)}
        />
      ))}
    </div>
  );
}
