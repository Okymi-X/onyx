import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TargetStore, TargetVariables } from '@/types';

/**
 * Default values for all target variables.
 * Provides placeholder data so the UI is never empty on first load.
 */
const DEFAULT_VALUES: TargetVariables = {
  targetIP: '10.10.10.10',
  targetDomain: 'domain.local',
  targetDC: 'DC01',
  targetUser: 'administrator',
  targetPassword: 'P@ssw0rd',
  localIP: '10.10.14.1',
  localPort: '4444',
};

/**
 * Global target store powered by Zustand.
 * Persists to localStorage so values survive page reloads.
 * Every setter updates a single field -- SRP at the action level.
 */
export const useTargetStore = create<TargetStore>()(
  persist(
    (set) => ({
      ...DEFAULT_VALUES,

      setTargetIP: (value: string) => set({ targetIP: value }),
      setTargetDomain: (value: string) => set({ targetDomain: value }),
      setTargetDC: (value: string) => set({ targetDC: value }),
      setTargetUser: (value: string) => set({ targetUser: value }),
      setTargetPassword: (value: string) => set({ targetPassword: value }),
      setLocalIP: (value: string) => set({ localIP: value }),
      setLocalPort: (value: string) => set({ localPort: value }),

      /** Resets every variable back to its default placeholder */
      resetAll: () => set({ ...DEFAULT_VALUES }),
    }),
    {
      name: 'onyx-target-store',
    }
  )
);
