"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { useTargetStore } from "@/store/useTargetStore";
import { hydrateCommand } from "@/lib/commandHydrator";
import type { OnyxCommand } from "@/types/onyx";

/**
 * CommandBlock -- renders a single hydrated command with copy-to-clipboard.
 *
 * Reads live target variables from the Zustand store and passes them through
 * the hydrator so the displayed command is always ready to paste.
 * The copy button provides visual feedback (Copy -> Check) for 2 seconds.
 */
export default function CommandBlock({ command }: { command: OnyxCommand }) {
  const [isCopied, setIsCopied] = useState(false);

  const targetState = useTargetStore();

  /** Apply placeholder replacements with current target values */
  const hydratedCode = hydrateCommand(command.code, targetState);

  /** Copy the hydrated command to clipboard and show feedback */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(hydratedCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      /* Clipboard API may fail in non-HTTPS contexts -- silent fallback */
    }
  }, [hydratedCode]);

  return (
    <div className="space-y-2">
      {/* Optional description text above the code block */}
      {command.description && (
        <p className="text-sm text-[#8b8b8b]">{command.description}</p>
      )}

      {/* Code block with copy button */}
      <div className="group relative rounded-md border border-[#333333] bg-[#1a1a1a]">
        {/* Language badge + Copy button row */}
        <div className="flex items-center justify-between border-b border-[#333333] px-3 py-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#8b8b8b]">
            {command.language}
          </span>
          <button
            onClick={handleCopy}
            title={isCopied ? "Copied" : "Copy to clipboard"}
            className={`rounded p-1 transition-colors ${
              isCopied
                ? "text-[#7d7af7]"
                : "text-[#8b8b8b] hover:text-[#d4d4d4]"
            }`}
          >
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>

        {/* Hydrated command text */}
        <pre className="overflow-x-auto px-4 py-3 text-sm leading-relaxed">
          <code className="font-mono text-[#d4d4d4]">{hydratedCode}</code>
        </pre>
      </div>
    </div>
  );
}
