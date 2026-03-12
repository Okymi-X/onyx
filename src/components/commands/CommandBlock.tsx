"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { useTargetStore } from "@/store/useTargetStore";
import { hydrateCommand } from "@/lib/commandHydrator";
import type { OnyxCommand } from "@/types/onyx";

type CommandTheme = {
  border: string;
  badgeBg: string;
  badgeText: string;
  codeText: string;
};

function getCommandTheme(language: string): CommandTheme {
  const lang = language.toLowerCase();

  if (lang.includes("powershell") || lang.includes("ps")) {
    return {
      border: "#4ba3ff",
      badgeBg: "rgba(75, 163, 255, 0.16)",
      badgeText: "#8cc9ff",
      codeText: "#d9ecff",
    };
  }

  if (lang.includes("bash") || lang.includes("sh") || lang.includes("zsh")) {
    return {
      border: "#37c089",
      badgeBg: "rgba(55, 192, 137, 0.16)",
      badgeText: "#7ce8ba",
      codeText: "#d8f7eb",
    };
  }

  if (lang.includes("sql")) {
    return {
      border: "#e6b450",
      badgeBg: "rgba(230, 180, 80, 0.16)",
      badgeText: "#ffd27c",
      codeText: "#fff1d2",
    };
  }

  return {
    border: "#7d7af7",
    badgeBg: "rgba(125, 122, 247, 0.16)",
    badgeText: "#b7b5ff",
    codeText: "#e3e2ff",
  };
}

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
  const theme = getCommandTheme(command.language);

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
      <div
        className="group relative rounded-md border bg-[#1a1a1a]"
        style={{
          borderColor: theme.border,
          boxShadow: `0 0 0 1px ${theme.badgeBg} inset`,
        }}
      >
        {/* Language badge + Copy button row */}
        <div className="flex items-center justify-between border-b border-[#333333] px-3 py-1.5">
          <span
            className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
            style={{
              backgroundColor: theme.badgeBg,
              color: theme.badgeText,
            }}
          >
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
          <code className="font-mono" style={{ color: theme.codeText }}>
            {hydratedCode}
          </code>
        </pre>
      </div>
    </div>
  );
}
