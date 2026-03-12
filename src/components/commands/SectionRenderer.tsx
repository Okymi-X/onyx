import CommandBlock from "@/components/commands/CommandBlock";
import type { OnyxSection } from "@/types/onyx";

/**
 * SectionRenderer -- displays a ### subsection and all its command blocks.
 *
 * Renders a bordered heading followed by vertically-spaced CommandBlock
 * instances. The `id` prop is used as an anchor target for sidebar navigation.
 */
export default function SectionRenderer({
  section,
  anchorId,
}: {
  section: OnyxSection;
  anchorId: string;
}) {
  return (
    <section id={anchorId} className="scroll-mt-4">
      <h3 className="mb-4 mt-8 border-b border-[#333333] pb-2 text-lg font-semibold text-[#d4d4d4]">
        {section.title}
      </h3>
      <div className="space-y-6">
        {section.commands.map((cmd, idx) => (
          <CommandBlock key={idx} command={cmd} />
        ))}
      </div>
    </section>
  );
}
