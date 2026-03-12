"use client";

import { useTargetStore } from "@/store/useTargetStore";
import {
  Server,
  Globe,
  HardDrive,
  User,
  KeyRound,
  Wifi,
  Hash,
  RotateCcw,
} from "lucide-react";

/**
 * ConfigFieldProps -- single input field definition for the config panel.
 * Keeps each field declarative and avoids repeating markup.
 */
interface ConfigFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  placeholder: string;
  type?: string;
}

/** Reusable input row -- icon + label + text field */
function ConfigField({
  label,
  value,
  onChange,
  icon,
  placeholder,
  type = "text",
}: ConfigFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#8b8b8b]">
        {icon}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        className="w-full rounded-md border border-[#333333] bg-[#1e1e1e] px-3 py-2 font-mono text-sm text-[#d4d4d4] placeholder-[#555555] outline-none transition-colors focus:border-transparent focus:ring-1 focus:ring-[#7d7af7]"
      />
    </div>
  );
}

/**
 * ConfigPanel -- right-side panel for editing global target variables.
 * Connected to the Zustand store; every keystroke updates all hydrated commands.
 */
export default function ConfigPanel() {
  const store = useTargetStore();

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-l border-[#333333] bg-[#252525]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#333333] px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#d4d4d4]">
          Target Config
        </h2>
        <button
          onClick={store.resetAll}
          title="Reset all variables"
          className="rounded p-1 text-[#8b8b8b] transition-colors hover:bg-[#333333] hover:text-[#d4d4d4]"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <ConfigField
          label="Target IP"
          value={store.targetIP}
          onChange={store.setTargetIP}
          icon={<Server size={12} />}
          placeholder="10.10.10.10"
        />
        <ConfigField
          label="Domain"
          value={store.targetDomain}
          onChange={store.setTargetDomain}
          icon={<Globe size={12} />}
          placeholder="domain.local"
        />
        <ConfigField
          label="Domain Controller"
          value={store.targetDC}
          onChange={store.setTargetDC}
          icon={<HardDrive size={12} />}
          placeholder="DC01"
        />
        <ConfigField
          label="Username"
          value={store.targetUser}
          onChange={store.setTargetUser}
          icon={<User size={12} />}
          placeholder="administrator"
        />
        <ConfigField
          label="Password"
          value={store.targetPassword}
          onChange={store.setTargetPassword}
          icon={<KeyRound size={12} />}
          placeholder="P@ssw0rd"
          type="text"
        />
        <ConfigField
          label="Local IP"
          value={store.localIP}
          onChange={store.setLocalIP}
          icon={<Wifi size={12} />}
          placeholder="10.10.14.1"
        />
        <ConfigField
          label="Local Port"
          value={store.localPort}
          onChange={store.setLocalPort}
          icon={<Hash size={12} />}
          placeholder="4444"
        />
      </div>
    </aside>
  );
}
